
/// <reference path="/Users/mac/Documents/editor_3d/v3.4.2/resources/3d/engine/bin/.declarations/cc.d.ts"/>

/// <reference path="/Users/mac/Documents/editor_3d/v3.4.2/resources/3d/engine/bin/.declarations/cc.editor.d.ts"/>

declare const CC_BUILD: boolean;
declare const CC_TEST: boolean;
declare const CC_EDITOR: boolean;
declare const CC_PREVIEW: boolean;
declare const CC_DEV: boolean;
declare const CC_DEBUG: boolean;
declare const CC_JSB: boolean;
declare const CC_WECHAT: boolean;
declare const CC_ALIPAY: boolean;
declare const CC_XIAOMI: boolean;
declare const CC_BAIDU: boolean;
declare const CC_COCOSPLAY: boolean;
declare const CC_MINIGAME: boolean;
declare const CC_RUNTIME_BASED: boolean;
declare const CC_SUPPORT_JIT: boolean;
declare const CC_PHYSICS_CANNON: boolean;
declare const CC_PHYSICS_AMMO: boolean;
declare const CC_PHYSICS_BUILTIN: boolean;
declare const cc: any;

// polyfills for editor
declare module 'cc' {
    interface CCObject {
        isRealValid: boolean;
        objFlags: number;
    }
    interface BaseNode {
        [editorExtrasTag]: {
            // restore the PrefabInstance Node when this node is the mounted child node of it.
            mountedRoot?: Node;
        };
        objectFlags: number;
    }
    interface Component {
        [editorExtrasTag]: {
            // restore the PrefabInstance Node when this component is the mounted component under it.
            mountedRoot?: Node
        };
        objectFlags: number;
    }

    interface RealKeyframeValue {
        [editorExtrasTag]: {
            tangentMode?: TangentMode;
        }
    }

    interface ParticleSystem {
        _isShowBB?: boolean;    // 是否显示包围盒
    }
}


