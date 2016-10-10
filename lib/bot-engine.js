'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var env = process.env.NODE_ENV;
var _ = require('underscore');
var SlackAppTraits = require('./traits/slack-app-traits');
var CommandEventProcessor = require('./event-processors/command-event-processor');

function isDevelopment() {
  return env === 'development';
}

function isProduction() {
  return env === 'production';
}

if (isDevelopment()) {
  require('dotenv').config();
}

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
  }

  _createClass(Engine, [{
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
      var _this = this;

      this.traits = this.traits || new SlackAppTraits();

      this.traits.beforeStartup(this);
      this.outputInfo();

      var controller = this.traits.createController(this);
      this.controller = controller;
      this.log = controller.log;
      this.storage = createStorage(controller);

      controller.setupWebserver(process.env.PORT, function (err, webserver) {
        if (err) {
          return _this.error('ERROR: ' + err);
        }

        controller.createWebhookEndpoints(controller.webserver);
        controller.createOauthEndpoints(controller.webserver, _this.responceAuth);
      });

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

      this.eventProcessor = this.eventProcessor || new CommandEventProcessor();
      this.eventProcessor.process(this, this.handler);

      this.deserializeTeam(controller);
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
        console.log('safeGet:error: ', _err);
        return { id: id };
      }).then(function (obj) {
        console.log('safeGet:success: ', obj);
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
        console.log(id, obj);
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