'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('underscore');
var Q = require('q');

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

var isPromise = function isPromise(o) {
  return !!o.then;
};

var toPromise = function toPromise(o) {
  if (isPromise(o)) return o;

  var deferred = Q.defer();
  deferred.resolve(o);
  return deferred.promise;
};

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

delegate(Commands.prototype, 'controller', ['on', 'hears'])

// extension #########################
;(function () {
  function onClear(object, prop, type, entities) {
    this.eventHandlers.push({
      command: 'clear-' + prop,
      usage: prop + '\u3092\u6D88\u53BB\u3057\u307E\u3059',
      handler: function handler(bot, message) {
        return entities.removeProp(message[object], prop).done(function () {
          bot.reply(message, prop + '\u3092\u6D88\u53BB\u3057\u307E\u3057\u305F');
        });
      }
    });
  }

  function onShow(object, prop, type, entities) {
    this.eventHandlers.push({
      command: prop,
      usage: prop + '\u3092\u8868\u793A\u3057\u307E\u3059',
      handler: function handler(bot, message) {
        return entities.getProp(message[object], prop).done(function (value) {
          bot.reply(message, prop + ': ' + type.toString(value));
        });
      }
    });
  }

  Commands.prototype.resource = function (object, prop, type, entities) {
    var objects = object + 's';
    entities = entities || this.engine.storage[objects];

    this.eventHandlers.push({
      command: 'set-' + prop + ' ' + type.format(),
      usage: prop + '\u3092\u8A2D\u5B9A\u3057\u307E\u3059',
      handler: function handler(bot, message) {
        return toPromise(type.value(message)).then(function (value) {
          return entities.saveProp(message[object], prop, value).done(function () {
            bot.reply(message, prop + '\u3092\u8A2D\u5B9A\u3057\u307E\u3057\u305F: ' + type.toString(value));
          });
        });
      }
    });

    onClear.call(this, object, prop, type, entities);
    onShow.call(this, object, prop, type, entities);
  };

  Commands.prototype.resources = function (object, prop, type, entities) {
    var objects = object + 's';
    entities = entities || this.engine.storage[objects];

    this.eventHandlers.push({
      command: 'add-' + prop + ' ' + type.format(),
      usage: prop + '\u3092\u8FFD\u52A0\u3057\u307E\u3059',
      handler: function handler(bot, message) {
        return toPromise(type.value(message)).then(function (value) {
          var defaults = {};
          defaults[prop] = [];
          return entities.safeGet(message[object], defaults).then(function (entity) {
            entity[prop].push(value);
            return entities.save(entity);
          }).done(function () {
            bot.reply(message, prop + '\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F: ' + type.toString(value));
          });
        });
      }
    });

    onClear.call(this, object, prop, type, entities);
    onShow.call(this, object, prop, type, entities);
  };
})();

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

module.exports = CommandEventProcessor;