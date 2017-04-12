# snap-shot-core

> Save / load named snapshots, useful for tests

[![NPM][npm-icon] ][npm-url]

[![Build status][ci-image] ][ci-url]
[![semantic-release][semantic-image] ][semantic-url]
[![js-standard-style][standard-image]][standard-url]

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
  file: __filename,
  specName: 'my test', // or whatever name you want to give,
  store, // optional function to preprocess the value before storing
  compare: compareFn,
  ext: '.test' // default value is '.snapshot'
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
const compare = ({expected, value}) => ({
  valid: typeof value === expected,
  message: 'check the type'
})
snapShot({
  what,
  store,
  compare
})
```

## Compare function

The comparator function needs to compare two values and return an object.
Here is an example

```js
const compareFn = ({expected, value}) => {
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
```

## Returned value

The `snapShotCore` function returns the *expected* value.
If this is the first time, it will be `store(what)` value. Otherwise it will be the loaded `expected` value.

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

## Debugging

Run the code with `DEBUG=snap-shot-core` option to see more log messages.

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
