"use strict";module.exports={title:"偏好设置",description:"编辑器偏好设置面板，这里存放一些编辑器全局配置以及插件全局配置。",saving:"正在保存",nav:{general:"通用设置",laboratory:"实验室"},general:{language:"编辑器语言",step:"数值默认步长",wheel_enable:"启用滚轮数值调节",wheel_enable_tips:"在数值输入框的输入模式下，可使用鼠标滚轮修改数值",theme:"皮肤主题",themeColor:"配色主题",preview_ip:"选择本机预览 IP 地址",server_port:"预览服务器端口号",serverPortHelpTips:"为了区分不同项目的预览服务器端口号，配置将存储到项目"},laboratory:{about:`
        <p>1. 实验室会不定期提供一些新的技术方案或实验性质的功能，你可以通过开关选项来开启或关闭相应的功能。</p>
        <p>2. 在未来的版本中，这些功能可能被合并，但也有可能出现破坏兼容性的修改，甚至可能会被取消。如果你想在开发环境中使用这些功能，请务必严格测试，并保持关注新版本的更新公告。</p>
        <p>3. 我们欢迎用户开启试用这些功能，并且在论坛提供宝贵的反馈意见，你可以让这些功能更适合自己的使用场景，给自己的项目更强大的助力。</p>`,create_terrain:"开启地形功能",new_add_component:"使用弹窗方式添加组件",bake_feature:"开启烘焙功能"},menu:{move_local:"将配置存储到项目",move_global:"还原成全局配置",position_info:"带有黄色标记的配置存储在项目中。反之则存储在全局所有项目共享。",copyConfigKey:"复制配置 key",importConfig:"导入配置",exportConfig:"导出配置",copyTabKey:"复制选项卡 key"},warn_info:{register_failed:"插件注册偏好配置失败"},contributions:{messages:{description:{open_settings:"打开偏好设置面板",queryConfig:"查询偏好配置",setConfig:"设置偏好配置"},doc:{open_settings:`
- tab {string} 需要打开的选项卡（功能插件的名称）
- ...args: {any[]} 打开选项卡带的其他参数

@returns {null}
                `,queryConfig:`
- name {string} 插件或分类名
- path? {string} 配置路径
- type? {'default' | 'global' | 'local'} 配置类型

@returns {any} 返回配置数据
                `,setConfig:`
- name {string} 插件名
- path {string} 配置路径
- value {any} 配置数据
- type? {'default' | 'global' | 'local'} 配置类型

@returns {boolean} 是否设置成功
                `},example:{open_settings:"await Editor.Message.request('preferences', 'open-settings');",queryConfig:"await Editor.Message.request('preferences', 'query-config', 'preview', 'general', 'global');",setConfig:"await Editor.Message.request('preferences', 'set-config', 'preview', 'general.auto_refresh', false, 'global');"}}}};