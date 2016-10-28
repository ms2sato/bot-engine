const i18n = require('i18next')
const fsBackend = require('i18next-node-fs-backend')

module.exports = function (name, next) {
  i18n.use(fsBackend).init({
    debug: false,
    lng: 'en',
    fallbackLng: 'en',
    ns: 'be',
    defaultNS: 'be',
    fallbackNS: true,
    backend: {
      loadPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`
    }
  }, (err) => {
    this[name] = i18n
    next(err)
  })
}
