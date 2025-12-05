export {
    IProperty,
    INode,
    IRemovedComponentInfo,
} from '@cocos/creator-types/editor/packages/scene/@types/public';

export { AssetInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';

export type ITypeCache = { [type: string]: string };

export type ISlotType = 'header' | 'section' | 'footer';

export type ISubConfig = {
    [type in ITypeCache]: {
        [name: string]: string
    }
}

export type ISlotConfig = {
    [key in ISlotType]: {
        [name: string]: string[]
    }
}

export type IDropItem = {
    type: string
    message: string
}

export type IDropConfig = {
    [type: string]: {
        package: string,
        message: string
    }
}

export type IInspectorRender = {
    [type: string]: { panel: string, slot: ISlotConfig, drop: IDropConfig };
}

export type IContributions = {
    type: ITypeCache, drop: {
        [key: string]: IDropItem[]
    }
} & Record<ISlotType, ISubConfig>;

// IInspectorRender 示例
// const demo = {
//     node: {
//         panel: 'path to node.js',
//         slot: {
//             header: {
//                 xxx: ['xxx.js', 'xxx.js'],
//             },
//         },
//         drop: {
//             'cc.Script': {
//                 package: 'console',
//                 message: 'messageName'
//             }
//         }
//     },
//     asset: {
//     },
// };
