/**
 * Created with JetBrains WebStorm.
 * User: Josh
 * Date: 8/4/12
 * Time: 9:30 PM
 * To change this template use File | Settings | File Templates.
 */
var ParticleSystem = (function (ps) {

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

  var Engine = function (canvas, settings) {

    this._canvas = ps.Utils.loadElement(canvas);

    if (!this._canvas) {
      throw new Error("A valid canvas id, or element must be provided");
    }

    this._ctx = this._canvas.getContext('2d');

    //Initialize
    this._settings = ps.Utils.merge(settings, this._settings);
    this._particles = [];
    this._forces = [];
    this._events = {
      onParticleCreated: []
    };

    this._settings.images = {
      "red-ball": this.loadImage('images/red-ball.png')
    };

    this._canvas.height = this._settings.height;
    this._canvas.width = this._settings.width;
  };
  Engine.prototype = {
    _canvas: null,
    _ctx: null,
    _particles: null,
    _lastStep: 0,
    _isStarted: false,
    _settings: {
      width: 500,
      height: 500,
      numParticles: 100,
      minRadius: 1,
      maxRadius: 50,
      minVelocity: 20,
      maxVelocity: 100,
      minLifetime: 10,
      maxLifetime: 30,
      minAngle: 0,
      maxAngle: 360,
      renderer:'circle-radial-gradient'
    },
    _forces: null,
    _events: null,
    updateSettings: function (settings) {
      this._settings = ps.Utils.merge(settings, this._settings);
      console.log(settings);
      console.log(this._settings);
    },
    start: function () {
      if (!this._isStarted) {
        this._isStarted = true;

        requestAnimationFrame(this.renderAnimationFrame.bind(this));
      }
    },
    stop: function () {
      this._isStarted = false;
    },
    addForce: function (force) {
      if (ps.Utils.isDefined(force) && ps.Utils.isFunction(force)) {
        this._forces.push(force);
      } else {
        throw new Error("force must be a function");
      }
    },
    removeForce: function (force) {
      if (!ps.Utils.isDefined(force)) return;

      var index = this._forces.indexOf(force);

      this._forces.splice(index, 1);
    },
    on: function (eventName, func) {
      if (!ps.Utils.isFunction(func)) {
        throw new Error("Must provide valid callable function for event handler");
      }

      var eventName = "on" + eventName;

      if (this._events[eventName]) {
        this._events[eventName].push(func);
      }
    },
    loadImage: function (url) {
      var img = new Image();
      img.src = url;

      return img;
    },
    renderAnimationFrame: function (milliseconds) {

      if (this._isStarted) {
        this.render(new TimeSpan(milliseconds - this._lastStep));

        this._lastStep = milliseconds;

        requestAnimationFrame(this.renderAnimationFrame.bind(this));
      }
    },
    render: function (timeDelta) {
      this._canvas.height = this._settings.height;
      this._canvas.width = this._settings.width;
      this._ctx.globalCompositeOperation = "source-over";
      this._ctx.fillStyle = "black";
      this._ctx.fillRect(0, 0, this._settings.width, this._settings.height);

      this.renderFramesPerSecond(timeDelta, this._ctx);
      this.regenerateParticles(this._particles, this._settings.numParticles);

      this._ctx.globalCompositeOperation = "lighter";

      this._ctx.fillStyle = "white";

      for (var i = 0; i < this._particles.length; i++) {
        var particle = this._particles[i];
        this.particleRenderers[this._settings.renderer].call(this, particle, this._ctx);
        this.applyForces(particle, timeDelta, this._forces);
        particle.move(timeDelta);
      }
    },
    renderFramesPerSecond: function (timeSpan, context) {

      var fps = 60;

      if (timeSpan.totalMilliseconds() !== 0) {
        var fps = (1 / timeSpan.totalSeconds()).toFixed(0).toString();
      }

      var font = context.font;
      var fillStyle = context.fillStyle;

      context.fillStyle = "white";
      context.font = "40pt Arial";

      context.fillText(fps, 5, 50);

      context.fillStyle = fillStyle;
      context.font = font;
    },
    particleRenderers:{
      'circle-radial-gradient':function (p, context) {
        //draw a circle
        var opacity = p.getRemainingLifePercent();

        p.color = p.color || [255, 255, 255];

        var rgbString = p.color.join(',');

        try {
          var gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          gradient.addColorStop(0, "rgba(" + rgbString + "," + opacity + ")");
          gradient.addColorStop(0.5, "rgba(" + rgbString + "," + opacity + ")");
          gradient.addColorStop(1, "rgba(" + rgbString + ",0)");
          context.fillStyle = gradient;
          context.fillStyle = "rgba(" + rgbString + "," + opacity + ")";
        }
        catch (ex) {
          debugger;
        }

        context.beginPath();
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
      },
      'dust':function (p, context) {

        //p.color = p.color || [255, 255, 255];

        //var rgbString = p.color.join(',');

        //context.fillStyle = "rgb(" + rgbString + ")";
        context.fillRect(p.x, p.y, 1, 1);
      }
    },
    renderSprite: function (p, context) {
      context.drawImage(this._settings.images["red-ball"], p.x, p.y, p.radius, p.radius);
    },
    regenerateParticles: function (particles, numParticles) {
      var curParticle;

      for(var i = particles.length - 1; i > numParticles; i--){
        curParticle = particles[i];

        if(curParticle.isDead()){
          particles.splice(i, 1);
        }
      }

      for (var i = 0; i < particles.length; i++) {
        curParticle = particles[i];

        if (curParticle.isDead()) {

          if (particles[i].shouldReset) {
            particles[i].reset(this._settings);
          } else {
            particles[i] = this.createRandomParticle(this._settings);
          }

          this.trigger("onParticleCreated", particles[i], particles[i]);
        }
      }

      while (particles.length < numParticles) {
        var newParticle = this.createRandomParticle(this._settings);
        particles.push(newParticle);
        this.trigger("onParticleCreated", newParticle, newParticle);
      }
    },
    applyForces: function (particle, timeDelta, forces) {
      for (var i = 0; i < forces.length; i++) {
        forces[i].call(particle, particle, timeDelta);
      }
    },
    createRandomParticle: function (settings) {
      var spec = {
        x: ps.Utils.getRandomInt(0, settings.width),
        y: ps.Utils.getRandomInt(0, settings.height),
        radius: ps.Utils.getRandomNumber(settings.minRadius, settings.maxRadius),
        velocity: new Velocity(
          ps.Utils.getRandomInt(settings.minVelocity, settings.maxVelocity),
          ps.Utils.getRandomNumber(settings.minAngle, settings.maxAngle)
        ),
        lifetime: ps.Utils.getRandomInt(settings.minLifetime, settings.maxLifetime)
      };

      return new Particle(spec.x, spec.y, spec.radius, spec.velocity, spec.lifetime);
    },
    trigger: function (eventName, context) {
      var args = Array.prototype.slice.call(arguments),
        handlers = this._events[eventName],
        i = 0;

      for (i = 0; i < handlers.length; i++) {
        handlers[i].apply(context, args.slice(2));
      }
    }
  };

  ps.Engine = Engine;

  ps.Utils = {
    /**
     * Returns a random number between min and max
     */
    getRandomNumber: function (min, max) {
      return Math.random() * (max - min) + min;
    },
    /**
     * Returns a random integer between min and max
     * Using Math.round() will give you a non-uniform distribution!
     */
    getRandomInt: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    //Merges two simple objects into one new one
    merge: function (input, target) {
      var prop, obj = {};

      for (prop in target) {
        if (target.hasOwnProperty(prop)) {
          obj[prop] = target[prop];

          if (input.hasOwnProperty(prop)) {
            obj[prop] = input[prop];
          }
        }
      }

      return obj;
    },
    isElementOfType: function (obj, type) {
      return (obj || {}).toString() === "[object HTML" + type + "Element]";
    },
    isString: function (obj) {
      return typeof(obj) === "string";
    },
    isDefined: function (obj) {
      return typeof(obj) !== "undefined";
    },
    isFunction: function (func) {
      return typeof func === "function";
    },
    loadElement: function (element) {
      if (!ps.Utils.isDefined(element)) return;

      if (ps.Utils.isString(element)) {
        return document.getElementById(element);
      }

      if (ps.Utils.isElementOfType(element, 'Canvas')) {
        return element;
      }
    }
  };


  var Particle = function (x, y, radius, velocity, lifetime) {
    this._lifetime = 0;
    this.lifetime = lifetime || 300;
    this.shouldReset = true;

    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 10;

    velocity = velocity || new Velocity(0, 0);

    if (!(velocity instanceof Velocity)) {
      throw new Error("Velocity must be a velocity");
    }

    this.velocity = velocity;
  };

  Object.defineProperty(Particle.prototype, 'lifetime', {
    writeable: true,
    get: function () {
      return this._lifetime;
    },
    set: function (lifetimeMs) {
      this._lifetime = lifetimeMs;
      this._remainingLife = lifetimeMs;
    }
  });

  Particle.prototype.move = function (timeSpan) {
    var vector = this.velocity.getVector(timeSpan.totalSeconds());
    this.x += vector.x;
    this.y += vector.y;
    this._remainingLife -= timeSpan.totalMilliseconds();
    if (this._remainingLife <= 0.01) {
      this._remainingLife = 0;
    }
  };

  Particle.prototype.getRemainingLifePercent = function () {
    return this.lifetime ? (this._remainingLife / this.lifetime) : 0;
  };

  Particle.prototype.isDead = function () {
    return this._remainingLife <= 0;
  };

  Particle.prototype.reset = function (settings) {
    this.x = ps.Utils.getRandomInt(0, settings.width);
    this.y = ps.Utils.getRandomInt(0, settings.height);
    this.radius = ps.Utils.getRandomNumber(settings.minRadius, settings.maxRadius);
    this.lifetime = ps.Utils.getRandomInt(settings.minLifetime, settings.maxLifetime);
    this._remainingLife = this.lifetime;
    this.velocity.setSpeedAndAngle(
      ps.Utils.getRandomInt(settings.minVelocity, settings.maxVelocity),
      ps.Utils.getRandomNumber(settings.minAngle, settings.maxAngle)
    );
  };

  var Vector = function (x, y) {
    this.x = x || x;
    this.y = y || y;
  };

  Vector.prototype.add = function (vector) {
    if (!(vector instanceof Vector)) {
      throw new Error("argument must be a Vector for addition");
    }

    this.x += vector.x;
    this.y += vector.y;

    return this;
  };

  Vector.prototype.subtract = function (vector) {
    if (!(vector instanceof Vector)) {
      throw new Error("argument must be a Vector for addition");
    }

    this.x -= vector.x;
    this.y -= vector.y;

    return this;
  };

  ps.Vector = Vector;

  var Velocity = function (speedPerSecond, angle) {
    this.setSpeedAndAngle(speedPerSecond, angle);
  };

  Velocity.prototype.getVector = function (time) {
    var seconds = time || 0;
    return new Vector(this.x * seconds, this.y * seconds);
  };

  Velocity.prototype.setSpeedAndAngle = function (speedPerSecond, angle) {
    this._speed = speedPerSecond || 0;
    this._angleRadians = ((angle || this._angleRadians || 0) * Math.PI) / 180;
    this.x = this._speed * Math.cos(this._angleRadians);
    this.y = this._speed * Math.sin(this._angleRadians);
  };

  Velocity.fromCoords = function (x1, y1, x2, y2, timeMs) {
    var x = x2 - x1,
      y = y2 - y1,
      speed = Math.sqrt(x * x + y * y),
      angle = Math.atan2(y, x) * 180 / Math.PI;

    return new Velocity(speed / (timeMs / 1000), angle);
  };

  ps.Velocity = Velocity;

  var Timer = function () {
    this._startTime;
    this._endTime;
  };

  Timer.prototype.start = function () {
    this._startTime = new Date();
  };

  Timer.prototype.stop = function () {
    this._endTime = new Date();
  };

  Timer.prototype.reset = function () {
    this._startTime = new Date();
    this._endTime = null;
  };

  Timer.prototype.elapsed = function () {
    if (!this._startTime) {
      return new TimeSpan();
    }

    var endTime = this._endTime || new Date();

    return TimeSpan.fromDateTime(this._startTime, endTime);
  };

  ps.Timer = Timer;

  var TimeSpan = function (milliseconds) {
    this._totalMilliseconds = milliseconds || 0;
  };

  TimeSpan.prototype.totalSeconds = function () {
    return this._totalMilliseconds / 1000;
  };

  TimeSpan.prototype.totalMilliseconds = function () {
    return this._totalMilliseconds;
  };

  TimeSpan.fromDateTime = function (dateBegin, dateEnd) {
    if (!(dateBegin instanceof Date) && !(dateEnd instanceof Date)) {
      throw new Error("A begin and end date must be supplied and both must be of type Date");
    }

    return new TimeSpan(dateEnd.getTime() - dateBegin.getTime());
  };

  ps.TimeSpan = TimeSpan;

  return ps;

}(ParticleSystem || {}));