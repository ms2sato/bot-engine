const promises = require('../../promises')
const _ = require('underscore')
const utils = require('../../utils')

function onClear (object, prop, type, entities) {
  this.eventHandlers.push({
    command: `clear-${prop}`,
    usage: this.engine.i18n.t('be.clearprop.usage', { prop}),
    handler: function (bot, message) {
      return entities.removeProp(message[object], prop).done(() => {
        bot.reply(message, this.engine.i18n.t('be.clearprop.message', { prop}))
      })
    }
  })
}

const resource = function (object, prop, type, entities) {
  const objects = utils.pluralize(object)
  entities = entities || this.engine.storage[objects]

  this.eventHandlers.push({
    command: `set-${prop} ${type.format()}`,
    usage: this.engine.i18n.t('be.setprop.usage', { prop}),
    handler: function (bot, message) {
      return promises.toPromise(type.value(message, bot)).then((value) => {
        return entities.saveProp(message[object], prop, value).done(() => {
          bot.reply(message, this.engine.i18n.t('be.setprop.message', { label: type.toLabel(value) }))
        })
      })
    }
  })

  onClear.call(this, object, prop, type, entities)

  this.eventHandlers.push({
    command: prop,
    usage: this.engine.i18n.t('be.showprop.usage', { prop}),
    handler: function (bot, message) {
      return entities.getProp(message[object], prop).done((value) => {
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

const resources = function (object, prop, type, entities) {
  let propertyType = arrayPropertyType
  const objects = `${object}s`
  entities = entities || this.engine.storage[objects]

  this.eventHandlers.push({
    command: `add-${prop} ${type.format()}`,
    usage: this.engine.i18n.t('be.addprop.usage', { prop}),
    handler: function (bot, message) {
      return promises.toPromise(type.value(message, bot)).then((value) => {
        if (_.isUndefined(value)) {
          return bot.reply(message, this.engine.i18n.t('be.addprop.message.fail'))
        }

        const defaults = {}
        defaults[prop] = propertyType.defaultValue()
        let added
        return entities.safeGet(message[object], defaults).then((entity) => {
          added = propertyType.add(entity[prop], value)
          return entities.save(entity)
        }).done(() => {
          bot.reply(message, this.engine.i18n.t('be.addprop.message.success', {
            prop,
            label: propertyType.valueToLabel(type, added)
          }))
        })
      })
    }
  })

  onClear.call(this, object, prop, type, entities)

  this.eventHandlers.push({
    command: prop,
    usage: this.engine.i18n.t('be.showprop.usage', { prop}),
    handler: function (bot, message) {
      return entities.getProp(message[object], prop).done((value) => {
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

module.exports = {
  resource: resource,
  resources: resources
}
