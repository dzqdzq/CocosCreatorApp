import { BaseMenuItem, MenuTemplateItem } from '../public/interface';
export declare function translationPath(path: string): string;
export declare function translationOption(option: BaseMenuItem, additional?: any, parent?: any): any;
/**
 * 将模版上的定义和 “模版” 内定义的配置合并
 * @param optionA 普通菜单项
 * @param optionB 模版的菜单项
 * @param additional
 */
export declare function mergeOption(optionA: BaseMenuItem, optionB: MenuTemplateItem): BaseMenuItem;
