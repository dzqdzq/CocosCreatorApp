var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

const electron_profile_1 = __importDefault(require("@base/electron-profile"));
const profile = electron_profile_1.default.load("global://editor/ui-kit.json");

exports.template = readFileSync(
  join(__dirname, "../../../static/settings/general.html"),
  "utf8"
);
exports.props = ["language"];
const defaultStep = 0.1;

function data() {
  var e = profile.get("num-input.wheel_enable") ?? true;
  var t = Number(profile.get("num-input.step")) || defaultStep;
  var r = Editor.Theme.getList();
  r.splice(r.indexOf("light"), 1);

  return {
    settings: {
      language: Editor.I18n.getLanguage(),
      step: t < 0 ? defaultStep : t,
      theme_color: Editor.Theme.use(),
      preview_ip: "127.0.0.1",
      server_port: 7456,
      wheel_enable: e,
    },
    ipList: [],
    themeList: r,
  };
}
async function mounted() {
  if (Editor.Startup.__protected__.ready.package) {
    await this._serviceSettingPrepare();
  } else {
    Editor.Startup.__protected__.once(
      "package-ready",
      this._serviceSettingPrepare
    );
  }
}
exports.watch = {};
exports.computed = {};
exports.components = {};

exports.methods = {
  _onSettingChanged(e, t) {
    var r = e.target.value;
    if (this.settings[t] !== r) {
      this.settings[t] = r;

      switch (t) {
        case "language": {
          Editor.I18n.select(r);
          break;
        }
        case "step": {
          if (r <= 0) {
            profile.set("num-input.step", defaultStep);
          } else {
            profile.set("num-input.step", r);
          }

          profile.save();
          break;
        }
        case "theme_color": {
          break;
        }
        case "preview_ip": {
          Editor.Message.send("preview", "set-preview-ip", r);
          break;
        }
        case "server_port": {
          Editor.Profile.setConfig("server", "server_port", r, "local");
          break;
        }
        case "wheel_enable": {
          profile.set("num-input.wheel_enable", r);
        }
      }
    }
  },
  async _serviceSettingPrepare() {
    this.ipList = await Editor.Message.request("server", "query-sort-ip-list");

    this.settings.preview_ip = await Editor.Message.request(
      "preview",
      "get-preview-ip"
    );

    this.settings.server_port = await Editor.Message.request(
      "server",
      "query-port"
    );
  },
};
