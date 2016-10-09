'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Botkit = require('botkit');
var env = process.env.NODE_ENV;
var _ = require('underscore');
var _s = require('underscore.string');

function isDevelopment() {
  return env === 'development';
}

function isProduction() {
  return env === 'production';
}

if (isDevelopment()) {
  require('dotenv').config();
}

var delegate = function delegate(prototype, to, name) {
  if (_.isArray(name)) {
    return _.each(name, function (n) {
      delegate(prototype, to, n);
    });
  }

  prototype[name] = function () {
    this[to][name].apply(this[to], arguments);
  };
};

var MessageUtils = function () {
  function MessageUtils() {
    _classCallCheck(this, MessageUtils);
  }

  _createClass(MessageUtils, null, [{
    key: 'mensionTo',
    value: function mensionTo(to, text) {
      var mension;
      if (Array.isArray(to)) {
        mension = to.map(function (t) {
          return '@' + t;
        }).join(' ');
      } else {
        mension = '@' + to;
      }
      return mension + ' ' + text;
    }
  }, {
    key: 'hasMensionTo',
    value: function hasMensionTo(name, text) {
      return text.indexOf('@' + name) !== -1;
    }
  }, {
    key: 'extractArray',
    value: function extractArray(str) {
      return _(str.split(',')).map(function (v) {
        return _s.trim(v);
      });
    }
  }]);

  return MessageUtils;
}();

// Resourceの定義


var ResourceType = function () {
  function ResourceType() {
    _classCallCheck(this, ResourceType);
  }

  _createClass(ResourceType, [{
    key: 'format',
    value: function format() {
      throw new Error('Unimplemented: format');
    }
  }, {
    key: 'value',
    value: function value(message) {
      throw new Error('Unimplemented: value');
    }
  }, {
    key: 'toString',
    value: function toString(value) {
      return JSON.stringify(value);
    }
  }]);

  return ResourceType;
}();

var HoursAndMinutesType = function (_ResourceType) {
  _inherits(HoursAndMinutesType, _ResourceType);

  function HoursAndMinutesType() {
    _classCallCheck(this, HoursAndMinutesType);

    return _possibleConstructorReturn(this, (HoursAndMinutesType.__proto__ || Object.getPrototypeOf(HoursAndMinutesType)).apply(this, arguments));
  }

  _createClass(HoursAndMinutesType, [{
    key: 'format',
    value: function format() {
      return '([0-9]?[0-9])\:([0-9]?[0-9])';
    }
  }, {
    key: 'value',
    value: function value(message) {
      var hours = Number(message.match[1]);
      var minutes = Number(message.match[2]);
      return { hours: hours, minutes: minutes };
    }
  }]);

  return HoursAndMinutesType;
}(ResourceType);

var NumberType = function (_ResourceType2) {
  _inherits(NumberType, _ResourceType2);

  function NumberType() {
    _classCallCheck(this, NumberType);

    return _possibleConstructorReturn(this, (NumberType.__proto__ || Object.getPrototypeOf(NumberType)).apply(this, arguments));
  }

  _createClass(NumberType, [{
    key: 'format',
    value: function format() {
      return '([0-9\.\-]+)';
    }
  }, {
    key: 'value',
    value: function value(message) {
      return Number(message.match[1]);
    }
  }]);

  return NumberType;
}(ResourceType);

var BooleanType = function (_ResourceType3) {
  _inherits(BooleanType, _ResourceType3);

  function BooleanType() {
    _classCallCheck(this, BooleanType);

    return _possibleConstructorReturn(this, (BooleanType.__proto__ || Object.getPrototypeOf(BooleanType)).apply(this, arguments));
  }

  _createClass(BooleanType, [{
    key: 'format',
    value: function format() {
      return '(.+)';
    }
  }, {
    key: 'value',
    value: function value(message) {
      return BooleanType.trues().indexOf(message.match[1].trim()) !== -1;
    }
  }], [{
    key: 'trues',
    value: function trues() {
      return ['yes', 'yea', 'yup', 'yep', 'ya', 'sure', 'ok', 'y', 'yeah', 'yah', 'true'];
    }
  }]);

  return BooleanType;
}(ResourceType);

var IntegerType = function (_NumberType) {
  _inherits(IntegerType, _NumberType);

  function IntegerType() {
    _classCallCheck(this, IntegerType);

    return _possibleConstructorReturn(this, (IntegerType.__proto__ || Object.getPrototypeOf(IntegerType)).apply(this, arguments));
  }

  _createClass(IntegerType, [{
    key: 'format',
    value: function format() {
      return '([0-9]+)';
    }
  }]);

  return IntegerType;
}(NumberType);

