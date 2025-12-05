//============ 加密/解密数据模块 ===========
'use strict';
import * as crypto from 'crypto';
import { readFile, outputFile, remove, readFileSync, readJSON, outputJSON } from 'fs-extra';
import { extname, join, dirname, basename } from 'path';

// 在加密后的文件添加文件头，方便判断文件类型是否符合要求，当与 .scene 使用同后缀资源时有用，目前暂未使用
const HMI_CRYPTO_FLAG = 'hmi';

// The `password` should be a long, randomly generated string.
const password = 'cocos-hmi-2024@@';
const algorithm = 'aes-256-cbc';

const iv = crypto.randomBytes(16);
const key = crypto.scryptSync(password, 'salt', 32);

// Encrypt function
function encrypt(text: string): string {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}

/**
 * 将普通的 JSON 序列化字符串转成加密后的字符串
 * @param content 
 * @returns 
 */
export async function transformToHMIContent(content: string) {
    content = await encrypt(content as string);
    return HMI_CRYPTO_FLAG + content;
}

/**
 * 将加密后的字符串转成普通的 JSON 序列化字符串
 * @param content 
 * @returns 
 */
export async function transformHMIContentToNormalContent(content: string) {
    return await decrypt(content.slice(3));
}

/**
 * 扫描目标文件夹内的场景、预制体文件将其转为加密后的文件，并删除原文件
 * @param file 
 */
export async function transformFileToHMIFile(file: string) {
    let str = await readFile(file, 'utf-8');
    str = await encrypt(str as string);
    str = HMI_CRYPTO_FLAG + str;
    const extName = extname(file);
    // 将 prefab 转成 hmi-prefab
    // 将 scene 转成 hmi-scene
    const newExtName = '.hmi-' + extName.slice(1);
    const dest = join(dirname(file), basename(file, extName) + newExtName);
    await outputFile(dest, str);
    await remove(file);
    return dest;
}

export async function transformMetaToHMIMeta(file: string, newMetaDest: string) {
    const metaData = await readJSON(file);
    metaData.importer = 'hmi-' + metaData.importer;
    metaData.imported = false;
    await outputJSON(newMetaDest, metaData);
    await remove(file);
}

/**
 * 验证某文件是否为加密后的文件
 * @param file 
 * @returns 
 */
export function checkIsHMIData(file: string) {
    // 确认是否是车机版加密方式的场景
    const str = readFileSync(file, 'utf-8');
    if (str.startsWith(HMI_CRYPTO_FLAG)) {
        return true;
    }
    return false;
}