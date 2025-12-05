'use strict';

// options.name
// options.depends
// options.handle

class Item {

    constructor(name, options) {
        options = options || {};

        // 该任务的名字
        this.name = name;
        // 该任务依赖的任务队列
        this.depends = options.depends || [];
        // 任务实际处理的函数
        this.handle = options.handle || function() {};
        // 任务重置过程中的还原操作函数
        this.reset = options.reset || function() {};

        // 该任务是否已经执行过
        this.executed = false;
        // 该任务是否正在执行
        this.running = false;
    }
}

module.exports = Item;