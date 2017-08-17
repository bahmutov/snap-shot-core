'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const {strip} = require('./utils')
const Result = require('folktale/result')
const snapshot = require('snap-shot-it')

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

describe('compare', () => {
  const {compare} = require('./utils')

  it('returns Result', () => {
    const expected = 'foo'
    const value = 'foo'
    const r = compare({expected, value})
    la(Result.hasInstance(r))
  })

  it('passes identical values', () => {
    const expected = 'foo'
    const value = 'foo'
    const r = compare({expected, value})
    la(r.value === undefined)
  })

  it('has error text', () => {
    const expected = 'foo'
    const value = 'bar'
    const r = compare({expected, value})
    la(r.value === '"foo" !== "bar"')
  })

  it('has error (snapshot)', () => {
    const expected = 'foo'
    const value = 'bar'
    snapshot(compare({expected, value}))
  })

  it('snapshots error value', () => {
    const expected = 'foo'
    const value = 'bar'
    compare({expected, value}).orElse(snapshot)
  })
})
