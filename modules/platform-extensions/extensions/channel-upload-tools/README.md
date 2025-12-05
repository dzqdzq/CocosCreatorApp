# 华为 AGC 上传插件

对于安卓平台都可以进行调试，目前是有华为快游戏平台调用该插件
https://docs.cocos.com/creator/3.3/manual/zh/editor/publish/publish-huawei-agc.html

## 安装

需要安装 @electron/remote、md5 依赖

## 更新

插件代码更新后都需要在外层重新编译

## 调用

页面会从 /source/ui/index.js 开始加载，同时根据打开插件传入的参数，指定从 /source/platform目录中，读取对应的 upload.js 页面
upload 页面用来展示当前平台的上传页面的功能
同时 platform/xxx/upload-list.js 页面用来展示不同平台的结果页面，每个平台会自己被遍历并添加到信息展示页中，（目前）各自平台自己定制展示页面
如果启动 panel 不传入参数，默认会加载结果展示页面（ upload/list.js 页面）（即每个平台的的结果页列表）

```bash
Editor.Panel.open('channel-upload-tools','huawei-agc');
```

## 用法

需要注册华为开发者账号并实名认证（https://developer.huawei.com/consumer/cn/doc/20300）
在构建发布面板中，发布平台选择 'HUAWEI AppGallery Connect' ，'agconnect-services' 配置需要引入华为参数文件 'agconnect-services.json' （https://service.cocos.com/document/zh/sdkhub-plugins/sdkhub-hms.html#%E9%85%8D%E7%BD%AE%E5%8D%8E%E4%B8%BA%E5%8F%82%E6%95%B0%E6%96%87%E4%BB%B6）
构建生成成功后可以直接将 APK 上传到 AppGallery Connect 后台，点击构建任务列表中 `上传` 按钮，打开上传面板
可以通过 `OAuth` 和 `API客户端` 两种登录方式，OAuth 登录方式只需要在点击 `确认上传` 按钮后会加载 /source/oauth/index.js 面板，根据提示登录华为账号 ，然后勾选对应权限，窗口会自动关闭并自动上传 APK；若首次使用 API 客户端方式登录，需要登录 AppGallery Connect 后台获取相关配置信息，然后再点击 `确认上传` 按钮即可

## 未注册华为开发者账号，未测
