import { PacInfo } from "../protect/asset-manager";

export interface IPackOptions {
    destTempDir: string;
    pacInfos: PacInfo[];
    needCompress?: boolean; // 是否需要压缩
    platform?: string; // 平台设置
}

export interface IAutoAtlasUserData {
    name: string;
    bleed: number | boolean;
    width: number;
    height: number;
    removeTextureInBundle: boolean;
    removeImageInBundle: boolean;
    removeSpriteAtlasInBundle: boolean;
    filterUnused: boolean;
}

export interface AtlasInfo {
    spriteFrameInfos: SpriteFrameInfo[];
    width: number;
    height: number;
    name: string;
    imagePath: string;
    imageUuid: string;
    textureUuid: string;
    compressed: CompressedInfo;
}

export interface AtlasResults {
    pacInfos: PacInfo[];
    assetsUuids: string[];
    // imageUuids: string[];
    // image2pac: any;
    spriteFrames: any[];
}
export interface CompressedInfo {
    suffixs: string[];
    imagePathNoExt: string;
}
export interface SpriteFrameInfo {
    name: string;
    spriteFrame: any;
    uuid: string;
    imageUuid: string;
    textureUuid: string;
    file: string;
    trim: any;
    rawWidth: number;
    rawHeight: number;
    width: number;
    height: number;
    originalPath: string;
    rotated: boolean;
}

export interface IPackResult {
    atlases: AtlasInfo[];
    options: IAutoAtlasUserData;
    unpackedImages: SpriteFrameInfo[];
    pacInfo: PacInfo;
    uuid?: string;
    dirty: boolean;
    mtimeMd5: string;
}

export interface ITrimInfo {
    width: number;
    height: number;
}

export interface pacPreviewResult {
    atlasImagePaths: string[];
    unpackedImages: SpriteFrameInfo[];
    dirty?: boolean; // 本次预览的结果，是否使用缓存
}
