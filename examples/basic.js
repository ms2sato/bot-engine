require('dotenv').config()
const be = require('../index.js')

const initParams = {}
initParams.json_file_store = './db/'

const engine = new be.Engine({
  initParams,
  config: {}
}, function (commands) {
  commands.resource('channel', 'number', be.ResourceTypes.Number) // number config
})

engine.start()
