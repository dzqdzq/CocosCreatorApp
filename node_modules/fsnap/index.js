'use strict';

const globby = require ('globby');
const fs = require ('fs');
const path_ = require ('path');
const pathPlus = require ('path-plus');

let fsnap = {};

/**
 * @method create
 * @param {string|Array} patterns
 * @param {object} opts
 */
fsnap.create = function (patterns, opts = {}) {
  let paths = globby.sync(patterns, opts);
  let snapshot = {};

  paths.forEach(p => {
    p = path_.normalize(p);

    // NOTE: it is possible we delete file between Globby and statSync
    // for this files, we will skip watch their changes
    let stat;
    try {
      stat = fs.statSync(p);
    } catch (err) {
      return;
    }

    snapshot[p] = stat;
  });

  return snapshot;
};

/**
 * @method diff
 * @param {object} s1 - first snapshot
 * @param {object} s2 - second snapshot
 * @param {object} opts
 * @param {object} opts.simplify - simplify the results by ignore the changed files under the directory
 */
fsnap.diff = function (s1, s2) {
  let result = {
    deletes: [],
    creates: [],
    changes: []
  };

  // compare s1 to s2
  for (let path in s1) {
    let stat1 = s1[path];
    let stat2 = s2[path];

    if (stat2 === undefined) {
      // delete
      result.deletes.push(path);
    } else if (stat1.isDirectory() !== stat2.isDirectory()) {
      // file <-> directory switched
      result.deletes.push(path);
      result.creates.push(path);
    } else if (stat1.isFile() && stat1.mtime.getTime() !== stat2.mtime.getTime()) {
      result.changes.push(path);
    }
  }

  // compare s2 to s1
  for ( let path in s2 ) {
    let stat1 = s1[path];

    if (stat1 === undefined) {
      result.creates.push(path);
    }
  }

  return result;
};

/**
 * @method simplify
 * @param {object} result - first snapshot
 */
fsnap.simplify = function (result) {
  // deletes
  result.deletes.sort((a, b) => {
    return a.localeCompare(b);
  });
  for (let i = 0; i < result.deletes.length-1; ++i) {
    let dir = result.deletes[i];

    for (let c = i+1; c < result.deletes.length; ++c) {
      let path = result.deletes[c];
      if (pathPlus.contains(dir, path)) {
        result.deletes.splice(c,1);
        --c;
      }
    }
  }

  // changes
  result.changes.sort((a, b) => {
    return a.localeCompare(b);
  });
  for (let i = 0; i < result.changes.length-1; ++i) {
    let dir = result.changes[i];

    for (let c = i+1; c < result.changes.length; ++c) {
      let path = result.changes[c];
      if (pathPlus.contains(dir, path)) {
        result.changes.splice(c,1);
        --c;
      }
    }
  }

  // creates
  result.creates.sort((a, b) => {
    return a.localeCompare(b);
  });
  for (let i = 0; i < result.creates.length-1; ++i) {
    let dir = result.creates[i];

    for (let c = i+1; c < result.creates.length; ++c) {
      let path = result.creates[c];
      if (pathPlus.contains(dir, path)) {
        result.creates.splice(c,1);
        --c;
      }
    }
  }

  return result;
};

// ========================================
// exports
// ========================================

module.exports = fsnap;
