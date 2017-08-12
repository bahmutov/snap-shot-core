'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')

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
    return {
      valid: true
    }
  }
  return {
    valid: false,
    message: `${e} !== ${v}`
  }
}

module.exports = {
  snapshotIndex,
  strip,
  compare
}
