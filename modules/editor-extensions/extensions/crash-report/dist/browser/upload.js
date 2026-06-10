var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMgr = undefined;
exports.UploadMgr = undefined;
exports.UploadFileInfo = undefined;
const axios_1 = __importDefault(require("axios"));

const { readFileSync } = require("fs-extra");

const { getLatestFilePath, calcMd5 } = require("../utils");

const stream_1 = require("stream");

const { basename } = require("path");

const { FormData, Blob, File } = require("formdata-node");
const FormDataEncoder = require("form-data-encoder").FormDataEncoder;
const hmacSHA256 = require("crypto-js/hmac-sha256");
class UploadFileInfo {
  file = Buffer.from("");
  fileMd5 = "";
  partMd5 = "";
  name = "unknow";
  size = 0;
  index = 1;
  total = 1;
  action = "upload";
  projectId = "CreatorAnalytics";
  serviceId = "crash-report";
  cuser = "sys";
  tags = "";
  isFuzzy = false;
  uploadFlag = 0;
  toFormData() {
    var e = new FormData();
    for (const a in this) {
      var t = this[a];

      if (Buffer.isBuffer(t)) {
        e.append(a, new Blob([t.buffer]));
      } else {
        e.append(a, String(t));
      }
    }
    return e;
  }
}
function sortObjectKey(t) {
  const a = {};

  Object.keys(t)
    .sort()
    .map((e) => {
      a[e] = t[e];
    });

  return a;
}
function getReqSignature(e, t, a, r, o) {
  var s = new Date().getTime();
  const i = {};
  e.forEach((e, t) => {
    var a = e.toString();

    if (a !== "[object File]" && a !== "[object Blob]") {
      i[t] = e;
    }
  });
  var l = sortObjectKey(i);
  let n = "";
  for (const c in l) {
    if (Object.prototype.hasOwnProperty.call(l, c)) {
      n += `${c}=${l[c]}&`;
    }
  }
  return {
    grantType: "aksk",
    accessKey: a,
    projectId: o,
    timestamp: s,
    signature: hmacSHA256(`${o}&${n}${t}&` + s, r).toString(),
  };
}
exports.UploadFileInfo = UploadFileInfo;
class UploadMgr {
  serviceId = "crash-report";
  baseURL = "https://gateway.cocos.com";
  projectId = "CreatorAnalytics";
  ak = "107c2c83ea164b5682f9ffc8eede42ab";
  sk = "1131702614884bafba5a4fddaa73a8ed";
  apiURL = "/cdn/uploadFileByCache";
  allowCrashReportAPIURL = "/A018/v1/A018AP001";
  client;
  constructor() {
    this.client = axios_1.default.create({ timeout: 120000 /* 12e4 */ });

    this.client.interceptors.request.use((e) => {
      var t;
      var a;
      var r;

      if (e.data instanceof FormData) {
        t = e.data.get("__apiURL__") || this.apiURL;
        e.data.delete("__apiURL__");
        e.maxContentLength = Infinity;
        a = new FormDataEncoder(e.data);
        r = e.headers;

        e.headers = {
          ...r,
          ...a.headers,
          ...getReqSignature(e.data, t, this.ak, this.sk, this.projectId),
        };

        e.data = stream_1.Readable.from(a.encode());
      }

      return e;
    });
  }
  async check() {
    try {
      var e = (await Editor.User.getUserToken()).access_token;
      var t = new FormData();

      var a = (t.append("__apiURL__", this.allowCrashReportAPIURL),
      t.append("access_token", String(e)),
      await this.client.post(this.baseURL + this.allowCrashReportAPIURL, t))
        .data;

      return a.data;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  async packMultipleZipAndUpload(t, a) {
    for (let e = 0; e < a.length; e++) {
      await this.packZipAndUpload(t, a[e]);
    }
  }
  packZipAndUpload(e, o) {
    const t = new (require("jszip"))();
    t.file("问题描述.txt", e || "未描述");
    try {
      t.file("编辑器日志.log", readFileSync(o.editorLog));
    } catch (e) {
      t.file("未找到编辑器日志.log", String(e));
    }
    try {
      var a = getLatestFilePath(o.dbLog, ".log");
      t.file("AssetDB日志.log", readFileSync(a));
    } catch (e) {
      t.file("未找到AssetDB日志.log", String(e));
    }
    try {
      var r = getLatestFilePath(o.buildLog, ".log");
      t.file("构建日志.log", readFileSync(r));
    } catch (e) {
      t.file("未找到构建日志.log", String(e));
    }
    try {
      var s = getLatestFilePath(o.crashLog, ".dmp");
      t.file(basename(s), readFileSync(s));
    } catch (e) {
      t.file("未找到 Crash 文件.log", String(e));
    }
    try {
      t.file("项目信息.json", readFileSync(o.projectJSON));
    } catch (e) {
      t.file("未找到项目信息.json", String(e));
    }
    t.file("崩溃详细信息.json", Buffer.from(JSON.stringify(o, null, 4)));

    return new Promise((a, r) => {
      t.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      }).then(async (e) => {
        try {
          var t = {
            ["Crash_" + o.process]: "Crash_" + o.process,
            app_version: Editor.App.version,
          };
          await this.upload(o, e, JSON.stringify(t));
          a(null);
        } catch (e) {
          r(e);
        }
      });
    });
  }
  async upload(e, t, a) {
    var r = 10485760;
    var t_length = t.length;
    let s = 1;
    for (
      var i, l, n = Math.ceil(t_length / r), c = calcMd5(t), d = e.zipName;
      s <= n;

    ) {
      i = (s - 1) * r;
      l = Math.min(t_length, i + r);

      await this.uploadSlice({
        name: d,
        file: t.slice(i, l),
        size: t_length,
        index: s,
        total: n,
        tags: a,
        fileMd5: c,
        cuser: e.uid,
      });

      s++;
    }
  }
  async uploadSlice(e) {
    try {
      var t = new UploadFileInfo();

      t.file = e.file;
      t.size = e.size;
      t.index = e.index;
      t.total = e.total;
      t.partMd5 = calcMd5(e.file);
      t.fileMd5 = e.fileMd5;
      t.name = e.name;
      t.serviceId = "crash-report";
      t.projectId = "CreatorAnalytics";
      t.cuser = e.cuser;
      t.tags = e.tags;
      console.debug(">>> upload data：", t);
      var a = await this.client.post(
        this.baseURL + this.apiURL,
        t.toFormData()
      );

      console.debug(
        `>>> upload data${
          a?.data?.code !== 200 ? "failed" : "successful"
        }，info：`,
        a
      );
    } catch (e) {
      console.error(">>> upload failed", e);
    }
  }
}
exports.UploadMgr = UploadMgr;
exports.uploadMgr = new UploadMgr();
