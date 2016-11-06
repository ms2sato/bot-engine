'use strict';

/**
 * usage:
 * delegate(Commands.prototype, 'controller', ['on', 'hears'])
 *
 * results:
 * define Commands.prototype.on: delegate to this.controller.on with params
 * define Commands.prototype.hears: delegate to this.controller.hears with params
 */
var _ = require('underscore');
var delegate = function delegate(prototype, to, name) {
  if (_.isArray(name)) {
    return _.each(name, function (n) {
      delegate(prototype, to, n);
    });
  }

  prototype[name] = function () {
    this[to][name].apply(this[to], arguments);
  };
};

module.exports = delegate;