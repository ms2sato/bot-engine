'use strict';

var bt = require('./resource-types/basic-resource-types');
var st = require('./resource-types/slack-resource-types');

module.exports = {
  HoursAndMinutesType: bt.HoursAndMinutesType,
  IntegerType: bt.IntegerType,
  NumberType: bt.NumberType,
  BooleanType: bt.BooleanType,
  StringType: bt.StringType,
  HoursAndMinutes: new bt.HoursAndMinutesType(),
  Integer: new bt.IntegerType(),
  Number: new bt.NumberType(),
  Boolean: new bt.BooleanType(),
  String: new bt.StringType(),
  // complex types
  UserType: st.UserType,
  User: new st.UserType()
};