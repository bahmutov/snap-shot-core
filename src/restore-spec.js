'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const debug = require('debug')('test')

const snapShotExtension = '.test'

/* global describe, it */
describe('restore', () => {
  const snapShotCore = require('.')

  it('has restore function', () => {
    la(is.fn(snapShotCore.restore), '"restore" should be a function')
  })

  it('counters can be restored to zero', function () {
    let called
    function raiser () {
      called = true
    }
    const specName = this.test.title
    const filename = path.join(
      process.cwd(),
      '__snapshots__/restore-spec.js.test'
    )

    // first snapshot
    snapShotCore.core({
      what: 'A',
      __filename,
      specName,
      ext: snapShotExtension
    })
    la(!called, 'custom raiser function was not called')

    // restore snapshot counters
    snapShotCore.restore()

    // this would repeat first snapshot (and it should fail)
    snapShotCore.core({
      what: 'B',
      __filename,
      specName,
      raiser,
      ext: snapShotExtension
    })

    let snapshot = require(filename)
    debug('loaded snapshot from %s', filename)
    debug(snapshot)

    // TODO expose utility functions that form full snapshot name
    // TODO expose utility functions that wrap values before saving
    const expectedSnapshotName = specName + ' 1'
    la(
      // string value surrounded by new lines
      snapshot[expectedSnapshotName] === '\nA\n',
      'first snapshot should be saved "' + expectedSnapshotName + '"',
      'found snapshots',
      snapshot
    )
    la(
      !snapshot[specName + ' 2'],
      'second snapshot should not be saved "',
      specName,
      ' 2"'
    )
    la(called, 'second snapshot should fail instead')
  })

  it('single counter can be restored to zero', function () {
    let called
    function raiser () {
      called = true
    }
    const specName = this.test.title
    const filename = path.join(
      process.cwd(),
      '__snapshots__/snap-shot-core-spec.js.test'
    )

    // first snapshot
    snapShotCore.core({
      what: 'A',
      __filename,
      specName,
      ext: snapShotExtension
    })
    snapShotCore.restore({
      file: __filename,
      specName
    })

    // this would repeat first snapshot (and it should fail)
    snapShotCore.core({
      what: 'B',
      __filename,
      specName,
      raiser,
      ext: snapShotExtension
    })

    let snapshot = require(filename)
    la(
      snapshot[specName + ' 1'] === '\nA\n',
      'first snapshot should be saved "',
      specName,
      ' 1"'
    )
    la(
      !snapshot[specName + ' 2'],
      'second snapshot should not be saved "',
      specName,
      ' 2"'
    )
    la(called, 'second snapshot should fail instead')
  })
})
