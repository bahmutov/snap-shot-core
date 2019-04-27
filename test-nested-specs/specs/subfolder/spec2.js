const snapshot = require('../../..').core

/* eslint-env mocha */
it('b', () => {
  snapshot({
    what: 42,
    __filename,
    specName: 'b'
  })
})
