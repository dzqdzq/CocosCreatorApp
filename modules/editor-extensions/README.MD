# Editor Extensions

开发中引擎与编辑器是组合各个业务模块的中枢，但各个业务模块修改频率远大于中枢管理器。所以我们将业务相关代码放到了这个仓库，并命名为 Editor Extensions，意为编辑器相关的扩展

**注意：在这个仓库内新增模块是无效的，需要通知编辑器内新增**，工作流暂时没有完全分开，后续将逐步解决

## 前置准备
在初始化之前，我们需要先在本地建立`cocos-engine`仓库
```bash
git clone https://github.com/cocos/cocos-engine.git
```
并为`cocos-engine`安装必要的库
```bash
npm install
```
然后再进行`Editor Extensions`仓库的初始化

## 初始化

首先我们需要为`Editor Extensions`安装必要的库

```bash
npm install --no-save --ignore-scripts
```

新建一个功能模块并创建 .editor.js 文件，然后构建模块
然后需要初始化仓库的一些基本配置

```bash
npm run init
```

init 会生成一份 config.json 配置，**我们需要手动填写内部的** `enginePath`

`enginePath`即为`cocos-engine`项目所在路径（*例如我的cocos-engine项目在F盘的project目录中*）
```json
{
    "enginePath": "F:\\project\\cocos-engine"
}
```

当我们配置完成后，就可以开始构建代码

最后需要构建代码

```bash
npm run build
```

```bash
npm run test 模块名称1 模块名称2 
```

执行所有插件的测试文件
```bash
npm run test

```

## 开发

构建完代码后，我们下载 3.4.0 及以上版本的编辑器，通过扩展管理器里的开发者选项卡，可以直接选择这个仓库内 extensions 下的任一插件，并启动它。启动后会自动关闭内置的同名插件，以达到替换的目的

# 测试

```bash
npm test
```

## 带配置初始化

```
npm run init -- --enginePath=/Users/xm10086/Project/Creator/editor-3d/resources/3d/engine
```
