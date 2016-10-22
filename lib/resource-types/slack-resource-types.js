'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var bt = require('./basic-resource-types');
var _ = require('underscore');

var UserType = function (_bt$StringType) {
  _inherits(UserType, _bt$StringType);

  function UserType() {
    _classCallCheck(this, UserType);

    return _possibleConstructorReturn(this, (UserType.__proto__ || Object.getPrototypeOf(UserType)).apply(this, arguments));
  }

  _createClass(UserType, [{
    key: 'value',
    value: function value(message, bot) {
      var _this2 = this;

      var username = message.match[1];
      return bot.api.users.list({}).then(function (users) {
        var member = _.findWhere(users.members, { name: username });
        if (!member) return member;
        return _this2.filter(member);
      });
    }
  }, {
    key: 'toLabel',
    value: function toLabel(value) {
      return value.name + '(id:' + value.id + ')';
    }

    // protected

  }, {
    key: 'filter',
    value: function filter(user) {
      return user;
    }
  }]);

  return UserType;
}(bt.StringType);

var UserLightType = function (_UserType) {
  _inherits(UserLightType, _UserType);

  function UserLightType() {
    _classCallCheck(this, UserLightType);

    return _possibleConstructorReturn(this, (UserLightType.__proto__ || Object.getPrototypeOf(UserLightType)).apply(this, arguments));
  }

  _createClass(UserLightType, [{
    key: 'filter',
    value: function filter(user) {
      return { id: user.id, name: user.name };
    }
  }]);

  return UserLightType;
}(UserType);

module.exports = {
  UserType: UserType,
  UserLightType: UserLightType
};