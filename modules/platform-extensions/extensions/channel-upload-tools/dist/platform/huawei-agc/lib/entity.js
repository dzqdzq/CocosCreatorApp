var ErrorCode;
Object.defineProperty(exports, "__esModule", { value: true });

exports.AppInfoRet = undefined;
exports.AuditInfo = undefined;
exports.AppInfo = undefined;
exports.UpdateAPKRet = undefined;
exports.UploadRet = undefined;
exports.UploadUrlRet = undefined;
exports.AccessTokenRet = undefined;
exports.CommonRet = undefined;
exports.ErrorCode = undefined;

((e) => {
  e[(e.fail = 0)] = "fail";
  e[(e.success = 1)] = "success";
  e[(e.getSecretError = 2)] = "getSecretError";
  e[(e.fileNotExists = 3)] = "fileNotExists";
  e[(e.fileTooLarge = 4)] = "fileTooLarge";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));

class CommonRet {
  code;
  constructor() {
    this.code = ErrorCode.fail;
  }
}
class AccessTokenRet extends (exports.CommonRet = CommonRet) {}
exports.AccessTokenRet = AccessTokenRet;
class UploadUrlRet extends CommonRet {}
exports.UploadUrlRet = UploadUrlRet;
class UploadRet extends CommonRet {}
exports.UploadRet = UploadRet;
class UpdateAPKRet extends CommonRet {}
exports.UpdateAPKRet = UpdateAPKRet;
class AppInfo {
  constructor(e) {}
}
exports.AppInfo = AppInfo;
class AuditInfo {
  constructor(e) {}
}
exports.AuditInfo = AuditInfo;
class AppInfoRet extends CommonRet {}
exports.AppInfoRet = AppInfoRet;
