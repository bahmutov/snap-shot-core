const snapshot = require('snap-shot-it')

/* eslint-env mocha */
it('a', () => {
  snapshot('foo')
  snapshot('bar')
})

it('b', () => {
  snapshot('foo')
  snapshot('bar')
})
