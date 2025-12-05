import { preferencesProtocol, projectProtocol } from '../public/interface';
/**
 * 查询一个插件的某个配置的值
 * @param {*} name
 * @param {*} key
 * @param {*} type
 */
export declare function getConfig(name: any, key: any, type?: preferencesProtocol): Promise<unknown>;
/**
 * 设置一个插件的某个配置的值
 * @param {*} name
 * @param {*} key
 * @param {*} value
 * @param {*} type
 */
export declare function setConfig(name: any, key: any, value: any, type?: preferencesProtocol): Promise<unknown>;
/**
 * 删除一个配置项目
 * @param {*} name
 * @param {*} key
 * @param {*} type
 */
export declare function removeConfig(name: any, key: any, type?: preferencesProtocol): Promise<unknown>;
/**
 * 查询一个插件的某个配置的值
 * @param {*} name
 * @param {*} key
 * @param {*} type
 */
export declare function getProject(name: any, key: any, type?: projectProtocol): Promise<unknown>;
/**
 * 设置一个插件的某个配置的值
 * @param {*} name
 * @param {*} key
 * @param {*} value
 * @param {*} type
 */
export declare function setProject(name: any, key: any, value: any, type?: projectProtocol): Promise<unknown>;
/**
 * 删除一个配置项目
 * @param {*} name
 * @param {*} key
 * @param {*} type
 */
export declare function removeProject(name: any, key: any, type: projectProtocol): Promise<unknown>;
/**
 * 查询一个插件的某个配置的值
 * @param {*} name
 * @param {*} key
 */
export declare function getTemp(name: any, key: any): Promise<unknown>;
/**
 * 设置一个插件的某个配置的值
 * @param {*} name
 * @param {*} key
 * @param {*} value
 */
export declare function setTemp(name: any, key: any, value: any): Promise<unknown>;
/**
 * 删除一个配置项目
 * @param {*} name
 * @param {*} key
 */
export declare function removeTemp(name: any, key: any): Promise<unknown>;
/**
 * 迁移全局数据
 * @param {*} pkgName
 * @param {*} profileVersion
 * @param {*} profileData
 */
export declare function migrateGlobal(pkgName: string, profileVersion: string, profileData: any): Promise<unknown>;
/**
 * 迁移项目本地数据
 * @param {*} pkgName
 * @param {*} profileVersion
 * @param {*} profileData
 */
export declare function migrateLocal(pkgName: string, profileVersion: string, profileData: any): Promise<unknown>;
/**
 * 迁移项目 settings 数据
 * @param {*} pkgName
 * @param {*} profileVersion
 * @param {*} profileData
 */
export declare function migrateProject(pkgName: string, profileVersion: string, profileData: any): Promise<unknown>;
/**
 * @param action
 * @param handle
 */
export declare function on(action: string, handle: (...args: any[]) => void): void;
/**
 * @param action
 * @param handle
 */
export declare function removeListener(action: string, handle: (...args: any[]) => void): void;
