/* eslint-env mocha */
const execaWrap = require('execa-wrap')
const path = require('path')
const fs = require('fs')
const { stripIndent } = require('common-tags')
const mkdirp = require('mkdirp')
const la = require('lazy-ass')

// include an emoji that should be escaped
const snapshot = stripIndent`
  exports['x'] = 42

  exports['b'] = '👍'

  exports['a'] = 60
`

const escapedSnapshot = stripIndent`
  exports['x'] = 42

  exports['b'] = \`
  \\uD83D\\uDC4D
  \`

  exports['a'] = 60
`

const escapedSortedSnapshot = stripIndent`
  exports['a'] = 60

  exports['b'] = \`
  \\uD83D\\uDC4D
  \`

  exports['x'] = 42
`

const script = path.join(__dirname, 'resave-snapshots.js')
const testFolder = path.join(__dirname, 'test-resave')
const filename = path.join(testFolder, 'snapshot.js')

beforeEach(() => mkdirp(testFolder))
beforeEach(() => {
  fs.writeFileSync(filename, snapshot, 'utf8')
})

it('re-saves snapshots without sorting', () => {
  const args = [script, filename]
  return execaWrap('node', args).then(() => {
    const saved = fs.readFileSync(filename, 'utf8').trim()
    la(
      saved === escapedSnapshot,
      'difference in saved unsorted snapshot\nexpected:\n' +
        escapedSnapshot +
        '\n---\nactual:\n' +
        saved +
        '\n---'
    )
  })
})

it('re-saves sorted snapshots', () => {
  const args = [script, '--sort', filename]
  return execaWrap('node', args).then(() => {
    const saved = fs.readFileSync(filename, 'utf8').trim()
    la(
      saved === escapedSortedSnapshot,
      'difference in saved sorted snapshot\nexpected:\n' +
        escapedSortedSnapshot +
        '\n---\nactual:\n' +
        saved +
        '\n---'
    )
  })
})
