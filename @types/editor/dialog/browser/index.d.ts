import { BrowserWindow, MessageBoxReturnValue, SaveDialogReturnValue, OpenDialogReturnValue } from 'electron';
import { SelectDialogOptions, MessageDialogOptions } from '../public/interface';
/**
 * 选择文件弹窗
 *
 * @param options 弹窗选项
 * @param window 窗口对象
 */
export declare function select(options?: SelectDialogOptions, window?: BrowserWindow | null): Promise<OpenDialogReturnValue>;
/**
 * 保存文件弹窗
 *
 * @param options 弹窗选项
 * @param window 窗口对象
 */
export declare function save(options?: SelectDialogOptions, window?: BrowserWindow | null): Promise<SaveDialogReturnValue>;
/**
 * 信息弹窗
 *
 * @param message 信息内容
 * @param options 弹窗选项
 * @param window 窗口对象
 */
export declare function info(message: string, options?: MessageDialogOptions, window?: BrowserWindow | null): Promise<MessageBoxReturnValue>;
/**
 * 警告弹窗
 *
 * @param message 信息内容
 * @param options 弹窗选项
 * @param window 窗口对象
 */
export declare function warn(message: string, options?: MessageDialogOptions, window?: BrowserWindow | null): Promise<MessageBoxReturnValue>;
/**
 * 错误弹窗
 *
 * @param message 信息内容
 * @param options 弹窗选项
 * @param window 窗口对象
 */
export declare function error(message: string, options?: MessageDialogOptions, window?: BrowserWindow | null): Promise<MessageBoxReturnValue>;
