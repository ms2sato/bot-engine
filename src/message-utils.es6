const _ = require('underscore')
const _s = require('underscore.string')

class MessageUtils {
  static mensionTo (to, text) {
    var mension
    if (Array.isArray(to)) {
      mension = (to.map(function (t) {
        return '@' + t
      })).join(' ')
    } else {
      mension = '@' + to
    }
    return mension + ' ' + text
  }

  static hasMensionTo (name, text) {
    return text.indexOf('@' + name) !== -1
  }

  static extractArray (str) {
    return _(str.split(',')).map((v) => {
      return _s.trim(v)
    })
  }
}

module.exports = MessageUtils
