class LegacyEventBinder {
  bind (engine, handler) {
    handler.call(engine, engine.controller)
  }
}

module.exports = LegacyEventBinder
