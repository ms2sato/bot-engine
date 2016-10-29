require('dotenv').config()
const i18n = require(`${__dirname}/../lib/i18n`)
const be = require(`${__dirname}/../index`)

const initParams = {
  debug: false,
  logLevel: 6,
  json_file_store: './db/'
}

const engine = new be.Engine({
  initParams,
  config: {}
}, function (commands) {
  commands.users('channel', 'members')
})

i18n.config({
  lng: 'ja'
})
engine.beforeStarts('i18n', i18n.middleware)

engine.start()
