const snapshot = require('..').core

/* eslint-env mocha */
it('a', () => {
  snapshot({
    what: 42,
    __filename,
    specName: 'a'
  })
})
