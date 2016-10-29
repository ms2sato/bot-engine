const i18n = require('i18next')
const fsBackend = require('i18next-node-fs-backend')

const defaults = {
  debug: false,
  lng: 'en',
  fallbackLng: 'en',
  ns: 'be',
  defaultNS: 'be',
  fallbackNS: true,
  backend: {
    loadPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`
  }
}

let _config = defaults

module.exports = {
  config: function (conf) {
    Object.assign(_config, conf)
    console.log('i18n setting', _config)
  },
  middleware: function (name, next) {
    i18n.use(fsBackend).init(_config, (err) => {
      this[name] = i18n
      next(err)
    })
  }
}
