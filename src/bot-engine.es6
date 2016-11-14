const env = process.env.NODE_ENV
const _ = require('underscore')
const SlackAppTraits = require('./traits/slack-app-traits')
const CommandEventBinder = require('./event-binders/command-event-binder')
const EventEmitter = require('eventemitter2').EventEmitter2

function isDevelopment () {
  return env === 'development'
}

function isProduction () {
  return env === 'production'
}

if (isDevelopment()) {
  require('dotenv').config()
}

let middlewareId = 1

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
    this.events = new EventEmitter({
      wildcard: true,
      delimiter: ':'
    })
  }

  use (name, middleware) {
    if(!name) {
      throw new TypeError('name shoud not be null')
    }

    if (!middleware) {
      if (!_.isFunction(name)) {
        throw new TypeError('name should be name of middleware or Function')
      }
      middleware = name
      name = '' + middlewareId++
    } else {
      if (!_.isFunction(middleware)) {
        throw new TypeError('middleware should be Function')
      }
    }

    return middleware(name, this)
  }

  start () {
    // default middlewares
    if (!this.i18n) {
      this.use('i18n', require('./i18n')())
    }

    return this.events.emitAsync('beforeStart:*', this).then((props) => {
      this.traits = this.traits || new SlackAppTraits()

      this.traits.beforeStartup(this)
      this.outputInfo()

      const controller = this.traits.createController(this)
      this.controller = controller
      this.log = controller.log
      this.storage = createStorage(controller)

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

      this.eventBinder = this.eventBinder || new CommandEventBinder()

      return this.events.emitAsync('beforeBinding:*', this).then(() => {
        return this.eventBinder.bind(this, this.handler)
      }).then(() => {
        return this.events.emitAsync('afterBinding:*', this)
      }).then(() => {
        return this.deserializeTeam(controller)
      }).then(() => {
        return this.events.emitAsync('afterStart:*', this)
      })
    })
  }

  setEventBinder (eventBinder) {
    this.eventBinder = eventBinder
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
        return { id: id }
      }).then((obj) => {
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

function botEngine (params, callback) {
  return new Engine(params, callback)
}

botEngine.isDevelopment = isDevelopment
botEngine.isProduction = isProduction
botEngine.Engine = Engine
botEngine.MessageUtils = require('./message-utils')
botEngine.ResourceTypes = require('./resource-types')
botEngine.webServer = require('./web-server')

module.exports = botEngine
