Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const Constant = require("./const");
const uploadInfo = require("./upload");
const list = require("./upload-list");

exports.name = Constant.PLATFORM;

exports.template = readFileSync(
  join(
    __dirname,
    "../../../static",
    `platform/${Constant.PLATFORM}/index.html`
  ),
  "utf8"
);

exports.created = () => {};
const components = {};

components["" + uploadInfo.name] = uploadInfo;
components["" + list.name] = list;
exports.components = components;

exports.data = () => ({
  compName: Constant.PLATFORM + "-upload",
  info: {},
});
