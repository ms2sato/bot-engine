'use strict';

var i18n = require('i18next');
var fsBackend = require('i18next-node-fs-backend');

module.exports = function (name, next) {
  var _this = this;

  i18n.use(fsBackend).init({
    debug: true,
    lng: 'en',
    fallbackLng: 'en',
    ns: 'be',
    defaultNS: 'be',
    fallbackNS: true,
    backend: {
      loadPath: __dirname + '/../locales/{{lng}}/{{ns}}.json'
    }
  }, function (err) {
    _this[name] = i18n;
    next(err);
  });
};