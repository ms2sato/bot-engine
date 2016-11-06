require('dotenv').config()
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
  // promisified slack api
  commands.hears('testuser', ['direct_message'], function (bot, message) {
    bot.api.channels.list({}).done((channels) => {
      console.log(channels)
    })
  })

  commands.user('leader')
  commands.users('membershash').asHash() // stored as hash
  commands.users('members') // stored as array
  commands.users('member_names').asHash('id', 'name') // key: user.id, value: user.name

  commands.resources('numbers', be.ResourceTypes.Number) // number list config
  commands.resources('fruits', be.ResourceTypes.String) // string list config

  commands.resource('number', be.ResourceTypes.Number) // number config
  commands.resource('yesorno', be.ResourceTypes.Boolean) // boolean config
})

engine.start()
