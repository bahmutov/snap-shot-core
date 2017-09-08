'use strict'

const debug = require('debug')('snap-shot-core')
const debugSave = require('debug')('save')
const la = require('lazy-ass')
const is = require('check-more-types')
const utils = require('./utils')
const isCI = require('is-ci')
const R = require('ramda')
const {snapshotIndex, strip} = utils

const isNode = Boolean(require('fs').existsSync)
const isBrowser = !isNode
const isCypress = isBrowser && typeof cy === 'object'

const DEFAULT_EXTENSION = '.snapshot.js'

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
var snapshotsPerTest = {}

const formKey = (specName, oneIndex) =>
  `${specName} ${oneIndex}`

function restore (options) {
  if (!options) {
    debug('restoring all counters')
    snapshotsPerTest = {}
  } else {
    const {file, specName} = options
    la(is.unemptyString(file), 'missing file', options)
    la(is.unemptyString(specName), 'missing specName', options)
    debug('restoring counter for file "%s" test "%s"', file, specName)
    delete snapshotsPerTest[specName]
  }
}

function findStoredValue ({file, specName, exactSpecName, index = 1, ext, opts = {}}) {
  la(is.unemptyString(file), 'missing file to find spec for', file)
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

  const key = exactSpecName || formKey(specName, index)
  debug('key "%s"', key)
  if (!(key in snapshots)) {
    return
  }

  return snapshots[key]
}

function storeValue ({file, specName, exactSpecName, index, value, ext, comment, opts = {}}) {
  la(value !== undefined, 'cannot store undefined value')
  la(is.unemptyString(file), 'missing filename', file)

  la(is.unemptyString(specName) || is.unemptyString(exactSpecName),
    'missing spec or exact spec name', specName, exactSpecName)

  if (!exactSpecName) {
    la(is.maybe.positive(index), 'missing snapshot index', file, specName, index)
  }
  la(is.maybe.unemptyString(comment), 'invalid comment to store', comment)

  // how to serialize comments?
  // as comments above each key?
  const snapshots = fs.loadSnapshots(file, ext)
  const key = exactSpecName || formKey(specName, index)
  snapshots[key] = value

  if (opts.show || opts.dryRun) {
    const relativeName = fs.fromCurrentFolder(file)
    console.log('saving snapshot "%s" for file %s', key, relativeName)
    console.log(value)
  }

  if (!opts.dryRun) {
    fs.saveSnapshots(file, snapshots, ext)
    debug('saved updated snapshot %d for spec "%s"', index, specName)

    debugSave('Saved for "%s %d" snapshot\n%s',
      specName, index, JSON.stringify(value, null, 2))
  }
}

// TODO switch to async
function pruneSnapshots ({tests, ext = DEFAULT_EXTENSION}) {
  la(is.array(tests), 'missing tests', tests)
  const byFilename = R.groupBy(R.prop('file'), tests)
  debug('pruning snapshots')
  Object.keys(byFilename).forEach(file => {
    const specNames = byFilename[file].map(s => s.specName)
    const snapshots = fs.loadSnapshots(file, ext)
    if (is.empty(snapshots)) {
      debug('empty snapshot file for', file)
      return
    }
    const isPresent = (val, key) => {
      return R.find(specName => key.startsWith(specName))(specNames)
    }
    const prunedSnapshots = R.pickBy(isPresent, snapshots)
    if (R.equals(prunedSnapshots, snapshots)) {
      debug('nothing to prune for file', file)
      return
    }
    debug('saving pruned snapshot file for', file)
    fs.saveSnapshots(file, prunedSnapshots, ext)
  })
}

const isPromise = x => is.object(x) && is.fn(x.then)

function snapShotCore ({what,
  file,
  __filename,
  specName,
  exactSpecName, // if specified will be used without any increments
  store = identity,
  compare = utils.compare,
  raiser,
  ext = DEFAULT_EXTENSION,
  comment,
  opts = {}
}) {
  const fileParameter = file || __filename
  la(is.unemptyString(fileParameter), 'missing file', fileParameter)
  la(is.maybe.unemptyString(specName), 'invalid specName', specName)
  la(is.maybe.unemptyString(exactSpecName), 'invalid exactSpecName', exactSpecName)
  la(specName || exactSpecName,
    'missing either specName or exactSpecName')

  la(is.fn(compare), 'missing compare function', compare)
  la(is.fn(store), 'invalid store function', store)
  if (!raiser) {
    raiser = fs.raiseIfDifferent
  }
  la(is.fn(raiser), 'invalid raiser function', raiser)
  la(is.maybe.unemptyString(comment), 'wrong comment type', comment)

  if (!('ci' in opts)) {
    debug('set CI flag to %s', isCI)
    opts.ci = isCI
  }

  if (ext) {
    la(ext[0] === '.', 'extension should start with .', ext)
  }
  debug(`file "${fileParameter} spec "${specName}`)

  const setOrCheckValue = any => {
    const index = exactSpecName ? 0 : snapshotIndex({
      counters: snapshotsPerTest,
      file: fileParameter,
      specName,
      exactSpecName
    })
    if (index) {
      la(is.positive(index), 'invalid snapshot index', index,
        'for\n', specName, '\ncounters', snapshotsPerTest)
      debug('spec "%s" snapshot is #%d',
        specName, index)
    }

    const value = strip(any)
    const expected = findStoredValue({
      file: fileParameter,
      specName,
      exactSpecName,
      index,
      ext,
      opts
    })
    if (expected === undefined) {
      if (opts.ci) {
        console.log('current directory', process.cwd())
        console.log('new value to save: %j', value)
        const key = formKey(specName, index)
        throw new Error('Cannot store new snapshot value\n' +
          'in ' + fileParameter + '\n' +
          'for spec called "' + specName + '"\n' +
          'test key "' + key + '"\n' +
          'when running on CI (opts.ci = 1)\n' +
          'see https://github.com/bahmutov/snap-shot-core/issues/5')
      }

      const storedValue = store(value)
      storeValue({
        file: fileParameter,
        specName,
        exactSpecName,
        index,
        value: storedValue,
        ext,
        comment,
        opts
      })
      return storedValue
    }

    const usedSpecName = specName || exactSpecName
    debug('found snapshot for "%s", value', usedSpecName, expected)
    raiser({
      value,
      expected,
      specName: usedSpecName,
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

snapShotCore.restore = restore
snapShotCore.prune = pruneSnapshots

module.exports = snapShotCore
