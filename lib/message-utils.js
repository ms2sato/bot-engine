'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('underscore');
var _s = require('underscore.string');

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

module.exports = MessageUtils;