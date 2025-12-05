"use strict";module.exports={title:"项目设置",description:"项目设置面板",saving:"正在保存",save:"保存",cancel:"取消",add:"添加",edit:"编辑",remove:"删除",rename:"重命名",delete:"删除",readonly:"只读",noSlider:"无法获取功能列表，请稍后重试",noContent:"无法加载内容，请稍后重试",toolbar:{projectPath:"项目",wizardPath:"编辑器",openProjectPath:"打开项目"},menu:{copyConfigKey:"复制配置 key",importConfig:"导入配置",exportConfig:"导出配置",copyTabKey:"复制选项卡 key"},general:{title:"项目数据",width:"设计宽度",height:"设计高度",fit_width:"适配屏幕宽度",fit_height:"适配屏幕高度",render_pipeline:"渲染管线",quality:"3D 高质量模式",downloadMaxConcurrency:"资源下载并发数",default_scene:"默认编辑场景",default_scene_tooltip:"第一次打开项目时显示的场景"},physics:{title:"物理",gravity:{x:"重力矢量 X",y:"重力矢量 Y",z:"重力矢量 Z"},allowSleep:"是否允许休眠",sleepThreshold:"进入休眠的默认速度临界值",autoSimulation:"是否开启自动模拟",fixedTimeStep:"每步模拟消耗的固定时间",maxSubSteps:"每步模拟的最大子步数",defaultMaterial:"默认材质",useNodeChains:"是否使用节点链组合刚体",collisionMatrix:"碰撞矩阵",add:{name:"输入名称，不能与现有的重复",error:"新增项的索引和名称均不能为空且不能与现有项重复"},edit:{error:"名称不能为空且不能与现有项重复"},delete:{warn:"确定删除该条配置吗？ \n Index = ${index} \n Name = ${name}"}},layers:{tips1:"Layers 能让相机渲染部分场景，让灯光照亮部分场景。",tips2:"可自定义 0 到 19 个 Layers， 而后 12 个 Layers 是引擎内置的。",warnInvalidName1:'Layer 名称 "{name}" 已经存在，不能与之同名。',warnInvalidName2:"数字 {name} 是 Layers 中的键名，不能与之同名。"},sortingLayers:{title:"Sorting Layers",tip:"通过拖动进行排序"},scripts:{title:"脚本",useDefineForClassFields:"符合规范的类字段",allowDeclareFields:"允许声明类字段",config_changed_info:"脚本设置更改，请重启编辑器",useDefineForClassFieldsTips:"当开启时，将使用 Define 语义实现类字段， 否则，将使用 Set 语义实现类字段。",allowDeclareFieldsTips:"当开启时，在 TypeScript 脚本中将允许使用 declare 关键字来声明类字段，并且，当字段未以 declare 声明时并未指定显式的初始化式时，将依照规范初始化为 undefined",loose:"启用宽松模式",loose_description:"启用宽松模式（loose mode）进行脚本编译。",exportsConditions:"导出条件",exportsConditionsTips:"为条件化导出指定解析条件，可参考编辑器模块解析算法。",guessCommonJsExports:"（实验性质）猜测 CommonJS 命名导出 ",guessCommonJsExports_description:"若开启，编辑器将会试着决定每个 CommonJS 模块的 CommonJS 命名导出，并将它们转换为 ES 模块命名导出。",preview_browserslist_config_file:"用于预览的浏览器列表",preview_browserslist_config_file_description:"设置在预览时 TypeScript/JavaScript 代码编译的浏览器列表文件。",pluginSortingConfig:"插件脚本排序配置",continueEdit:"继续编辑",confirmCommit:"确认提交",invalidPlugins:"无效的插件脚本路径: {plugin}, 将会在提交后自动移除。",addAllPlugins:"添加所有的插件脚本",editInJSONMode:"以 JSON 形式编辑",editInListMode:"以列表形式编辑",clearMissingPlugin:"清空丢失插件脚本"},model:{title:"模型"},joint:{title:"骨骼贴图布局",size:"贴图尺寸",bone:"骨骼",info:"针对蒙皮模型的实例合批需求，需要手动设置骨骼贴图布局，确保每个实例同时可能播放的所有动画都放在同一张贴图上。\n详细说明参考：",missing_joint:"请先选中一个 'texture' 类型图片",removeTextureTip:"删除该贴图",removeTextureWarn:"确定删除该贴图吗? \n '${name}'",removeSkeletonTip:"删除骨骼",removeSkeletonClipTip:"删除骨骼动画"},warn_info:{register_failed:"插件注册项目配置失败"},contributions:{messages:{description:{open_settings:"打开项目设置面板",queryConfig:"查询项目配置",setConfig:"设置项目配置"},doc:{open_settings:`
- name {string} 要打开的选项卡所属的插件注册名称
- tab {string} 在注册功能时使用的键
- ...args: {any[]} 打开选项卡时附带的其他参数

@returns {null}
                `,queryConfig:`
- name {string} 插件名
- path? {string} 配置路径
- type? {'default' | 'project'} 配置类型

@returns {any} 返回配置数据
                `,setConfig:`
- name {string} 插件名
- path {string} 配置路径
- value {any} 配置数据

@returns {boolean} 设置成功与否
                `},example:{open_settings:"await Editor.Message.request('project', 'open-settings');",queryConfig:"await Editor.Message.request('project', 'query-config', 'engine', 'modules');",setConfig:"await Editor.Message.request('project', 'set-config', 'project', 'general.downloadMaxConcurrency', 10);"}}}};