import { MessageBoxReturnValue, SaveDialogReturnValue, OpenDialogReturnValue } from 'electron';
import { SelectDialogOptions, MessageDialogOptions } from '../public/interface';
/**
 * 选择文件弹窗
 * @param options
 */
export declare function select(options?: SelectDialogOptions): Promise<OpenDialogReturnValue>;
/**
 * 保存文件
 * @param options
 */
export declare function save(options?: SelectDialogOptions): Promise<SaveDialogReturnValue>;
/**
 * 信息弹窗
 * @param message
 * @param options
 */
export declare function info(message: string, options?: MessageDialogOptions): Promise<MessageBoxReturnValue>;
/**
 * 警告弹窗
 * @param message
 * @param options
 */
export declare function warn(message: string, options?: MessageDialogOptions): Promise<MessageBoxReturnValue>;
/**
 * 错误弹窗
 * @param message
 * @param options
 */
export declare function error(message: string, options?: MessageDialogOptions): Promise<MessageBoxReturnValue>;
