const env = process.env.NODE_ENV
const _ = require('underscore')
const SlackAppTraits = require('./traits/slack-app-traits')
const CommandEventProcessor = require('./event-processors/command-event-processor')

function isDevelopment () {
  return env === 'development'
}

function isProduction () {
  return env === 'production'
}

if (isDevelopment()) {
  require('dotenv').config()
}

class Engine {
  constructor (params, handler) {
    if (!params.initParams) {
      throw new Error('params.initParams not found.')
    }
    if (!handler) {
      throw new Error('handler not found.')
    }

    this.params = params
    this.handler = handler
    this.bots = {}
  }

  responceAuth (err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err)
    } else {
      res.send('Success!')
    }
  }

  start () {
    this.traits = this.traits || new SlackAppTraits()

    this.traits.beforeStartup(this)
    this.outputInfo()

    const controller = this.traits.createController(this)
    this.controller = controller
    this.log = controller.log
    this.storage = createStorage(controller)

    controller.setupWebserver(process.env.PORT, (err, webserver) => {
      if (err) {
        return this.error('ERROR: ' + err)
      }

      controller.createWebhookEndpoints(controller.webserver)
      controller.createOauthEndpoints(controller.webserver, this.responceAuth)
    })

    controller.on('create_bot', (bot, config) => {
      if (this.bots[bot.config.token]) {
        // already online! do nothing.
      } else {
        bot.startRTM((err) => {
          if (err) {
            return this.error(err)
          }

          this.trackBot(bot)

          bot.startPrivateConversation({user: config.createdBy}, (err, convo) => {
            if (err) {
              return this.info(err)
            }

            this.greet(convo)
          })
        })
      }
    })

    this.eventProcessor = this.eventProcessor || new CommandEventProcessor()
    this.eventProcessor.process(this, this.handler)

    this.deserializeTeam(controller)
  }

  setEventProcessor (eventProcessor) {
    this.eventProcessor = eventProcessor
  }

  setTraits (traits) {
    this.traits = traits
  }

  error () {
    this.controller.log.error.apply(this.controller.log, arguments)
  }

  info () {
    this.controller.log.info.apply(this.controller.log, arguments)
  }

  find (team) {
    for (const key in this.bots) {
      if (this.bots.hasOwnProperty(key)) {
        const bot = this.bots[key]
        if (bot.team_info.id === team) return bot
      }
    }
    return null
  }

  // protected
  greet (convo) {
    convo.say('I am a bot that has just joined your team')
    convo.say('You must now /invite me to a channel so that I can be of use!')
  }

  // private
  deserializeTeam (controller) {
    controller.storage.teams.all((err, teams) => {
      if (err) {
        throw new Error(err)
      }

      // connect all teams with bots up to slack!
      for (let t in teams) {
        if (teams[t].bot) {
          controller.spawn(teams[t]).startRTM((err, bot) => {
            if (err) {
              this.error('Error connecting bot to Slack:', err)
            } else {
              this.trackBot(bot)
            }
          })
        }
      }
    })
  }

  checkEnv (name) {
    if (!process.env[name]) {
      const msg = `Error: Specify ${name} in environment`
      this.log.error(msg)
      throw new Error(msg)
    }
  }

  // private
  trackBot (bot) {
    require('./slack-api').promisify(bot.api)
    this.bots[bot.config.token] = bot
  }

  // private
  outputInfo () {
    console.log('### Engine start ############################')
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`clientId: ${process.env.clientId}`)
    console.log(`PORT: ${process.env.PORT}`)
    console.log('###############################################')
  }
}

function createStorage (controller) {
  const storage = require('botkit-promise-storage')(controller)

  function enhance (entities) {
    entities.safeGet = function (id, defaults = {}) {
      return entities.get(id).catch((_err) => {
        console.log('safeGet:error: ', _err)
        return { id: id }
      }).then((obj) => {
        console.log('safeGet:success: ', obj)
        return _.defaults(obj || { id: id }, defaults)
      })
    }

    entities.getProp = function (id, prop, defaults) {
      return entities.safeGet(id).then((obj) => {
        return _.isUndefined(obj[prop]) ? defaults : obj[prop]
      })
    }

    entities.saveProp = function (id, prop, value) {
      return entities.safeGet(id).then((obj) => {
        console.log(id, obj)
        obj[prop] = value
        return entities.save(obj)
      })
    }

    entities.removeProp = function (id, prop) {
      return entities.get(id).then((obj) => {
        delete obj[prop]
        return entities.save(obj)
      }).catch((_err) => {
        return { id: id }
      })
    }
  }

  enhance(storage.users)
  enhance(storage.channels)
  enhance(storage.teams)

  return storage
}

module.exports = {
  isDevelopment: isDevelopment,
  isProduction: isProduction,
  Engine: Engine,
  MessageUtils: require('./message-utils'),
  ResourceTypes: require('./resource-types')
}
