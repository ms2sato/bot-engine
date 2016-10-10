const Botkit = require('botkit')

class SlackAppTraits {
  beforeStartup (engine) {
    engine.checkEnv('clientId')
    engine.checkEnv('clientSecret')
    engine.checkEnv('PORT')
  }

  createController (engine) {
    const params = engine.params
    const config = Object.assign({
      clientId: process.env.clientId,
      clientSecret: process.env.clientSecret,
      scopes: ['bot']
    }, params.config)

    return Botkit.slackbot(
      params.initParams
    ).configureSlackApp(
      config
    )
  }
}

module.exports = SlackAppTraits
