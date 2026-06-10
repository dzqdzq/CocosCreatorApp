Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.name = undefined;
exports.template = undefined;

exports.created = created;
exports.data = data;

const { readFileSync, existsSync } = require("fs-extra");

const { join, basename } = require("path");

const huawei = require("./lib/huawei");
const phone_1 = require("../../utils/phone");
const log_1 = require("../../utils/log");
const info_1 = require("../../utils/info");
async function created() {
  this.register_handler();
  await huawei.checkRuntimeVersion();
  this.rpkPath = await huawei.getRpkPath();
}
function data() {
  return { rpkPath: "", params: "", huaweiPlugin: huawei };
}

exports.template = readFileSync(
  join(__dirname, "../../../static/plugins/huawei/ui.html"),
  "utf-8"
);

exports.name = "huawei-runtime";

exports.computed = {
  runDisabled() {
    return this.huaweiPlugin.state !== huawei.RUNTIME_STATE.free;
  },
  cancelDisabled() {
    return this.huaweiPlugin.state !== huawei.RUNTIME_STATE.free;
  },
};

exports.methods = {
  t(e) {
    return Editor.I18n.t(e);
  },
  paramsChange(e) {
    this.params = e.target.value;
  },
  rpkSelected(e) {
    this.rpkPath = e.target.value;
  },
  register_handler() {
    phone_1.phone.on("add_device", async (e) => {
      if (huawei.needToCreatLogcat(e)) {
        await huawei.checkRuntime();
        huawei.openLogcat(e);
      }
    });

    phone_1.phone.on("remove_device", (e) => {});
  },
  async installApk() {
    await huawei.installRuntime();
  },
  async onChooseRpkPath(e) {
    e.stopPropagation();
    e = await Editor.Dialog.select({
      path: join(Editor.Project.path, "/build"),
      type: "file",
      filters: [
        {
          name: this.t("runtime-dev-tools.huawei") + " runtime rpk",
          extensions: ["rpk"],
        },
      ],
    });

    if (e.filePaths && e.filePaths[0]) {
      this.rpkPath = e.filePaths[0];
    }
  },
  getLaunchParams() {
    var t = this;
    var e = ["--ei", "debugmode", "1"];

    if (t.uri) {
      e.push("--es");
      e.push("uri");
      e.push(encodeURIComponent(t.uri));
    }

    if (t.params) {
      try {
        JSON.parse(t.params);
        e.push("--es");
        e.push("params");
        e.push(encodeURIComponent(t.params));
      } catch (e) {
        log_1.log.warn(t.t("runtime-dev-tools.error_params"));
      }
    }

    return e.join(" ");
  },
  async launch() {
    var e = this;

    if (existsSync(e.rpkPath)) {
      await huawei.stopRuntime();
      await huawei.pushRpkToPhone(e.rpkPath);

      await huawei.startRuntimeWithRpk(
        basename(e.rpkPath),
        e.getLaunchParams()
      );
    } else {
      log_1.log.error(e.t("runtime-dev-tools.can_not_find_rpk"), e.rpkPath);

      info_1.info.error(e.t("runtime-dev-tools.can_not_find_rpk"), e.rpkPath);
    }
  },
  async stop() {
    await huawei.stopRuntime();
  },
};
