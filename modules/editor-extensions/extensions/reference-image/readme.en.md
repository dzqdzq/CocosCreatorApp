# reference-image (Reference Image Plugin)

This plugin is designed to facilitate the insertion of reference images in the scene editor, 
aiding developers in laying out UI elements based on these reference images.

## Features
- Supports the addition of multiple images
- Allows setting offset and opacity for reference images in all directions
- Enables setting different reference images for each prefab
- Supports removing reference image (selecting empty)
- Supports adjusting offset using (ctrl|cmd + arrow keys)

## Implementation Approach

### Data

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

`referenceImageConfig.images` maintains a common collection of images, 
and each `prefab` corresponding reference image is recorded in `referenceImageConfig.sceneUUID`. 
Based on the current value of `referenceImageConfig.scene`, it can be determined which reference image needs to be rendered.

### Public Interface

check the Cocos Creator editor's main menu under Developer -> Message List for reference-image.

### Structure

This plugin logic is divided into 3 parts

- `manager.ts` is responsible for data manipulation and sends notifications to the scene and panel to set reference images.
- `scene-walker.ts` is responsible for rendering a node with a reference image in the scene, with data provided by the plugin panel.
- `scene-toolbars.ts` registers a small icon on the right side of the scene editor toolbar to toggle the visibility of the panel.
