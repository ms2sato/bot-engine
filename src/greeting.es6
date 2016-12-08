function greeting (config = {}) {
  return function (engine, name = 'greeting') {
    function greet (convo) {
      convo.say('I am a bot that has just joined your team')
      convo.say('You must now /invite me to a channel so that I can be of use!')
    }

    engine.events.on(`afterCreate:${name}`, (engine, bot) => {
      return new Promise((resolve, reject) => {
        bot.startPrivateConversation({user: config.createdBy}, (err, convo) => {
          if (err) {
            return reject(err)
          }

          greet(convo)
          resolve()
        })
      })
    })
  }
}

module.exports = greeting
