# babel-plugin-parser-opts

Pass arbitrary Babylon parser options to Babel.

[Babel] internally uses [Babylon] to parse JavaScript. However, it does
not expose all of Babylon's [options] to be changed by users. This plugin
makes it possible to change all of these options.

[Babel]: https://github.com/babel/babel
[Babylon]: https://github.com/babel/babylon
[options]: https://github.com/babel/babylon#options

## Installation

```sh
$ npm install babel-plugin-parser-opts
```

## Usage

### Via `.babelrc`

**.babelrc**

```json
{
  "plugins": [
    [ "parser-opts", { "allowReturnOutsideFunction": true } ]
  ]
}
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: [
    [ 'parser-opts', { allowReturnOutsideFunction: true } ]
  ]
});
```

### Parser plugins

All provided options will overwrite existing options, with one exception:
`plugins`. If provided, `plugins` array will be merged with existing.
