const Botkit = require('botkit')
const env = process.env.NODE_ENV
const _ = require('underscore')
const _s = require('underscore.string')

function isDevelopment () {
  return env === 'development'
}

function isProduction () {
  return env === 'production'
}

if (isDevelopment()) {
  require('dotenv').config()
}

const delegate = function (prototype, to, name) {
  if (_.isArray(name)) {
    return _.each(name, (n) => {
      delegate(prototype, to, n)
    })
  }

  prototype[name] = function () {
    this[to][name].apply(this[to], arguments)
  }
}

class MessageUtils {
  static mensionTo (to, text) {
    var mension
    if (Array.isArray(to)) {
      mension = (to.map(function (t) {
        return '@' + t
      })).join(' ')
    } else {
      mension = '@' + to
    }
    return mension + ' ' + text
  }

  static hasMensionTo (name, text) {
    return text.indexOf('@' + name) !== -1
  }

  static extractArray (str) {
    return _(str.split(',')).map((v) => {
      return _s.trim(v)
    })
  }
}

// Resourceの定義
class ResourceType {
  format () { throw new Error('Unimplemented: format') }
  value (message) { throw new Error('Unimplemented: value') }
  toString (value) { return JSON.stringify(value) }
}
class HoursAndMinutesType extends ResourceType {
  format () {
    return '([0-9]?[0-9])\:([0-9]?[0-9])'
  }

  value (message) {
    const hours = Number(message.match[1])
    const minutes = Number(message.match[2])
    return {hours, minutes}
  }
}

class NumberType extends ResourceType {
  format () { return '([0-9\.\-]+)' }
  value (message) { return Number(message.match[1]) }
}

class BooleanType extends ResourceType {
  static trues () { return ['yes', 'yea', 'yup', 'yep', 'ya', 'sure', 'ok', 'y', 'yeah', 'yah', 'true'] }
  format () { return '(.+)' }
  value (message) { return BooleanType.trues().indexOf(message.match[1].trim()) !== -1 }
}

class IntegerType extends NumberType {
  format () { return '([0-9]+)' }
}

class Commands {
  constructor (engine) {
    this.engine = engine
    this.controller = engine.controller
    this.eventHandlers = []
  }

  onError (err) {
    console.error(err.message, err.stack)
  }

  apply () {
    _.each(this.eventHandlers, (eventHandler) => {
      this.hearCommand(eventHandler)
    })

    this.hearCommand({
      command: 'usage',
      handler: (bot, message) => {
        const usages = this.eventHandlers.map((eventHandler) => {
          return `/${eventHandler.command}: ${eventHandler.usage}`
        })
        return bot.reply(message, usages.join('\n'))
      }
    })
  }

  push (eventHandler) {
    if (_.isArray(eventHandler)) {
      this.eventHandlers = _.union(this.eventHandlers, eventHandler)
    } else {
      this.eventHandlers.push(eventHandler)
    }
    return this
  }

  hearCommand (eventHandler) {
    if (!eventHandler.command) throw new Error('command not found on event param')
    if (!eventHandler.handler) throw new Error('handler not found on event param')

    const patterns = this.commandToPatterns(eventHandler.command)
    const types = eventHandler.types || ['mention', 'direct_mention']
    const callback = this.decorateHandler(patterns, eventHandler.handler)

    if (eventHandler.middleware) {
      return this.controller.hears(
        patterns,
        types,
        eventHandler.middleware,
        callback
      )
    }

    return this.controller.hears(patterns, types, callback)
  }

  mentions (patterns, callback) {
    this.eventHandlers.push({
      patterns: patterns,
      handler: this.decorateHandler(patterns, callback)
    })
  }

  resource (object, prop, type, entities) {
    const objects = `${object}s`
    entities = entities || this.engine.storage[objects]

    this.eventHandlers.push({
      command: `set-${prop} ${type.format()}`,
      usage: `${prop}を設定します`,
      handler: function (bot, message) {
        console.log(object, message)
        const value = type.value(message)
        return entities.saveProp(message[object], prop, value).done(() => {
          bot.reply(message, `${prop}を設定しました: ${type.toString(value)}`)
        })
      }
    })

    this.eventHandlers.push({
      command: `clear-${prop}`,
      usage: `${prop}を消去します`,
      handler: function (bot, message) {
        return entities.removeProp(message[object], prop).done(() => {
          bot.reply(message, `${prop}を消去しました`)
        })
      }
    })

    this.eventHandlers.push({
      command: prop,
      usage: `${prop}を表示します`,
      handler: function (bot, message) {
        return entities.getProp(message[object], prop).done((value) => {
          bot.reply(message, `${prop}: ${type.toString(value)}`)
        })
      }
    })
  }

  // private
  commandToPatterns (command) { return [`/${command}`] }

  // private
  decorateHandler (patterns, callback) {
    return (bot, message) => {
      console.log(`${new Date()}: ${patterns} called`)
      try {
        const ret = callback(bot, message)
        if (ret) { // is promise
          ret.catch((err) => {
            this.onError(err)
          })
        }
      } catch (err) {
        this.onError(err)
      }
    }
  }
}
delegate(Commands.prototype, 'controller', ['on', 'hears'])

class CommandEventProcessor {
  process (engine, handler) {
    this.commands = new Commands(engine)
    handler.call(engine, this.commands)
    this.commands.apply()
  }
}

class LegacyEventProcessor {
  process (engine, handler) {
    handler.call(engine, engine.controller)
  }
}

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
  MessageUtils: MessageUtils,
  CommandEventProcessor: CommandEventProcessor,
  LegacyEventProcessor: LegacyEventProcessor,
  SlackAppTraits: SlackAppTraits,
  ResourceTypes: {
    HoursAndMinutesType: HoursAndMinutesType,
    IntegerType: IntegerType,
    NumberType: NumberType,
    BooleanType: BooleanType,
    HoursAndMinutes: new HoursAndMinutesType(),
    Integer: new IntegerType(),
    Number: new NumberType(),
    Boolean: new BooleanType()
  }
}
