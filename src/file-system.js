'use strict'

const fs = require('fs')
const path = require('path')
const debug = require('debug')('snap-shot-core')
const la = require('lazy-ass')
const is = require('check-more-types')
const mkdirp = require('mkdirp')
const vm = require('vm')
const escapeQuotes = require('escape-quotes')
const jsesc = require('jsesc')

const cwd = process.cwd()
const fromCurrentFolder = path.relative.bind(null, cwd)
const snapshotsFolder = fromCurrentFolder('__snapshots__')

function loadSnaps (snapshotPath) {
  const full = require.resolve(snapshotPath)
  if (!fs.existsSync(snapshotPath)) {
    return {}
  }

  const sandbox = {
    exports: {}
  }
  const source = fs.readFileSync(full, 'utf8')
  try {
    vm.runInNewContext(source, sandbox)
    return sandbox.exports
  } catch (e) {
    console.error('Could not load file', full)
    console.error(source)
    console.error(e)
    if (e instanceof SyntaxError) {
      throw e
    }
    return {}
  }
}

function fileForSpec (specFile, ext) {
  la(is.maybe.string(ext), 'invalid extension to find', ext)

  const specName = path.basename(specFile)
  let filename = path.join(snapshotsFolder, specName)
  if (ext) {
    filename += ext
  }
  return path.resolve(filename)
}

function loadSnapshots (specFile, ext) {
  la(is.unemptyString(specFile), 'missing specFile name', specFile)

  const filename = fileForSpec(specFile, ext)
  debug('loading snapshots from %s', filename)
  let snapshots = {}
  if (fs.existsSync(filename)) {
    snapshots = loadSnaps(filename)
  } else {
    debug('could not find snapshots file %s', filename)
  }
  return snapshots
}

function saveSnapshots (specFile, snapshots, ext) {
  mkdirp.sync(snapshotsFolder)
  const filename = fileForSpec(specFile, ext)
  const specRelativeName = fromCurrentFolder(specFile)
  debug('saving snapshots into %s for %s', filename, specRelativeName)

  let s = ''
  Object.keys(snapshots).forEach(testName => {
    debug(`snapshot name "${testName}"`)
    const value = snapshots[testName]
    const serialized = jsesc(value, {
      json: true,
      compact: false,
      indent: '  '
    })
    s += `exports['${escapeQuotes(testName)}'] = ${serialized}\n\n`
  })
  fs.writeFileSync(filename, s, 'utf8')
  return snapshots
}

const isValidCompareResult = is.schema({
  valid: is.bool,
  message: is.maybe.string
})

// expected = schema we expect value to adhere to
function raiseIfDifferent ({value, expected, specName, compare}) {
  la(value, 'missing value to compare', value)
  la(expected, 'missing expected value', expected)
  la(is.unemptyString(specName), 'missing spec name', specName)

  const result = compare({expected, value})
  la(isValidCompareResult(result), 'invalid compare result', result,
    'when comparing value\n', value, 'with expected\n', expected)

  if (!result.valid) {
    debug('Test "%s" snapshot difference', specName)
    la(is.unemptyString(result.message), 'missing result message', result)
    console.log(result.message)
    throw new Error(result.message)
  }
}

module.exports = {
  readFileSync: fs.readFileSync,
  fromCurrentFolder,
  loadSnapshots,
  saveSnapshots,
  raiseIfDifferent
}
