# snap-shot-core

> Save / load named snapshots, useful for tests

[![NPM][npm-icon] ][npm-url]

[![Build status][ci-image] ][ci-url]
[![semantic-release][semantic-image] ][semantic-url]
[![js-standard-style][standard-image]][standard-url]
[![renovate-app badge][renovate-badge]][renovate-app]

<!-- [![next-update-travis badge][nut-badge]][nut-readme] -->

This is the snapshot loading and saving utility, used by
[snap-shot][snap-shot] and [schema-shot][schema-shot] projects.
Can be used to save snapshots from any testing project.

```sh
npm install --save-dev snap-shot-core
```

```js
const snapShot = require('snap-shot-core')
const what // my object
const out = snapShot({
  what,
  file: __filename,    // aliases: file, __filename
  specName: 'my test', // or whatever name you want to give,
  store, // optional function to preprocess the value before storing
  compare: compareFn, // optional function that compares values
  raiser: raiseErrorFn, // optional
  ext: '.test' // default value is '.snapshot.js'
})
```

## Store function

Sometimes you want to store not the value itself, but something derived,
like the object's schema (check out [schema-shot][schema-shot]). You can
pass a function `store` that transforms the object before saving.
For example if we are only interested in the type of value, we can do the
following (paired with the right `compare` function).

```js
const store = x => typeof x
// expected - previously saved "type of" value
// value - current original value
const compare = ({expected, value}) => // return Result
snapShot({
  what,
  store,
  compare
})
```

Note: by default multi line text is saves using ES6 template string, while
everything else is saved using normal serialization using
[jsesc](https://github.com/mathiasbynens/jsesc).

## Compare function

A function to compare expected and actual value should return `Result`
instance, preferably [Folktable.Result][result]. A simple one could be

```js
const Result = require('folktale/result')
function compare ({expected, value}) {
  const e = JSON.stringify(expected)
  const v = JSON.stringify(value)
  if (e === v) {
    return Result.Ok()
  }
  return Result.Error(`${e} !== ${v}`)
}
```

Another one, that compares values by type could be even simpler

```js
const sameTypes = (a, b) =>
  typeof expected === typeof value

const compareTypes = ({expected, value}) =>
  sameTypes(expected, value)
    ? Result.Ok()
    : Result.Error('types are different')
```

Note input is an object `{expected, value}` and if there is a difference
you should describe it as a string `Result.Error(<difference string>)`.
Why does it return a `Result`? Because it makes [life easier][result post].

[result]: http://folktale.origamitower.com/api/v2.0.0/en/folktale.result.html
[result post]: https://glebbahmutov.com/blog/use-a-little-bit-of-fp/#result-either-for-utility-functions

## Raise function

Default function will compare current and loaded values using `compare`
function and if the values are different will throw an error. You can provide
your own function to fail a test differently. Your function will be called
with these parameters

```js
raiser({
  value,    // current value
  expected, // loaded value
  specName, // the name of the test
  compare   // compare function
})
```

Default `raiser` function just throws an Error with good message.

## Returned value

The `snapShotCore` function returns the *expected* value.
If this is the first time, it will be `store(what)` value.
Otherwise it will be the loaded `expected` value.

[snap-shot]: https://github.com/bahmutov/snap-shot
[schema-shot]: https://github.com/bahmutov/schema-shot

## Options

You can pass several options to control the behavior. I usually grab them
from the environment variables.

* `show` - log snapshot value when saving new one
* `dryRun` - only show the new snapshot value, but do not save it
* `update` - override snapshot value with the new one if there is difference
* `ci` - the tests are running on CI, which should disallow *saving snapshots*

```js
const opts = {
  show: Boolean(process.env.SHOW),
  dryRun: Boolean(process.env.DRY),
  update: Boolean(process.env.UPDATE),
  ci: Boolean(process.env.CI)
}
snapShot({
  what,
  file: __filename,
  specName: 'my test',
  compare: compareFn,
  ext: '.test',
  opts
})
```

If `opts.ci` is not set, it will use [is-ci](https://github.com/watson/is-ci)
to determine if running on CI or not.

## Pruning snapshots

When test names change or tests are updated, new snapshots are saved, but old ones remain
in the snapshot file. To prune the old snapshots, the test runner can pass all current spec
names to prune all other ones. Just call `.prune()` method and pass the following options

```
* tests: list of current tests. Each object should have
  file: the full test filename
  specName: the full title of the test
* ext: optional snapshot filename extension
```

For example see [src/prune-spec.js](src/prune-spec.js)

**note** this can still leave old snapshot files, if the spec has no tests running or
has been renamed.

**note 2** if you run tests with `.only` it will remove all other snapshots in that file.
This is normal, you will recreated all snapshots once you run all the tests again.

## Exact snapshot name

Sometimes you do not want to auto increment the snapshots, or use default test name.
In this case you can pass `exactSpecName` to just save the snapshot with that key.

```js
snapShotCore({
  what: 42,
  exactSpecName: 'computed value',
  file: __filename
})
```
The snapshot file will have
```js
exports['computed value'] = 42
```

## Text snapshots

When saving strings, the snapshot will be surrounded by newlines to avoid
extra lone first line (looking like `exports["name"] = ...`). So when saving snapshot text

```text
line 1
line 2
```
the snapshot file will have
```js
exports["name"] = `
line 1
line 2
`
```

The newlines will be trimmed automatically when loading the snapshot value.

## Debugging

Run the code with `DEBUG=snap-shot-core` option to see more log messages.

## Testing in watch mode

In case you execute your tests in watch mode and you notice the snapshots are always new-created for the same set of tests, then you need to restore the counters per file.

tape example:

```js
//foo.test.js
const test = require('tape');
const snapShot = require('snap-shot-core')

test.onFinish(snapShot.restore)

test('one test', function (t) {
    t.plan(1)
    snapShot({
        what: 1,
        file: __filename,
        specName: 'one test'
    })
})
```

You can restore / reset a counter for a particular test

```js
const snapShot = require('snap-shot-core')
snapShot.restore({
  file: __filename,
  specName: 'this test'
})
```

### Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2017

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](https://glebbahmutov.com)
* [blog](https://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/snap-shot-core/issues) on Github

## MIT License

Copyright (c) 2017 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[npm-icon]: https://nodei.co/npm/snap-shot-core.svg?downloads=true
[npm-url]: https://npmjs.org/package/snap-shot-core
[ci-image]: https://travis-ci.org/bahmutov/snap-shot-core.svg?branch=master
[ci-url]: https://travis-ci.org/bahmutov/snap-shot-core
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
[nut-badge]: https://img.shields.io/badge/next--update--travis-weekly-green.svg
[nut-readme]: https://github.com/bahmutov/next-update-travis#readme
[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/
