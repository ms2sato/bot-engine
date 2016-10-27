'use strict';

var promises = require('./promises');
var Q = require('q');
var _ = require('underscore');

exports.promisify = function (api) {
  var targets = ['auth', 'oauth', 'channels', 'chat', 'emoji', 'files', 'groups', 'im', 'mpim', 'pins', 'reactions', 'rtm', 'search', 'stars', 'team', 'users'];
  _.each(targets, function (target) {
    promises.promisifyAll(api[target]);
  });

  api.allChannels = function () {
    return Q.all([this.channels.list, this.groups.list]);
  };
};