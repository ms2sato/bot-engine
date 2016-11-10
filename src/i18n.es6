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

module.exports = function (conf) {
  Object.assign(_config, conf)
  return function (name, engine) {
    engine.events.on(`beforeStart:${name}`, function (engine) {
      return new Promise(function (resolve, reject) {
        i18n.use(fsBackend).init(_config, (err) => {
          if (err) {
            return reject(err)
          }
          engine[name] = i18n
          resolve(engine)
        })
      })
    })
  }
}
