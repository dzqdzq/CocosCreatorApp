import { BaseMenuItem, MenuTemplateItem } from '../public/interface';
/**
 * 将一个菜单项目配置添加到主菜单里
 * @param path 注册的菜单的位置
 * @param option 菜单配置项目
 */
export declare function add(path: string, option: BaseMenuItem): void;
/**
 * 删除一个菜单
 * @param path 删除菜单的搜索路径
 * @param option 菜单配置项目
 */
export declare function remove(path: string, option: BaseMenuItem): void;
/**
 * 添加分组信息
 * @param path
 * @param name
 * @param order
 */
export declare function addGroup(path: string, name: string, order: number): void;
/**
 * 删除分组
 * @param path
 * @param name
 */
export declare function removeGroup(path: string, name: string): void;
/**
 * 应用更改的菜单设置
 */
export declare function apply(): void;
/**
 * 注册一个菜单模版
 * @param name
 * @param templates
 */
export declare function registerTemplate(name: string, templates: MenuTemplateItem[]): void;
/**
 * 删除一个已经注册的菜单模版
 * @param name
 * @param template
 */
export declare function unregisterTemplate(name: string): void;
