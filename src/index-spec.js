'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const { stripIndent } = require('common-tags')

/* eslint-env mocha */
describe('throwCannotSaveOnCI', () => {
  const { throwCannotSaveOnCI } = require('./index')

  it('is a function', () => {
    la(is.fn(throwCannotSaveOnCI))
  })

  it('throws good message for auto formed', () => {
    let caught
    try {
      throwCannotSaveOnCI({
        value: 'foo',
        fileParameter: 'spec.js',
        exactSpecName: null,
        specName: 'my spec',
        index: 1
      })
    } catch (e) {
      caught = true
      const expected = stripIndent`
        Cannot store new snapshot value
        in "spec.js"
        for snapshot called "my spec"
        test key "my spec 1"
        when running on CI (opts.ci = 1)
        see https://github.com/bahmutov/snap-shot-core/issues/5
      `
      la(
        e.message === expected,
        'expected:\n' + expected + '\n\nactual:\n' + e.message
      )
    }
    la(caught, 'did not catch error!')
  })

  it('throws good message for exact snapshot name', () => {
    let caught
    try {
      throwCannotSaveOnCI({
        value: 'foo',
        fileParameter: 'spec.js',
        exactSpecName: 'my snapshot name',
        specName: null,
        index: null
      })
    } catch (e) {
      caught = true
      const expected = stripIndent`
        Cannot store new snapshot value
        in "spec.js"
        for snapshot called "my snapshot name"
        test key "my snapshot name"
        when running on CI (opts.ci = 1)
        see https://github.com/bahmutov/snap-shot-core/issues/5
      `
      la(
        e.message === expected,
        'expected:\n' + expected + '\n\nactual:\n' + e.message
      )
    }
    la(caught, 'did not catch error!')
  })
})
