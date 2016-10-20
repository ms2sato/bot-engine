const _ = require('underscore')
const Q = require('q')

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

const isPromise = function (o) {
  return !!o.then
}

const toPromise = function (o) {
  if (isPromise(o)) return o

  const deferred = Q.defer()
  deferred.resolve(o)
  return deferred.promise
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

// extension #########################
;(() => {
  function onClear (object, prop, type, entities) {
    this.eventHandlers.push({
      command: `clear-${prop}`,
      usage: `${prop}を消去します`,
      handler: function (bot, message) {
        return entities.removeProp(message[object], prop).done(() => {
          bot.reply(message, `${prop}を消去しました`)
        })
      }
    })
  }

  function onShow (object, prop, type, entities) {
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

  Commands.prototype.resource = function (object, prop, type, entities) {
    const objects = `${object}s`
    entities = entities || this.engine.storage[objects]

    this.eventHandlers.push({
      command: `set-${prop} ${type.format()}`,
      usage: `${prop}を設定します`,
      handler: function (bot, message) {
        return toPromise(type.value(message)).then((value) => {
          return entities.saveProp(message[object], prop, value).done(() => {
            bot.reply(message, `${prop}を設定しました: ${type.toString(value)}`)
          })
        })
      }
    })

    onClear.call(this, object, prop, type, entities)
    onShow.call(this, object, prop, type, entities)
  }

  Commands.prototype.resources = function (object, prop, type, entities) {
    const objects = `${object}s`
    entities = entities || this.engine.storage[objects]

    this.eventHandlers.push({
      command: `add-${prop} ${type.format()}`,
      usage: `${prop}を追加します`,
      handler: function (bot, message) {
        return toPromise(type.value(message)).then((value) => {
          const defaults = {}
          defaults[prop] = []
          return entities.safeGet(message[object], defaults).then((entity) => {
            entity[prop].push(value)
            return entities.save(entity)
          }).done(() => {
            bot.reply(message, `${prop}を追加しました: ${type.toString(value)}`)
          })
        })
      }
    })

    onClear.call(this, object, prop, type, entities)
    onShow.call(this, object, prop, type, entities)
  }
})()

class CommandEventProcessor {
  process (engine, handler) {
    this.commands = new Commands(engine)
    handler.call(engine, this.commands)
    this.commands.apply()
  }
}

module.exports = CommandEventProcessor
