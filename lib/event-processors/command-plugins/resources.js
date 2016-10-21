'use strict';

var promises = require('../../promises');
var _ = require('underscore');

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

var resource = function resource(object, prop, type, entities) {
  var objects = object + 's';
  entities = entities || this.engine.storage[objects];

  this.eventHandlers.push({
    command: 'set-' + prop + ' ' + type.format(),
    usage: prop + '\u3092\u8A2D\u5B9A\u3057\u307E\u3059',
    handler: function handler(bot, message) {
      return promises.toPromise(type.value(message, bot)).then(function (value) {
        return entities.saveProp(message[object], prop, value).done(function () {
          bot.reply(message, prop + '\u3092\u8A2D\u5B9A\u3057\u307E\u3057\u305F: ' + type.toLabel(value));
        });
      });
    }
  });

  onClear.call(this, object, prop, type, entities);

  this.eventHandlers.push({
    command: prop,
    usage: prop + '\u3092\u8868\u793A\u3057\u307E\u3059',
    handler: function handler(bot, message) {
      return entities.getProp(message[object], prop).done(function (value) {
        bot.reply(message, prop + ': ' + type.toLabel(value));
      });
    }
  });
};

var resources = function resources(object, prop, type, entities) {
  var objects = object + 's';
  entities = entities || this.engine.storage[objects];

  this.eventHandlers.push({
    command: 'add-' + prop + ' ' + type.format(),
    usage: prop + '\u3092\u8FFD\u52A0\u3057\u307E\u3059',
    handler: function handler(bot, message) {
      return promises.toPromise(type.value(message, bot)).then(function (value) {
        if (_.isUndefined(value)) {
          return bot.reply(message, '有効な値が取れませんでした');
        }

        var defaults = {};
        defaults[prop] = [];
        return entities.safeGet(message[object], defaults).then(function (entity) {
          entity[prop].push(value);
          return entities.save(entity);
        }).done(function () {
          bot.reply(message, prop + '\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F: ' + type.toLabel(value));
        });
      });
    }
  });

  onClear.call(this, object, prop, type, entities);

  this.eventHandlers.push({
    command: prop,
    usage: prop + '\u3092\u8868\u793A\u3057\u307E\u3059',
    handler: function handler(bot, message) {
      return entities.getProp(message[object], prop).done(function (value) {
        bot.reply(message, prop + ':\n' + _.map(value, function (v) {
          return type.toLabel(v);
        }).join('\n'));
      });
    }
  });
};

module.exports = {
  resource: resource, resources: resources
};