import { PopupOptions } from '../public/interface';
/**
 * 右键菜单
 * @param options 菜单配置
 */
export declare function popup(options: PopupOptions): void;
export declare function queryPopup(): Promise<unknown>;
export declare function clickPopup(searcher: string): Promise<unknown>;
export declare function queryMain(): Promise<unknown>;
export declare function clickMain(searcher: string): Promise<unknown>;
