/**
 * Created by Josh on 7/29/14.
 */
(function () {
  'use strict';

  var ParticleSystemCtrl = function ($element, $attrs, ParticleEngine) {
    this.$element = $element;
    this.$attrs = $attrs;
    this.settings = {
      scale: 1,
      height: 600,
      width: 500,
      numParticles: 500,
      minVelocity: 0,
      maxVelocity: 100,
      minAngle: 0,
      maxAngle: 360,
      minLifetime: 50,
      maxLifetime: 1000,
      minRadius: 2,
      maxRadius: 6
    };
    this.particleSystem = new ParticleEngine($element.find('canvas')[0], this.settings);
  };
  ParticleSystemCtrl.$inject = ['$element', '$attrs', 'ParticleEngine'];

  ParticleSystemCtrl.prototype = {
    particleSystem: undefined,
    settings: undefined,
    getSettings:function(){
     var _this = this;

     angular.forEach(_this.settings, function(val, key){
        _this.settings[key] = parseInt(val, 10);
     });

     return _this.settings;
    },
    updateSettings: function () {
      this.particleSystem.updateSettings(this.getSettings());
    },
    start: function () {
      this.particleSystem.start();
    },
    stop: function () {
      this.particleSystem.stop();
    }
  };

  var ParticleSystemDirective = function () {
    return {
      restrict: 'E',
      controller: ParticleSystemCtrl,
      controllerAs: 'ps',
      scope:true,
      template: "<div>" +
        "<canvas></canvas>" +
        "<div>" +
        "<button type='button' ng-click='ps.start()'>Start</button>" +
        "<button type='button' ng-click='ps.stop()'>Stop</button><br/>" +
        "Particles: <input type='text' ng-model='ps.settings.numParticles' ng-change='ps.updateSettings()'><br />" +
        "Min Angle: <input type='text' ng-model='ps.settings.minAngle' ng-change='ps.updateSettings()'><br />" +
        "Max Angle: <input type='text' ng-model='ps.settings.maxAngle' ng-change='ps.updateSettings()'><br />" +
        "Min Lifetime: <input type='text' ng-model='ps.settings.minLifetime' ng-change='ps.updateSettings()'><br />" +
        "Max Lifetime: <input type='text' ng-model='ps.settings.maxLifetime' ng-change='ps.updateSettings()'><br />" +
        "Min Velocity: <input type='text' ng-model='ps.settings.minVelocity' ng-change='ps.updateSettings()'><br />" +
        "Max Velocity: <input type='text' ng-model='ps.settings.maxVelocity' ng-change='ps.updateSettings()'><br />" +
        "Min Radius: <input type='text' ng-model='ps.settings.minRadius' ng-change='ps.updateSettings()'><br />" +
        "Max Radius: <input type='text' ng-model='ps.settings.maxRadius' ng-change='ps.updateSettings()'><br />" +
        "</div>" +
        "</div>"
    };
  };

  angular.module('particle-engine')
    .directive('particleSystem', ParticleSystemDirective);

}());