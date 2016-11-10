const i18n = require(`${__dirname}/../lib/i18n`)
const be = require(`${__dirname}/../index`)

const initParams = {
  debug: false,
  logLevel: 6,
  json_file_store: './db/'
}

const engine = be({
  initParams
}, function (commands) {
  commands.users('channel', 'members')
})

engine.use('i18n', i18n({ lng: 'ja' }))

engine.start().catch(function (err) {
  console.log(err)
})
