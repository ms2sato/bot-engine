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

module.exports = function (conf) {
  Object.assign(_config, conf);
  return function (engine) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'i18n';

    engine.events.on('beforeStart:' + name, function (engine) {
      return new Promise(function (resolve, reject) {
        i18n.use(fsBackend).init(_config, function (err) {
          if (err) {
            return reject(err);
          }
          engine[name] = i18n;
          resolve(engine);
        });
      });
    });
  };
};