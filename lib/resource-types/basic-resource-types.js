'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
  }, {
    key: 'toLabel',
    value: function toLabel(value) {
      return this.toString(value);
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

var StringType = function (_ResourceType3) {
  _inherits(StringType, _ResourceType3);

  function StringType() {
    _classCallCheck(this, StringType);

    return _possibleConstructorReturn(this, (StringType.__proto__ || Object.getPrototypeOf(StringType)).apply(this, arguments));
  }

  _createClass(StringType, [{
    key: 'format',
    value: function format() {
      return '(\\S+)';
    }
  }, {
    key: 'value',
    value: function value(message) {
      return message.match[1];
    }
  }]);

  return StringType;
}(ResourceType);

var BooleanType = function (_StringType) {
  _inherits(BooleanType, _StringType);

  function BooleanType() {
    _classCallCheck(this, BooleanType);

    return _possibleConstructorReturn(this, (BooleanType.__proto__ || Object.getPrototypeOf(BooleanType)).apply(this, arguments));
  }

  _createClass(BooleanType, [{
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
}(StringType);

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

module.exports = {
  HoursAndMinutesType: HoursAndMinutesType,
  IntegerType: IntegerType,
  NumberType: NumberType,
  BooleanType: BooleanType,
  StringType: StringType
};