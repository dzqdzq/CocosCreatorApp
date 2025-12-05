# 测试插件

Tester 会读取所有的插件目录内的 test 文件夹。

## 语法

语法参考 mocha，简化了实现，在 html 上实现了一套简单的描述管理

所有的异步控制都是用 promise 的 async 和 await

```javascript
const { expect } = require('chai');

describe('tester 单元测试', () => {

    describe('测试功能 1', () => {

        before(async () => {
            console.log('测试前的处理');
        });

        after(async () => {
            console.log('测试后的处理');
        });

        it('测试项目 1', () => {
            expect(await Editor.Profile.getConfig('scene', 'current-scene')).to.equal('');
        });

        it('测试项目 2', () => {
            expect(await Editor.Profile.getConfig('scene', 'current-scene')).to.equal('');            
        });
    });
});
```

### describe(message, function)

描述当前的测试项目，并定义该测试的处理函数，描述可以互相嵌套

### before

在一个描述内，我们可以使用 before 方法，在当前描述内所有测试开始前，执行一段代码

### after

同 before，只是这个在测试之后执行一段代码，一般用来还原因为测试造成的修改

### it

实际的测试方法，也会带有一段测试的描述，内部一般是各种断言

## Tester

测试需要使用的部分方法封装

### Tester.Ipc

Ipc 模块

#### Tester.Ipc.record()

开始记录 ipc 广播消息，并且忽略之前记录的所有消息

### Tester.Ipc.count('tester:ready')

获取自上次记录以来，某个广播消息收到的次数

### Tester.Ipc.get('tester:ready', 0)

取出收到的第一条 tester:ready 消息

```javascript
{
    time: Date.now(), // 广播接收到的时间
    params: [uuid], // 广播发出的参数
}
```