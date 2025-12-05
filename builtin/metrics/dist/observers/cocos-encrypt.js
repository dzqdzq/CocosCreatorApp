"use strict";const MAX_ENCRYPT_BLOCK=117,rsakey=`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9LCzyypg24REurnyflGy2LdFj
c63hBk/69r84TAJHlE7x92kUpZBF+7cRf0bFRIRA52OsKlF/ljzCjfOPBE9JfNIq
+dwF/rSqns+eyQHPQFd5lY692loz9Mo1pNgElpHuJbfydju7F5KTnQYqviCWompm
LKKdzAPcY1AVJfWd+QIDAQAB
-----END PUBLIC KEY-----
`;function RSAEncrypt(r){var e=require("crypto");return e.publicEncrypt({key:rsakey,padding:e.constants.RSA_PKCS1_PADDING},Buffer.from(r))}const encrypt={urlsafe_b64encode(r){return r.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},encryptPostData(r){let e,t=Buffer.alloc(0),c=0;for(var n=(r=Buffer.from(r)).length;0<n-c;)t=(e=n-c>MAX_ENCRYPT_BLOCK?RSAEncrypt(r.slice(c,c+MAX_ENCRYPT_BLOCK)):RSAEncrypt(r.slice(c,c+n-c)),Buffer.concat([t,e],e.length+t.length)),c+=MAX_ENCRYPT_BLOCK;var l=t.toString("base64");return this.urlsafe_b64encode(l)}};module.exports=encrypt;