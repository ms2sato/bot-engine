'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('underscore');
var rt = require('../resource-types');
var utils = require('../utils');
var delegate = require('../delegate');

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
      var _this = this;

      _.each(this.eventHandlers, function (eventHandler) {
        _this.hearCommand(eventHandler);
      });

      this.hearCommand({
        command: 'usage',
        handler: function handler(bot, message) {
          var usages = _this.eventHandlers.map(function (eventHandler) {
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
      var _this2 = this;

      return function (bot, message) {
        _this2.engine.log.debug(new Date() + ': ' + patterns + ' called');
        try {
          var ret = callback(bot, message);
          if (ret) {
            // is promise
            ret.catch(function (err) {
              _this2.onError(err);
            });
          }
        } catch (err) {
          _this2.onError(err);
        }
      };
    }
  }]);

  return Commands;
}();

delegate(Commands.prototype, 'controller', ['on', 'hears']);

var CommandEventBinder = function () {
  function CommandEventBinder() {
    _classCallCheck(this, CommandEventBinder);

    this.aliases = {
      user: rt.User
    };
  }

  _createClass(CommandEventBinder, [{
    key: 'bind',
    value: function bind(engine, handler) {
      this.commands = this.createCommands(engine);

      handler.call(engine, this.commands);
      this.commands.apply();
    }

    // private

  }, {
    key: 'createCommands',
    value: function createCommands(engine) {
      var commands = new Commands(engine);

      // plugin #########################
      require('./command-plugins/resources').plug(commands);

      // aliases #########################
      _.each(this.aliases, function (type, key) {
        commands[key] = function (prop, entities) {
          return this.resource(prop, type, entities);
        };

        commands[utils.pluralize(key)] = function (prop, entities) {
          return this.resources(prop, type, entities);
        };
      });

      return commands;
    }
  }]);

  return CommandEventBinder;
}();

module.exports = CommandEventBinder;