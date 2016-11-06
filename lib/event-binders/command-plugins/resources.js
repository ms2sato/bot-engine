'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var promises = require('../../promises');
var _ = require('underscore');
var utils = require('../../utils');

function onClear(prop, type, entities) {
  var _this = this;

  this.eventHandlers.push({
    command: 'clear-' + prop,
    usage: this.engine.i18n.t('be.clearprop.usage', { prop: prop }),
    handler: function handler(bot, message) {
      return entities.removeProp(bot, message, prop).done(function () {
        bot.reply(message, _this.engine.i18n.t('be.clearprop.message', { prop: prop }));
      });
    }
  });
}

var resource = function resource(prop, type, entities) {
  var _this2 = this;

  entities = entities || this.channelEntities();

  this.eventHandlers.push({
    command: 'set-' + prop + ' ' + type.format(),
    usage: this.engine.i18n.t('be.setprop.usage', { prop: prop }),
    handler: function handler(bot, message) {
      return promises.toPromise(type.value(message, bot)).then(function (value) {
        return entities.saveProp(bot, message, prop, value).done(function () {
          bot.reply(message, _this2.engine.i18n.t('be.setprop.message', { label: type.toLabel(value) }));
        });
      });
    }
  });

  onClear.call(this, prop, type, entities);

  this.eventHandlers.push({
    command: prop,
    usage: this.engine.i18n.t('be.showprop.usage', { prop: prop }),
    handler: function handler(bot, message) {
      return entities.getProp(bot, message, prop).done(function (value) {
        bot.reply(message, _this2.engine.i18n.t('be.showprop.message', { label: type.toLabel(value) }));
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

    var _this4 = _possibleConstructorReturn(this, (HashPropertyType.__proto__ || Object.getPrototypeOf(HashPropertyType)).call(this));

    _this4.keyLabel = keyLabel;
    _this4.valueLabel = valueLabel;
    return _this4;
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

var resources = function resources(prop, type, entities) {
  var _this5 = this;

  entities = entities || this.channelEntities();
  var propertyType = arrayPropertyType;

  this.eventHandlers.push({
    command: 'add-' + prop + ' ' + type.format(),
    usage: this.engine.i18n.t('be.addprop.usage', { prop: prop }),
    handler: function handler(bot, message) {
      return promises.toPromise(type.value(message, bot)).then(function (value) {
        if (_.isUndefined(value)) {
          return bot.reply(message, _this5.engine.i18n.t('be.addprop.message.fail'));
        }

        entities.addProp(bot, message, propertyType, prop, value).done(function (added) {
          bot.reply(message, _this5.engine.i18n.t('be.addprop.message.success', {
            prop: prop,
            label: propertyType.valueToLabel(type, added)
          }));
        });
      });
    }
  });

  onClear.call(this, prop, type, entities);

  this.eventHandlers.push({
    command: prop,
    usage: this.engine.i18n.t('be.showprop.usage', { prop: prop }),
    handler: function handler(bot, message) {
      return entities.getProp(bot, message, prop).done(function (value) {
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

var Storage2Entities = function () {
  function Storage2Entities(engine, objectName) {
    _classCallCheck(this, Storage2Entities);

    this.body = engine.storage[utils.pluralize(objectName)];
    this.objectName = objectName;
  }

  _createClass(Storage2Entities, [{
    key: 'getProp',
    value: function getProp(bot, message, prop) {
      return this.body.getProp(message[this.objectName], prop);
    }
  }, {
    key: 'saveProp',
    value: function saveProp(bot, message, prop, value) {
      return this.body.saveProp(message[this.objectName], prop, value);
    }
  }, {
    key: 'removeProp',
    value: function removeProp(bot, message, prop) {
      return this.body.removeProp(message[this.objectName], prop);
    }
  }, {
    key: 'addProp',
    value: function addProp(bot, message, propertyType, prop, value) {
      var _this6 = this;

      var defaults = {};
      defaults[prop] = propertyType.defaultValue();
      var added = void 0;
      return this.body.safeGet(message[this.objectName], defaults).then(function (entity) {
        added = propertyType.add(entity[prop], value);
        return _this6.body.save(entity).then(function () {
          return added;
        });
      });
    }
  }]);

  return Storage2Entities;
}();

module.exports = {
  plug: function plug(commands) {
    commands.resource = resource;
    commands.resources = resources;

    commands.userEntities = function () {
      return new Storage2Entities(this.engine, 'user');
    };
    commands.channelEntities = function () {
      return new Storage2Entities(this.engine, 'channel');
    };
    commands.teamEntities = function () {
      return new Storage2Entities(this.engine, 'team');
    };
  }
};