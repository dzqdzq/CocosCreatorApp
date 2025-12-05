# 证书生成插件

证书生成面板插件单独维护，放置在和构建平台一起的地方，有需要的平台插件自行调用，目前在华为快游戏、OPPO 小游戏和 vivo 小游戏平台中有调用

## 更新

插件代码更新后都需要在外层重新编译（不清楚内置插件如何更新）

## 调用

需要使用证书生成插件的平台，调用 `Editor.Panel.open('certificate')` 打开插件面板

```bash
Editor.Panel.open('certificate');
```

## 用法

调用 `Editor.Panel.open('certificate')` 打开插件面板后，通过 `Editor.Profile.getConfig('certificate', 'settings', 'global')` 获取缓存的表单输入，然后进行校验及错误提示
更改输入内容会同步缓存，并做校验，只有全部校验通过后才可点击 `生成` 按钮。点击 `生成` 按钮后，会将生成的 pem 文件保存到配置的路径下
证书生成用的是新开一个子进程，执行 openssl 命令生成 pem 证书文件
