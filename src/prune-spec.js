'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const debug = require('debug')('test')
const R = require('ramda')

/* eslint-env mocha */
describe('pruning snapshots', () => {
  describe('pruning an object', () => {
    const pruneSnapshotsInObject = require('./prune')().pruneSnapshotsInObject

    it('prunes an object', () => {
      const runtimeSnapshots = [
        {
          specName: 'a',
          file: 'foo.js'
        }
      ]
      const snapshots = {
        a: 1,
        b: 2,
        c: 3
      }
      const pruned = pruneSnapshotsInObject(runtimeSnapshots, snapshots)
      debug(pruned)
      const expected = {
        a: 1
      }
      la(
        R.equals(pruned)(expected),
        'invalid pruned',
        pruned,
        'should be',
        expected
      )
    })

    it('prunes an object 2', () => {
      const runtimeSnapshots = [
        {
          specName: 'a',
          file: 'foo.js'
        },
        {
          specName: 'b',
          file: 'foo.js'
        }
      ]
      const snapshots = {
        a: 1,
        b: 2,
        c: 3
      }
      const pruned = pruneSnapshotsInObject(runtimeSnapshots, snapshots)
      debug(pruned)
      const expected = {
        a: 1,
        b: 2
      }
      la(
        R.equals(pruned)(expected),
        'invalid pruned',
        pruned,
        'should be',
        expected
      )
    })
  })

  describe('end to end', () => {
    const snapshot = require('.')
    const prune = snapshot.prune
    let dummyTestName

    it('is a function', () => {
      la(is.fn(prune))
    })

    it('is a dummy test', function () {
      dummyTestName = this.test.fullTitle().trim()
      debug('creating a snapshot for test "%s"', dummyTestName)
      debug('from filename "%s"', __filename)

      snapshot.core({
        what: 42,
        specName: dummyTestName,
        __filename,
        // avoid skipping pruning when running on CI server
        opts: {
          ci: false
        }
      })
    })

    it('prunes', () => {
      const tests = [
        {
          file: __filename,
          specName: dummyTestName
        }
      ]
      prune({ tests })
    })
  })
})
