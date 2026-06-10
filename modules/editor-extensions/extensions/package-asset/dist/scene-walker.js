Object.defineProperty(exports, "__esModule", { value: true });

const { readdirSync, readFileSync } = require("fs");

const { join, extname, dirname } = require("path");

const {
  trimDependUuid,
  findUUIDs,
  getDependScriptUuid,
} = require("./common/utlis");

module.paths.push(join(Editor.App.path, "node_modules"));
const fs_extra_1 = require("fs-extra");

const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
exports.methods = {
  _dependMap: [],
  _assetsMap: [],
  _depends: [],
  _tree: [],
  _flattenedTree: [],
  _databaseAssets: [],
  _includeDepend: false,
  getUuid(e) {
    var t = e.split("@");
    return (e = t.length > 1 ? t[0] : e);
  },
  async getExportAssets(e) {
    this._includeDepend = e.includeDepend;
    e = e.uuids;
    await this._reset();
    for (const i of e) {
      await this._step(i);
    }
    e = await Editor.Message.request("assets", "unstaging");
    let t = "type";

    if (e) {
      t = e.sortType;
    }

    for (let e = 0; e < this._tree.length; ++e) {
      var s = this._tree[e];
      await this.pruningTree(e, s, this._tree);
    }
    await this.sortTree(this._tree, t);
    return this._tree;
  },
  async pruningTree(e, t, s) {
    if (t.detail.isDirectory) {
      var i = [];
      for (let e = 0; e < t.children.length; ++e) {
        var r = t.children[e];

        if (r.detail.isDirectory) {
          if (r.children.length === 0) {
            i.push(e);
          } else {
            this.pruningTree(e, r, t);
          }
        }
      }
      for (const a of i) {
        t.children.splice(a, 1);
      }

      if (t.children.length === 0) {
        (Array.isArray(s) ? s : s.children).splice(e, 1);
      }
    }
  },
  async sortTree(e, s) {
    e.sort((e, t) => {
      e = e.detail.asset;
      t = t.detail.asset;
      return e.isDirectory !== true || t.isDirectory
        ? e.isDirectory || t.isDirectory !== true
          ? s === "type" && e.importer !== t.importer
            ? collator.compare(e.importer, t.importer)
            : collator.compare(e.path, t.path)
          : 1
        : -1;
    });
    for (const t of e) {
      this.sortTree(t.children, s);
    }
  },
  async _reset() {
    this._tree.length = 0;
    this._flattenedTree.length = 0;
    this._assetsMap.length = 0;
    this._dependMap = await this._getDependMap();
    this._depends.length = 0;
    this._databaseAssets.length = 0;
  },
  async createItem(e) {
    var t;
    var s;
    var i;
    var r = await Editor.Message.request("asset-db", "query-asset-info", e);
    return r
      ? ((t = r.isDirectory || r.importer === "database"),
        (s = this._depends.includes(r.uuid)),
        (i = !r.url.startsWith("db://internal")),
        {
          detail: {
            value: r.name,
            url: r.url,
            file: r.file,
            checked: true,
            extname: extname(r.file),
            isDirectory: t,
            legal: i,
            asset: r,
            depend: s,
            icon: r.importer,
          },
          showArrow: t,
          children: [],
        })
      : (console.log("can not found asset info by url: " + e), null);
  },
  async _getDependMap() {
    return Editor.Message.request("asset-db", "execute-script", {
      name: "package-asset",
      method: "getDependMap",
    });
  },
  async _addAssetTree(r) {
    this._assetsMap.push(r.uuid);
    var e = this._flattenedTree.find((e) => e.detail.url === r.url);
    if (!e) {
      var a = r.url.slice("db://".length).split("/");
      let t;
      let e;
      let r_url = r.url;
      let i = "";

      while (a.length !== 0) {
        a.pop();

        if (r_url === "db://assets" && i) {
          t = this._flattenedTree.find((e) => e.detail.url === i);

          if (!this._tree.find((e) => e.detail.url === t.detail.url)) {
            this._tree.push(t);
          }

          break;
        }

        if ((t = this._flattenedTree.find((e) => e.detail.url === r_url))) {
          var d = t.children.find((e) => e.detail.url === i);
          if (!d && e && (t.children.push(e), t.detail.isDirectory)) {
            break;
          }
        } else {
          if (!(t = await this.createItem(r_url))) {
            continue;
          }
          if (!this._includeDepend && t.detail.depend) {
            break;
          }
          this._flattenedTree.push(t);

          if (e) {
            t.children.push(e);
          }
        }
        e = t;
        i = r_url;
        r_url = dirname(r_url);
      }
    }
  },
  hasNeedToDepend(e) {
    for (const t of this._databaseAssets) {
      if (e.includes(t.file)) {
        return false;
      }
    }
    return true;
  },
  _addDepend(e) {
    var t;
    var s = [];
    for (t of e) {
      t = trimDependUuid(t);

      if (!s.includes(t)) {
        s.push(t);
      }

      if (!this._depends.includes(t)) {
        this._depends.push(t);
      }
    }
    return s;
  },
  async _depend(t) {
    if (this.hasNeedToDepend(t)) {
      let e = [];
      for (const i of (this._dependMap.path || [])[t] || []) {
        var s = await Editor.Message.request("asset-db", "query-uuid", i);

        if (s) {
          e.push(s);
        }
      }
      t = (this._dependMap.uuid || [])[t] || [];
      e = e.concat(t);
      for (const r of (e = this._addDepend(e))) {
        await this._step(r);
      }
    }
  },
  async getSourceAsset(e) {
    e = this.getUuid(e);
    return Editor.Message.request("asset-db", "query-asset-info", e);
  },
  async _step(e) {
    try {
      var t = await this.getSourceAsset(e);
      if (
        t &&
        !t.url.startsWith("db://internal") &&
        !this._assetsMap.includes(e)
      ) {
        if (t.importer === "database") {
          this._databaseAssets.push(t);
        }

        await this._addAssetTree(t);

        if (t.isDirectory || t.importer === "database") {
          for (const i of readdirSync(t.file)) {
            if (!i.endsWith(".meta") && !i.endsWith(".DS_Store")) {
              var s = t.path + "/" + i;
              const e = await Editor.Message.request(
                "asset-db",
                "query-uuid",
                s
              );
              await this._depend(t.file);

              if (e) {
                await this._step(e);
              }
            }
          }
        } else {
          if (t.type === "cc.Script") {
            await this._dependTypescript(t);
          } else {
            await this._dependUuid(t);
          }

          await this._depend(t.file);
        }
      }
    } catch (e) {
      console.log(e);
    }
  },
  async _dependUuid(e) {
    let t = "";
    let s = [];
    switch (e.importer) {
      case "terrain": {
        t = readFileSync(e.library[".json"], "utf8");
        break;
      }
      case "fbx":
      case "gltf": {
        var i = await this._dependGltfUuid(e);
        s = s.concat(i);
        break;
      }
      default: {
        t = readFileSync(e.file, "utf-8");
      }
    }
    s = (s = s.concat(t.match(/(?<=__uuid__": ")(.*)(?=")/g) || [])).concat(
      t.match(/(?<=uuid": ")(.*)(?=")/g) || []
    );
    let r = [];
    for (const d of (r = r.concat(
      t.match(/(?<=__type__": ")(.*)(?=")/g) || []
    ))) {
      var a = Editor.Utils.UUID.decompressUUID(d);

      if (!a.startsWith("cc.")) {
        s.push(a);
      }
    }
    for (const n of (s = this._addDepend(s))) {
      await this._step(n);
    }
  },
  async _dependGltfUuid(e) {
    const t = [];
    var e = e.file + ".meta";
    var e = (0, fs_extra_1.readJSONSync)(e);
    var e_userData = e.userData;
    if (!e_userData) {
      return [];
    }
    findUUIDs(e).forEach((e) => {
      e = e.split("@")[0];

      if (!t.includes(e)) {
        t.push(e);
      }
    });
    e = (e_userData.assetFinder && e_userData.assetFinder.materials) || [];
    for (const i of e) {
      if (!t.includes(i)) {
        t.push(i);
      }
    }
    for (const r of e_userData.imageMetas || []) {
      let e;

      if (
        (e = r.uri.includes("/")
          ? await Editor.Message.request("asset-db", "query-uuid", r.uri)
          : r.uri.split("@")[0])
      ) {
        if (!t.includes(e)) {
          t.push(e);
        }
      } else {
        console.log(`can not find uuid: ${e} by image uri: ` + r.uri);
      }
    }
    return t;
  },
  async _dependTypescript(e) {
    e = await getDependScriptUuid(e);
    for (const t of this._addDepend(e)) {
      await this._step(t);
    }
  },
};
