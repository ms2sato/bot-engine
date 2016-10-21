const promises = require('../../promises')
const _ = require('underscore')

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

const resource = function (object, prop, type, entities) {
  const objects = `${object}s`
  entities = entities || this.engine.storage[objects]

  this.eventHandlers.push({
    command: `set-${prop} ${type.format()}`,
    usage: `${prop}を設定します`,
    handler: function (bot, message) {
      return promises.toPromise(type.value(message, bot)).then((value) => {
        return entities.saveProp(message[object], prop, value).done(() => {
          bot.reply(message, `${prop}を設定しました: ${type.toLabel(value)}`)
        })
      })
    }
  })

  onClear.call(this, object, prop, type, entities)

  this.eventHandlers.push({
    command: prop,
    usage: `${prop}を表示します`,
    handler: function (bot, message) {
      return entities.getProp(message[object], prop).done((value) => {
        bot.reply(message, `${prop}: ${type.toLabel(value)}`)
      })
    }
  })
}

const resources = function (object, prop, type, entities) {
  const objects = `${object}s`
  entities = entities || this.engine.storage[objects]

  this.eventHandlers.push({
    command: `add-${prop} ${type.format()}`,
    usage: `${prop}を追加します`,
    handler: function (bot, message) {
      return promises.toPromise(type.value(message, bot)).then((value) => {
        if (_.isUndefined(value)) {
          return bot.reply(message, '有効な値が取れませんでした')
        }

        const defaults = {}
        defaults[prop] = []
        return entities.safeGet(message[object], defaults).then((entity) => {
          entity[prop].push(value)
          return entities.save(entity)
        }).done(() => {
          bot.reply(message, `${prop}を追加しました: ${type.toLabel(value)}`)
        })
      })
    }
  })

  onClear.call(this, object, prop, type, entities)

  this.eventHandlers.push({
    command: prop,
    usage: `${prop}を表示します`,
    handler: function (bot, message) {
      return entities.getProp(message[object], prop).done((value) => {
        bot.reply(message, `${prop}:
${_.map(value, (v) => type.toLabel(v)).join('\n')}`)
      })
    }
  })
}

module.exports = {
  resource, resources
}
