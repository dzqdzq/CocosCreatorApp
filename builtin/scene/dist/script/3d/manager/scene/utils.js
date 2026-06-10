Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
class SceneUtil {
  static Timeout = 60000 /* 6e4 */;
  timer;
  async showWarnDialog() {
    var e = Editor.I18n.t("scene.messages.loadSceneTimeoutTips.message");
    var t = Editor.I18n.t("scene.messages.loadSceneTimeoutTips.waiting");
    var r = Editor.I18n.t("scene.messages.loadSceneTimeoutTips.interrupt");
    return Editor.Dialog.warn(e, { buttons: [t, r], default: 0, cancel: 1 });
  }
  async loadSceneByUuid(a) {
    return new Promise((s, i) => {
      let n = false;
      clearTimeout(this.timer);

      cc_1.assetManager.loadAny(a, null, (e, t) => {
        clearTimeout(this.timer);
        n = true;

        if (e) {
          i(e);
        } else if (t instanceof cc_1.SceneAsset) {
          var t_scene = t.scene;
          t_scene._id = t._uuid;
          t_scene._name = t._name;
          try {
            cc.director.runSceneImmediate(t_scene);
            s(t_scene);
          } catch (e) {
            i(e);
          }
        } else {
          i(new Error("The asset " + a + " is not a scene"));
        }
      });

      const t = () =>
        setTimeout(async () => {
          var e;
          if (!n) {
            if ((e = await this.showWarnDialog()).response === 0 || !n) {
              this.timer = t();
            }

            return e.response === 1
              ? i(new Error("Open scene timeout"))
              : undefined;
          }
        }, SceneUtil.Timeout);
      this.timer = t();
    });
  }
  async loadSceneByNode(s) {
    return new Promise((e, t) => {
      clearTimeout(this.timer);
      const r = () =>
        setTimeout(async () => {
          if ((await this.showWarnDialog()).response === 1) {
            return t(new Error("Open scene timeout"));
          }
          this.timer = r();
        }, SceneUtil.Timeout);
      this.timer = r();
      try {
        cc.director.runSceneImmediate(s);
        clearTimeout(this.timer);
        e();
      } catch (e) {
        t(e);
      }
    });
  }
  async loadSceneByJson(e) {
    return new Promise((r, s) => {
      let i = false;
      clearTimeout(this.timer);

      cc_1.assetManager.loadWithJson(e, null, (e, t) => {
        clearTimeout(this.timer);
        i = true;

        if (e) {
          return s(e);
        }

        try {
          cc.director.runSceneImmediate(t);
          r(t);
        } catch (e) {
          s(e);
        }
      });

      const t = () =>
        setTimeout(async () => {
          var e;
          if (!i) {
            if ((e = await this.showWarnDialog()).response === 0 || !i) {
              this.timer = t();
            }

            return e.response === 1
              ? s(new Error("Open scene timeout"))
              : undefined;
          }
        }, SceneUtil.Timeout);
      this.timer = t();
    });
  }
  async loadPrefab(i) {
    return new Promise((r, s) => {
      cc_1.assetManager.loadAny(i, (e, t) =>
        e
          ? s(e)
          : t instanceof cc.Prefab
          ? void r(t)
          : s("Open resources are not prefabricated! - " + i)
      );
    });
  }
  async loadPrefabByJson(e) {
    return new Promise((r, s) => {
      cc_1.assetManager.loadWithJson(e, (e, t) =>
        e
          ? s(e)
          : t instanceof cc.Prefab
          ? void r(t)
          : s("Open json are not prefabricated! - ")
      );
    });
  }
  unloadPrefab(e) {
    e = cc_1.assetManager.assets.get(e);

    if (e) {
      cc_1.assetManager.releaseAsset(e);
    }
  }
  recursiveNode(e, t) {
    t(e);

    if (e.children) {
      e.children.forEach((e) => this.recursiveNode(e, t));
    }
  }
}
exports.default = new SceneUtil();
