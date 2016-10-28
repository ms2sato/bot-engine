const _ = require('underscore')
const Q = require('q')

function isPromise (o) {
  return o.then
}

function toPromise (o) {
  if (!_.isUndefined(o) && isPromise(o)) return o

  const deferred = Q.defer()
  deferred.resolve(o)
  return deferred.promise
}

function promisify (obj, func) {
  if (arguments.length === 1) {
    func = obj
    obj = null
  }

  if (isPromise(func)) return func
  if (!_.isFunction(func)) return func

  return function () {
    const deferred = Q.defer()
    const args = []

    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i])
    }
    args.push(function (err, ret) {
      if (err) return deferred.reject(err)
      deferred.resolve(ret)
    })

    func.apply(obj, args)
    return deferred.promise
  }
}

function promisifyAll (obj) {
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue

    obj[key] = promisify(obj, obj[key])
  }
}

module.exports = {
  isPromise: isPromise,
  toPromise: toPromise,
  promisify: promisify,
  promisifyAll: promisifyAll
}
