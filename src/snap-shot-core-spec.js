'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const fs = require('fs')
const path = require('path')

const opts = {
  show: Boolean(process.env.SHOW),
  dryRun: Boolean(process.env.DRY),
  update: Boolean(process.env.UPDATE),
  ci: Boolean(process.env.CI)
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

  it('handles single quote in the name', () => {
    snapShotCore({
      what: 42,
      file,
      specName: "has single quote -> ' <-",
      compare: compareFn,
      ext: snapShotExtension,
      opts
    })
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

  it('CI does not allow saving', function () {
    const what = {
      foo: 'bar'
    }
    la(is.raises(function snapshotOnCi () {
      snapShotCore({
        what,
        file,
        specName: 'ci test',
        compare: compareFn,
        ext: snapShotExtension,
        opts: {ci: true}
      })
    }))
  })

  it('can use custom raiser function', function () {
    let called
    function raiser () {
      called = true
    }

    snapShotCore({
      what: 42,
      file,
      specName: 'customer raiser function',
      ext: snapShotExtension,
      raiser,
      compare: compareFn
    })
    la(called, 'customer raiser function was called')
  })

  it('has default compare function', () => {
    snapShotCore({
      what: {foo: 'bar'},
      file,
      specName: 'default compare'
    })
  })

  it('allows passing __filename', () => {
    snapShotCore({
      what: {foo: 'bar'},
      __filename,
      specName: 'default compare'
    })
  })

  it('counters can be restored to zero', function () {
    let called
    function raiser () {
      called = true
    }
    const specName = this.test.title
    const filename = path.join(process.cwd(),
      '__snapshots__/snap-shot-core-spec.js.test')

    // first snapshot
    snapShotCore({
      what: 'A',
      __filename,
      specName,
      ext: snapShotExtension
    })

    la(is.fn(snapShotCore.restore), '"restore" shoudl be a function')

    // restore snapshot counters
    snapShotCore.restore()

    // this would repeat first snapshot (and it should fail)
    snapShotCore({
      what: 'B',
      __filename,
      specName,
      raiser,
      ext: snapShotExtension
    })

    let snapshot = require(filename)
    la(snapshot[specName + ' 1'] === 'A', 'first snapshot should be saved "', specName, ' 1"')
    la(!snapshot[specName + ' 2'], 'second snapshot should not be saved "', specName, ' 2"')
    la(called, 'second snapshot should fail instead')
  })

  it('escapes unicode sequences', () => {
    snapShotCore({
      what: '\u2028 \u270C\uFE0F',
      __filename,
      specName: 'unicode'
    })
  })
})
