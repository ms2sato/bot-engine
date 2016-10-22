const bt = require('./basic-resource-types')
const _ = require('underscore')

class UserType extends bt.StringType {
  value (message, bot) {
    const username = message.match[1]
    return bot.api.users.list({}).then((users) => {
      const member = _.findWhere(users.members, {name: username})
      if (!member) return member
      return this.filter(member)
    })
  }

  toLabel (value) {
    return `${value.name}(id:${value.id})`
  }

  // protected
  filter (user) { return user }
}

class UserLightType extends UserType {
  filter (user) { return {id: user.id, name: user.name} }
}

module.exports = {
  UserType: UserType,
  UserLightType: UserLightType
}
