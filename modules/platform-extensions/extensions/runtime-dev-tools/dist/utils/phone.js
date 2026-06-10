Object.defineProperty(exports, "__esModule", { value: true });
exports.phone = undefined;
const adbKit = require("adbkit");

const { join } = require("path");

const base_1 = require("./base");
const log_1 = require("./log");
let ANDROID_SDK_PATH;
class Phone extends base_1.Base {
  adb;
  list = [];
  currentPhone;
  platform;
  options;
  constructor() {
    super();
  }
  get adbPath() {
    return join(ANDROID_SDK_PATH, "platform-tools", "adb");
  }
  init(e) {
    return Promise.resolve()
      .then(async () => {
        var t;

        if ((ANDROID_SDK_PATH = e)) {
          this.adb = adbKit.createClient({
            bin: this.adbPath,
            port: process.env.ANDROID_ADB_SERVER_PORT || 5037,
          });

          await this._initTracker();
        } else {
          t = Editor.I18n.t("runtime-dev-tools.android_sdk_error");
          console.error(t);
          log_1.log.error(t);
        }
      })
      .catch((t) => {
        log_1.log.error(t);
      });
  }
  async install(t, e) {
    try {
      await this.adb.install(t, e);
    } catch (t) {
      log_1.log.error(t);
    }
  }
  async shell(t, e) {
    try {
      log_1.log.debug("exec shell command => ", e);

      return await this.adb
        .shell(t, e)
        .then(adbKit.util.readAll)
        .then((t) => t.toString("utf-8").trim());
    } catch (t) {
      log_1.log.error(t);
    }
  }
  async push(t, e, r) {
    try {
      return this.adb.push(t, e, r);
    } catch (t) {
      log_1.log.error(t);
    }
  }
  async _initTracker() {
    try {
      var t = await this.adb.trackDevices();

      t.on("add", async (t) => {
        setTimeout(async () => {
          await this._addPhone(t);
        }, 500);
      });

      t.on("remove", (t) => {
        this._removePhone(t);

        setTimeout(() => {
          this.emit("remove_device", t.id);
        }, 500);
      });

      t.on("end", () => {});
    } catch (t) {
      log_1.log.error(t);
    }
  }
  async getPhoneList() {
    try {
      var e = await this.adb.listDevices();
      for (let t = 0; t < e.length; t++) {
        await this._addPhone(e[t]);
      }
      this.currentPhone = e[0];
      return this.list;
    } catch (t) {
      log_1.log.error(t);
    }
  }
  async getDeviceName(t) {
    t = await this.shell(t, "getprop ro.product.model");

    if (!t) {
      log_1.log.warn("获取不到设备型号");
    }

    return t;
  }
  async getDeviceManufacturer(t) {
    t = await this.shell(t, "getprop ro.product.brand");

    if (!t) {
      log_1.log.warn("获取不到设备制造商");
    }

    return t;
  }
  async isInstalled(t, e) {
    try {
      return await this.adb.isInstalled(t, e);
    } catch (t) {
      log_1.log.error(t);
    }
  }
  async _addPhone(e) {
    if (!this.list.find((t) => t.id === e.id)) {
      e.name = await this.getDeviceName(e.id);
      e.cp = await this.getDeviceManufacturer(e.id);
      this.list.push(e);
      this.list.length === 1 && (this.currentPhone = this.list[0]);
      this.emit("add_device", e.id);
    }
  }
  _removePhone(e) {
    var t = this.list.find((t) => t.id === e.id);

    if (
      t &&
      (this.list.splice(this.list.indexOf(t), 1),
      !this.list.includes(this.currentPhone))
    ) {
      this.currentPhone = null;
    }
  }
}
exports.phone = new Phone();
