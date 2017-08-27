var Config;
(function(Config) {
    'use strict';

    Config.bootstrap = function() {
        var scale = 1,
            gravity = new ParticleSystem.Velocity(320 * scale, 90),
            wind = new ParticleSystem.Velocity(100 * scale, 180),
            elasticity = 5,
            mousepos = { x: 0, y: 0 },
            settings = {
                height: window.innerHeight,
                width: window.innerWidth,
                numParticles: 1000,
                minVelocity: 10 * scale,
                maxVelocity: 300 * scale,
                minAngle: 0,
                maxAngle: 360,
                minLifetime: 50,
                maxLifetime: 1000,
                minRadius: 3 * scale,
                maxRadius: 6 * scale
            },
            colorIndex = 0,
            setupColors = {
                fire: [
                    [202, 117, 36],
                    [202, 151, 36],
                    [202, 52, 36]
                ],
                water: [
                    [34, 25, 175],
                    [14, 18, 116],
                    [85, 77, 216]
                ],
                pinkAndGreen: [[255, 179, 179], [179, 255, 179]]
            },
            pos = {
                initial: {
                    x: settings.width / 2,
                    y: settings.height / 2
                },
                cur: {
                    x: settings.width / 2,
                    y: settings.height / 2
                },
                incrementX: 0.1,
                incrementY: 0.1,
                maxDistanceX: settings.width / 2,
                maxDistanceY: settings.height / 2
            };
        pos.max = {
            x: pos.initial.x + pos.maxDistanceX,
            y: pos.initial.y + pos.maxDistanceY
        };
        pos.min = {
            x: pos.initial.x - pos.maxDistanceX,
            y: pos.initial.y - pos.maxDistanceY
        };

        function applyForce(velocity) {
            return function(particle, delta) {
                var f = velocity.getVector(delta.totalSeconds());

                particle.velocity.x += f.x;
                particle.velocity.y += f.y;
            };
        }

        function createBounceFunction(direction, upperBound, lowerBound, elasticity) {
            return function(particle, delta) {
                if ((particle[direction] + particle.radius) > upperBound) {
                    particle[direction] = upperBound - particle.radius;
                    particle.velocity[direction] = -(particle.velocity[direction] / elasticity);
                } else if ((particle[direction] - particle.radius) < lowerBound) {
                    particle[direction] = particle.radius;
                    particle.velocity[direction] = -(particle.velocity[direction] / elasticity);
                }
            };
        }

        function createMousePointerForceFunction() {
            return function(particle, delta) {
                var forceToMouse = ParticleSystem.Velocity.fromCoords(particle.x, particle.y, mousepos.x, mousepos.y, 1000);

                if (forceToMouse._speed <= 50) {
                    var vector = forceToMouse.getVector(delta.totalSeconds());
                    particle.velocity.x -= vector.x * 50;
                    particle.velocity.y -= vector.y * 50;
                }
            };
        }

        function trackMouse() {
            window.addEventListener("mousemove", function(event) {
                var e = event;

                var target = e.target || e.srcElement,
                    style = target.currentStyle || window.getComputedStyle(target, null),
                    borderLeftWidth = parseInt(style['borderLeftWidth'], 10),
                    borderTopWidth = parseInt(style['borderTopWidth'], 10),
                    rect = target.getBoundingClientRect(),
                    offsetX = e.clientX - borderLeftWidth - rect.left,
                    offsetY = e.clientY - borderTopWidth - rect.top;

                mousepos.x = offsetX;
                mousepos.y = offsetY;
            });
        }

        function createSpawnAtMousePosition() {
            return function(particle) {
                particle.x = mousepos.x;
                particle.y = mousepos.y;
            };
        }

        function createSpawnPositionMover(colors) {
            return function(particle) {
                particle.x = pos.cur.x += pos.incrementX;
                particle.y = pos.cur.y += pos.incrementY;

                if (pos.cur.x > pos.max.x || pos.cur.x < pos.min.x) {
                    pos.incrementX *= -1;
                }
                if (pos.cur.y > pos.max.y || pos.cur.y < pos.min.y) {
                    pos.incrementY *= -1;
                }

                if (colorIndex >= colors.length) {
                    colorIndex = 0;
                }

                particle.color = colors[colorIndex];
                colorIndex += 1;
            };
        }

        function createColorSetter(colors) {
            return function(particle) {
                if (colorIndex >= colors.length) {
                    colorIndex = 0;
                }

                particle.color = colors[colorIndex];
                colorIndex += 1;
            };
        }

        function createMasterParticle() {
            var masterParticle,
                lifetime = 100000;

            return function(particle) {
                if (!masterParticle) {
                    particle.x = settings.width / 2;
                    particle.y = settings.height / 2;
                    particle.radius = 10;
                    particle.velocity.x *= 5;
                    particle.velocity.y *= 5;
                    //particle.velocity = new ParticleSystem.Velocity(0, 0);

                    particle.lifetime = lifetime;
                    particle.shouldReset = false;
                    particle.__isMaster__ = true;
                    masterParticle = particle;
                }

                if (!particle.__isMaster__) {
                    var angle = Math.random() * Math.PI * 2;

                    particle.x = masterParticle.x + Math.cos(angle) * masterParticle.radius;
                    particle.y = masterParticle.y + Math.sin(angle) * masterParticle.radius;
                }

                if (masterParticle.isDead()) {
                    masterParticle = undefined;
                }
            };
        }

        function createForceToMouse() {
            return function(particle, delta) {
                if (particle.__isMaster__) {
                    var forceToMouse = ParticleSystem.Velocity.fromCoords(particle.x, particle.y, mousepos.x, mousepos.y, 1000);
                    var vector = forceToMouse.getVector(delta.totalSeconds());
                    particle.velocity.x += vector.x;
                    particle.velocity.y += vector.y;
                }
            };
        }

        function createFriction() {
            return function(particle, delta) {
                if (!particle.__isMaster__) {
                    particle.velocity.x *= 0.99;
                    particle.velocity.y *= 0.99;
                }
            };
        }

        function createAcceleration() {
            return function(particle, delta) {
                if (!particle.__isMaster__) {
                    particle.velocity.x *= 1.05;
                    particle.velocity.y *= 1.05;
                }
            };
        }

        var engine = Config.engine = new ParticleSystem.Engine("world1", settings);
        engine.start();

        engine.addForce(applyForce(gravity));
        //engine.addForce(applyForce(wind));
        engine.addForce(createBounceFunction('x', settings.width, 0, elasticity));
        engine.addForce(createBounceFunction('y', settings.height, 0, elasticity));
        //engine.addForce(createMousePointerForceFunction());
        engine.on("ParticleCreated", createColorSetter(setupColors.fire));
        //engine.on("ParticleCreated", createMasterParticle());
        //engine.addForce(createForceToMouse());
        //engine.addForce(createAcceleration());
        //engine.addForce(createFriction());
        //engine.on("ParticleCreated", createSpawnPositionMover(setupColors.water));
        engine.on("ParticleCreated", createSpawnAtMousePosition());

        trackMouse();
		/*
					var engine2 = new ParticleSystem.Engine("world2", ParticleSystem.Utils.merge({
						numParticles: 500,
						minVelocity: 0 * scale,
						maxVelocity: 100 * scale,
						minAngle: 85,
						maxAngle: 95,
						minLifetime: 2000,
						maxLifetime: 4000,
						minRadius: 2 * scale,
						maxRadius: 6 * scale
					}, settings));
		
					engine2.addForce(applyForce(gravity));
					//engine2.addForce(applyForce(wind));
					engine2.addForce(createBounceFunction('x', settings.width, 0, elasticity));
					engine2.addForce(createBounceFunction('y', settings.height, 0, elasticity));
					//engine2.addForce(createMousePointerForceFunction());
					engine2.on("ParticleCreated", createColorSetter(setupColors.water));
					//engine2.on("ParticleCreated", createMasterParticle());
					//engine2.addForce(createForceToMouse());
					//engine2.on("ParticleCreated", createSpawnPositionMover(setupColors.fire));
					engine2.on("ParticleCreated", createSpawnAtMousePosition());
		
					engine.start();
					engine2.start();
		
					document.body.onclick = function(e) {
		
						console.log([offsetX, offsetY]);
					};*/
    };

} (Config = (Config || {})));