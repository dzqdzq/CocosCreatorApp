/**
 * 当前的语言种类
 */
export declare function getLanguage(): any;
/**
 * 翻译一个 key
 * 允许翻译变量 {a}，传入的第二个参数 obj 内定义 a
 *
 * @param str 翻译内容对应的 key
 * @param obj 翻译参数
 */
export declare function t(str: string, obj?: {
    [key: string]: string;
}): any;
/**
 * 切换语言
 * @param language 选择的语言
 */
export declare function select(language: string): void;
/**
 * 附加多语言数据
 * @param language 选择的语言
 */
export declare function register(language: string, key: string, map: any): void;
