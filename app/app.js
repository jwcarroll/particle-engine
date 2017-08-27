/**
 * Created by Josh on 7/29/14.
 */
(function () {
  'use strict';

  angular.module('particle-engine', [])
    .value('ParticleEngine', ParticleSystem.Engine);

}());