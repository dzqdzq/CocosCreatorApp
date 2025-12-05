'use strict';

const path_ = require('path');
let pathPlus = {};

/**
 * @method basenameNoExt
 * @param {string} path
 */
pathPlus.basenameNoExt = function ( path ) {
  return path_.basename(path, path_.extname(path) );
};

/**
 * @method slash
 * @param {string} path
 */
pathPlus.slash = function ( path ) {
  // var isExtendedLengthPath = /^\\\\\?\\/.test(path);
  // var hasNonAscii = /[^\x00-\x80]+/.test(path);
  // if (isExtendedLengthPath || hasNonAscii) {
  //     return path;
  // }
  return path.replace(/\\/g, '/');
};

/**
 * @method stripSep
 * @param {string} path
 */
pathPlus.stripSep = function ( path ) {
  path = path_.normalize(path);
  for ( var i = path.length-1; i >= 0; --i ) {
    if ( path[i] !== path_.sep ) {
      break;
    }
  }
  return path.substring(0,i+1);
};

/**
 * @method stripExt
 * @param {string} path
 */
pathPlus.stripExt = function ( path ) {
  var extname = path_.extname(path);
  return path.substring(0, path.length-extname.length);
};

/**
 * @method contains
 * @param {string} pathA
 * @param {string} pathB
 *
 * Examples:
 *
 *   pathA = foo/bar,         pathB = foo/bar/foobar, return true
 *   pathA = foo/bar,         pathB = foo/bar,        return true
 *   pathA = foo/bar/foobar,  pathB = foo/bar,        return false
 *   pathA = foo/bar/foobar,  pathB = foobar/bar/foo, return false
 */
pathPlus.contains = function ( pathA, pathB ) {
  pathA = pathPlus.stripSep(pathA);
  pathB = pathPlus.stripSep(pathB);

  if ( process.platform === 'win32' ) {
    pathA = pathA.toLowerCase();
    pathB = pathB.toLowerCase();
  }

  //
  if ( pathA === pathB ) {
    return true;
  }

  // never compare files
  if ( path_.dirname(pathA) === path_.dirname(pathB) ) {
    return false;
  }

  if ( pathA.length < pathB.length &&
      pathB.indexOf (pathA + path_.sep) === 0 ) {
        return true;
      }

      return false;
};

/**
 * @method toPosix
 * @param {string} path
 */
pathPlus.toPosix = function (path) {
  return path.replace(/\\/g, '/');
};

// ========================================
// exports
// ========================================

let _ = {};
for ( let p in path_ ) {
  _[p] = path_[p];
}
for ( let p in pathPlus ) {
  _[p] = pathPlus[p];
}

module.exports = _;
