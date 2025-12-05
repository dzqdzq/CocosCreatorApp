# Cocos Creator 平台插件

自 3.5.0 起，编辑器内所有支持的平台相关插件的代码实现都会存放在本仓库。后续如有其他团队需要集成新的平台到编辑器内，也一样需要提交到本仓库，平台插件之间可以互相参考。

## 快速开始

1. 安装依赖与编译

    ```bash
        npm install
        npm run init -- --enginePath=${enginePath} // 初始化引擎模块路径
        npm run build // 编译仓库所有插件的 js 和 css 后面跟插件名称可以单独编译某个插件
    ```

2. 开发调试平台插件

    (1) 在扩展管理器中，添加本地的插件代码包，启用插件即可
    (2) 使用命令行开发者模式打开编辑器（需要添加 --dev），再将插件目录软链接到编辑器的插件目录下开发即可。

    - 命令行打开方式
        - Mac

        ```bash
            /Applications/CocosCreator/Creator/3.0.0/CocosCreator.app/Contents/MacOS/CocosCreator --dev --project projectPath
        ```

        - Windows

        ```bash
            ...\CocosCreator.exe --dev --project projectPath
        ```

    - 编辑器插件目录
        - 全局目录： 在开发者工具控制台输入 `Editor.App.home`，找到编辑器的全局配置目录，该文件夹下的 `extensions` 便是全局的插件目录。
        - 项目目录：项目文件夹下的 `extensions` 目录
    - 实际开发可以将当前仓库下 `platforms/{PLATFORM_NAME}` 目录链接到插件目录下的 `extensions/{PLATFORM_NAME}`，每个平台是一个独立的编辑器插件。软链接方式可以网上搜索教程，如果没有其他插件的开发需求，直接将当前仓库的 `platforms` 链接到 `extensions` 目录也可。

### 编译监听

直接在对应平台插件目录下执行

```bash
    tsc --watch
```

或者使用 vscode 开发，`Ctrl + shift + B` 调用对应监听或者 build 命令即可

## 约定规范与文档

目前这些依旧归属于编辑器内部插件，依旧需要遵守一些编辑器内部开发的约定规范，也会参与到编辑器的实际打包加密流程里。关于编辑器内代码开发约定，可以参考 [3d-tasks 仓库下的文档](https://github.com/cocos-creator/3d-tasks/blob/master/editor-docs/index.md)。

重点需要关注：

1. [编辑器插件系统的核心功能介绍](https://github.com/cocos-creator/3d-tasks/blob/master/editor-docs/library/readme.md)

2. [构建插件注册方式](https://github.com/cocos-creator/3d-tasks/blob/master/editor-docs/package/builder/build-plugin/readme.md)

## 语法检查

推荐使用 vscode 进行开发，项目使用 eslint 进行语法检查，文件夹内带有 eslintrc.js 配置文件。

在 VSCode 内下载所需的插件：

1. ESLint 代码语法检查
2. Code Spell Checker 单词拼写检查
3. stylelint 检查 less/css 格式是否正确
4. markdownlint 检查 markdown 格式是否正确
5. i18n-ally 检查 i18n 是否匹配

仓库里默认会带上一份 .vscode/settings.json 配置，已经配置好这些插件的一些使用配置。
