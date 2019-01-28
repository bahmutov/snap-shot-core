const R = require('ramda')
const debug = require('debug')('snap-shot-core')
const pluralize = require('pluralize')
const la = require('lazy-ass')
const is = require('check-more-types')
const utils = require('./utils')

const isRunTimeSnapshot = is.schema({
  specName: is.unemptyString,
  file: is.unemptyString
})

const pruneSnapshotsInObject = (runtimeSnapshots, snapshots) => {
  la(is.array(runtimeSnapshots), 'invalid runtime snapshots', runtimeSnapshots)
  runtimeSnapshots.forEach((r, k) => {
    la(isRunTimeSnapshot(r), 'invalid runtime snapshot', r, 'at index', k)
  })

  const specNames = R.map(R.prop('specName'), runtimeSnapshots)
  debug('have %s before pruning', pluralize('name', specNames.length, true))
  if (debug.enabled) {
    debug(specNames.sort())
  }

  const isPresent = (val, key) => {
    return R.find(specName => key.startsWith(specName))(specNames)
  }
  const prunedSnapshots = R.pickBy(isPresent, snapshots)
  debug(
    'after pruning remaining %s',
    pluralize('name', R.keys(prunedSnapshots).length, true)
  )
  if (debug.enabled) {
    debug(R.keys(prunedSnapshots).sort())
  }

  return prunedSnapshots
}

const pruneSnapshotsInFile = ({ fs, byFilename, ext }, opts) => file => {
  const snapshots = fs.loadSnapshots(file, ext, opts)
  if (is.empty(snapshots)) {
    debug('empty snapshots to prune in file', file)
    return
  }

  const runtimeSnapshots = byFilename[file]
  const prunedSnapshots = pruneSnapshotsInObject(runtimeSnapshots, snapshots)
  if (R.equals(prunedSnapshots, snapshots)) {
    debug('nothing to prune for file', file)
    return
  }

  debug('saving pruned snapshot file for', file)
  fs.saveSnapshots(file, prunedSnapshots, ext, opts)
}

// TODO switch to async id:3
// Gleb Bahmutov
// gleb.bahmutov@gmail.com
// https://github.com/bahmutov/snap-shot-core/issues/88
const pruneSnapshots = (fs) => ({ tests, ext = utils.DEFAULT_EXTENSION }, opts) => {
  la(is.array(tests), 'missing tests', tests)
  const byFilename = R.groupBy(R.prop('file'), tests)
  debug('pruning snapshots')
  debug('run time tests')
  debug(tests)

  Object.keys(byFilename).forEach(pruneSnapshotsInFile({ fs, byFilename, ext }, opts))
}

module.exports = fs => {
  return {
    pruneSnapshots: pruneSnapshots(fs),
    pruneSnapshotsInObject
  }
}
