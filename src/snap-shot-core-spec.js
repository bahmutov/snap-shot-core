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
      file: __filename,
      specName: 'my test',
      compare: compareFn,
      ext: '.test',
      opts
    })
    la(out !== what, 'returns new reference')
    la(out.foo === what.foo, 'different values', out)
    const filename = path.join(process.cwd(),
      '__snapshots__/snap-shot-core-spec.js.test')
    la(fs.existsSync(filename), 'cannot find saved file', filename)
  })
})
