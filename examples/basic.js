require('dotenv').config()
const be = require('../index.js')

const initParams = {
  debug: false,
  logLevel: 6,
  json_file_store: './db/'
}

const engine = new be.Engine({
  initParams,
  config: {}
}, function (commands) {
  // promisified slack api
  commands.hears('testuser', ['direct_message'], function (bot, message) {
    bot.api.channels.list({}).done((channels) => {
      console.log(channels)
    })
  })

  commands.user('channel', 'leader')
  commands.users('channel', 'membershash').asHash() // stored as hash
  commands.users('channel', 'members') // stored as array
  commands.users('channel', 'member_names').asHash('id', 'name') // key: user.id, value: user.name

  commands.resources('channel', 'numbers', be.ResourceTypes.Number) // number list config
  commands.resources('channel', 'fruits', be.ResourceTypes.String) // string list config

  commands.resource('channel', 'number', be.ResourceTypes.Number) // number config
  commands.resource('channel', 'yesorno', be.ResourceTypes.Boolean) // boolean config
})

engine.start()
