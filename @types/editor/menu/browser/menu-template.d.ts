import { MenuTemplateItem } from '../public/interface';
/**
 * 注册一个模版
 * @param name
 * @param templates
 */
export declare function register(name: string, templates: MenuTemplateItem[]): void;
/**
 * 反注册一个模版
 * @param name
 */
export declare function unregister(name: string): void;
/**
 * 查询指定的模版
 * @param name
 */
export declare function query(name: string): MenuTemplateItem[] | undefined;
