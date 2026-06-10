Object.defineProperty(exports, "__esModule", { value: true });
exports.API = undefined;

const { existsSync, statSync } = require("fs-extra");

const Network = require("../../../utils/network");
const Constant = require("../const");
const MAX_APK_SIZE = 4294967296;

const {
  AuditInfo,
  AppInfo,
  ErrorCode,
  AccessTokenRet,
  AppInfoRet,
  UploadUrlRet,
  UploadRet,
  UpdateAPKRet,
} = require("./entity");

class API {
  loginType;
  accessToken;
  clientID;
  static HOST = "https://connect-api.cloud.huawei.com";
  constructor(e, r, t) {
    this.loginType = e;
    this.accessToken = r;

    if (e === Constant.LOGIN_TYPE.client) {
      this.clientID = t;
    }
  }
  get oAuthLogin() {
    return this.loginType === Constant.LOGIN_TYPE.oauth;
  }
  genHeader() {
    var e = {};

    if (this.oAuthLogin) {
      e.oauth2Token = this.accessToken;
    } else {
      e.Authorization = "Bearer " + this.accessToken;
      e.client_id = this.clientID;
    }

    return e;
  }
  static async getAccessToken(e, r) {
    var t = new AccessTokenRet();
    var s = API.HOST + "/api/oauth2/v1/token";
    var e = {
      grant_type: "client_credentials",
      client_id: e,
      client_secret: r,
    };
    try {
      var o = await Network.postAsync(s, JSON.stringify(e));

      if ((o = JSON.parse(o)).access_token) {
        t.code = ErrorCode.success;
        t.accessToken = o.access_token;
      }
    } catch (e) {
      t.errorMessage = e;
    }
    return t;
  }
  async queryAppInfo(e) {
    var r = new AppInfoRet();
    var t = API.HOST + "/api/publish/v2/app-info";
    var e = { appId: e };
    try {
      var s = await Network.getAsync(t, e, this.genHeader());

      if ((s = JSON.parse(s)).ret.code === 0) {
        r.code = ErrorCode.success;
        s.appInfo = new AppInfo(s.appInfo);
        s.auditInfo = new AuditInfo(s.auditInfo);
      }
    } catch (e) {
      r.errorMessage = e;
    }
    return r;
  }
  async getUploadUrl(e, r) {
    var t = new UploadUrlRet();
    var s = API.HOST + "/api/publish/v2/upload-url";
    var e = { appId: e, suffix: r || "apk" };
    try {
      var o = await Network.getAsync(s, e, this.genHeader());

      if ((o = JSON.parse(o)).uploadUrl) {
        t.code = ErrorCode.success;
        t.uploadUrl = o.uploadUrl;
        o.chunkUploadUrl && (t.chunkUploadUrl = o.chunkUploadUrl);
        t.authCode = o.authCode;
      }
    } catch (e) {
      t.errorMessage = e;
    }
    return t;
  }
  async uploadFile(e, r, t) {
    var s = new UploadRet();
    if (existsSync(r)) {
      if (statSync(r).size > MAX_APK_SIZE) {
        s.code = ErrorCode.fileTooLarge;
      } else {
        try {
          var o = await Network.uploadFile(e, r, t);

          if (
            (o = (o = JSON.parse(o)).result).UploadFileRsp &&
            o.UploadFileRsp.ifSuccess
          ) {
            s.code = ErrorCode.success;

            s.files = o.UploadFileRsp.fileInfoList.map((e) => ({
              fileDestUrl: e.fileDestUlr,
              size: e.size,
            }));
          }
        } catch (e) {
          s.errorMessage = e;
        }
      }
    } else {
      s.code = ErrorCode.fileNotExists;
    }
    return s;
  }
  async updateApkInfo(e, r, t, s = 1) {
    var o = new UpdateAPKRet();
    var a = API.HOST + "/api/publish/v2/app-file-info";
    try {
      var n = { appId: e, releaseType: s };
      var i = { fileType: 5, files: [{ fileName: r, fileDestUrl: t }] };
      var c = await Network.putAsync(a, n, this.genHeader(), JSON.stringify(i));

      if ((c = JSON.parse(c).ret).code === 0) {
        o.code = ErrorCode.success;
      } else {
        o.errorMessage = c.msg;
      }
    } catch (e) {
      o.errorMessage = e;
    }
    return o;
  }
}
exports.API = API;
