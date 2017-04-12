'use strict'

const debug = require('debug')('snap-shot-core')
const debugSave = require('debug')('save')
const la = require('lazy-ass')
const is = require('check-more-types')
const utils = require('./utils')
const {snapshotIndex, strip} = utils

const isNode = Boolean(require('fs').existsSync)
const isBrowser = !isNode
const isCypress = isBrowser && typeof cy === 'object'

const identity = x => x

// TODO do we still need this? Is this working?
let fs
if (isNode) {
  fs = require('./file-system')
} else if (isCypress) {
  fs = require('./cypress-system')
} else {
  fs = require('./browser-system')
}

// keeps track how many "snapshot" calls were there per test
const snapshotsPerTest = {}

const formKey = (specName, oneIndex) =>
  `${specName} ${oneIndex}`

function findStoredValue ({file, specName, index = 1, ext, opts = {}}) {
  const relativePath = fs.fromCurrentFolder(file)
  if (opts.update) {
    // let the new value replace the current value
    return
  }

  debug('loading snapshots from %s %s for spec %s', file, ext, relativePath)
  const snapshots = fs.loadSnapshots(file, ext)
  if (!snapshots) {
    return
  }

  const key = formKey(specName, index)
  debug('key "%s"', key)
  if (!(key in snapshots)) {
    return
  }

  return snapshots[key]
}

function storeValue ({file, specName, index, value, ext, opts = {}}) {
  la(value !== undefined, 'cannot store undefined value')
  la(is.unemptyString(file), 'missing filename', file)
  la(is.unemptyString(specName), 'missing spec name', specName)
  la(is.positive(index), 'missing snapshot index', file, specName, index)

  if (opts.ci) {
    throw new Error('Cannot store new snapshot value\n' +
      'in ' + file + '\n' +
      'for ' + specName + '\n' +
      'when running on CI (opts.ci = 1)\n' +
      'see https://github.com/bahmutov/snap-shot-core/issues/5')
  }

  const snapshots = fs.loadSnapshots(file, ext)
  const key = formKey(specName, index)
  snapshots[key] = value

  if (opts.show || opts.dryRun) {
    const relativeName = fs.fromCurrentFolder(file)
    console.log('saving snapshot "%s" for file %s', key, relativeName)
    console.log(value)
  }

  if (!opts.dryRun) {
    fs.saveSnapshots(file, snapshots, ext)
    debug('saved updated snapshot %d for spec %s', index, specName)

    debugSave('Saved for "%s %d" snapshot\n%s',
      specName, index, JSON.stringify(value, null, 2))
  }
}

const isPromise = x => is.object(x) && is.fn(x.then)

function snapShotCore ({what,
  file,
  specName,
  store = identity,
  compare,
  ext = '.snapshot',
  opts = {}
}) {
  la(is.unemptyString(file), 'missing file', file)
  la(is.unemptyString(specName), 'missing specName', specName)
  la(is.fn(compare), 'missing compare function', compare)
  la(is.fn(store), 'invalid store function', store)

  if (ext) {
    la(ext[0] === '.', 'extension should start with .', ext)
  }

  const setOrCheckValue = any => {
    const index = snapshotIndex({specName, counters: snapshotsPerTest})
    la(is.positive(index), 'invalid snapshot index', index,
      'for\n', specName, '\ncounters', snapshotsPerTest)
    debug('spec "%s" snapshot is #%d',
      specName, index)

    const value = strip(any)
    const expected = findStoredValue({
      file,
      specName,
      index,
      ext,
      opts
    })
    if (expected === undefined) {
      const storedValue = store(value)
      storeValue({
        file,
        specName,
        index,
        value: storedValue,
        ext,
        opts
      })
      return storedValue
    }

    debug('found snapshot for "%s", value', specName, expected)
    fs.raiseIfDifferent({
      value,
      expected,
      specName,
      compare
    })
    return expected
  }

  if (isPromise(what)) {
    return what.then(setOrCheckValue)
  } else {
    return setOrCheckValue(what)
  }
}

if (isBrowser) {
  // there might be async step to load test source code in the browser
  la(is.fn(fs.init), 'browser file system is missing init', fs)
  snapShotCore.init = fs.init
}

module.exports = snapShotCore
