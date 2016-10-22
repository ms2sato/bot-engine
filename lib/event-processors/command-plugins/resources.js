'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var promises = require('../../promises');
var _ = require('underscore');
var utils = require('../../utils');

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
  var objects = utils.pluralize(object);
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

var CollectionPropertyType = function () {
  function CollectionPropertyType() {
    _classCallCheck(this, CollectionPropertyType);
  }

  _createClass(CollectionPropertyType, [{
    key: 'each',
    value: function each(collection, func) {
      return _.each(collection, func);
    }
  }, {
    key: 'map',
    value: function map(collection, func) {
      return _.map(collection, func);
    }
  }, {
    key: 'valueToLabel',
    value: function valueToLabel(type, value) {
      return type.toLabel(value);
    }
  }]);

  return CollectionPropertyType;
}();

var ArrayPropertyType = function (_CollectionPropertyTy) {
  _inherits(ArrayPropertyType, _CollectionPropertyTy);

  function ArrayPropertyType() {
    _classCallCheck(this, ArrayPropertyType);

    return _possibleConstructorReturn(this, (ArrayPropertyType.__proto__ || Object.getPrototypeOf(ArrayPropertyType)).apply(this, arguments));
  }

  _createClass(ArrayPropertyType, [{
    key: 'defaultValue',
    value: function defaultValue() {
      return [];
    }
  }, {
    key: 'add',
    value: function add(collection, value) {
      collection.push(value);
      return value;
    }
  }]);

  return ArrayPropertyType;
}(CollectionPropertyType);

var HashPropertyType = function (_CollectionPropertyTy2) {
  _inherits(HashPropertyType, _CollectionPropertyTy2);

  function HashPropertyType() {
    var keyLabel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'id';
    var valueLabel = arguments[1];

    _classCallCheck(this, HashPropertyType);

    var _this2 = _possibleConstructorReturn(this, (HashPropertyType.__proto__ || Object.getPrototypeOf(HashPropertyType)).call(this));

    _this2.keyLabel = keyLabel;
    _this2.valueLabel = valueLabel;
    return _this2;
  }

  _createClass(HashPropertyType, [{
    key: 'defaultValue',
    value: function defaultValue() {
      return {};
    }
  }, {
    key: 'add',
    value: function add(collection, item) {
      var key = this.keyOf(item);
      var value = this.valueOf(item);
      collection[key] = value;
      return value;
    }
  }, {
    key: 'valueToLabel',
    value: function valueToLabel(type, value) {
      return this.valueLabel ? value : type.toLabel(value);
    }

    // protected

  }, {
    key: 'keyOf',
    value: function keyOf(item) {
      return item[this.keyLabel];
    }

    // protected

  }, {
    key: 'valueOf',
    value: function valueOf(item) {
      return this.valueLabel ? item[this.valueLabel] : item;
    }
  }]);

  return HashPropertyType;
}(CollectionPropertyType);

var arrayPropertyType = new ArrayPropertyType();

var resources = function resources(object, prop, type, entities) {
  var propertyType = arrayPropertyType;
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
        defaults[prop] = propertyType.defaultValue();
        var added = void 0;
        return entities.safeGet(message[object], defaults).then(function (entity) {
          added = propertyType.add(entity[prop], value);
          return entities.save(entity);
        }).done(function () {
          bot.reply(message, prop + '\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F: ' + propertyType.valueToLabel(type, added));
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
        var results = propertyType.map(value, function (v, k) {
          return '[' + k + ']' + propertyType.valueToLabel(type, v);
        }).join('\n');
        bot.reply(message, prop + ':\n' + results);
      });
    }
  });

  return {
    as: function as(pType) {
      propertyType = pType;
      return this;
    },
    asHash: function asHash() {
      var keyLabel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'id';
      var valueLabel = arguments[1];

      return this.as(new HashPropertyType(keyLabel, valueLabel));
    },
    asArray: function asArray() {
      return this.as(arrayPropertyType);
    }
  };
};

module.exports = {
  resource: resource,
  resources: resources
};