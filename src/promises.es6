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

module.exports = {
  isPromise: isPromise,
  toPromise: toPromise
}
