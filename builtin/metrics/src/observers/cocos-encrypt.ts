'use strict';
/**
 * 从cocos analytics sdk 扒下来的加密代码
 */
const MAX_ENCRYPT_BLOCK = 117;

const rsakey =
    `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9LCzyypg24REurnyflGy2LdFj
c63hBk/69r84TAJHlE7x92kUpZBF+7cRf0bFRIRA52OsKlF/ljzCjfOPBE9JfNIq
+dwF/rSqns+eyQHPQFd5lY692loz9Mo1pNgElpHuJbfydju7F5KTnQYqviCWompm
LKKdzAPcY1AVJfWd+QIDAQAB
-----END PUBLIC KEY-----
`;

function RSAEncrypt(text: string) {
    const crypto = require('crypto');
    return crypto.publicEncrypt({
        key: rsakey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(text));
}

const encrypt = {
    urlsafe_b64encode($string: string) {
        const $data = $string.replace(/\+/g, '-') // Convert '+' to '-'
            .replace(/\//g, '_') // Convert '/' to '_'
            .replace(/=+$/, ''); // Remove ending '='
        return $data;
    },

    encryptPostData(data: any) {
        let newBuf;
        let hexData: Buffer = Buffer.alloc(0);
        let offset = 0;

        data = Buffer.from(data);
        const inputLen = data.length;

        while (inputLen - offset > 0) {
            if (inputLen - offset > MAX_ENCRYPT_BLOCK) {
                newBuf = RSAEncrypt(data.slice(offset, offset + MAX_ENCRYPT_BLOCK));
                hexData = Buffer.concat([hexData, newBuf], newBuf.length + hexData.length);
            } else {
                newBuf = RSAEncrypt(data.slice(offset, offset + inputLen - offset));
                hexData = Buffer.concat([hexData, newBuf], newBuf.length + hexData.length);
            }
            offset = offset + MAX_ENCRYPT_BLOCK;
        }

        let encrypted = hexData.toString('base64');
        encrypted = this.urlsafe_b64encode(encrypted);

        return encrypted;
    },
};

module.exports = encrypt;
