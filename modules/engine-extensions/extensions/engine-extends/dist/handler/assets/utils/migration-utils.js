var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationHook = undefined;
exports.Archive = undefined;
const fs_extra_1 = __importDefault(require("fs-extra"));
const archiveProxyWatchedTag = Symbol("ArchiveProxyWatched");
class Archive {
  constructor(e = null) {
    deIndex(e, e);
    this._originalData = e;
    this._root = Array.isArray(e) ? e[0] : e;
    const o = {
      get(e, r, t) {
        return r === archiveProxyWatchedTag ||
          null == (e = Reflect.get(e, r, t)) ||
          typeof e != "object"
          ? e
          : ((r = e[refTag] !== undefined ? e[refTag] : e), new Proxy(r, o));
      },
      set(e, r, t, o) {
        var a = typeof t == "object" && t ? t[archiveProxyWatchedTag] ?? t : t;

        var t =
          !Array.isArray(t) && typeof t == "object" && t ? { [refTag]: a } : a;

        return Reflect.set(e, r, t, o);
      },
    };
    this._proxyHandler = o;
  }
  get root() {
    return new Proxy(this._root, this._proxyHandler);
  }
  get(e) {
    var e =
      typeof e == "object" && e ? e[archiveProxyWatchedTag] ?? e : this._root;

    var r = [e];
    reIndex(e, r);
    return r.length === 1 ? r[0] : r;
  }
  addObject() {
    return new Proxy({}, this._proxyHandler);
  }
  addTypedObject(e) {
    return new Proxy({ __type__: e }, this._proxyHandler);
  }
  visitTypedObject(e, r) {
    var t = new Set();
    this._visitTypedObject(e, r, this._root, t);
  }
  clearObject(e) {
    for (const r of Object.keys(e)) {
      if (r !== "__type__") {
        delete e[r];
      }
    }
  }
  _root;
  _originalData;
  _proxyHandler;
  _visitTypedObject(r, t, e, o) {
    if (Array.isArray(e)) {
      e.forEach((e) => {
        this._visitTypedObject(r, t, e, o);
      });
    } else if (e && typeof e == "object") {
      if (e[refTag]) {
        this._visitTypedObject(r, t, e[refTag], o);
      } else if (!o.has(e)) {
        o.add(e);

        if (e.__type__ === r) {
          t(new Proxy(e, this._proxyHandler));
        }

        for (const a of Object.values(e)) {
          this._visitTypedObject(r, t, a, o);
        }
      }
    }
  }
}
exports.Archive = Archive;
const refTag = Symbol("Ref");
function deIndex(e, r) {
  var t;

  if (Array.isArray(e)) {
    e.forEach((e) => {
      deIndex(e, r);
    });
  } else if (e && typeof e == "object") {
    if (typeof e.__id__ == "number") {
      t = e.__id__;
      e[refTag] = r[t];
    } else {
      Object.values(e).forEach((e) => deIndex(e, r));
    }
  }
}
function reIndex(e, r) {
  var t;
  var o;
  var a;

  if (Array.isArray(e)) {
    e.forEach((e) => {
      reIndex(e, r);
    });
  } else if (e && typeof e == "object") {
    if ((o = (t = e)[refTag])) {
      if (0 <= (a = r.indexOf(o))) {
        t.__id__ = a;
      } else {
        t.__id__ = r.length;
        r.push(o);
        reIndex(o, r);
      }
    } else {
      Object.values(e).forEach((e) => reIndex(e, r));
    }
  }
}
exports.migrationHook = {
  async pre(e) {
    e.getSwapSpace().json = await fs_extra_1.default.readJSON(e.source);
  },
  async post(e, r) {
    var t = e.getSwapSpace();

    if (r > 0) {
      r = JSON.stringify(t.json, null, 2);
      await fs_extra_1.default.writeFile(e.source, r);
    }

    delete t.json;
  },
};
