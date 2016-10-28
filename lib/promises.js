'use strict';

var _ = require('underscore');
var Q = require('q');

function isPromise(o) {
  return o.then;
}

function toPromise(o) {
  if (!_.isUndefined(o) && isPromise(o)) return o;

  var deferred = Q.defer();
  deferred.resolve(o);
  return deferred.promise;
}

function promisify(obj, func) {
  if (arguments.length === 1) {
    func = obj;
    obj = null;
  }

  if (isPromise(func)) return func;
  if (!_.isFunction(func)) return func;

  return function () {
    var deferred = Q.defer();
    var args = [];

    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, ret) {
      if (err) return deferred.reject(err);
      deferred.resolve(ret);
    });

    func.apply(obj, args);
    return deferred.promise;
  };
}

function promisifyAll(obj) {
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    obj[key] = promisify(obj, obj[key]);
  }
}

module.exports = {
  isPromise: isPromise,
  toPromise: toPromise,
  promisify: promisify,
  promisifyAll: promisifyAll
};