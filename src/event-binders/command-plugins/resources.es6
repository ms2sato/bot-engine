const promises = require('../../promises')
const _ = require('underscore')
const utils = require('../../utils')

function onClear (prop, type, entities) {
  this.eventHandlers.push({
    command: `clear-${prop}`,
    usage: this.engine.i18n.t('be.clearprop.usage', { prop}),
    handler: (bot, message) => {
      return entities.removeProp(bot, message, prop).done(() => {
        bot.reply(message, this.engine.i18n.t('be.clearprop.message', { prop}))
      })
    }
  })
}

const resource = function (prop, type, entities) {
  entities = entities || this.channelEntities()

  this.eventHandlers.push({
    command: `set-${prop} ${type.format()}`,
    usage: this.engine.i18n.t('be.setprop.usage', { prop}),
    handler: (bot, message) => {
      return promises.toPromise(type.value(message, bot)).then((value) => {
        return entities.saveProp(bot, message, prop, value).done(() => {
          bot.reply(message, this.engine.i18n.t('be.setprop.message', { label: type.toLabel(value) }))
        })
      })
    }
  })

  onClear.call(this, prop, type, entities)

  this.eventHandlers.push({
    command: prop,
    usage: this.engine.i18n.t('be.showprop.usage', { prop}),
    handler: (bot, message) => {
      return entities.getProp(bot, message, prop).done((value) => {
        bot.reply(message, this.engine.i18n.t('be.showprop.message', { label: type.toLabel(value) }))
      })
    }
  })
}

class CollectionPropertyType {
  each (collection, func) { return _.each(collection, func) }
  map (collection, func) { return _.map(collection, func) }
  valueToLabel (type, value) { return type.toLabel(value) }
}

class ArrayPropertyType extends CollectionPropertyType {
  defaultValue () { return [] }
  add (collection, value) {
    collection.push(value)
    return value
  }
}

class HashPropertyType extends CollectionPropertyType {
  constructor (keyLabel = 'id' , valueLabel) {
    super()
    this.keyLabel = keyLabel
    this.valueLabel = valueLabel
  }

  defaultValue () { return {} }

  add (collection, item) {
    const key = this.keyOf(item)
    const value = this.valueOf(item)
    collection[key] = value
    return value
  }

  valueToLabel (type, value) {
    return (this.valueLabel) ? value : type.toLabel(value)
  }

  // protected
  keyOf (item) {
    return item[this.keyLabel]
  }

  // protected
  valueOf (item) {
    return (this.valueLabel) ? item[this.valueLabel] : item
  }
}

const arrayPropertyType = new ArrayPropertyType()

const resources = function (prop, type, entities) {
  entities = entities || this.channelEntities()
  let propertyType = arrayPropertyType

  this.eventHandlers.push({
    command: `add-${prop} ${type.format()}`,
    usage: this.engine.i18n.t('be.addprop.usage', { prop}),
    handler: (bot, message) => {
      return promises.toPromise(type.value(message, bot)).then((value) => {
        if (_.isUndefined(value)) {
          return bot.reply(message, this.engine.i18n.t('be.addprop.message.fail'))
        }

        entities.addProp(bot, message, propertyType, prop, value).done((added) => {
          bot.reply(message, this.engine.i18n.t('be.addprop.message.success', {
            prop,
            label: propertyType.valueToLabel(type, added)
          }))
        })
      })
    }
  })

  onClear.call(this, prop, type, entities)

  this.eventHandlers.push({
    command: prop,
    usage: this.engine.i18n.t('be.showprop.usage', { prop}),
    handler: (bot, message) => {
      return entities.getProp(bot, message, prop).done((value) => {
        const results = propertyType.map(value, (v, k) => {
          return `[${k}]${propertyType.valueToLabel(type, v)}`
        }).join('\n')
        bot.reply(message, `${prop}:
${results}`)
      })
    }
  })

  return {
    as: function (pType) {
      propertyType = pType
      return this
    },
    asHash: function (keyLabel = 'id' , valueLabel) {
      return this.as(new HashPropertyType(keyLabel, valueLabel))
    },
    asArray: function () {
      return this.as(arrayPropertyType)
    }
  }
}

class Storage2Entities {
  constructor (engine, objectName) {
    this.body = engine.storage[utils.pluralize(objectName)]
    this.objectName = objectName
  }

  getProp (bot, message, prop) {
    return this.body.getProp(message[this.objectName], prop)
  }

  saveProp (bot, message, prop, value) {
    return this.body.saveProp(message[this.objectName], prop, value)
  }

  removeProp (bot, message, prop) {
    return this.body.removeProp(message[this.objectName], prop)
  }

  addProp (bot, message, propertyType, prop, value) {
    const defaults = {}
    defaults[prop] = propertyType.defaultValue()
    let added
    return this.body.safeGet(message[this.objectName], defaults).then((entity) => {
      added = propertyType.add(entity[prop], value)
      return this.body.save(entity).then(() => {
        return added
      })
    })
  }
}

module.exports = {
  plug: function (commands) {
    commands.resource = resource
    commands.resources = resources

    commands.userEntities = function () {
      return new Storage2Entities(this.engine, 'user')
    }
    commands.channelEntities = function () {
      return new Storage2Entities(this.engine, 'channel')
    }
    commands.teamEntities = function () {
      return new Storage2Entities(this.engine, 'team')
    }
  }
}
