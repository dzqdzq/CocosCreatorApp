export declare const NonUuidMark = ".";
export declare function compressUuid(uuid: string, min: boolean): any;
export declare function decompressUuid(uuid: string): any;
export declare function isUuid(str: string): any;
export declare function uuid(compress?: boolean): any;
export declare function compressUUID(uuid: string, min: boolean): any;
export declare function compressHex(hexString: string, reservedHeadLength: number): any;
export declare function decompressUUID(uuid: string): any;
export declare function isUUID(str: string): any;
export declare function getUuidFromLibPath(path: string): any;
export declare function generate(compress?: boolean): any;
/**
 * 从一个名字转换成一个 id
 * 这是个有损压缩，并不能够还原成原来的名字
 * 注意：此方法需要和 asset-db 保持一致
 * @param id
 * @param extend
 */
export declare function nameToSubId(name: string, extend?: number): any;
//# sourceMappingURL=uuid.d.ts.map