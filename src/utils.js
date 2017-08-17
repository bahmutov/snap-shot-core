'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const Result = require('folktale/result')

// TODO: we should also consider the file spec name + test name
// not just spec name (which is test name here)
function snapshotIndex ({counters, file, specName}) {
  la(is.object(counters), 'expected counters', counters)
  la(is.unemptyString(specName), 'expected specName', specName)
  la(is.unemptyString(file), 'missing filename', file)

  if (!(specName in counters)) {
    counters[specName] = 1
  } else {
    counters[specName] += 1
  }
  return counters[specName]
}

// make sure values in the object are "safe" to be serialized
// and compared from loaded value
function strip (o) {
  if (is.fn(o)) {
    return o
  }
  return JSON.parse(JSON.stringify(o))
}

function compare ({expected, value}) {
  const e = JSON.stringify(expected)
  const v = JSON.stringify(value)
  if (e === v) {
    return Result.Ok()
  }
  return Result.Error(`${e} !== ${v}`)
}

const sameTypes = (a, b) => typeof expected === typeof value

const compareTypes = ({expected, value}) =>
  sameTypes(expected, value) ? Result.Ok() : Result.Error('no message')

module.exports = {
  snapshotIndex,
  strip,
  compare,
  sameTypes,
  compareTypes
}
