# 华为快游戏调试插件

对于安卓平台都可以进行调试，目前是有华为快游戏平台调用该插件
https://docs.cocos.com/creator/3.3/manual/zh/editor/publish/publish-huawei-quick-game.html

## 安装

需要安装 @electron/remote、adbkit、request、request-progress 依赖（等 extensions 仓库插件迁移完成后看如何使用编译工作流）

## 更新

插件代码更新后都需要在外层重新编译（不清楚内置插件如何更新）

## 调用

需要使用调试插件的平台自行调用，需要传平台名称和 rpk 路径

/source/plugin/xxx 和 /static/plugin/xxx 目录下放的是不同平台各自的处理和样式，需要在调用插件时候传参通知使用的是那个平台

```bash
Editor.Panel.open('runtime-dev-tools', {
    platform: 'huawei-runtime',
    rpkPath,
});
```

## 用法

需要安装配置原生环境（https://docs.cocos.com/creator/3.3/manual/zh/editor/publish/setup-native-development.html）
要使用调试功能，需要在华为手机上安装 `华为快应用加载器`，连接到手机上

华为快游戏平台构建并生成成功后，会在发布路径 build/huawei-quick-game/dist 下生成 rpk 包
插件入口在构建任务列表中点击华为快游戏项的 `调试` 按钮，就会弹出 `快游戏调试工具` 面板
面板左侧展示已连接手机，右侧可以修改 rpk 路径和参数配置，底部显示调试输出和信息提示

## 接入手机后的调试功能未测
