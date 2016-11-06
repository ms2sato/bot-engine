const _ = require('underscore')
const rt = require('../resource-types')
const utils = require('../utils')
const delegate = require('../delegate')

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

class CommandEventBinder {
  constructor () {
    this.aliases = {
      user: rt.User
    }
  }

  bind (engine, handler) {
    this.commands = this.createCommands(engine)

    handler.call(engine, this.commands)
    this.commands.apply()
  }

  // private
  createCommands (engine) {
    const commands = new Commands(engine)

    // plugin #########################
    require('./command-plugins/resources').plug(commands)

    // aliases #########################
    _.each(this.aliases, (type, key) => {
      commands[key] = function (prop, entities) {
        return this.resource(prop, type, entities)
      }

      commands[utils.pluralize(key)] = function (prop, entities) {
        return this.resources(prop, type, entities)
      }
    })

    return commands
  }
}

module.exports = CommandEventBinder
