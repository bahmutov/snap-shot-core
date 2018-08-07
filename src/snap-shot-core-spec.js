'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const fs = require('fs')
const path = require('path')
const utils = require('./utils')

const opts = {
  show: Boolean(process.env.SHOW),
  dryRun: Boolean(process.env.DRY),
  update: Boolean(process.env.UPDATE),
  ci: Boolean(process.env.CI)
}

const file = __filename
const snapShotExtension = '.test'

/* eslint-env mocha */
describe('snap-shot-core', () => {
  const snapShotCore = require('.')

  it('exports a top level object', () => {
    la(is.object(snapShotCore))
  })

  it('is a function', () => {
    la(is.fn(snapShotCore.core))
  })

  it('can save without increment the exact snapshot name', () => {
    snapShotCore.core({
      what: 43,
      file,
      exactSpecName: 'this should not be incremented',
      compare: utils.compare,
      ext: snapShotExtension,
      opts
    })
  })

  it('handles single quote in the name', () => {
    snapShotCore.core({
      what: 42,
      file,
      specName: "has single quote -> ' <-",
      compare: utils.compare,
      ext: snapShotExtension,
      opts
    })
  })

  it('stores comment', () => {
    snapShotCore.core({
      what: 42,
      file,
      specName: 'stores comment',
      opts,
      comment: 'this is a comment'
    })
  })

  it('saves snapshot object', () => {
    const what = {
      foo: 'bar'
    }
    const out = snapShotCore.core({
      what,
      file,
      specName: 'my test',
      compare: utils.compare,
      ext: snapShotExtension,
      opts
    })
    la(out !== what, 'returns new reference')
    la(out.foo === what.foo, 'different values', out)
    const filename = path.join(
      process.cwd(),
      '__snapshots__/snap-shot-core-spec.js.test'
    )
    la(fs.existsSync(filename), 'cannot find saved file', filename)
  })

  it('can store derived value', function () {
    const specName = this.test.title
    la(is.unemptyString(specName), 'could not get name from', this.test)
    const store = x => 2 * x

    const what = 40
    const out = snapShotCore.core({
      what,
      file,
      specName,
      store,
      compare: utils.compareTypes,
      ext: snapShotExtension,
      opts
    })
    la(out === what * 2, 'expected saved value', out)
  })

  it('typeof example', function () {
    const specName = this.test.title
    const store = x => typeof x
    // let us try snapshotting a function
    // but we only care about the "type" of the value
    const what = () => 'noop'
    const out = snapShotCore.core({
      what,
      file,
      specName,
      store,
      compare: utils.compareTypes,
      ext: snapShotExtension,
      opts
    })
    la(out === 'function', 'expected type', out)
  })

  it('CI does not allow saving', function () {
    const what = {
      foo: 'bar'
    }
    la(
      is.raises(function snapshotOnCi () {
        snapShotCore.core({
          what,
          file,
          specName: 'ci test',
          compare: utils.compare,
          ext: snapShotExtension,
          opts: { ci: true }
        })
      })
    )
  })

  it('can use custom raiser function', function () {
    let called
    function raiser () {
      called = true
    }

    snapShotCore.core({
      what: 42,
      file,
      specName: 'customer raiser function',
      ext: snapShotExtension,
      raiser,
      compare: utils.compare
    })
    la(called, 'customer raiser function was called')
  })

  it('has default compare function', () => {
    snapShotCore.core({
      what: { foo: 'bar' },
      file,
      specName: 'default compare'
    })
  })

  it('allows passing __filename', () => {
    snapShotCore.core({
      what: { foo: 'bar' },
      __filename,
      specName: 'default compare'
    })
  })

  it('has restore function', () => {
    la(is.fn(snapShotCore.restore), '"restore" should be a function')
  })

  it('escapes unicode sequences', () => {
    snapShotCore.core({
      what: '\u2028 \u270C\uFE0F',
      __filename,
      specName: 'unicode'
    })
  })

  it('can have same exact snapshot name from different files', () => {
    snapShotCore.core({
      what: 42,
      file: 'spec-a.js',
      exactSpecName: 'foo'
    })

    snapShotCore.core({
      what: 80,
      file: 'spec-b.js',
      exactSpecName: 'foo'
    })
  })

  after(() => {
    // confirm named snapshots from different spec files
    const snapshotsA = require('../__snapshots__/spec-a.js.snapshot')
    la(snapshotsA.foo === 42, snapshotsA)
    const snapshotsB = require('../__snapshots__/spec-b.js.snapshot')
    la(snapshotsB.foo === 80, snapshotsB)
  })
})
