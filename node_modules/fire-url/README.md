# Node Module Template

Node's url module with helpful functions.

## Install

```js
    npm install fire-url
```

## Usage

```js
    var url = require('fire-url');
    var result = url.join('http://www.google.com', 'a', '/b/cd', '?foo=123');
    console.log(result);
```

Prints:

```js
    http://www.google.com/a/b/cd?foo=123
```
