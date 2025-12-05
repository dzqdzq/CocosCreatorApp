/**
 * 从cocos analytics sdk 扒下来的加密代码
 */
declare const MAX_ENCRYPT_BLOCK = 117;
declare let rsakey: string;
declare function RSAEncrypt(text: any): any;
declare var encrypt: {
    urlsafe_b64encode($string: any): any;
    encryptPostData(data: any): string;
};