var Commands = function () {
  function Commands(engine) {
    _classCallCheck(this, Commands);

    this.engine = engine;
    this.controller = engine.controller;
    this.eventHandlers = [];
  }

  _createClass(Commands, [{
    key: 'onError',
    value: function onError(err) {
      console.error(err.message, err.stack);
    }
  }, {
    key: 'apply',
    value: function apply() {
      var _this5 = this;

      _.each(this.eventHandlers, function (eventHandler) {
        _this5.hearCommand(eventHandler);
      });

      this.hearCommand({
        command: 'usage',
        handler: function handler(bot, message) {
          var usages = _this5.eventHandlers.map(function (eventHandler) {
            return '/' + eventHandler.command + ': ' + eventHandler.usage;
          });
          return bot.reply(message, usages.join('\n'));
        }
      });
    }
  }, {
    key: 'push',
    value: function push(eventHandler) {
      if (_.isArray(eventHandler)) {
        this.eventHandlers = _.union(this.eventHandlers, eventHandler);
      } else {
        this.eventHandlers.push(eventHandler);
      }
      return this;
    }
  }, {
    key: 'hearCommand',
    value: function hearCommand(eventHandler) {
      if (!eventHandler.command) throw new Error('command not found on event param');
      if (!eventHandler.handler) throw new Error('handler not found on event param');

      var patterns = this.commandToPatterns(eventHandler.command);
      var types = eventHandler.types || ['mention', 'direct_mention'];
      var callback = this.decorateHandler(patterns, eventHandler.handler);

      if (eventHandler.middleware) {
        return this.controller.hears(patterns, types, eventHandler.middleware, callback);
      }

      return this.controller.hears(patterns, types, callback);
    }
  }, {
    key: 'mentions',
    value: function mentions(patterns, callback) {
      this.eventHandlers.push({
        patterns: patterns,
        handler: this.decorateHandler(patterns, callback)
      });
    }
  }, {
    key: 'resource',
    value: function resource(object, prop, type, entities) {
      var objects = object + 's';
      entities = entities || this.engine.storage[objects];

      this.eventHandlers.push({
        command: 'set-' + prop + ' ' + type.format(),
        usage: prop + 'を設定します',
        handler: function handler(bot, message) {
          console.log(object, message);
          var value = type.value(message);
          return entities.saveProp(message[object], prop, value).done(function () {
            bot.reply(message, prop + 'を設定しました: ' + type.toString(value));
          });
        }
      });

      this.eventHandlers.push({
        command: 'clear-' + prop,
        usage: prop + 'を消去します',
        handler: function handler(bot, message) {
          return entities.removeProp(message[object], prop).done(function () {
            bot.reply(message, prop + 'を消去しました');
          });
        }
      });

      this.eventHandlers.push({
        command: prop,
        usage: prop + 'を表示します',
        handler: function handler(bot, message) {
          return entities.getProp(message[object], prop).done(function (value) {
            bot.reply(message, prop + ': ' + type.toString(value));
          });
        }
      });
    }

    // private

  }, {
    key: 'commandToPatterns',
    value: function commandToPatterns(command) {
      return ['/' + command];
    }

    // private

  }, {
    key: 'decorateHandler',
    value: function decorateHandler(patterns, callback) {
      var _this6 = this;

      return function (bot, message) {
        console.log(new Date() + ': ' + patterns + ' called');
        try {
          var ret = callback(bot, message);
          if (ret) {
            // is promise
            ret.catch(function (err) {
              _this6.onError(err);
            });
          }
        } catch (err) {
          _this6.onError(err);
        }
      };
    }
  }]);

  return Commands;
}();

delegate(Commands.prototype, 'controller', ['on', 'hears']);

var CommandEventProcessor = function () {
  function CommandEventProcessor() {
    _classCallCheck(this, CommandEventProcessor);
  }

  _createClass(CommandEventProcessor, [{
    key: 'process',
    value: function process(engine, handler) {
      this.commands = new Commands(engine);
      handler.call(engine, this.commands);
      this.commands.apply();
    }
  }]);

  return CommandEventProcessor;
}();

var LegacyEventProcessor = function () {
  function LegacyEventProcessor() {
    _classCallCheck(this, LegacyEventProcessor);
  }

  _createClass(LegacyEventProcessor, [{
    key: 'process',
    value: function process(engine, handler) {
      handler.call(engine, engine.controller);
    }
  }]);

  return LegacyEventProcessor;
}();

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
      var _this7 = this;

      this.traits = this.traits || new SlackAppTraits();

      this.traits.beforeStartup(this);
      this.outputInfo();

      var controller = this.traits.createController(this);
      this.controller = controller;
      this.log = controller.log;
      this.storage = createStorage(controller);

      controller.setupWebserver(process.env.PORT, function (err, webserver) {
        if (err) {
          return _this7.error('ERROR: ' + err);
        }

        controller.createWebhookEndpoints(controller.webserver);
        controller.createOauthEndpoints(controller.webserver, _this7.responceAuth);
      });

      controller.on('create_bot', function (bot, config) {
        if (_this7.bots[bot.config.token]) {
          // already online! do nothing.
        } else {
            bot.startRTM(function (err) {
              if (err) {
                return _this7.error(err);
              }

              _this7.trackBot(bot);

              bot.startPrivateConversation({ user: config.createdBy }, function (err, convo) {
                if (err) {
                  return _this7.info(err);
                }

                _this7.greet(convo);
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
      var _this8 = this;

      controller.storage.teams.all(function (err, teams) {
        if (err) {
          throw new Error(err);
        }

        // connect all teams with bots up to slack!
        for (var t in teams) {
          if (teams[t].bot) {
            controller.spawn(teams[t]).startRTM(function (err, bot) {
              if (err) {
                _this8.error('Error connecting bot to Slack:', err);
              } else {
                _this8.trackBot(bot);
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
  MessageUtils: MessageUtils,
  CommandEventProcessor: CommandEventProcessor,
  LegacyEventProcessor: LegacyEventProcessor,
  SlackAppTraits: SlackAppTraits,
  ResourceTypes: {
    HoursAndMinutesType: HoursAndMinutesType,
    IntegerType: IntegerType,
    NumberType: NumberType,
    BooleanType: BooleanType,
    HoursAndMinutes: new HoursAndMinutesType(),
    Integer: new IntegerType(),
    Number: new NumberType(),
    Boolean: new BooleanType()
  }
};
