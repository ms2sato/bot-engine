/**
 * usage:
 * delegate(Commands.prototype, 'controller', ['on', 'hears'])
 *
 * results:
 * define Commands.prototype.on: delegate to this.controller.on with params
 * define Commands.prototype.hears: delegate to this.controller.hears with params
 */
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

module.exports = delegate
