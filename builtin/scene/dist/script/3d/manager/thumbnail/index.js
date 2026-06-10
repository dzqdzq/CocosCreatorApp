var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const mesh_thumbnail_generator_1 = __importDefault(
  require("./mesh-thumbnail-generator")
);

const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ThumbnailManager {
  _generator;
  _projectCacheMap;
  constructor() {
    this._generator = new Map();
    this._projectCacheMap = new Map();
  }
  register(e, t) {
    if (this._generator.has(e)) {
      console.error("Thumbnail registed $type already");
    } else {
      this._generator.set(e, t);
    }
  }
  unRegister(e) {
    if (this._generator.has(e)) {
      this._generator.delete(e);
    }
  }
  async uuidToPath(e, t = null) {
    return this._projectCacheMap.has(e)
      ? this._projectCacheMap.get(e)
      : ((t = (t =
          t ||
          (await Editor.Message.request(
            "asset-db",
            "query-asset-info",
            e
          ))).url.match(/db:\/\/([^\/]*)/)[1]),
        path_1.default.join(
          Editor.Project.tmpDir,
          "asset-db",
          t,
          e.substr(0, 2),
          e,
          e + ".png"
        ));
  }
  async queryThumbnailSingle(e, t = "") {
    var s;

    if (t === "") {
      t = (await Editor.Message.request("asset-db", "query-asset-info", e))
        ?.type;
    }

    return this._generator.has(t)
      ? ((s = await this.uuidToPath(e)),
        fs_1.default.existsSync(s)
          ? s
          : this._generator.get(t).getThumbnail(e, s))
      : "";
  }
  async queryThumbnail(h, u = []) {
    return new Promise((n, e) => {
      (async () => {
        const t = [];
        var e = u.length === h.length;
        let s = 0;
        let h_length = h.length;
        for (const r in h) {
          const i = h[r];
          this.queryThumbnailSingle(i, e ? u[r] : "")
            .then((e) => {
              t[r] = e;

              if (++s === h_length) {
                n(t);
              }
            })
            .catch((e) => {
              --h_length;
              t[r] = "";
              console.debug("queryThumbnail fail", i, e);

              if (s === h_length) {
                n(t);
              }
            });
        }
      })();
    });
  }
  async delete(e, t) {
    if (this._generator.get(t.type)) {
      t = await this.uuidToPath(e, t);
      fs_1.default.existsSync(t) && fs_1.default.rmSync(t);
      this._projectCacheMap.delete(e);
    }
  }
  init() {
    if (!isPreviewProcess) {
      this.register("cc.Mesh", new mesh_thumbnail_generator_1.default());
      this.generateAll();
    }
  }
  assetChange(t, e, s) {
    this.queryThumbnailSingle(t, e?.type).then((e) => {
      this._projectCacheMap.set(t, e);
    });
  }
  async assetDelete(e, t) {
    t = t || (await Editor.Message.request("asset-db", "query-asset-info", e));
    this.delete(e, t);
  }
  async generateAll() {
    var e = await Editor.Message.request("asset-db", "query-assets", {
      importer: "gltf-mesh",
    });
    const a = [];
    const s = [];
    const r = this;

    const i = (t) => {
      if (r._generator.has(t.type)) {
        a.push(t.uuid);
        s.push(t.type);
      }

      if (t.subAssets) {
        Object.keys(t.subAssets).forEach(async (e) => {
          i(t.subAssets[e]);
        });
      }
    };

    e.forEach((e) => {
      i(e);
    });

    console.time("Thumbnail Generate Cost Time");

    this.queryThumbnail(a, s).then((t) => {
      for (let e = 0; e < a.length; e++) {
        var s = a[e];
        this._projectCacheMap.set(s, t[e]);
      }
      console.timeEnd("Thumbnail Generate Cost Time");
    });
  }
}
exports.default = new ThumbnailManager();
