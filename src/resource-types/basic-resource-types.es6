// Resourceの定義
class ResourceType {
  format () { throw new Error('Unimplemented: format') }
  value (message) { throw new Error('Unimplemented: value') }
  toString (value) { return JSON.stringify(value) }
  toLabel (value) { return this.toStrong(value) }
}

class HoursAndMinutesType extends ResourceType {
  format () {
    return '([0-9]?[0-9])\:([0-9]?[0-9])'
  }

  value (message) {
    const hours = Number(message.match[1])
    const minutes = Number(message.match[2])
    return {hours, minutes}
  }
}

class NumberType extends ResourceType {
  format () { return '([0-9\.\-]+)' }
  value (message) { return Number(message.match[1]) }
}

class StringType extends ResourceType {
  format () { return '(\\S+)' }
  value (message) { return message.match[1]}
}

class BooleanType extends StringType {
  static trues () { return ['yes', 'yea', 'yup', 'yep', 'ya', 'sure', 'ok', 'y', 'yeah', 'yah', 'true'] }
  value (message) { return BooleanType.trues().indexOf(message.match[1].trim()) !== -1 }
}

class IntegerType extends NumberType {
  format () { return '([0-9]+)' }
}

module.exports = {
  HoursAndMinutesType: HoursAndMinutesType,
  IntegerType: IntegerType,
  NumberType: NumberType,
  BooleanType: BooleanType,
  StringType: StringType
}
