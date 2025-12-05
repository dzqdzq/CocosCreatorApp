# 依赖任务管理器

管理多个任务之间的依赖关系以及运行顺序。

经常会碰到某些任务依赖于另一些任务的情况，任务依赖在异步执行的时候尤为难控制。

所以写了个小工具，控制异步任务流程。

## 结构

每个任务包含了**名字**、**依赖的任务数组**、**实际的处理函数**三个部分。

管理器在某个任务完成的时候，会自动去检查依赖于当前任务的其他任务是否满足执行条件，如果满足，则会自动执行。

需要注意的是，这里的执行、仅仅是执行实际函数而已，如果任务完成，需要调用 finish 告诉管理器。这么做的原因是允许更加灵活的结合异步机制使用。

## 使用方式

```javascript
const vDependence = require('v-dependence');

const depend = vDependence.create();

// 添加一个 a 任务，不带任何的处理函数
depend.add('a');

// 添加一个 b 任务，依赖 a 任务
depend.add('b', {
    depends: ['a'],
    handle() {
        // todo something
        depend.finish('b');
    },
    reset() {
        // todo something
    },
});

// 将 a 任务标记完成
// a 任务标记完成的时候，会检查依赖 a 的其他任务，这时候会执行 b 任务
depend.finish('a');

// 将 a 任务的完成标记还原
// 这时候会将依赖 a 任务的 b 任务一并还原
depend.reset('a');

```