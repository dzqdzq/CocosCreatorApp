Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
const fs_1 = require("fs");

const { readFileSync } = fs_1;

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const vueTemplate = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../static/contributions/preferences.html"),
  "utf8"
);

const DevicePreferenceVM = Vue.extend({
  name: "DevicePreferenceVM",
  data() {
    return {
      config: { builtin: [], custom: [], enable: {} },
      deviceType: "",
      num: -1,
      device: { name: "", width: 0, height: 0, ratio: 0 },
      editType: "",
    };
  },
  computed: {
    confirmButtonDisabled() {
      return (
        !this.device.name ||
        this.device.height === 0 ||
        this.device.width === 0 ||
        this.device.ratio === 0
      );
    },
    deviceFormDisabled() {
      return this.deviceType === "builtin" && this.editType !== "add";
    },
  },
  mounted() {
    this.refresh();
  },
  methods: {
    async refresh() {
      var e = await Editor.Profile.getConfig(
        "device",
        "deviceConfig",
        "default"
      );

      var i = await Editor.Profile.getConfig("device", "custom", "global");
      var t = await Editor.Profile.getConfig("device", "enableDevice");
      this.config.builtin = e;

      if (i) {
        this.config.custom = i;
      }

      if (t) {
        this.config.enable = t;
      }

      this.chooseDevice("builtin", 0);
    },
    chooseDevice(e, i) {
      if (this.editType !== "add") {
        this.editType = "";
        this.deviceType = e;
        this.num = i;
        this.updateDevice();
      }
    },
    updateDevice() {
      requestAnimationFrame(() => {
        var e;

        if (
          this.config[this.deviceType] &&
          this.config[this.deviceType][this.num]
        ) {
          e = this.config[this.deviceType][this.num];
          this.device.name = e.name;
          this.device.width = e.width;
          this.device.height = e.height;
          this.device.ratio = e.ratio;
        }
      });
    },
    onDeviceChange(e) {
      var e = e.target;
      var i = e.getAttribute("path");

      if (
        i &&
        this.device[i] !== undefined &&
        ((e = e.value), (this.device[i] = e), this.editType !== "add")
      ) {
        if (this.isDeviceChanged()) {
          this.editType = "update";
        } else {
          this.editType = "";
        }
      }
    },
    createDevice() {
      this.device.name = Editor.I18n.t("device.markname");
      this.device.width = 0;
      this.device.height = 0;
      this.device.ratio = 1;
      this.editType = "add";
    },
    confirmDevice() {
      if (this.editType === "add") {
        if (this.isDeviceNameExist(this.device.name)) {
          return void Editor.Dialog.warn(
            Editor.I18n.t("device.invalid.exists")
          );
        }
        this.config.custom.push(JSON.parse(JSON.stringify(this.device)));
        this.editType = "";
        this.chooseDevice("custom", this.config.custom.length - 1);
      } else {
        var e = this.config.custom[this.num];
        if (!e) {
          return;
        }
        if (
          e.name !== this.device.name &&
          this.isDeviceNameExist(this.device.name)
        ) {
          return void Editor.Dialog.warn(
            Editor.I18n.t("device.invalid.exists")
          );
        }
        e.name = this.device.name;
        e.width = this.device.width;
        e.height = this.device.height;
        e.ratio = this.device.ratio;
        this.editType = "";
      }
      Editor.Profile.setConfig(
        "device",
        "custom",
        this.config.custom,
        "global"
      );
    },
    cancelCreate() {
      this.editType = "";
      var e = this.config[this.deviceType][this.num];
      this.device.name = e.name;
      this.device.width = e.width;
      this.device.height = e.height;
      this.device.ratio = e.ratio;
    },
    deleteDevice(e) {
      var i;

      if (this.config.custom[e]) {
        i = this.config.custom[e].name;
        this.config.custom.splice(e, 1);

        this.deviceType === "custom" &&
          e <= this.num &&
          (this.config.custom.length === 0
            ? this.chooseDevice("builtin", 0)
            : this.chooseDevice("custom", this.num - 1));

        Editor.Profile.setConfig(
          "device",
          "custom",
          this.config.custom,
          "global"
        );

        delete this.config.enable[i];

        Editor.Profile.setConfig(
          "device",
          "enableDevice",
          this.config.enable,
          "global"
        );
      }
    },
    async switchEnable(e, i) {
      this.config.enable[i] = e;

      await Editor.Profile.setConfig(
        "device",
        "enableDevice",
        this.config.enable,
        "global"
      );

      Editor.Message.broadcast("device:devices-changed");
    },
    isDeviceNameExist(i) {
      return (
        this.config.builtin.some((e) => i === e.name) ||
        this.config.custom.some((e) => i === e.name)
      );
    },
    isDeviceChanged() {
      var e = this.config.custom[this.num];
      let i = false;
      for (const t in e) {
        if (e[t] !== this.device[t]) {
          i = true;
        }
      }
      return i;
    },
  },
  template: vueTemplate,
});

function ready() {
  var e = this;
  e.vm?.$destroy();
  e.vm = new DevicePreferenceVM();
  e.vm.$mount(e.$.container);
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}
async function exportConfig() {
  var e = {};

  e.custom = {
    type: "global",
    value: await Editor.Message.request(
      "preferences",
      "query-config",
      "device",
      "custom"
    ),
  };

  e.enableDevice = {
    type: "global",
    value: await Editor.Message.request(
      "preferences",
      "query-config",
      "device",
      "enableDevice"
    ),
  };

  return e;
}
async function importConfig(e) {
  if (e.custom) {
    await Editor.Message.request(
      "preferences",
      "set-config",
      "device",
      "custom",
      e.custom.value,
      "global"
    );
  }

  if (e.enableDevice) {
    await Editor.Message.request(
      "preferences",
      "set-config",
      "device",
      "enableDevice",
      e.enableDevice.value,
      "global"
    );
  }
}

exports.style = readFileSync(join(__dirname, "./preferences.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
