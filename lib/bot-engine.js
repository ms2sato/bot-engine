'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var env = process.env.NODE_ENV;
var _ = require('underscore');
var SlackAppTraits = require('./traits/slack-app-traits');
var CommandEventBinder = require('./event-binders/command-event-binder');
var EventEmitter = require('eventemitter2').EventEmitter2;

function isDevelopment() {
  return env === 'development';
}

function isProduction() {
  return env === 'production';
}

if (isDevelopment()) {
  require('dotenv').config();
}

var middlewareId = 1;

var Engine = function () {
  function Engine(params, handler) {
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
    this.events = new EventEmitter({
      wildcard: true,
      delimiter: ':'
    });
  }

  _createClass(Engine, [{
    key: 'use',
    value: function use(name, middleware) {
      if (!name) {
        throw new TypeError('name shoud not be null');
      }

      if (!middleware) {
        if (!_.isFunction(name)) {
          throw new TypeError('name should be name of middleware or Function');
        }
        middleware = name;
        name = '' + middlewareId++;
      } else {
        if (!_.isFunction(middleware)) {
          throw new TypeError('middleware should be Function');
        }
      }

      return middleware(name, this);
    }
  }, {
    key: 'start',
    value: function start() {
      var _this = this;

      // default middlewares
      if (!this.i18n) {
        this.use('i18n', require('./i18n')());
      }

      return this.events.emitAsync('beforeStart:*', this).then(function (props) {
        _this.traits = _this.traits || new SlackAppTraits();

        _this.traits.beforeStartup(_this);
        _this.outputInfo();

        var controller = _this.traits.createController(_this);
        _this.controller = controller;
        _this.log = controller.log;
        _this.storage = createStorage(controller);

        controller.on('create_bot', function (bot, config) {
          if (_this.bots[bot.config.token]) {
            // already online! do nothing.
          } else {
            bot.startRTM(function (err) {
              if (err) {
                return _this.error(err);
              }

              _this.trackBot(bot);

              bot.startPrivateConversation({ user: config.createdBy }, function (err, convo) {
                if (err) {
                  return _this.info(err);
                }

                _this.greet(convo);
              });
            });
          }
        });

        _this.eventBinder = _this.eventBinder || new CommandEventBinder();

        return _this.events.emitAsync('beforeBinding:*', _this).then(function () {
          return _this.eventBinder.bind(_this, _this.handler);
        }).then(function () {
          return _this.events.emitAsync('afterBinding:*', _this);
        }).then(function () {
          return _this.deserializeTeam(controller);
        }).then(function () {
          return _this.events.emitAsync('afterStart:*', _this);
        });
      });
    }
  }, {
    key: 'setEventBinder',
    value: function setEventBinder(eventBinder) {
      this.eventBinder = eventBinder;
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
      var _this2 = this;

      controller.storage.teams.all(function (err, teams) {
        if (err) {
          throw new Error(err);
        }

        // connect all teams with bots up to slack!
        for (var t in teams) {
          if (teams[t].bot) {
            controller.spawn(teams[t]).startRTM(function (err, bot) {
              if (err) {
                _this2.error('Error connecting bot to Slack:', err);
              } else {
                _this2.trackBot(bot);
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

function botEngine(params, callback) {
  return new Engine(params, callback);
}

botEngine.isDevelopment = isDevelopment;
botEngine.isProduction = isProduction;
botEngine.Engine = Engine;
botEngine.MessageUtils = require('./message-utils');
botEngine.ResourceTypes = require('./resource-types');
botEngine.webServer = require('./web-server');

module.exports = botEngine;