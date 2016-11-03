const _ = require('underscore')
const rt = require('../resource-types')
const utils = require('../utils')

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

  // private
  commandToPatterns (command) { return [`/${command}`] }

  // private
  decorateHandler (patterns, callback) {
    return (bot, message) => {
      this.engine.log.debug(`${new Date()}: ${patterns} called`)
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

// plugin #########################
const r = require('./command-plugins/resources')
Commands.prototype.resource = r.resource
Commands.prototype.resources = r.resources

// aliases #########################
const aliases = {
  user: rt.User
}

_.each(aliases, (type, key) => {
  Commands.prototype[key] = function (object, prop, entities) {
    return this.resource(object, prop, type, entities)
  }

  Commands.prototype[utils.pluralize(key)] = function (object, prop, entities) {
    return this.resources(object, prop, type, entities)
  }
})

class CommandEventBinder {
  bind (engine, handler) {
    this.commands = new Commands(engine)
    handler.call(engine, this.commands)
    this.commands.apply()
  }
}

module.exports = CommandEventBinder
