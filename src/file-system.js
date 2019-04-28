'use strict'

const fs = require('fs')
const path = require('path')
const debug = require('debug')('snap-shot-core')
const verbose = require('debug')('snap-shot-core:verbose')
const la = require('lazy-ass')
const is = require('check-more-types')
const mkdirp = require('mkdirp')
const vm = require('vm')
const escapeQuotes = require('escape-quotes')
const pluralize = require('pluralize')

const removeExtraNewLines = require('./utils').removeExtraNewLines
const exportText = require('./utils').exportText
const exportObject = require('./utils').exportObject

/**
 * Saved original process current working directory (absolute path).
 * We want to save it right away, because during testing CWD often changes,
 * and we don't want the snapshots to randomly "jump" around and be
 * saved in an unexpected location.
 */
const cwd = process.cwd()
/**
 * Returns a relative path to the original working directory.
 */
const fromCurrentFolder = path.relative.bind(null, cwd)
// TODO: expose the name of the snapshots folder to the outside world id:16
// - <https://github.com/bahmutov/snap-shot-core/issues/245>
// Gleb Bahmutov
// gleb.bahmutov@gmail.com
const snapshotsFolder = fromCurrentFolder('__snapshots__')
debug('process cwd: %s', cwd)
debug('snapshots folder: %s', snapshotsFolder)

/**
 * Changes from relative path to absolute filename with respect to the
 * _original working directory_. Always use this function instead of
 * `path.resolve(filename)` because `path.resolve` will be affected
 * by the _current_ working directory at the moment of resolution, and
 * we want to form snapshot filenames wrt to the original starting
 * working directory.
 */
const resolveToCwd = path.resolve.bind(null, cwd)

const isOptions = is.schema({
  sortSnapshots: is.bool
})

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
  verbose('spec file "%s" has name "%s"', specFile, specName)

  let filename = path.join(snapshotsFolder, specName)
  if (ext) {
    if (!filename.endsWith(ext)) {
      filename += ext
    }
  }
  verbose('formed filename %s', filename)
  const fullName = resolveToCwd(filename)
  verbose('full resolved name %s', fullName)

  return fullName
}

function loadSnapshotsFrom (filename) {
  la(is.unemptyString(filename), 'missing snapshots filename', filename)

  debug('loading snapshots from %s', filename)
  let snapshots = {}
  if (fs.existsSync(filename)) {
    snapshots = loadSnaps(filename)
  } else {
    debug('could not find snapshots file %s', filename)
  }
  return snapshots
}

function loadSnapshots (specFile, ext) {
  la(is.unemptyString(specFile), 'missing specFile name', specFile)

  const filename = fileForSpec(specFile, ext)
  verbose('from spec %s got snap filename %s', specFile, filename)
  return loadSnapshotsFrom(filename)
}

function prepareFragments (snapshots, opts = { sortSnapshots: true }) {
  la(isOptions(opts), 'expected prepare fragments options', opts)

  const names = opts.sortSnapshots
    ? Object.keys(snapshots).sort()
    : Object.keys(snapshots)

  const fragments = names.map(testName => {
    debug(`snapshot name "${testName}"`)
    const value = snapshots[testName]
    const escapedName = escapeQuotes(testName)
    return is.string(value)
      ? exportText(escapedName, value)
      : exportObject(escapedName, value)
  })

  return fragments
}

function maybeSortAndSave (snapshots, filename, opts = { sortSnapshots: true }) {
  const fragments = prepareFragments(snapshots, opts)
  debug('have %s', pluralize('fragment', fragments.length, true))

  const s = fragments.join('\n')
  fs.writeFileSync(filename, s, 'utf8')
  return s
}

// returns snapshot text
function saveSnapshots (
  specFile,
  snapshots,
  ext,
  opts = { sortSnapshots: true }
) {
  la(isOptions(opts), 'expected save snapshots options', opts)

  mkdirp.sync(snapshotsFolder)
  const filename = fileForSpec(specFile, ext)
  const specRelativeName = fromCurrentFolder(specFile)
  debug('saving snapshots into %s for %s', filename, specRelativeName)
  debug('snapshots are')
  debug(snapshots)

  return maybeSortAndSave(snapshots, filename, opts)
}

const isValidCompareResult = is.schema({
  orElse: is.fn
})

// expected = schema we expect value to adhere to
// value - what the test computed right now
// expected - existing value loaded from snapshot
function raiseIfDifferent (options) {
  options = options || {}

  const value = options.value
  const expected = options.expected
  const specName = options.specName
  const compare = options.compare

  la(value, 'missing value to compare', value)
  la(expected, 'missing expected value', expected)
  la(is.unemptyString(specName), 'missing spec name', specName)

  const result = compare({ expected, value })
  la(
    isValidCompareResult(result),
    'invalid compare result',
    result,
    'when comparing value\n',
    value,
    'with expected\n',
    expected
  )

  result.orElse(message => {
    debug('Test "%s" snapshot difference', specName)
    la(is.unemptyString(message), 'missing err string', message)

    const fullMessage = `Different value of snapshot "${specName}"\n${message}`

    // QUESTION should we print the error message by default?
    console.error(fullMessage)

    throw new Error(fullMessage)
  })
}

module.exports = {
  readFileSync: fs.readFileSync,
  fromCurrentFolder,
  loadSnapshots,
  loadSnapshotsFrom,
  saveSnapshots,
  maybeSortAndSave,
  raiseIfDifferent,
  fileForSpec,
  exportText,
  prepareFragments
}
