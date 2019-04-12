const snapShotCore = require('.')
const stripIndent = require('common-tags').stripIndent
const disparity = require('disparity')
const Result = require('folktale/result')

function compareText (options) {
  const expected = options.expected
  const value = options.value

  const textDiff = disparity.unified(expected, value)
  return textDiff ? Result.Error(textDiff) : Result.Ok()
}

/* eslint-env mocha */
describe('multi line text', () => {
  const text = stripIndent`
    line 1
    line 2
    line 3

    line 5 without line 4
  `

  it('saves long text', () => {
    snapShotCore.core({
      what: text,
      __filename,
      specName: 'multi line text'
    })
  })

  it('another text test', () => {
    snapShotCore.core({
      what: text,
      __filename,
      specName: 'multi line text 2'
    })
  })

  it('uses good diff', () => {
    snapShotCore.core({
      what: text,
      __filename,
      specName: 'disparity diff',
      compare: compareText
    })
  })

  it('does not put text on the first line of the snapshot', () => {
    snapShotCore.core({
      what: text,
      __filename,
      exactSpecName: 'no first line',
      compare: compareText
    })
  })
})

describe('multi line text with backticks', () => {
  const text = stripIndent`
    line 1
    line 2 with \`42\`
    line 3 with \`foo\`

    line 5 without line 4
  `

  it('saves text just fine', () => {
    snapShotCore.core({
      what: text,
      __filename,
      specName: 'text with backticks'
    })
  })
})
