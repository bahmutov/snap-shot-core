const fs = require('./file-system')
const la = require('lazy-ass')
const is = require('check-more-types')

/* eslint-env mocha */
describe('file system', () => {
  describe('saveSnapshots', () => {
    const {saveSnapshots} = fs

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
  })

  describe('fileForSpec', () => {
    const {fileForSpec} = fs

    it('adds different extension', () => {
      const result = fileForSpec('foo.coffee', '.js')
      la(result.endsWith('foo.coffee.js'), result)
    })

    it('does not add .js twice', () => {
      const result = fileForSpec('foo.js', '.js')
      la(result.endsWith('foo.js'), result)
    })
  })
})
