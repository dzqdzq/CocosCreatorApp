Object.defineProperty(exports, "__esModule", { value: true });
exports.extension = undefined;
exports.config = undefined;
exports.act = undefined;
exports.$ = undefined;
exports.clear = clear;

const { join } = require("path");

function clear() {
  exports.$.panel = null;
  exports.$.searchInput = null;
  exports.$.toggleExpandIcon = null;
  exports.$.viewBox = null;
  exports.$.tree = null;
}

exports.$ = {
  panel: null,
  searchInput: null,
  toggleExpandIcon: null,
  viewBox: null,
  tree: null,
};

exports.act = { selects: [], twinkles: {}, twinkleQueue: [] };

exports.config = {
  protocol: "db://",
  assetHeight: 20,
  iconWidth: 16,
  nodeLeft: 6,
  assetTypes() {
    return this.buildinTypes.concat(this.extendDrop.types);
  },
  buildinTypes: [],
  extendMenu: {
    packages: {},
    show(e, t) {
      var a = [];
      var r = this.packages;
      let o;

      if (t) {
        o = {
          displayName: t.displayName,
          extends: t.extends,
          importer: t.importer,
          isDirectory: t.isDirectory,
          instantiation: t.instantiation,
          imported: t.imported,
          invalid: t.invalid,
          name: t.name,
          file: t.file,
          redirect: t.redirect,
          readonly: t.readonly,
          type: t.type,
          url: t.url,
          uuid: t.uuid,
        };
      }

      for (const i in r) {
        var s;
        var n = r[i];

        if (
          n &&
          (s = n[e]) &&
          n.methods[s] &&
          ((n = n.methods[s](o)), Array.isArray(n)) &&
          n.length
        ) {
          a.push({ type: "separator" });
          a.push(...n);
        }
      }
      return a;
    },
    attach(e, t) {
      exports.config.extendMenu.packages[e] = t;
    },
    detach(e) {
      delete exports.config.extendMenu.packages[e];
    },
  },
  extendDrop: {
    types: [],
    callbacks: {},
    attach(r, e) {
      e.forEach((a) => {
        var a_type = a.type;

        if (a_type && !this.types.includes(a_type)) {
          this.types.push(a_type);
          this.callbacks[a_type] || (this.callbacks[a_type] = {});
          this.callbacks[a_type][r] = async (e, t) =>
            Editor.Message.request(r, a.message, e, t);
        }
      });
    },
    detach(a, e) {
      e.forEach((e) => {
        const e_type = e.type;

        if (
          e_type &&
          this.types.includes(e_type) &&
          ((this.types = this.types.filter((e) => e !== e_type)),
          this.callbacks[e_type])
        ) {
          delete this.callbacks[e_type][a];
        }
      });
    },
  },
  extendSearch: {
    packages: {},
    show(e, t) {
      var a = {};
      var r = this.packages;
      for (const n in r) {
        var o;
        var s = r[n];

        if (
          s &&
          (o = s[e]) &&
          s.methods[o] &&
          ((s = s.methods[o](t)), Array.isArray(s)) &&
          s.length
        ) {
          a[n] = s;
        }
      }
      return a;
    },
    attach(e, t) {
      exports.config.extendSearch.packages[e] = t;
    },
    detach(e) {
      delete exports.config.extendSearch.packages[e];
    },
  },
  async update() {
    this.buildinTypes = await Editor.Message.request(
      "asset-db",
      "query-all-asset-types"
    );
  },
};

const localFileMap = {};
function generateLocalFileExtend() {
  exports.$.panel.localFileExtend = Object.values(localFileMap).flat();
}
exports.extension = {
  attach(a) {
    if (!a.invalid && a.info.contributions && a.info.contributions.assets) {
      try {
        var e;
        var t;
        var r;
        var o = a.info.contributions.assets;

        if (Array.isArray(o.drop)) {
          exports.config.extendDrop.attach(a.name, o.drop);
        }

        if (o.menu && typeof o.menu.methods == "string") {
          e = join(a.path, o.menu.methods);
          Editor.Module.__protected__.removeCache(e);
          s = e.replace(/^\w:/, (e) => e.toLocaleUpperCase());
          Editor.Module.__protected__.removeCache(s);
          o.menu.methods = Editor.Module.__protected__.requireFile(e);
          exports.config.extendMenu.attach(a.name, o.menu);
        }

        if (o.search && typeof o.search.methods == "string") {
          t = join(a.path, o.search.methods);
          Editor.Module.__protected__.removeCache(t);
          r = t.replace(/^\w:/, (e) => e.toLocaleUpperCase());
          Editor.Module.__protected__.removeCache(r);
          o.search.methods = Editor.Module.__protected__.requireFile(t);
          exports.config.extendSearch.attach(a.name, o.search);
        }

        exports.$.tree.update();
      } catch (e) {
        console.error(e);
      }
      var s = a.info.contributions.assets.localFile;

      if (Array.isArray(s)) {
        localFileMap[a.name] = s.map((e) => {
          var t = join(
            (e.type === "extension" ? a : Editor.Project).path,
            e.path
          );
          e.path = t;
          return e;
        });
      }

      generateLocalFileExtend();
    }
  },
  detach(e) {
    if (!e.invalid && e.info.contributions && e.info.contributions.assets) {
      try {
        var t = e.info.contributions.assets;

        if (Array.isArray(t.drop)) {
          exports.config.extendDrop.detach(e.name, t.drop);
        }

        if (t.menu) {
          exports.config.extendMenu.detach(e.name);
        }

        if (t.search) {
          exports.config.extendSearch.detach(e.name);
        }

        exports.$.tree.update();
      } catch (e) {
        console.error(e);
      }
      t = e.info.contributions.assets.localFile;

      if (Array.isArray(t)) {
        delete localFileMap[e.name];
      }

      generateLocalFileExtend();
    }
  },
};
