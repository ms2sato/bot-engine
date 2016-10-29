'use strict';

var i18n = require('i18next');
var fsBackend = require('i18next-node-fs-backend');

var defaults = {
  debug: false,
  lng: 'en',
  fallbackLng: 'en',
  ns: 'be',
  defaultNS: 'be',
  fallbackNS: true,
  backend: {
    loadPath: __dirname + '/../locales/{{lng}}/{{ns}}.json'
  }
};

var _config = defaults;

module.exports = {
  config: function config(conf) {
    Object.assign(_config, conf);
    console.log('i18n setting', _config);
  },
  middleware: function middleware(name, next) {
    var _this = this;

    i18n.use(fsBackend).init(_config, function (err) {
      _this[name] = i18n;
      next(err);
    });
  }
};