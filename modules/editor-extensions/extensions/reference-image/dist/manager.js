var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.manager = undefined;
exports.Manager = undefined;
const package_json_1 = __importDefault(require("../package.json"));

const { existsSync } = require("fs-extra");

const {
  sendToSceneSwitchImage,
  sendToSceneSyncImageData,
  sendToSceneResetImage,
} = require("./utils");

function getDefaultImageData() {
  return { path: "", x: 0, y: 0, sx: 1, sy: 1, opacity: 50 };
}
const DefaultConfig = { images: [], sceneUUID: {}, scene: "" };
class Manager {
  constructor() {
    this._config = { images: [], sceneUUID: {}, scene: "" };
  }
  get config() {
    return this._config;
  }
  getCurrent() {
    const { scene, sceneUUID, images } = this.config;
    let s;

    if (scene && sceneUUID[scene]) {
      s = images.find((e) => e.path === sceneUUID[scene].path);
    } else if (images.length) {
      s = images[0];
    }

    return s ?? getDefaultImageData();
  }
  async init() {
    this._config =
      (await Editor.Profile.getConfig(package_json_1.default.name, "config")) ||
      DefaultConfig;

    this._config.scene = await Editor.Message.request(
      "scene",
      "query-current-scene"
    );
  }
  openPanel() {
    Editor.Panel.open(package_json_1.default.name);
  }
  async setSceneUUID(e) {
    this.config.scene = e;
    await this.refresh();
    e = await Editor.Profile.getConfig(package_json_1.default.name, "show");
    Editor.Message.broadcast(package_json_1.default.name + ":show", e);
  }
  async refresh() {
    await Editor.Profile.setConfig(
      package_json_1.default.name,
      "config",
      this.config
    );
    var e = this.getCurrent();

    if (this.config.images.length !== 0 && e.path) {
      await sendToSceneSwitchImage(e);
      await sendToSceneSyncImageData(e);
    } else {
      await sendToSceneResetImage();
    }

    this.notifyRefresh();
  }
  async addImage(e) {
    let t = "";
    var a;
    var s = [];
    for (const n of e) {
      if (this.config.images.every((e) => e.path !== n)) {
        a = getDefaultImageData();
        a.path = n;
        this.config.images.push(a);
        t = t || n;
      } else {
        s.push(n);
      }
    }
    var { scene: e, sceneUUID } = this.config;
    sceneUUID[e] = { path: t || s[s.length - 1] || "" };
    await this.refresh();
  }
  async removeImage(a) {
    var e;
    var t;
    var s;

    var i = this.config.images.findIndex((e) => e.path === a);

    if (-1 !== i) {
      this.config.images.splice(i, 1);

      Object.entries(this.config.sceneUUID).forEach(([e, t]) => {
        if (t.path === a) {
          this.config.sceneUUID[e].path = "";
        }
      });

      e = this.config.images.length;
      ({ scene: t, sceneUUID: s } = this.config);

      s[t] = {
        path:
          (null == (t = this.config.images[(s = e <= (s = i + 1) ? e - 1 : s)])
            ? undefined
            : t.path) || "",
      };

      await this.refresh();
    }
  }
  async switchImage(e, t) {
    var a = this.config.sceneUUID;
    var t = t || this.config.scene;

    if (a[t]) {
      a[t].path = e;
    } else {
      a[t] = { path: e };
    }

    await this.refresh();
  }
  async setImageData(e, t) {
    var a = this.getCurrent();

    if (e in a) {
      a[e] = t;
      await sendToSceneSyncImageData(this.getCurrent());

      t !== undefined &&
        (await Editor.Profile.setConfig(package_json_1.default.name, e, t));

      this.notifyRefresh();
    }
  }
  updateImagesState() {
    this.config.images = this.config.images.map((e) => {
      e.missing = !existsSync(e.path);
      return e;
    });
  }
  notifyRefresh() {
    this.updateImagesState();

    Editor.Message.send(
      package_json_1.default.name,
      "notify-refresh",
      this.config,
      this.getCurrent()
    );
  }
}
exports.Manager = Manager;
exports.manager = new Manager();
