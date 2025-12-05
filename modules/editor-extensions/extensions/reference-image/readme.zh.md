# reference-image (参考图插件)

用于在场景编辑器里插入参考图，方便开发者根据参考图进行布局 UI 元素。

## 具体功能
- 支持添加多张图片
- 支持针对参考图设置上下左右的偏移，和透明度
- 支持针对每个 `prefab` 设置不同的参考图
- 支持取消参考图 （选择空）
- 支持 (ctrl|cmd + 方向键)调整偏移量

## 实现方案

### 数据

```ts
interface IImageData {
    path: string;
    x: number;
    y: number;
    opacity: number
}
interface ISceneData {
    [sceneUUID: string]: {
        path: string
    }
}
interface IReference {
    images: IImageData[];
    sceneUUID: ISceneData;
    scene: string;
}

const defaultConfig = {
    images: [],
    sceneUUID: {},
    scene: '',
};
let referenceImageConfig: IReference = defaultConfig;
```

`referenceImageConfig.images` 维护了一个公共的图片集合，
每个 `prefab` 对应的参考图记录在 `referenceImageConfig.sceneUUID` 里。
根据当前 `referenceImageConfig.scene` 的值，可以确定需要渲染具体哪个参考图。

### 公开接口

可查看编辑器主菜单开发者 -> 消息列表中的 **reference-image**

### 结构

此插件逻辑分为 3 部分

- `manager.ts` 负责数据的增删改，并且发送通知到场景与面板进行设置参考图
- `scene-walker.ts` 负责在场景里面渲染一个参考图的节点，数据由插件面板提供
- `scene-toolbars.ts` 往场景编辑器的工具栏右侧注册了一个小 Icon，用来切换面板的显示隐藏
