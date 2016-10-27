const promises = require('./promises')
const Q = require('q')
const _ = require('underscore')

exports.promisify = function (api) {
  const targets = ['auth', 'oauth', 'channels', 'chat', 'emoji', 'files', 'groups',
    'im', 'mpim', 'pins', 'reactions', 'rtm', 'search', 'stars', 'team', 'users' ]
  _.each(targets, (target) => {
    promises.promisifyAll(api[target])
  })

  api.allChannels = function () {
    return Q.all([this.channels.list, this.groups.list])
  }
}
