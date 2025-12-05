"use strict";module.exports={title:"场景编辑器",description:"Cocos Creator 场景编辑器",preview_title:"预览",dock:"停靠",project_2d_name:"2D 项目",project_2d_tooltip:"当前项目为 2D 项目<br>引擎的 3D 模块将会在构建时剔除，编辑器已屏蔽部分 3D 相关功能。<br>如需切换为 3D 项目，可在菜单：<br>项目 / 项目设置 / 功能裁剪 中勾选 “基础 3D 功能” 模块。",new:"新建场景",save:"保存场景",save_as:"另存为..",align_with_view:"将节点对齐到场景视角",align_view_with_node:"将场景视角对齐到与节点",is3DValueWarn:"因未启用3d模式，该值无意义，但已生效，请检查",distribution:"分布:",alignment:"对齐:",menu:{undo:"撤销",redo:"重做",newNodeEmpty:"空节点",new3dObject:"3D 对象",new3dCube:"Cube 立方体",new3dCylinder:"Cylinder 圆柱体",new3dSphere:"Sphere 球体",new3dCapsule:"Capsule 胶囊",new3dCone:"Cone 圆锥体",new3dTorus:"Torus 圆环体",new3dPlane:"Plane 平面",new3dQuad:"Quad 四方形",newLightObject:"光源",newLightDirectional:"平行光",newLightSphere:"球面光",newLightSpot:"聚光",newLightProbe:"光照探针",newReflectionProbe:"反射探针",newCameraObject:"摄像机",newTerrain:"地形",newEffects:"特效",newEffectsParticle:"粒子系统",newUI:"UI 组件",newRenderUI:"2D 对象",newUICanvas:"Canvas（画布）",newUISprite:"Sprite（精灵）",newUILabel:"Label（文本）",newUIButton:"Button（按钮）",newUIToggle:"Toggle（复选按钮）",newUIToggleGroup:"ToggleGroup（单选按钮）",newUISlider:"Slider（滑动器）",newUIProgressBar:"ProgressBar（进度条）",newUIWidget:"Widget（对齐）",newUIEditBox:"EditBox（输入框）",newUILayout:"Layout（布局）",newUIScrollView:"ScrollView（滚动视图）",newUIMask:"Mask（遮罩）",newUIParticle2D:"ParticleSystem2D（粒子）",newUISpriteSplash:"SpriteSplash（单色）",newUIRichText:"RichText（富文本）",newUITiledMap:"TiledMap（地图）",newUIVideoPlayer:"VideoPlayer（播放器）",newUIWebView:"WebView（网页视图）",newUIPageView:"PageView（页面视图）",newUIGraphics:"Graphics（绘图）",newSpriteRenderer:"SpriteRenderer（2D精灵）",experimental:"实验性功能",help_url:"帮助文档"},develop:"打开场景调试工具",preview_develop:"打开预览调试工具",graphical_tools:"开关图形工具",terrain:{is_create_message:"编辑地形需要有地形资源，是否创建地形资源?",is_create:"是否创建地形资源?",path_unlegal:"保存路径请限制在当前项目 /assets 路径内",cancel:"取消",edit:"编辑",save:"保存",delete:"删除",abort:"中止",manage:"管理",bulge:"雕塑 隆起",sunken:"雕塑 凹下",smooth:"雕塑 平滑",paint:"涂料",sculpt:"雕塑",select:"选择",noImageData:"暂无数据",tileSize:"栅格大小",weightMapSize:"权重图大小",lightMapSize:"光照图大小",blockCount:"地形块数量",brushSize:"画刷大小",brushStrength:"画刷强度",brushHeight:"画刷高度",brushMode:"画刷模式",brushRotation:"画刷旋转",brushFalloff:"画刷衰减",brush:"画刷",layer:"纹理层",normalMap:"法线贴图",metallic:"金属性",roughness:"粗糙度",paintTileSize:"平铺大小",index:"索引",layers:"纹理层",weight:"权重图"},messages:{cannot_cut_to_self:"不能将剪切的节点粘贴到自己身上",warning:"警告",scenario_modified:" 数据已经修改。",want_to_save:"是否要把数据保存到文件？",save:"保存",dont_save:"不保存",cancel:"取消",save_fail:"保存场景失败：保存路径请限制在当前项目 /assets 路径内，并以 .scene 作为文件后缀",save_fail_prefab:"保存预制件失败：保存路径请限制在当前项目 /assets 路径内，并以 .prefab 作为文件后缀",save_type_fail:"新场景保存类型不匹配",confirm:"确定",particle_system_2d:{export_error:"该资源不支持导出到项目外，保存路径请限制在当前项目 /assets 路径内，并以 .plist 作为文件后缀"},scene_cache:{use_latest_scene:"查询到即将打开的场景 {url} 存在 {time} 生成的未被保存的场景数据，是否应用该数据？",use_last_scene:"打开 {url} 场景失败，该场景数据可能已经损坏，查询到有历史缓存版本 ({time})的场景数据，是否应用？",apply:"应用",no:"否"},not_response:"场景无响应",debug_native:"调试原生场景方法:请打开C++调试工具,附加到场景进程后，点击确定",graphical_tools_not_support:"编辑器预览和原生场景暂不支持抓帧",webGLContextLost:{message:"场景视图的 WebGL 上下文已丢失，是否重载场景视图进行恢复？",title:"WebGL 上下文丢失",buttons:{reload:"重新加载",cancel:"取消"}}},save_prefab:"保存",close_prefab:"关闭",save_clip:"保存",close_clip:"关闭",gizmos:{tools_visibility_3d:"3D工具可见性",icon3d:"3D 图标",showGrid:"显示网格"},ui_tools:{zoom_up:"放大",zoom_down:"缩小",zoom_reset:"按1:1显示",align_top:"顶对齐",align_v_center:"垂直居中对齐",align_bottom:"底对齐",align_left:"左对齐",align_h_center:"水平居中对齐",align_right:"右对齐",distribute_top:"按顶分布",distribute_v_center:"按垂直居中分布",distribute_bottom:"按底分布",distribute_left:"按左分布",distribute_h_center:"按水平居中分布",distribute_right:"按右分布"},tooltips:{translate_gizmo:"移动工具，拖拽工具手柄来修改节点的位置 (W)",rotate_gizmo:"旋转工具，拖拽工具手柄来修改节点的角度 (E)",scale_gizmo:"缩放工具，拖拽工具手柄来修改节点的缩放 (R)",rect_gizmo:"矩形变换工具，拖拽四条边或四个顶点，可以同时修改节点的大小和位置 (T)",local:"局部坐标",local_gizmo:"变换工具中手柄箭头的朝向表示相对于节点的方向",global:"世界坐标",global_gizmo:"变换工具中手柄箭头的朝向以世界坐标系为准，不会考虑节点的旋转",pivot:"锚点",pivotTip:"变换工具出现在节点的锚点位置",center:"中心点",centerTip:"变换工具出现在节点的中心点位置",edit_mode:"切换 2D/3D 编辑模式. (2)",rotationTip3D:"相对父节点的旋转角度。<br>对应的脚本 API 是 Node.eulerAngles。",rotationTip2D:"旋转角度，输入正值时逆时针旋转。<br>对应的脚本 API 是 Node.angle。",scaleTip:"相对父节点的整体缩放比例",positionTip:"相对父节点的位置坐标"},increment_snap:{title:"增量吸附配置",enable_translate:"是否启用移动吸附",enable_rotate:"是否启用旋转吸附",enable_scale:"是否启用缩放吸附",xyz_together:"X Y Z 统一使用 X 值"},rect_tool_snap:{title:"矩形工具吸附配置",enable_snap:"启用智能对齐",threshold:"吸附检测阈值"},scripting:{crReport:"在 {importer} 中检测到可能的循环引用：从 {source} 导入 {imported} 时。"},camera_size:{render_target_resolution:"渲染输出目标分辨率"},scene_view:{is_scene_light_on:"如果开启，将开启场景中的灯，如果关闭则使用一个和场景相机对齐的平行光"},editor_camera:{fov:"Fov",fovTip:"相机的视角大小",far:"远焦距",farTip:"相机的远裁剪距离，应在可接受范围内尽量取最小。",near:"近焦距",nearTip:"相机的近裁剪距离，应在可接受范围内尽量取最大",color:"颜色",colorTip:"相机的颜色缓冲默认值",wheel:"滚轮",wheelTip:"滚轮速度",wander:"漫游",wanderTip:"漫游速度",enableAcceleration:"漫游加速",enableAccelerationTip:"开启后，漫游相机移动速度会随着时间增长, 否则相机会以一个恒定速度移动",aperture:"光圈",apertureTip:"相机光圈，影响相机的曝光参数",shutter:"快门",shutterTip:"相机快门，影响相机的曝光参数",iso:"感光度",isoTip:"相机感光度，影响相机的曝光参数",settings:{reset:"重置"}},animation:{delete_edit_clip_limit:"动画编辑模式下不允许移除或替换正在编辑的动画剪辑"},debug_view:{base_shading:"基础绘制模式",shaded:"正常渲染",wireframe:"线框",wireframe_on_shaded:"正常渲染加线框",performance_info:"性能信息",overdraw:"几何密度",mipMap_density:"贴图密度",UV_density:"UV密度",lightMap_density:"UV密度",normalMap:"法线贴图",light_map_uv:"光照贴图UV",physics_info:"物理信息",collision:"碰撞显示",rendering_debug_options:"渲染调试 (只支持 surface shader)",rendering_single_option:"渲染单项调试",CSM_layer_coloration:"级联阴影染色",lighting_with_base_color:"光照信息带固有色（纯光照切换）",disable_all_single_options:"无单项调试",model_info:"模型信息",vertex_colors:"顶点色",world_normal:"世界空间顶点法线",world_tangent:"世界空间顶点切线",world_position:"世界空间顶点坐标 ",mirrored_normal:"法线镜像",UV0:"UV0",UV1:" UV1",projection_depth_z:"投影深度Z",liner_depth_w:"线性深度W",front_face_coloration:"正反面标记",material_info:"材质信息",world_space_pixel_normals:"世界空间像素法线",world_space_pixel_tangents:"世界空间像素切线",world_space_pixel_binormals:"世界空间像素副法线",base_color:"固有色",diffuse_color:"漫反射颜色",specular_color:"镜面反射颜色",opacity:"透明度",metallic:"金属度",roughness:"粗糙度",specular_intensity:"镜面反射强度",ior:"折射率",lighting_info:"光照信息",direct_diffuse:"直接光漫反射",direct_specular:"直接光镜面反射",direct_lighting:"直接光照",ambient_diffuse:"环境光漫反射",ambient_specular:"环境光镜面反射",ambient_lighting:"环境光照",emissive:"自发光",light_map:"光照贴图",shadows:"阴影",ambient_occlusion:"环境光遮蔽",adv_lighting_info:"高级光照信息",fresnel:"菲涅耳",direct_transmit_diffuse:"直接透射光",direct_transmit_specular:"直接折射光",ambient_transmit_diffuse:"环境透射光",ambient_transmit_specular:"环境折射光",transmit_lighting:"透射光照",direct_trt:"直接光内反射",ambient_trt:"环境光内反射",trt_lighting:"内反射光照",tt_lighting:"内透射光照",misc_info:"其他信息",fog_factor:"雾",rendering_composite_options:"渲染组合调试",enable_all_composite_options:"全选渲染组合调试组",lighting:"光照功能",tone_mapping:"色调映射",cammacorrection:"伽玛校正",transmit_diffuse:"透射光",transmit_specular:"折射光"},game_view:{edit:"管理...",design_resolution:"设计分辨率",free_aspect:"不限比例",full_screen_tips:"最佳显示比例",devtool_invalid:"预览调试工具仅在编辑器预览下可用",ready:"预览环境初始化完毕",failed:"预览环境初始化失败，无法预览"},contributions:{messages:{description:{gameview_stop:"退出播放",gameview_play_of_switch_scene:"当前 Game View 处于播放状态,要切换场景请退出播放。",open_scene:"打开场景",close_scene:"关闭场景",save_scene:"保存场景",save_as_scene:"场景另存为",query_is_ready:"查询当前场景是否准备就绪",query_dirty:"查询当前场景是否有修改",query_classes:"查询所有在引擎中注册的类",query_components:"查询当前场景的所有组件",query_component_has_script:"查询引擎组件列表是否含有指定类名的脚本",query_node_tree:"查询节点树的信息",query_node_by_asset_uuid:"查询使用了资源 UUID 的节点",set_property:"设置某个元素内的属性",reset_property:"重置元素属性到默认值",move_array_element:"移动数组内某个元素的位置",remove_array_element:"删除数组内某个元素的位置",cut_node:"剪切节点",copy_node:"拷贝节点，给下一步粘贴（创建）节点准备数据",duplicate_node:"复制节点",paste_node:"粘贴节点",set_parent:"设置节点父级",create_node:"创建节点",query_node:"查询一个节点的数据",reset_node:"重置节点的位置, 角度和缩放",remove_node:"删除节点",create_component:"创建组件",reset_component:"重置组件",execute_component_method:"执行组件上的方法",execute_scene_script:"执行某个插件注册的方法",remove_component:"删除组件",query_component:"查询一个组件的数据",snapshot:"快照当前场景状态",snapshot_abort:"中止快照",soft_reload:"软刷新场景",change_gizmo_tool:"更改 Gizmo 工具",change_gizmo_pivot:"更改变换基准点",change_gizmo_coordinate:"更改坐标系",change_is2D:"更改2D/3D视图模式",set_grid_visible:"显示/隐藏网格",query_is_grid_visible:"查询网格显示状态",set_icon_gizmo_3d:"设置 IconGizmo 为 3D 或 2D 模式",query_is_icon_gizmo_3d:"查询 IconGizmo 模式",set_icon_gizmo_size:"设置 IconGizmo 的大小",query_icon_gizmo_size:"查询 IconGizmo 的大小",query_gizmo_tool_name:"获取当前 Gizmo 工具的名字",query_gizmo_pivot:"获取当前 Gizmo 基准点名字",query_gizmo_coordinate:"获取当前坐标系名字",query_is2D:"获取当前视图模式",focus_camera:"聚焦场景相机到节点上",align_with_view:"将场景相机位置与角度应用到选中节点上",align_view_with_node:"将选中节点位置与角度应用到当前视角",scene_ready:"场景打开通知",scene_close:"场景关闭通知",UITransform_lack:"正在添加 UI 节点，但所有上层节点都没有 cc.UITransform 组件",UITransform_add_to_root:"给根节点添加 cc.UITransform 组件",UITransform_within_canvas:"创建 Canvas 节点作为父节点",UITransform_cancel:"取消",animationComponentCollision:"动画控制器组件和动画组件、骨骼动画组件不能共存。",physicsDynamicBodyShape:"动力学刚体不能设置为以下碰撞体：Terrain, Plane, Non-Convex Mesh。",light_probe_edit_mode_changed:"光照探针编辑模式切换通知",light_probe_bounding_box_edit_mode_changed:"光照探针组件包围盒编辑模式切换通知",light_probe_delete_when_editing_probe:"当前正在探针编辑模式 无法修改正在编辑的探针节点。请先退出探针编辑模式并再次尝试。",begin_recording:"开始记录节点 Undo 数据",end_recording:"结束记录节点 Undo 数据",cancel_recording:"取消记录节点 Undo 数据",create_prefab:"创建预制体资源(内置撤销记录)",apply_prefab:"应用预制体节点修改到对应资源(内置撤销记录)",restore_prefab:"使用预制体资源还原对应预制件节点(内置撤销记录)",revert_removed_component:"还原预制体节点被移除的组件(内置撤销记录)",apply_removed_component:"应用预制体删除组件的修改到对应资源(内置撤销记录)"},doc:{open_scene:`
                - uuid {string} 场景资源的 UUID`,query_classes:`
                @returns {[Object]}
                - extends? {string} 过滤出基于此类名扩展而来的类
                `,query_components:`
                @returns {[Object]}
                - name {string} 组件名字
                - path {string} 菜单路径
                `,query_component_has_script:`
                - name 脚本的类名 Class
                
                @returns {boolean} 存在 true, 不存在 false
                `,query_node_tree:`
                - uuid? {string} 根节点 uuid，不传入则以场景节点为根节点
                
                @returns {Object}
                - name {string} 节点名字或者 'scene'
                - active {boolean} 节点激活状态 
                - type {string} cc.Scene or cc.Node
                - uuid {string} 节点的 uuid
                - children {[]} 子节点数组
                - prefab {number} prefab状态, 1 表示是 prefab, 2 表示是 prefab 但丢失资源
                - isScene {boolean} 是否是场景节点
                - components {[Object]} 组件数组
                    - type {string} 组件类型
                    - value {string} 组件的 uuid 
                    - extends {[string]} 组件的继承链数组
                `,query_node_by_asset_uuid:`
                - 查询使用了资源 UUID 的节点
                
                @returns {string[]}  节点的 uuid
                `,set_property:`
                - options {SetPropertyOptions}
                    - uuid {string} 修改属性的对象的 uuid
                    - path {string} 属性挂载对象的搜索路径
                    - dump {IProperty} 属性 dump 出来的数据
                `,reset_property:`
                - options {SetPropertyOptions}
                    - uuid {string} 修改属性的对象的 uuid
                    - path {string} 属性挂载对象的搜索路径
                `,move_array_element:`
                - options {MoveArrayOptions}
                    - uuid {string} 节点的 uuid
                    - path {string} 数组的搜索路径
                    - target {number} 目标 item 原来的索引
                    - offset {number} 偏移量
                
                @returns {boolean} 操作是否成功
                `,remove_array_element:`
                - options {MoveArrayOptions}
                    - uuid {string} 节点的 uuid
                    - path {string} 数组的搜索路径
                    - index {number} 目标 item 的索引
                
                @returns {boolean} 操作是否成功
                `,copy_node:`
                - uuids {string | string[]} 节点的 uuid
    
                @returns {string | string[]} 返回节点的 uuid
                `,cut_node:`
                - uuids {string | string[]} 节点的 uuid
    
                @returns {string | string[]} 返回节点的 uuid
                `,duplicate_node:`
                - uuids {string | string[]} 节点的 uuid
    
                @returns {string | string[]} 返回新节点的 uuid
                `,paste_node:`
                - options {PasteNodeOptions}
                    - target {string} 目标节点 uuid
                    - uuids {string | string[]} 被复制的节点 uuid
                    - keepWorldTransform {boolean} 是否保持新节点的世界坐标不变
                
                @returns {string | string[]} 返回新节点的 uuid
                `,set_parent:`
                - options {CutNodeOptions}
                    - parent {string} 父节点 uuid
                    - uuids {string|string[]} 需要设置的子节点 uuid
                    - keepWorldTransform {boolean} 是否保持新节点的世界坐标不变
                
                @returns {string | string[]} 返回节点的 uuid
                `,create_node:`
                - options {CreateNodeOptions}
                    - parent {string} 父节点 uuid
                    - components? {string[]} 组件名字
                
                    - name? {string} 节点名字
                    - dump? {INode | IScene} node 初始化应用的 dump 数据
                    - keepWorldTransform? {boolean} 是否保持新节点的世界坐标不变
                    - type? {string} 资源类型
                    - canvasRequired? {boolean} 是否需要有 cc.Canvas
                    - unlinkPrefab? {boolean} 是否要解绑为普通节点
                    - assetUuid? {string} asset uuid，从资源实例化节点
                
                @returns {string | string[]} 返回新节点的 uuid
                `,query_node:`
                - uuid {string} 节点的 uuid
    
                @returns {Object} 节点的 dump 数据
                `,reset_node:`
                - uuid {string} 节点的 uuid
    
                @returns {boolean} 操作是否成功
                `,restore_prefab:`
                - uuid {string} 节点的 uuid
                - assetUuid {string} 资源的 uuid
    
                @returns {boolean} 操作是否成功
                `,remove_node:`
                - options {RemoveNodeOptions}
                    - uuid: {string | string[]} 节点的 uuid
                `,create_component:`
                - options {CreateComponentOptions}
                    - uuid {string} 节点的 uuid
                    - component {string} 组件 classId （cid）（推荐方式） 或者 className 类名
                `,remove_component:`
                - options {CreateComponentOptions}
                    - uuid {string} 节点的 uuid
                    - component {string} 组件 classId （cid）（推荐方式） 或者 className 类名
                `,reset_component:`
                - options {ResetComponentOptions}
                    - uuid {string} 组件的 uuid
                
                @returns {boolean} 操作是否成功
                `,execute_component_method:`
                - options {ExecuteComponentMethodOptions}
                    - uuid {string} 组件的 uuid
                    - name {string} 方法名
                    - args {any[]} 参数
                `,execute_scene_script:`
                - options {ExecuteSceneScriptMethodsOptions}
                    - name {string} 注册进来的插件名字
                    - method {string} 执行的方法名字
                    - args {any[]} 参数数组
                `,query_component:`
                - uuid {string} 组件的 uuid
    
                @returns {Object} 组件的 dump 数据
                `,change_gizmo_tool:`
                - name {string} 工具名字 'position' | 'rotation' | 'scale'| 'rect'
                `,change_gizmo_pivot:`
                - name {string} 变换基准点 'pivot' | 'center'
                `,change_gizmo_coordinate:`
                - type {string} 坐标系 'local' | 'global'
                `,change_is2D:`
                - is2D {boolean} 2D/3D视图
                `,set_grid_visible:`
                - visible {boolean} 显示/隐藏网格
                `,query_is_grid_visible:`
                @returns {boolean} true: visible, false: invisible
                `,set_icon_gizmo_3d:`
                - is3D {boolean} 3D/2D IconGizmo
                `,query_is_icon_gizmo_3d:`
                @returns {boolean} true: 3D, false: 2D
                `,set_icon_gizmo_size:`
                - size {number} IconGizmo 的大小
                `,query_icon_gizmo_size:`
                @returns {number} IconGizmo 的大小
                `,query_gizmo_tool_name:`
                @returns {string} 'position' | 'rotation' | 'scale' | 'rect'
                `,query_gizmo_pivot:`
                @returns {string} 'pivot' | 'center'
                `,query_gizmo_coordinate:`
                @returns {string} 'local' | 'global'
                `,query_is2D:`
                @returns {boolean} true:2D, false:3D
                `,focus_camera:`
                - uuids {string[] | null} 节点 uuid
                `,align_with_view:`
                @returns {null}
                `,align_view_with_node:`
                @returns {null}
                `,scene_ready:`
                - uuid {string} uuid of scene
                `,light_probe_edit_mode_changed:`
                - mode {boolean} 切换后的探针编辑模式
                `,light_probe_bounding_box_edit_mode_changed:`
                - mode {boolean} 切换后的探针组件包围盒编辑模式
                `},example:{open_scene:`
await Editor.Message.request('scene', 'open-scene', sceneUuid);
                `,save_scene:`
await Editor.Message.request('scene', 'save-scene');
                `,save_as_scene:`
await Editor.Message.request('scene', 'save-as-scene');
                `,close_scene:`
await Editor.Message.request('scene', 'close-scene');
                `,query_is_ready:`
await Editor.Message.request('scene', 'query-is-ready');
                `,query_dirty:`
await Editor.Message.request('scene', 'query-dirty');
                `,query_classes:`
await Editor.Message.request('scene', 'query-classes');
                `,query_components:`
await Editor.Message.request('scene', 'query-components');
                `,query_component_has_script:`
await Editor.Message.request('scene', 'query-component-has-script', 'cc.Sprite');
                `,query_node_tree:`
await Editor.Message.request('scene', 'query-node-tree', nodeUuid);
                `,query_node_by_asset_uuid:`
await Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetUuid);
                `,set_property:`
await Editor.Message.request('scene', 'set-property', {
    uuid: nodeUuid,
    path: '__comps__.1.defaultClip',
    dump: {
        type: 'cc.AnimationClip',
        value: {
            uuid: animClipUuid,
        },
    },
});
                `,reset_property:`
await Editor.Message.request('scene', 'reset-property', {
    uuid: nodeUuid,
    path: 'position',
});
                `,move_array_element:`
await Editor.Message.request('scene', 'move-array-element', {
    uuid: nodeUuid,
    path: '__comps__',
    target: 1,
    offset: -1,
});
                `,remove_array_element:`
await Editor.Message.request('scene', 'remove-array-element', {
    uuid: nodeUuid,
    path: '__comps__',
    index: 0,
});
                `,copy_node:`
await Editor.Message.request('scene', 'copy-node', uuids);
                `,cut_node:`
await Editor.Message.request('scene', 'cut-node', uuids);
                `,duplicate_node:`
await Editor.Message.request('scene', 'duplicate-node', uuids);
                `,paste_node:`
await Editor.Message.request('scene', 'paste-node', {
    target: nodeUuid,
    uuids: nodeUuids,
});
                `,set_parent:`
await Editor.Message.request('scene','set-parent', {
    parent: nodeUuid,
    uuids: nodeUuids,
});
                `,create_node:`
await Editor.Message.request('scene', 'create-node', {
    name: 'New Node'
    parent: nodeUuid,
});
                `,query_node:`
await Editor.Message.request('scene', 'query-node', nodeUuid);
                `,reset_node:`
await Editor.Message.request('scene', 'reset-node', {
    uuid: nodeUuid,
});
                `,restore_prefab:`
await Editor.Message.request('scene', 'restore-prefab', nodeUuid, assetUuid);
                `,remove_node:`
await Editor.Message.request('scene', 'remove-node', { 
    uuid: nodeUuid
});
                `,create_component:`
Editor.Message.request('scene', 'create-component', { 
    uuid: nodeUuid,
    component: 'cc.Sprite'
});
                `,remove_component:`
await Editor.Message.request('scene', 'remove-component', { 
    uuid: componentUuid,
});
                `,reset_component:`
await Editor.Message.request('scene', 'reset-component', {
    uuid: componentUuid,
});
                `,execute_component_method:`
await Editor.Message.request('scene', 'execute-component-method', {
    uuid: componentUuid,
    name: 'getNoisePreview',
    args: [100, 100],
});
                `,execute_scene_script:`
await Editor.Message.request('scene', 'execute-scene-script', {
    name: 'animation-graph',
    method: 'query',
    args: [],
});
                `,snapshot:`
await Editor.Message.request('scene', 'snapshot');
                `,snapshot_abort:`
await Editor.Message.request('scene', 'snapshot-abort');
                `,begin_recording:`
const undoID = await Editor.Message.request('scene', 'begin-recording', nodeUuid);
                `,end_recording:`
await Editor.Message.request('scene', 'end-recording', undoID);
                `,cancel_recording:`
await Editor.Message.request('scene', 'cancel-recording', undoID);
                `,soft_reload:`
await Editor.Message.request('scene', 'soft-reload');
                `,query_component:`
await Editor.Message.request('scene', 'query-component', nodeUuid);
                `,change_gizmo_tool:`
await Editor.Message.request('scene', 'change-gizmo-tool', 'position');
                `,change_gizmo_pivot:`
await Editor.Message.request('scene', 'query-gizmo-pivot');
                `,change_gizmo_coordinate:`
await Editor.Message.request('scene', 'change-gizmo-coordinate', 'global');
                `,change_is2D:`
await Editor.Message.request('scene', 'change-is2D', true);
                `,set_grid_visible:`
await Editor.Message.request('scene', 'set-grid-visible', false);
                `,query_is_grid_visible:`
await Editor.Message.request('scene', 'query-is-grid-visible');
                `,set_icon_gizmo_3d:`
await Editor.Message.request('scene', 'set-icon-gizmo-3d', false);
                `,query_is_icon_gizmo_3d:`
await Editor.Message.request('scene', 'query-is-icon-gizmo-3d');
                `,set_icon_gizmo_size:`
await Editor.Message.request('scene', 'set-icon-gizmo-size', 60);
                `,query_icon_gizmo_size:`
await Editor.Message.request('scene', 'query-icon-gizmo-size');
                `,query_gizmo_tool_name:`
await Editor.Message.request('scene', 'query-gizmo-tool-name');
                `,query_gizmo_pivot:`
await Editor.Message.request('scene', 'query-gizmo-pivot');
                `,query_gizmo_coordinate:`
await Editor.Message.request('scene', 'query-gizmo-coordinate');
                `,query_is2D:`
await Editor.Message.request('scene', 'query-is2D');
                `,focus_camera:`
await Editor.Message.request('scene', 'focus-camera', nodeUuids);
                `,align_with_view:`
await Editor.Message.request('scene', 'align-with-view');
                `,align_view_with_node:`
await Editor.Message.request('scene', 'align-with-view-node');
                `,scene_ready:`
Editor.Message.broadcast('scene:ready', assetUuid);
                `,scene_close:`
Editor.Message.broadcast('scene:close');
                `,light_probe_edit_mode_changed:`
Editor.Message.broadcast('scene:light-probe-edit-mode-changed', true);
                `,light_probe_bounding_box_edit_mode_changed:`
Editor.Message.broadcast('scene:light-probe-bounding-box-edit-mode-changed', true);
                `}},preferences:{scene_cache:{use:"开启场景即时缓存功能",interval:"场景即时缓存间隔时间"},scene:{debug_native:"调试原生引擎场景",native:"启用原生引擎加载场景编辑器",on_native_change:"编辑器原生场景配置已修改，需要重启编辑器才能生效",tick:"保持场景主循环运行"}},console:{clearOnPlay:"预览时清空"}},lod:{culled:"剔除"},crash:{dialog:{native_crash:{message:"原生场景被用来提高场景的效果和表现，但是检测到多次场景崩溃， 是否尝试切换到typescript引擎？",switch_to_ts:"切换并重启",continue:"继续使用原生引擎"}}},disable_in_native_tooltip:"启用原生引擎模式下该功能暂不可用",ui_prop:{array_not_support_multiple:"数组暂不支持多选编辑"}};