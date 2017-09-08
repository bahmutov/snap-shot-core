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
const stripIndent = require('common-tags').stripIndent

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
    return removeExtraNewLines(sandbox.exports)
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
    if (!filename.endsWith(ext)) {
      filename += ext
    }
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

function exportText (name, value) {
  la(is.unemptyString(name), 'expected snapshot name, got:', name)
  if (!is.unemptyString(value)) {
    const message = stripIndent`
      Cannot store empty / null / undefined string as a snapshot value.
      Seems the value you are trying to store in a snapshot "${name}"
      is empty. Snapshots only work well if they have actual content
      to store. Otherwise, why bother?
    `
    throw new Error(message)
  }
  la(is.unemptyString(value), 'expected string value', value)
  const withNewLines = '\n' + value + '\n'
  return `exports['${name}'] = \`${withNewLines}\`\n`
}

function exportObject (name, value) {
  const serialized = jsesc(value, {
    json: true,
    compact: false,
    indent: '  '
  })
  return `exports['${name}'] = ${serialized}\n`
}

// returns snapshot text
function saveSnapshots (specFile, snapshots, ext) {
  mkdirp.sync(snapshotsFolder)
  const filename = fileForSpec(specFile, ext)
  const specRelativeName = fromCurrentFolder(specFile)
  debug('saving snapshots into %s for %s', filename, specRelativeName)

  const fragments = Object.keys(snapshots).map(testName => {
    debug(`snapshot name "${testName}"`)
    const value = snapshots[testName]
    const escapedName = escapeQuotes(testName)
    return is.string(value)
      ? exportText(escapedName, value)
      : exportObject(escapedName, value)
  })
  const s = fragments.join('\n')
  fs.writeFileSync(filename, s, 'utf8')
  return s
}

const isValidCompareResult = is.schema({
  orElse: is.fn
})

// expected = schema we expect value to adhere to
// value - what the test computed right now
// expected - existing value loaded from snapshot
function raiseIfDifferent ({value, expected, specName, compare}) {
  la(value, 'missing value to compare', value)
  la(expected, 'missing expected value', expected)
  la(is.unemptyString(specName), 'missing spec name', specName)

  const result = compare({expected, value})
  la(isValidCompareResult(result), 'invalid compare result', result,
    'when comparing value\n', value, 'with expected\n', expected)

  result.orElse(message => {
    debug('Test "%s" snapshot difference', specName)
    la(is.unemptyString(message), 'missing err string', message)
    console.log(message)
    throw new Error(message)
  })
}

const isSurroundedByNewLines = (s) =>
  is.string(s) && s.length > 1 && s[0] === '\n' && s[s.length - 1] === '\n'

// when we save string snapshots we add extra new lines to
// avoid long first lines
// when loading snapshots we should remove these new lines
// from string properties
function removeExtraNewLines (snapshots) {
  Object.keys(snapshots).forEach(key => {
    const value = snapshots[key]
    if (isSurroundedByNewLines(value)) {
      snapshots[key] = value.substr(1, value.length - 2)
    }
  })
  return snapshots
}

module.exports = {
  readFileSync: fs.readFileSync,
  fromCurrentFolder,
  loadSnapshots,
  saveSnapshots,
  raiseIfDifferent,
  fileForSpec,
  exportText,
  removeExtraNewLines
}
