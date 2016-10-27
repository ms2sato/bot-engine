'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var env = process.env.NODE_ENV;
var _ = require('underscore');
var SlackAppTraits = require('./traits/slack-app-traits');
var CommandEventProcessor = require('./event-processors/command-event-processor');
var promisify = require('./promises').promisify;
var Q = require('q');

function isDevelopment() {
  return env === 'development';
}

function isProduction() {
  return env === 'production';
}

if (isDevelopment()) {
  require('dotenv').config();
}

var middlewareNames = ['beforeStarts', 'beforeEventProcesses', 'afterEventProcesses'];

var Engine = function () {
  function Engine(params, handler) {
    var _this = this;

    _classCallCheck(this, Engine);

    if (!params.initParams) {
      throw new Error('params.initParams not found.');
    }
    if (!handler) {
      throw new Error('handler not found.');
    }

    this.params = params;
    this.handler = handler;
    this.bots = {};
    this.middlewares = {};

    middlewareNames.forEach(function (name) {
      _this.middlewares[name] = {};
    });

    // default middlewares
    this.beforeStarts('i18n', require('./i18n'));
  }

  _createClass(Engine, [{
    key: 'callMiddleware',
    value: function callMiddleware(middlewareName) {
      var _this2 = this;

      if (middlewareNames.indexOf(middlewareName) == -1) {
        throw new Error('Unexected MiddlewareGroup: ' + middlewareName);
      }
      return Q.all(_.map(this.middlewares[middlewareName], function (callback, name) {
        return promisify(_this2, callback).call(_this2, name);
      }));
    }
  }, {
    key: 'responceAuth',
    value: function responceAuth(err, req, res) {
      if (err) {
        res.status(500).send('ERROR: ' + err);
      } else {
        res.send('Success!');
      }
    }
  }, {
    key: 'start',
    value: function start() {
      var _this3 = this;

      return this.callMiddleware('beforeStarts').then(function (props) {
        _this3.traits = _this3.traits || new SlackAppTraits();

        _this3.traits.beforeStartup(_this3);
        _this3.outputInfo();

        var controller = _this3.traits.createController(_this3);
        _this3.controller = controller;
        _this3.log = controller.log;
        _this3.storage = createStorage(controller);

        controller.setupWebserver(process.env.PORT, function (err, webserver) {
          if (err) {
            return _this3.error('ERROR: ' + err);
          }

          controller.createWebhookEndpoints(controller.webserver);
          controller.createOauthEndpoints(controller.webserver, _this3.responceAuth);
        });

        controller.on('create_bot', function (bot, config) {
          if (_this3.bots[bot.config.token]) {
            // already online! do nothing.
          } else {
            bot.startRTM(function (err) {
              if (err) {
                return _this3.error(err);
              }

              _this3.trackBot(bot);

              bot.startPrivateConversation({ user: config.createdBy }, function (err, convo) {
                if (err) {
                  return _this3.info(err);
                }

                _this3.greet(convo);
              });
            });
          }
        });

        _this3.eventProcessor = _this3.eventProcessor || new CommandEventProcessor();
        _this3.eventProcessor.process(_this3, _this3.handler);

        _this3.deserializeTeam(controller);
      }).done();
    }
  }, {
    key: 'setEventProcessor',
    value: function setEventProcessor(eventProcessor) {
      this.eventProcessor = eventProcessor;
    }
  }, {
    key: 'setTraits',
    value: function setTraits(traits) {
      this.traits = traits;
    }
  }, {
    key: 'error',
    value: function error() {
      this.controller.log.error.apply(this.controller.log, arguments);
    }
  }, {
    key: 'info',
    value: function info() {
      this.controller.log.info.apply(this.controller.log, arguments);
    }
  }, {
    key: 'find',
    value: function find(team) {
      for (var key in this.bots) {
        if (this.bots.hasOwnProperty(key)) {
          var bot = this.bots[key];
          if (bot.team_info.id === team) return bot;
        }
      }
      return null;
    }

    // protected

  }, {
    key: 'greet',
    value: function greet(convo) {
      convo.say('I am a bot that has just joined your team');
      convo.say('You must now /invite me to a channel so that I can be of use!');
    }

    // private

  }, {
    key: 'deserializeTeam',
    value: function deserializeTeam(controller) {
      var _this4 = this;

      controller.storage.teams.all(function (err, teams) {
        if (err) {
          throw new Error(err);
        }

        // connect all teams with bots up to slack!
        for (var t in teams) {
          if (teams[t].bot) {
            controller.spawn(teams[t]).startRTM(function (err, bot) {
              if (err) {
                _this4.error('Error connecting bot to Slack:', err);
              } else {
                _this4.trackBot(bot);
              }
            });
          }
        }
      });
    }
  }, {
    key: 'checkEnv',
    value: function checkEnv(name) {
      if (!process.env[name]) {
        var msg = 'Error: Specify ' + name + ' in environment';
        this.log.error(msg);
        throw new Error(msg);
      }
    }

    // private

  }, {
    key: 'trackBot',
    value: function trackBot(bot) {
      require('./slack-api').promisify(bot.api);
      this.bots[bot.config.token] = bot;
    }

    // private

  }, {
    key: 'outputInfo',
    value: function outputInfo() {
      console.log('### Engine start ############################');
      console.log('NODE_ENV: ' + process.env.NODE_ENV);
      console.log('clientId: ' + process.env.clientId);
      console.log('PORT: ' + process.env.PORT);
      console.log('###############################################');
    }
  }]);

  return Engine;
}();

middlewareNames.forEach(function (middlewareName) {
  Engine.prototype[middlewareName] = function (name, callback) {
    this.middlewares[middlewareName][name] = callback;
  };
});

function createStorage(controller) {
  var storage = require('botkit-promise-storage')(controller);

  function enhance(entities) {
    entities.safeGet = function (id) {
      var defaults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return entities.get(id).catch(function (_err) {
        return { id: id };
      }).then(function (obj) {
        return _.defaults(obj || { id: id }, defaults);
      });
    };

    entities.getProp = function (id, prop, defaults) {
      return entities.safeGet(id).then(function (obj) {
        return _.isUndefined(obj[prop]) ? defaults : obj[prop];
      });
    };

    entities.saveProp = function (id, prop, value) {
      return entities.safeGet(id).then(function (obj) {
        obj[prop] = value;
        return entities.save(obj);
      });
    };

    entities.removeProp = function (id, prop) {
      return entities.get(id).then(function (obj) {
        delete obj[prop];
        return entities.save(obj);
      }).catch(function (_err) {
        return { id: id };
      });
    };
  }

  enhance(storage.users);
  enhance(storage.channels);
  enhance(storage.teams);

  return storage;
}

module.exports = {
  isDevelopment: isDevelopment,
  isProduction: isProduction,
  Engine: Engine,
  MessageUtils: require('./message-utils'),
  ResourceTypes: require('./resource-types')
};