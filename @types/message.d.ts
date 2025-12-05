import * as AssetDB from '../builtin/asset-db/@types/message';
import * as Scene from '../builtin/scene/@types/message';
import * as Engine from '../builtin/engine/@types/message';
import * as Builder from '../builtin/builder/@types/public/message';
// import * as Extension from '../builtin/extension/@types/message';

declare global {
    interface EditorMessageContent {
        params: any[],
        result: any;
    }

    interface EditorMessageMap {
        [x: string]: EditorMessageContent;
    }

    interface EditorMessageMaps {
        [x: string]: EditorMessageMap;
        'asset-db': AssetDB.message;
        'scene': Scene.message;
        'engine': Engine.message;
        'builder': Builder.message;
        // 'extension': Extension.message;

    }
}
