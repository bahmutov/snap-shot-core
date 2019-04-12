'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const strip = require('./utils').strip
const Result = require('folktale/result')
const snapshot = require('snap-shot-it')
const { stripIndent } = require('common-tags')
const jsesc = require('jsesc')

const compareText = (expected, formatted) => {
  la(
    formatted === expected,
    'expected\n' + expected + '\ngot\n' + formatted + '\nend'
  )
}

/* global describe, it */
describe('utils', () => {
  it('is a function', () => {
    la(is.fn(strip))
  })

  it('handles objects with methods', () => {
    const out = strip({
      foo: 'bar',
      fn: () => 'nothing'
    })
    la(is.object(out), 'returns an object', out)
    la(!out.fn, 'method has been removed', out)
  })

  it('passes a function as is', () => {
    const fn = () => 'nothing'
    const out = strip(fn)
    la(out === fn)
  })
})

describe('compare', () => {
  const compare = require('./utils').compare

  it('returns Result', () => {
    const expected = 'foo'
    const value = 'foo'
    const r = compare({ expected, value })
    la(Result.hasInstance(r))
  })

  it('passes identical values', () => {
    const expected = 'foo'
    const value = 'foo'
    const r = compare({ expected, value })
    la(r.value === undefined)
  })

  it('has error text', () => {
    const expected = 'foo'
    const value = 'bar'
    const r = compare({ expected, value })
    la(r.value === '"foo" !== "bar"')
  })

  it('has error (snapshot)', () => {
    const expected = 'foo'
    const value = 'bar'
    snapshot(compare({ expected, value }))
  })

  const raise = () => {
    throw new Error('Cannot reach this')
  }
  it('snapshots error value', () => {
    const expected = 'foo'
    const value = 'bar'
    compare({ expected, value })
      .map(raise)
      .orElse(snapshot)
  })
})

describe('exportObject', () => {
  const exportObject = require('./utils').exportObject

  it('is a function', () => {
    la(is.fn(exportObject))
  })

  it('does not escape emoji values', () => {
    const formatted = exportObject('name', {
      foo: '😁'
    })
    const expected = stripIndent`
      exports['name'] = {
        "foo": "😁"
      }
    `
    la(
      formatted === expected + '\n',
      'expected\n' + expected + '\ngot\n' + formatted + '\nend'
    )
  })

  it('does not escape emoji keys', () => {
    const formatted = exportObject('name', {
      '🍕': '😁'
    })
    const expected = stripIndent`
      exports['name'] = {
        "🍕": "😁"
      }
    `
    la(
      formatted === expected + '\n',
      'expected\n' + expected + '\ngot\n' + formatted + '\nend'
    )
  })
})

describe('jsesc', () => {
  const options = {
    quotes: 'backtick',
    minimal: true
  }

  it('normal text', () => {
    const text = 'foo'
    const escaped = jsesc(text, options)
    const expected = 'foo'
    compareText(expected, escaped)
  })

  it('escapes backticks', () => {
    const text = 'foo `bar` baz'
    const escaped = jsesc(text, options)
    const expected = 'foo \\`bar\\` baz'
    compareText(expected, escaped)
  })

  it('escapes backticks around number', () => {
    const text = 'foo `100` baz'
    const escaped = jsesc(text, options)
    const expected = 'foo \\`100\\` baz'
    compareText(expected, escaped)
  })

  it('escapes backticks around emoji', () => {
    const text = 'foo `⭐️` baz'
    const escaped = jsesc(text, options)
    const expected = 'foo \\`⭐️\\` baz'
    compareText(expected, escaped)
  })
})

describe('exportText', () => {
  const exportText = require('./utils').exportText

  it('is a function', () => {
    la(is.fn(exportText))
  })

  it('does escape backtick on the text', () => {
    const formatted = exportText('name', '`code`')
    const expected = "exports['name'] = `\n\\`code\\`\n`\n"
    la(formatted === expected, 'expected\n' + expected + '\ngot\n' + formatted)
  })

  it('does escape template variable on the text', () => {
    /* eslint-disable no-template-curly-in-string */
    const formatted = exportText('name', '`${1}`')
    const expected = "exports['name'] = `\n\\`\\${1}\\`\n`\n"
    la(formatted === expected, 'expected\n' + expected + '\ngot\n' + formatted)
    /* eslint-enable no-template-curly-in-string */
  })

  it('does not replace \\n with \n on the text', () => {
    const formatted = exportText('name', 'escaped \\n')
    const expected = "exports['name'] = `\nescaped \\\\n\n`\n"
    la(formatted === expected, 'expected\n' + expected + '\ngot\n' + formatted)
  })

  it('does not put value on the first line', () => {
    const formatted = exportText('name', 'foo')
    const expected = "exports['name'] = `\nfoo\n`\n"
    la(formatted === expected, 'expected\n' + expected + '\ngot\n' + formatted)
  })

  it('does not escape unicode emoji', () => {
    const formatted = exportText('reaction', '😁')
    const expected = "exports['reaction'] = `\n😁\n`\n"
    la(formatted === expected, 'expected\n' + expected + '\ngot\n' + formatted)
  })

  it('does not escape ascii art', () => {
    const text = stripIndent`
      =============================
        (Run Finished)

        Spec                                          Tests  Passing  Failing  Pending  Skipped
        ┌─────────────────────────────────────────────────────────────────────────────────────┐
        │ ✔ simple_passing_spec.coffee     XX:XX        1        1        -        -        - │
        └─────────────────────────────────────────────────────────────────────────────────────┘
        All specs passed!                  XX:XX        1        1        -        -        -
    `
    const formatted = exportText('ascii art', text)
    const expected = "exports['ascii art'] = `\n" + text + '\n`\n'
    la(
      formatted === expected,
      'expected\n' + expected + '\ngot\n' + formatted + '\nend'
    )
  })
})

describe('removeExtraNewLines', () => {
  const removeExtraNewLines = require('./utils').removeExtraNewLines

  it('is a function', () => {
    la(is.fn(removeExtraNewLines))
  })

  it('leaves other values unchanged', () => {
    const snapshots = {
      foo: 'bar',
      age: 42
    }
    const result = removeExtraNewLines(snapshots)
    snapshot(result)
  })

  it('removes new lines', () => {
    const snapshots = {
      foo: '\nbar\n',
      age: 42
    }
    const result = removeExtraNewLines(snapshots)
    snapshot(result)
  })
})
