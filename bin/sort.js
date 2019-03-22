#!/usr/bin/env node

'use strict'

const debug = require('debug')('snap-shot-core')
const path = require('path')
const pluralize = require('pluralize')
const { loadSnapshotsFrom, maybeSortAndSave } = require('../src/file-system')

const help = 'USE: ./node_modules/.bin/sort-snapshots <snapshot filename>'

require('simple-bin-help')({
  minArguments: 3, // node, script, filename
  packagePath: path.join(__dirname, '..', 'package.json'),
  help: help
})

const snapshotFilename = path.resolve(process.argv[2])
const snapshots = loadSnapshotsFrom(snapshotFilename)
const names = Object.keys(snapshots)
debug('loaded %s', pluralize('snapshot', names.length, true))
debug(names.join('\n'))

console.log('saving sorted snapshots to', snapshotFilename)
maybeSortAndSave(snapshots, snapshotFilename, { sortSnapshots: true })
