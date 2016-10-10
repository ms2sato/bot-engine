const _ = require('underscore')

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

module.exports = CommandEventProcessor
