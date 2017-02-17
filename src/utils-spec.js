'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const {strip} = require('./utils')

/* global describe, it */
describe('utils', () => {
  it('is a function', () => {
    la(is.fn(strip))
  })

  it('handles objects with methods', () => {
    const out = strip({
      foo: 'bar',
      fn: () => 'nothing'
    })
    la(is.object(out), 'returns an object', out)
    la(!out.fn, 'method has been removed', out)
  })

  it('passes a function as is', () => {
    const fn = () => 'nothing'
    const out = strip(fn)
    la(out === fn)
  })
})
