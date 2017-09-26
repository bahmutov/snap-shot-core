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

  const raise = () => {
    throw new Error('Cannot reach this')
  }
  it('snapshots error value', () => {
    const expected = 'foo'
    const value = 'bar'
    compare({expected, value})
      .map(raise)
      .orElse(snapshot)
  })
})

describe('exportText', () => {
  const {exportText} = require('./utils')

  it('is a function', () => {
    la(is.fn(exportText))
  })

  it('does not put value on the first line', () => {
    const formatted = exportText('name', 'foo')
    const expected = "exports['name'] = `\nfoo\n`\n"
    la(formatted === expected, 'expected\n' + expected + '\ngot\n' + formatted)
  })
})

describe('removeExtraNewLines', () => {
  const {removeExtraNewLines} = require('./utils')

  it('is a function', () => {
    la(is.fn(removeExtraNewLines))
  })

  it('leaves other values unchanged', () => {
    const snapshots = {
      foo: 'bar',
      age: 42
    }
    const result = removeExtraNewLines(snapshots)
    snapshot(result)
  })

  it('removes new lines', () => {
    const snapshots = {
      foo: '\nbar\n',
      age: 42
    }
    const result = removeExtraNewLines(snapshots)
    snapshot(result)
  })
})
