'use strict';

var Q = require('q');

function isPromise(o) {
  return !!o.then;
}

function toPromise(o) {
  if (isPromise(o)) return o;

  var deferred = Q.defer();
  deferred.resolve(o);
  return deferred.promise;
}

module.exports = {
  isPromise: isPromise,
  toPromise: toPromise
};