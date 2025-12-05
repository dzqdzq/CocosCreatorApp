'use strict';

// 主进程和渲染进程加载不同对象
if (process.type === 'browser') {
    module.exports = require('./lib/main');
} else if (process.type === 'renderer') {
    module.exports = require('./lib/renderer');
}