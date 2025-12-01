[![NPM Version](http://img.shields.io/npm/v/jq-trim.svg?style=flat)](https://npmjs.org/package/jq-trim)
[![Build Status](http://img.shields.io/travis/royriojas/jq-trim.svg?style=flat)](https://travis-ci.org/royriojas/jq-trim)

# jq-trim
> A trim method that behaves like jquery.trim

## Install

```bash
npm i --save jq-trim
```

## Usage

```javascript
var trim = require('jq-trim');

describe( 'jq-trim', function () {
  it( 'should trim a string', function () {
    var trim = require( '../' );
    var val = trim( ' a simple string    ' );
    expect( val ).to.equal( 'a simple string' );
  } );
  it( 'should return an empty string if null is passed', function () {
    var trim = require( '../' );
    var val = trim( null );
    expect( val ).to.equal( '' );
  } );
  it( 'should return an empty string if undefined is passed', function () {
    var trim = require( '../' );
    var val = trim( undefined );
    expect( val ).to.equal( '' );
  } );
  it( 'should return the toString() of the passed object if non a string', function () {
    var trim = require( '../' );
    var val = trim( { } );
    expect( val ).to.equal( '[object Object]' );
  } );
} );
```

## License

[MIT](./LICENSE)

## Changelog

[Changelog](./changelog.md)
