Object.defineProperty(exports, "__esModule", { value: true });

const { join } = require("path");

const { readFileSync } = require("fs-extra");

const { createUIProp, createSpan } = require("../utils");

exports.style = readFileSync(
  join(__dirname, "../../static", "style.css"),
  "utf8"
);

exports.template = readFileSync(
  join(__dirname, "../../static", "template.html"),
  "utf8"
);

exports.$ = {
  steps: ".steps",
  cancel: ".cancel",
  confirm: ".confirm",
  content: ".content",
};

exports.methods = {
  onCancel() {
    _upload = false;
    Editor.Panel.close("crash-reporter");
  },
  onSubmit() {
    _upload = true;
    Editor.Panel.close("crash-reporter");
  },
  refresh(e) {
    showUI(e);
  },
};

let _this;
let _upload = false;
let _mustBeUpload = false;
exports.ready = async function () {
  _this = this;
  _upload = false;
  _this.$.cancel.addEventListener("click", this.onCancel);
  _this.$.confirm.addEventListener("click", this.onSubmit);

  _mustBeUpload = await Editor.Profile.getConfig(
    "utils",
    "features.must-crash-report"
  );

  showUI(
    await Editor.Message.request("crash-reporter", "query-crash-report-infos")
  );
};
let _uiProcess;
let _uiGoneDetails;
let _uiTimeCrash;
const _uiSpan = [];
let _uiTotalTime;
let _uiVersion;
let _uiUserAgent;
let _uiCID;
let _uiUID;
let _uiArch;
let _uiPlatform;
let _uiOSVersion;
let _uiTotalmem;
let _uiFreemem;
let _uiPackages;
let _uiCpus;
function showUI(e) {
  var [t] = e;
  let i = "";
  let s = "";

  e.forEach((e) => {
    i += e.process + " ";
    s += `${e.process} & reason: ${e.details.reason} & exitCode: ${e.details.exitCode} <br>`;
  });

  _uiProcess = createUIProp("Process:", i, _this.$.content, _uiProcess);

  _uiGoneDetails = createUIProp(
    "Gone Details:",
    s,
    _this.$.content,
    _uiGoneDetails
  );

  _uiSpan[0] = createSpan(_this.$.content, _uiSpan[0]);

  _uiTimeCrash = createUIProp(
    "Time Crash:",
    String(t.time),
    _this.$.content,
    _uiTimeCrash
  );

  _uiTotalTime = createUIProp(
    "Total Time:",
    String(t.uptime),
    _this.$.content,
    _uiTotalTime
  );

  _uiSpan[1] = createSpan(_this.$.content, _uiSpan[1]);

  _uiVersion = createUIProp("Version:", t.version, _this.$.content, _uiVersion);

  _uiUserAgent = createUIProp(
    "UserAgent:",
    t.userAgent,
    _this.$.content,
    _uiUserAgent
  );

  _uiCID = createUIProp("Client ID:", t.cid, _this.$.content, _uiCID);

  _uiUID = createUIProp("User ID:", t.uid, _this.$.content, _uiUID);

  _uiSpan[2] = createSpan(_this.$.content, _uiSpan[2]);

  _uiArch = createUIProp("Arch:", t.arch, _this.$.content, _uiArch);

  _uiPlatform = createUIProp(
    "Platform:",
    t.platform,
    _this.$.content,
    _uiPlatform
  );

  _uiOSVersion = createUIProp(
    "osVersion:",
    t.osVersion,
    _this.$.content,
    _uiOSVersion
  );

  _uiTotalmem = createUIProp(
    "Totalmem:",
    String(t.totalmem),
    _this.$.content,
    _uiTotalmem
  );

  _uiFreemem = createUIProp(
    "Freemem:",
    String(t.freemem),
    _this.$.content,
    _uiFreemem
  );

  _uiSpan[3] = createSpan(_this.$.content, _uiSpan[3]);

  _uiPackages = createUIProp(
    "Packages:",
    JSON.stringify(t.packages),
    _this.$.content,
    _uiPackages
  );

  _uiSpan[4] = createSpan(_this.$.content, _uiSpan[4]);

  _uiCpus = createUIProp(
    "Cpus:",
    JSON.stringify(t.cpus),
    _this.$.content,
    _uiCpus
  );
}
exports.beforeClose = () => {};

exports.close = async function () {
  _this.$.cancel.removeEventListener("click", this.onCancel);
  _this.$.confirm.removeEventListener("click", this.onSubmit);

  if (_upload || _mustBeUpload) {
    Editor.Message.broadcast("crash-reporter:upload", _this.$.steps.value);
  }

  _this = undefined;
  _upload = false;
};
