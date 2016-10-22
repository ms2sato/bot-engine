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

class CollectionPropertyType {
  each (collection, func) { return _.each(collection, func) }
  map (collection, func) { return _.map(collection, func) }
}

class ArrayPropertyType extends CollectionPropertyType {
  defaultValue () { return [] }
  add (collection, value) { collection.push(value) }
}

class HashPropertyType extends CollectionPropertyType {
  constructor (key = 'id') {
    super()
    this.key = key
  }
  defaultValue () { return {} }
  add (collection, value) {
    const key = this.keyOf(value)
    collection[key] = value
  }
  keyOf (value) {
    return value[this.key]
  }
}

const arrayPropertyType = new ArrayPropertyType()

const resources = function (object, prop, type, entities) {
  let propertyType = arrayPropertyType
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
        defaults[prop] = propertyType.defaultValue()
        return entities.safeGet(message[object], defaults).then((entity) => {
          propertyType.add(entity[prop], value)
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
        const results = propertyType.map(value, (v, k) => {
          return `[${k}]${type.toLabel(v)}`
        }).join('\n')
        bot.reply(message, `${prop}:
${results}`)
      })
    }
  })

  return {
    asHash: function (key = 'id') {
      propertyType = new HashPropertyType(key)
      return this
    },
    asArray: function () {
      propertyType = arrayPropertyType
      return this
    }
  }
}

module.exports = {
  resource: resource,
  resources: resources
}
