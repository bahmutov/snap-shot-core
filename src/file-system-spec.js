const fileSystem = require('./file-system')
const utils = require('./utils')
const fs = require('fs')
const la = require('lazy-ass')
const is = require('check-more-types')
const sinon = require('sinon')
const mkdirp = require('mkdirp')

/* eslint-env mocha */
describe('file system', () => {
  describe('saveSnapshots', () => {
    const saveSnapshots = fileSystem.saveSnapshots

    it('is a function', () => {
      la(is.fn(saveSnapshots))
    })

    it('throws detailed error when trying to store empty string value', () => {
      la(is.raises(() => {
        // snapshots with empty string to save
        const snapshots = {
          test: ''
        }
        saveSnapshots('./foo-spec.js', snapshots, '.js')
      }, (err) => {
        const text = 'Cannot store empty / null / undefined string'
        return err.message.includes(text)
      }))
    })

    it('puts new lines around text snapshots', () => {
      sinon.stub(fs, 'writeFileSync')
      sinon.stub(mkdirp, 'sync')

      const snapshots = {
        test: 'line 1\nline 2'
      }
      const text = saveSnapshots('./foo-spec.js', snapshots, '.js')
      fs.writeFileSync.restore()
      mkdirp.sync.restore()
      const expected = "exports['test'] = `\nline 1\nline 2\n`\n"
      la(text === expected, 'should add newlines around text snapshot\n' +
        text + '\nexpected\n' + expected)
    })
  })

  describe('fileForSpec', () => {
    const fileForSpec = fileSystem.fileForSpec

    it('adds different extension', () => {
      const result = fileForSpec('foo.coffee', '.js')
      la(result.endsWith('foo.coffee.js'), result)
    })

    it('does not add .js twice', () => {
      const result = fileForSpec('foo.js', '.js')
      la(result.endsWith('foo.js'), result)
    })
  })

  describe('error message', () => {
    it('includes snapshot name', () => {
      const specName = 'foo-bar 1'

      la(is.raises(() => {
        fileSystem.raiseIfDifferent({
          value: 42,
          expected: 41,
          specName,
          compare: utils.compare
        })
      }, (err) => {
        return err.message.includes(specName)
      }))
    })
  })
})
