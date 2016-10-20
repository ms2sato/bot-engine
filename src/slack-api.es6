const promises = require('./promises')
const Q = require('q')
const _ = require('underscore')

function promisify (obj, func) {
  if (promises.isPromise(func)) {
    return func
  }

  if (!_.isFunction(func)) return func

  return function (options) {
    const deferred = Q.defer()
    func.call(obj, options, function (err, ret) {
      if (err) return deferred.reject(err)
      deferred.resolve(ret)
    })
    return deferred.promise
  }
}

function promisifyAll (obj) {
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue

    obj[key] = promisify(obj, obj[key])
  }
}

exports.promisify = function (api) {
  const targets = ['auth', 'oauth', 'channels', 'chat', 'emoji', 'files', 'groups',
   'im', 'mpim', 'pins', 'reactions', 'rtm', 'search', 'stars', 'team', 'users' ]
  _.each(targets, (target) => {
    promisifyAll(api[target])
  })

  api.allChannels = function () {
    return Q.all([this.channels.list, this.groups.list])
  }
}
