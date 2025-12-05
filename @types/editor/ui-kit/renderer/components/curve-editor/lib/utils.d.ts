export declare function createMatrix(): DOMMatrix;
export declare function smoothScale(delta: number, scale: number): number;
/**
 * 保留小数点
 * @param val
 * @param num
 */
export declare function toFixed(val: number, num: number): number;
/**
 * @function clamp01
 * @param {number} val
 * @returns {number}
 *
 * Clamps a value between 0 and 1.
 */
export declare function clamp01(val: number): number;
/**
 * 取给定边界范围的值
 * Take the value of the given boundary range
 * @param {number} val
 * @param {number} min
 * @param {number} max
 */
export declare function clamp(val: number, min: number, max: number): any;
