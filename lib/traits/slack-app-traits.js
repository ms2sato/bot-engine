'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Botkit = require('botkit');

var SlackAppTraits = function () {
  function SlackAppTraits() {
    _classCallCheck(this, SlackAppTraits);
  }

  _createClass(SlackAppTraits, [{
    key: 'beforeStartup',
    value: function beforeStartup(engine) {
      engine.checkEnv('clientId');
      engine.checkEnv('clientSecret');
      engine.checkEnv('PORT');
    }
  }, {
    key: 'createController',
    value: function createController(engine) {
      var params = engine.params;
      var config = Object.assign({
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        scopes: ['bot']
      }, params.config);

      return Botkit.slackbot(params.initParams).configureSlackApp(config);
    }
  }]);

  return SlackAppTraits;
}();

module.exports = SlackAppTraits;