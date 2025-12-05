# 程序管理器

在 3.7.0 对 program 的`配置 key`命名，配置的结构进行了修改。
为了兼容高低版本的，同时保留了之前版本的配置和新版本的配置，之前版本的修改之前版本的配置，新版本的修改新版本的配置，相互分离的。

下面是 370 做的配置命名下划线转驼峰及在后面加上 V2 的列表:

- android_sdk -> androidSDK
- android_ndk -> androidNDK
- browser -> browserV2
- bytedance_app_path -> bytedanceAppPath (目前没有这个配置)
- bytedance_devtools -> bytedanceDevtools
- cmake -> cmakeV2
- ohos_sdk -> ohosSDK
- ohos_ndk -> ohosNDK
- picture_editor -> pictureEditor
- script_editor -> scriptEditor
- wechat_devtools -> wechatDevtools

其他配置就是后续注册的了

数据结构修改如下：

```
"android_sdk": "C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk"
    ↓
"androidSDK": {
    "path": "C:\\Users\\Administrator\\AppData\\Local\\Android\\Sdk"
    "commandArgument": ""
}
```

## program 管理的第三方工具

- [ ] 默认脚本编辑器
- [ ] 默认浏览器
- [ ] 默认图片编辑器

## 其他第三方工具陆续需要迁移到各自插件中

- [x] 微信开发者
- [x] 安卓 NDK
- [x] 安卓 SDK
- [x] HarmonyOS NDK
- [x] HarmonyOS SDK
- [x] CMake
- [x] 抖音开发者工具
- [x] Java Home

- 迁移时需要注意兼容原来的所有版本，包括之前的 下划线\V2后缀 的配置
    - 迁移时如果存在新版本的配置，则迁移新版本的配置到插件
    - 不存在新版本的配置，存在之前版本的配置，则迁移之前版本的配置过去(由于 3.7.0 迁移时候一定会生成新结构的配置，所以不存在新版本配置时候表示是从 3.7.0 之前版本升级上来的，不曾打开过 3.7.0 以上版本)
    - 迁移后，program 新版本的配置是需要删除的，但之前命名版本的配置不能删除
    - 迁移时需要同时考虑 local、global 的配置
- 迁移后注意其他插件使用的 i18n

## program 机制再补充

- [x] default 配置会展示为输入框的 placeholder
- [x] 支持左侧 icon 赋值配置的 key，进行快速接口查询
- [x] 支持插件自定义注册
- [ ] 自定义注册到 program 的暂不支持 openProgram 打开程序和导入导出配置

