# console 插件

用于显示 `editor` 的日志信息，类似简化的 chrome  devtool console 面板。[需求集合](https://github.com/cocos-creator/3d-tasks/issues/1605)

## 目前包含的功能

- 支持如 `log` `warn` `error` 3种类型的日志信息
- 支持展开、收缩显示日志信息的栈队列
- 支持自定义格式的数据跳转 [issue](https://github.com/cocos-creator/3d-tasks/pull/2702/files)
- 支持识别日志信息中 `https` & `local path`，直接跳转
- 面板列表采用虚拟列表，支持数十万级别的数据滚动渲染


## 主要模块
- mannager.ts 负责日志信息的数据处理和将日志保存到本地
- components/list.ts 负责日志渲染和虚拟列表的实现
- footer/left.ts 被注册到编辑器底部左下角，用于显示日志数量信息


## 业务流程

### 1、数据获取
面板启动时从 `Editor` 获取日志数据，并传给 `manager` 初始化数据信息。
```js
const list = await Editor.Logger.query();

manager.reset(list);
```

### 2、数据渲染
`manager` 处理完数据之后，调用列表组件的渲染函数进行虚拟列表的渲染，列表在渲染时会调用一些工具函数将自定义格式的数据渲染为可交互的  UI 组件。比如打开指定资源节点。

### 3、数据保存

`manager` 在收到数据时会同时保存一份副本到本地文件，方便用户排查问题。

### 4、脚标更新

`console` 面板向编辑器的左下角注册了一个计数面板，用于呈现当前日志信息的数量信息。通过 `Message` 进行数据传输

```js
// 广播
Editor.Message.broadcast('console:logsUpdate', logCounter); 


// 接收
Editor.Message.addBroadcastListener('console:logsUpdate', this.updateCounter);
```

