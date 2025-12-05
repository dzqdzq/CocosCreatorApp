"use strict";module.exports={title:"资源数据库",description:"Cocos Creator 资源管理器",deprecatedTip:"{oldName} 已在 {version} 版本废弃，请更换为 {newName}",globalReadonlyTip:"全局变量 {name} 字段已被资源进程使用，不可重写，请更换其他字段",mask:{startup:"正在启动资源数据库 - {name}",loading:"正在启动中"},"debug-mode":"打开资源(构建)调试工具",assetDBPauseTips:"资源数据库已锁定，资源操作({operate})将会延迟响应，请稍侯",assetDBInitError:"资源进程启动失败！",operate:{dialogError:"错误",dialogWarning:"警告",dialogQuestion:"确认",dialogInfo:"提示",dialogDoNotNotify:"本次操作不再提醒",overwrite:"覆盖",rename:"重命名",edit:"编辑",editTip:"启动中...",apply:"应用",cancel:"取消"},operation:{invalid_url:"无效的 URL: 传入 URL 必须是字符串, 且以 db:// 开头",exists_url:"无效的 URL: URL 指向资源不存在",readonly:"目标路径不合法: 目标为只读文件夹",overwrite:"文件已存在，是否覆盖？"},importAsset:{metaExists:"{name} 资源 meta 文件已存在，跳过 meta 导入，如果需要请在偏好设置内开启"},openAsset:{preferenceProgramWarning:"为更好地打开脚本，请在 {preferences} -> {program} -> {scriptEditor} 里配置打开脚本的应用程序"},createAsset:{title:"创建资源",fail:{unknown:"创建资源 ({target}) 失败: 未知错误",type:"创建资源失败: 传入的资源类型 ({type}) 无法识别",url:"创建资源失败: 传入的地址 ({url}) 无法识别",exist:"创建资源失败: 文件已经存在",drop:"创建资源失败: 导入的资源地址 ({target}) 不存在",toUrl:"创建资源失败: 文件路径 ({target}) 可能超出项目范围，无法转为项目内的 URL",uuid:"创建资源失败: 无法转换为项目 URL 的参数 ({target})",content:"创建资源 ({target}) 失败: 文件内容格式不正确",readonly:"创建资源 ({target}) 失败: 不能在只读资源上操作"},warn:{overwrite:"文件已存在，是否覆盖？"}},createAssetTemplate:{title:"创建资源模板",manageTemplate:"管理模板文件"},dropAsset:{overwrite:"覆盖文件",reserve:"保留两个文件",fail:{unknown:"导入资源失败: 未知错误",url:"导入资源失败: 目标地址格式错误，须为 db://folder 格式",filepaths:"导入资源失败: 被导入的资源不能为空",readonly:"导入资源失败: 不能在只读资源上导入"},warn:{overwrite:"文件已存在，是否覆盖？",sameway:"接下来的导入保持相同操作"}},saveAsset:{fail:{unknown:"保存资源失败: 未知错误",uuid:"保存资源失败: 无法识别 UUID ",content:"保存资源失败: 文件内容格式不正确 ",readonly:"保存资源失败: 不能在只读资源上操作"}},saveAssetMeta:{fail:{unknown:"保存资源 META 失败: 未知错误",uuid:"保存资源 META 失败: 无法识别 UUID ",content:"保存资源 META 失败: 文件内容格式不正确 ",readonly:"保存资源 META 失败: 不能在只读资源上操作"}},copyAsset:{fail:{unknown:"复制资源失败: 未知错误",url:"复制资源失败: 参数不合法 ",source:"复制资源失败: 源地址不存在文件",target:"复制资源失败: 目标文件已经存在",include:"复制资源失败: 源地址不能被目标地址包含",parent:"复制资源失败: 目标地址的父级地址不正确",readonly:"复制资源失败: 目标地址的父级地址是只读文件，不可粘贴进子文件",metauuid:"复制资源失败: 写入新的 uuid 发生错误"}},moveAsset:{fail:{unknown:"移动资源失败: 未知错误",url:"移动资源失败: 参数不合法 ",source:"移动资源失败: 源地址不存在文件",target:"移动资源失败: 目标地址不合法",exist:"移动资源失败: 目标地址已经存在相同的文件",include:"移动资源失败: 源地址不能被目标地址包含",parent:"移动资源失败: 目标地址的父级地址不正确",readonly_source:"移动资源失败: 源地址是只读文件，不可移动",readonly:"移动资源失败: 目标地址的父级地址是只读文件，不可移入子文件"},warn:{overwrite:"文件已存在，是否覆盖？"}},renameAsset:{fail:{source:"复制资源失败: 源地址不存在文件",include:"复制资源失败: 源地址不能被目标地址包含",parent:"复制资源失败: 目标地址的父级地址不正确"},warn:{overwrite:"文件已存在，是否覆盖？"}},deleteAsset:{fail:{unknown:"删除资源失败: 未知错误",url:"删除资源失败: 参数不合法 ",unexist:"删除资源失败: 文件不存在 ",readonly:"删除资源失败: 只读文件不可删除"}},preferences:{log_level:"日志等级",log_level_debug:"输出所有信息",log_level_log:"输出错误、警告以及日志",log_level_warn:"仅输出错误、警告",log_level_error:"仅输出错误",ignore_glob:"忽略文件（采用 Glob 匹配模式）",ignore_changed:"忽略配置修改",notice_reload_editor:"需要重启编辑器使用新的配置",auto_scan:"自动刷新资源",auto_scan_info:"关闭自动刷新后，编辑器将不检查外部资源更新，如果需要更新资源状态，请点击资源面板上的刷新按钮。",autoOverwriteMeta:"导入资源时自动覆盖 meta",autoOverwriteMetaTooltip:"当导入的资源存在 meta 且与本地资源冲突的时候，自动覆盖",flagReimportCheck:"优化调度策略",flagReimportCheckTooltip:"使用策略优化导入过程，减少开销",defaultImageMeta:"图片默认导入类型",defaultMeta:"默认资源导入类型配置",defaultMetaTip:"此配置允许用户自定义不同格式文件在导入时所对应的引擎资源类型。更改默认文件资源类型配置之后，项目内新添加的资源将按照新的配置文件类型导入，已经存在项目中的资源仍将维持原有类型。"},importers:{glTF:{glTF_asset_group_mesh:"网格",glTF_asset_group_animation:"动画",glTF_asset_group_node:"结点",glTF_asset_group_skin:"蒙皮",glTF_asset_group_sampler:"纹理采样器",glTF_asset:"{group}[{index}]（{name}）",glTF_asset_no_name:"{group}[{index}]",unsupported_alpha_mode:"暂未支持 {material} 中的 Alpha 模式 {mode}",unsupported_texture_parameter:"{texture} 使用的 {sampler} 的 {type} 参数值 {value} 未受支持支持",texture_parameter_min_filter:"缩放过滤器",texture_parameter_mag_filter:"放大过滤器",unsupported_channel_path:"暂未支持 {animation} 中的 通道[{channel}] 的类型 {path}，该通道将被忽略",reference_skin_in_different_scene:"{node} 与其引用的 {skin} 并不在同一场景中",disallow_cubic_spline_channel_split:"{animation} 的 通道[{channel}] 使用了球形曲线插值，动画切割无法应用于此曲线上",failed_to_calculate_tangents_due_to_lack_of_normals:"无法计算 {mesh} 中 子网格[{primitive}] 的切线信息，因为该子网格中缺少法线信息",failed_to_calculate_tangents_due_to_lack_of_uvs:"无法计算 {mesh} 中 子网格[{primitive}] 的切线信息，因为该子网格中缺少纹理坐标 UV 信息",empty_morph:"网格 {mesh} 的第 {primitive} 个基元中存在形变数据，但该数据为空。",unsupported_extension:"未支持的 GLTF 扩展：{name}",failed_to_load_image:"无法加载图片 {url} ：{reason}",image_uri_should_be_file_url:"图片的 URL 必须是文件 URL",failed_to_convert_tga:"转换 TGA 图片失败。"},fbx:{failed_to_convert_fbx_file:"无法转换 FBX 文件 {path}",no_available_fbx_temp_dir:"内部错误：无法为 'fbx-temp-dir' 选项找到一个仅含 Ascii 字符的路径。 你可以尝试使项目路径中仅含英文字符来解决该问题。",fbx2glTF_exists_with_non_zero_code:`
FBX2glTF 进程以非 0 状态值 {code} 退出， 
意味着该进程可能未成功终止。 
这通常是因为 FBX2glTF 在转换源 FBX 文件时发生了内部错误。 
若允许，请向 Cocos 团队或 FBX2glTF 作者报告此错误并附上相关的 FBX 文件。
进程输出: {output} 
`,fbxGlTfConv:{missing_dll:"缺少依赖库。可能你的系统缺少必要的运行时，请尝试安装 VC 运行时：https://aka.ms/vs/16/release/vc_redist.x64.exe。",unsupported_inherit_type:"以下结点指定了不支持的继承类型 [{type}]: [{nodes}]。",multi_material_layers:"网格 [{mesh}] 具有多个材质层级。",skin_merge_error:"骨骼 [{node}] 在不同的网格上具有不同的逆绑定矩阵。",detached_joint_error:"忽略骨骼 [{node}]，因为它不在场景图中。",inconsistent_target_count:"子网格 [{mesh}] 具有不同数量的形变形状。",shall_not_be_texture:"材质 [{material}] 的 [{property}] 属性不允许是贴图。",invalid_node_animation_range:"结点 {node} 在动画 {take} 上的动画时长（{received} 秒）超出了预设的限制（{limit} 秒）。这可能是不正常的现象，通常由于 FBX 文件中存在负帧或间隔较大的帧；为此，将不会导入该动画。"}},javascript:{transform_failure:"脚本 {path} 转换失败：${reason}"},image:{title:"是否转换图片格式？",change_type_detail:"是否将 {name} 依赖的 {path} 图片资源转成符合 {name} 使用的 'SpriteFrame' 类型"},dragonbones_atlas:{texture_not_imported:"{texture} 没有被导入",texture_not_found:"无法为 {atlas} 找到贴图 {texture}"}},contributions:{messages:{description:{asset_db_ready:"资源数据库准备就绪时的广播",asset_db_close:"资源数据库关闭时的广播",asset_db_asset_add:"当资源数据库准备就绪后，再新增资源时的广播",asset_db_asset_change:"当一个资源被修改时的广播",asset_db_asset_delete:"当一个资源被删除时的广播",query_ready:"检查资源数据库是否启动完毕",create_asset:"新建一个资源",import_asset:"将一个文件或文件夹导入到资源数据库内",copy_asset:"复制某个资源",move_asset:"将一个资源移动到某个地方",rename_asset:"重命名指定资源",delete_asset:"删除一个资源",open_asset:"尝试使用记录的打开程序打开一个资源",save_asset:"保存资源",save_asset_meta:"保存资源的 meta 信息",reimport_asset:"重新导入资源",refresh_asset:"刷新一个资源所在的 url 位置，删除资源会被销毁，新增资源会导入",query_path:"查询一个资源的路径",query_url:"查询一个资源的 URL",query_uuid:"查询一个资源的 UUID",query_assets:"根据条件查询资源数组",query_asset_info:"查询一个资源的基本信息",query_asset_meta:"查询一个资源的 META 信息",generate_available_url:"根据传入的 url 生成一个可用的新 url"},doc:{asset_db_asset_add:"",query_ready:"@returns {boolean} 是否准备就绪",create_asset:`
- url {string} 资源的 URL，例如 db://assets/abc.json
- content {string | null} 写入文件的 string，为 null 则新建文件夹
- option {AssetOperationOption}
    - option.overwrite {boolean} 是否强制覆盖，默认 false
    - option.rename {boolean} 冲突是否自动更名，默认 false

@returns {AssetInfo} 返回一个资源信息
                `,import_asset:`
- source {string} 本地的文件绝对地址
- target {string} 导入到数据库的 url 地址
- option {AssetOperationOption}
    - option.overwrite {boolean} 是否强制覆盖，默认 false
    - option.rename {boolean} 冲突是否自动更名，默认 false

@returns {AssetInfo} 返回一个资源信息
                `,copy_asset:`
- source {string} 源资源的 URL 路径，例如 db://assets/abc.json
- target {string} 复制到的目标位置 URL
- option {AssetOperationOption}
    - option.overwrite {boolean} 是否强制覆盖，默认 false
    - option.rename {boolean} 冲突是否自动更名，默认 false

@returns {AssetInfo} 返回一个资源信息
                `,move_asset:`
- source {string} 需要移动的源资源 URL 路径，例如 db://assets/abc.json
- target {string} 移动到的目标位置 URL
- option {AssetOperationOption}
    - option.overwrite {boolean} 是否强制覆盖，默认 false
    - option.rename {boolean} 冲突是否自动更名，默认 false

@returns {AssetInfo} 返回一个资源信息
                `,delete_asset:`
- url {string} 资源的 URL

@returns {AssetInfo} 返回一个资源信息
                `,open_asset:`
- urlOrUUID {string} 尝试打开的资源 URL 或者 UUID
                `,save_asset:`
- urlOrUUID {string} 资源的 URL 或者 UUID
- content {string | Buffer} 资源的内容字符串，如果是 typeArray，请使用 Buffer.from 转换。

@returns {AssetInfo} 返回一个资源信息
                `,save_asset_meta:`
- urlOrUUID {string} 资源的 URL 或者 UUID
- content {string} 资源 meta 序列化后的内容字符串

@returns {AssetInfo} 返回一个资源信息
                `,reimport_asset:`
- urlOrUUID {string} 资源的 URL 或者 UUID
                `,refresh_asset:`
- urlOrUUID {string} 资源的 URL 或者 UUID
                `,query_path:`
- urlOrUUID {string} 资源的 URL 或者 UUID

@returns {string} 返回一个资源的磁盘绝对路径
                `,query_url:`
- uuid {string} 资源的 UUID

@returns {string} 返回一个资源的 url
                `,query_uuid:`
- url {string} 资源的 URL

@returns {string} 返回一个资源的 uuid
                `,query_assets:`
- pattern? {string} 路径匹配模式，glob 格式 (db://**)
- ccType? {string} 资源类型，例如 cc.Texture2D
- importer? {string} 资源导入器类型，例如 texture

@returns {AssetInfo[]} 返回资源数组
                `,query_asset_info:`
- urlOrUUID {string} 资源的 url 地址或者 uuid

@returns {AssetInfo} 返回一个资源信息
                `,query_asset_meta:`
- urlOrUUID {string} 资源的 url 地址或者 uuid

@returns {AssetMeta} 返回一个资源 meta 信息
                `,generate_available_url:`
- url {string} 资源的 url

@returns {string} 返回一个新的或者和传入参数一样的 url
                `},example:{query_ready:`
await Editor.Message.request('asset-db', 'query-ready');
                `,create_asset:`
await Editor.Message.request('asset-db', 'create-asset', url, content);
                `,import_asset:`
await Editor.Message.request('asset-db', 'import-asset', path, url, { overwrite: true, rename: true });
                `,copy_asset:`
await Editor.Message.request('asset-db', 'copy-asset', sourceUrl, targetUrl, { overwrite: true, rename: true });
                `,move_asset:`
await Editor.Message.request('asset-db', 'move-asset', sourceUrl, targetUrl);
                `,delete_asset:`
await Editor.Message.request('asset-db', 'delete-asset', pathOrUrlOrUUID);
                `,open_asset:`
await Editor.Message.request('asset-db', 'open-asset', urlOrUUID);
                `,save_asset:`
await Editor.Message.request('asset-db', 'save-asset', urlOrUUID, content);
                `,save_asset_meta:`
await Editor.Message.request('asset-db', 'save-asset-meta', urlOrUUID, content);
                `,reimport_asset:`
await Editor.Message.request('asset-db', 'reimport-asset', urlOrUUID);
                `,refresh_asset:`
await Editor.Message.request('asset-db', 'refresh-asset', urlOrUUID);
                `,query_path:`
await Editor.Message.request('asset-db', 'query-path', urlOrUUID);
                `,query_url:`
await Editor.Message.request('asset-db', 'query-url', uuidOrPath);
                `,query_uuid:`
await Editor.Message.request('asset-db', 'query-uuid', urlOrUUID);
                `,query_assets:`
await Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.Script' });
                `,query_asset_info:`
await Editor.Message.request('asset-db', 'query-asset-info', urlOrUUIDOrPath);
                `,query_asset_meta:`
await Editor.Message.request('asset-db', 'query-asset-meta', urlOrUUID);
                `,generate_available_url:`
await Editor.Message.request('asset-db', 'generate-available-url', url);
                `,asset_db_ready:`
Editor.Message.broadcast('asset-db:ready');
                `,asset_db_close:`
Editor.Message.broadcast('asset-db:close');
                `,asset_db_asset_add:`
Editor.Message.broadcast('asset-db:asset-add');
                `,asset_db_asset_change:`
Editor.Message.broadcast('asset-db:asset-change');
                `,asset_db_asset_delete:`
Editor.Message.broadcast('asset-db:asset-delete');
                `}}},migrations:{creator:{autoTitle:".creator 文件夹已迁移完成",autoMessage:"编辑器已为您自动迁移，请勿在 .creator 文件下再放置文件，以免重复迁移造成问题，请知悉。",message:".creator 文件夹已废弃，原文件夹内存放的 default-meta.json 将会放置到项目下的 settings 目录。asset-template 将会转移到项目下的 templates/new-asset 目录下，请及时提交文件夹变动以免造成使用问题。"},templates:{autoTitle:"预览构建模板文件夹已迁移完成",autoMessage:"编辑器已为您自动迁移，请勿在原始模板地址再放置文件，以免重复迁移造成问题，请知悉。",message:"preview-template 与 build-template 文件夹将会迁移至 templates 目录，请及时提交文件夹变动以免造成使用问题。",title:"预览构建模板位置变化通知"},failed:{title:"自动迁移模板文件失败",message:"请参考文档说明手动迁移模板文件到指定位置以免对项目造成影响。"}}};