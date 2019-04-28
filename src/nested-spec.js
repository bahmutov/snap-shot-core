const shell = require('shelljs')
const { join } = require('path')
const la = require('lazy-ass')
const fs = require('fs')
const R = require('ramda')
const execa = require('execa')

/* eslint-env mocha */
describe('nested specs', () => {
  // if we are running this test on CI, we cannot save new snapshots
  // so for this particular test we need to clear CI=1 value
  // we remove any of the env variables used by "ci-info" module
  const limitedEnv = R.omit(
    ['CI', 'CONTINUOUS_INTEGRATION', 'BUILD_NUMBER', 'RUN_ID', 'TRAVIS'],
    process.env
  )
  const sourceFolder = join(__dirname, '..', 'test-nested-specs')
  const tempFolder = join(__dirname, '..', 'temp-test-nested-specs')

  /**
   * Checks a given folder against expected snapshots.
   * Pass a root folder without `__snapshots__` part,
   * and an object containing as keys
   * just names of the expected snapshot files. For value,
   * use object of exports in that snapshot
   *
   * @example
    ```
    checkSnapshots(tempFolder, {
      'spec.js.snapshot.js': {
        'a 1': 42
      },
      'spec2.js.snapshot.js': {
        'b 1': 42
      }
    })
    ```
   */
  const checkSnapshots = (rootFolder, snapshots) => {
    const snapshotsFolder = join(rootFolder, '__snapshots__')
    la(
      fs.existsSync(snapshotsFolder),
      'cannot find snapshots folder',
      snapshotsFolder
    )
    // TODO check if the snapshots folder does not have extra files id:15
    // - <https://github.com/bahmutov/snap-shot-core/issues/244>
    // Gleb Bahmutov
    // gleb.bahmutov@gmail.com
    Object.keys(snapshots).forEach(expectedFilename => {
      const filename = join(snapshotsFolder, expectedFilename)
      la(
        fs.existsSync(filename),
        'cannot find expected snapshot',
        expectedFilename,
        'as file',
        filename
      )
      const loaded = require(filename)
      const expected = snapshots[expectedFilename]
      la(
        R.equals(loaded, expected),
        'in snapshot file',
        filename,
        'a different value loaded',
        loaded,
        'from expected',
        expected
      )
    })
  }

  beforeEach(() => {
    shell.rm('-rf', tempFolder)
    shell.mkdir(tempFolder)
    shell.cp(join(sourceFolder, 'package.json'), tempFolder)
    shell.cp('-R', join(sourceFolder, 'specs'), tempFolder)
  })

  it('saves snapshots in single folder', function () {
    this.timeout(5000)

    execa.shellSync('npm test', {
      cwd: tempFolder,
      stdio: 'inherit',
      // only use the limited environment keys
      // without "CI=1" value
      env: limitedEnv,
      extendEnv: false
    })

    checkSnapshots(tempFolder, {
      'spec.js.snapshot.js': {
        'a 1': 42
      },
      'spec2.js.snapshot.js': {
        'b 1': 42
      }
    })

    // run the tests again to check if values are not clashing
    // but with CI=1 to avoid writing new files accidentally
    execa.shellSync('npm test', {
      cwd: tempFolder,
      stdio: 'inherit',
      env: { CI: '1' }
    })
  })
})
