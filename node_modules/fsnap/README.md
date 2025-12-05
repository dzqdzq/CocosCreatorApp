# fsnap

[![Linux Build Status](https://travis-ci.org/electron-utils/fsnap.svg?branch=master)](https://travis-ci.org/electron-utils/fsnap)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/0ebl8wdrt9wwmhcp?svg=true)](https://ci.appveyor.com/project/jwu/fsnap)
[![Dependency Status](https://david-dm.org/electron-utils/fsnap.svg)](https://david-dm.org/electron-utils/fsnap)
[![devDependency Status](https://david-dm.org/electron-utils/fsnap/dev-status.svg)](https://david-dm.org/electron-utils/fsnap#info=devDependencies)

Diff filesystem snapshot results. Useful for file watch system.

## Install

```bash
npm install --save fsnap
```

## Usage

```javascript
const fsnap = require('fsnap');

let s1 = fsnap.create(path);
let s2 = fsnap.create(path);
let result = fsnap.diff(s1, s2);

// do something...
console.log(result.deletes);
console.log(result.changes);
console.log(result.creates);
```

## API Reference

## Methods

### fsnap.create(patterns, [options])

  - `patterns` string|Array - See supported `minimatch` [patterns](https://github.com/isaacs/minimatch#usage).
  - `options` object - See the `node-glob` [options](https://github.com/isaacs/node-glob#options).

create snapshot from the given patterns.

### fsnap.diff(s1, s2)

  - `s1` object - snapshot 1
  - `s2` object - snapshot 2

Returns `object`

  - `deletes` array - path list of deleted files and directories.
  - `creates` array - path list of created files and directories.
  - `chagnes` array - path list of changed files and directories.

### fsnap.simplify(result)

  - `result` object - the result of `fsnap.diff`

Simplify the diff result by remove files contains in the directory in the same result.

## License

MIT © 2017 Johnny Wu
