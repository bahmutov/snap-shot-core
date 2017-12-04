'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')

/* eslint-env mocha */
describe('pruning snapshots', () => {
  const snapshot = require('.')
  const prune = snapshot.prune
  let dummyTestName

  it('is a function', () => {
    la(is.fn(prune))
  })

  it('is a dummy test', function () {
    dummyTestName = this.test.fullTitle().trim()
    snapshot({
      what: 42,
      specName: dummyTestName,
      __filename
    })
  })

  it('prunes', () => {
    const tests = [{
      file: __filename,
      specName: dummyTestName
    }]
    prune({tests})
  })
})
