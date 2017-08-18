const fs = require('./file-system')
const la = require('lazy-ass')

/* eslint-env mocha */
describe('file system', () => {
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
