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
