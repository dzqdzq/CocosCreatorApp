import { BaseMenuItem } from '../public/interface';
/**
 * 添加一个菜单到主菜单上
 * @param path 主菜单所在的位置，如果是一级菜单，则传入空字符串
 * @param option 菜单项内容
 */
export declare function add(path: string, option: BaseMenuItem): void;
/**
 * 从主菜单上删除一个菜单项
 * @param path 主菜单所在的位置，如果是一级菜单，则传入空字符串
 * @param option 菜单项内容
 */
export declare function remove(path: string, option: BaseMenuItem): void;
