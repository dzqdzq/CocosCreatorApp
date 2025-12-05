import { preferencesProtocol, projectProtocol } from '../public/interface';
export { migrateGlobal, migrateLocal, migrateProject } from './migration';
export declare const profileMap: {
    [name: string]: {
        defaultPreferences: any;
        global: any;
        local: any;
        defaultProject: any;
        project: any;
        temp: any;
    };
};
/**
 * 生成 profiles 对象
 * @param name
 */
export declare function ensureProfiles(name: string): {
    defaultPreferences: any;
    global: any;
    local: any;
    defaultProject: any;
    project: any;
    temp: any;
};
/**
 * 查询一个插件的某个配置的值
 * @param name 插件名字
 * @param key 设置的配置的 key
 * @param type 配置存储类型
 */
export declare function getConfig(name: string, key: string, type?: preferencesProtocol): Promise<any>;
/**
 * 设置一个插件的某个配置的值
 * @param name 插件名字
 * @param key 设置的配置的 key
 * @param value 设置的配置的值
 * @param type 配置存储类型
 */
export declare function setConfig(name: string, key: string, value: string, type?: preferencesProtocol): Promise<void>;
/**
 * 删除一个配置项目
 * @param name 插件的名字
 * @param key 删除的配置的 key
 * @param type 配置存储类型
 */
export declare function removeConfig(name: string, key: string, type?: preferencesProtocol): Promise<void>;
/**
 * 查询一个插件的某个配置的值
 * @param name 插件名字
 * @param key 设置的配置的 key
 * @param type 配置存储类型
 */
export declare function getProject(name: string, key: string, type?: projectProtocol): Promise<any>;
/**
 * 设置一个插件的某个配置的值
 * @param name 插件名字
 * @param key 设置的配置的 key
 * @param value 设置的配置的值
 * @param type 配置存储类型
 */
export declare function setProject(name: string, key: string, value: string, type?: projectProtocol): Promise<void>;
/**
 * 删除一个配置项目
 * @param name 插件的名字
 * @param key 删除的配置的 key
 * @param type 配置存储类型
 */
export declare function removeProject(name: string, key: string, type?: projectProtocol): Promise<void>;
/**
 * 查询一个插件的某个配置的值
 * @param name 插件名字
 * @param key 设置的配置的 key
 */
export declare function getTemp(name: string, key: string): Promise<any>;
/**
 * 设置一个插件的某个配置的值
 * @param name 插件名字
 * @param key 设置的配置的 key
 * @param value 设置的配置的值
 */
export declare function setTemp(name: string, key: string, value: string): Promise<void>;
/**
 * 删除一个配置项目
 * @param name 插件的名字
 * @param key 删除的配置的 key
 */
export declare function removeTemp(name: string, key: string): Promise<void>;
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
