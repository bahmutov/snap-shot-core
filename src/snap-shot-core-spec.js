'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const fs = require('fs')
const path = require('path')

const opts = {
  show: Boolean(process.env.SHOW),
  dryRun: Boolean(process.env.DRY),
  update: Boolean(process.env.UPDATE)
}

const compareFn = ({expected, value}) => {
  const e = JSON.stringify(expected)
  const v = JSON.stringify(value)
  if (e === v) {
    return {
      valid: true
    }
  }
  return {
    valid: false,
    message: `${e} !== ${v}`
  }
}

const areSameType = ({expected, value}) => {
  return {
    valid: typeof expected === typeof value,
    message: 'no message'
  }
}

const file = __filename
const snapShotExtension = '.test'

/* global describe, it */
describe('snap-shot-core', () => {
  const snapShotCore = require('.')

  it('it is a function', () => {
    la(is.fn(snapShotCore))
  })

  it('saves snapshot object', () => {
    const what = {
      foo: 'bar'
    }
    const out = snapShotCore({
      what,
      file,
      specName: 'my test',
      compare: compareFn,
      ext: snapShotExtension,
      opts
    })
    la(out !== what, 'returns new reference')
    la(out.foo === what.foo, 'different values', out)
    const filename = path.join(process.cwd(),
      '__snapshots__/snap-shot-core-spec.js.test')
    la(fs.existsSync(filename), 'cannot find saved file', filename)
  })

  it('can store derived value', function () {
    const specName = this.test.title
    la(is.unemptyString(specName), 'could not get name from', this.test)
    const store = x => 2 * x

    const what = 40
    const out = snapShotCore({
      what,
      file,
      specName,
      store,
      compare: areSameType,
      ext: snapShotExtension,
      opts
    })
    la(out === what * 2, 'expected saved value', out)
  })

  it('typeof example', function () {
    const specName = this.test.title
    const store = x => typeof x
    const compare = ({expected, value}) => ({
      valid: typeof value === expected,
      message: 'check the type'
    })
    // let us try snapshotting a function
    // but we only care about the "type" of the value
    const what = () => 'noop'
    const out = snapShotCore({
      what,
      file,
      specName,
      store,
      compare,
      ext: snapShotExtension,
      opts
    })
    la(out === 'function', 'expected type', out)
  })
})
