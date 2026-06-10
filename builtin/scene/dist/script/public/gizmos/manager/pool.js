var __importDefault =
  (this && this.__importDefault) ||
  ((o) => (o && o.__esModule ? o : { default: o }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.GizmoPool = undefined;

const { getGizmoProperty, setGizmoProperty } = require("./data");

const gizmo_defines_1 = __importDefault(require("../gizmo-defines"));
class GizmoPool {
  _transformPool = {};
  _componentsPool = {};
  _iconPool = {};
  _persistentPool = {};
  _getPool(o) {
    var t = { pool: {}, typeDefs: {} };
    switch (o) {
      case "component": {
        t.pool = this._componentsPool;
        t.typeDefs = gizmo_defines_1.default.components;
        break;
      }
      case "icon": {
        t.pool = this._iconPool;
        t.typeDefs = gizmo_defines_1.default.iconGizmo;
        break;
      }
      case "persistent": {
        t.pool = this._persistentPool;
        t.typeDefs = gizmo_defines_1.default.persistentGizmo;
      }
    }
    return t;
  }
  unmountGizmo(o) {
    if (o.target && getGizmoProperty("component", o.target) === o) {
      setGizmoProperty("component", o.target, null);
    }

    if (o.target && getGizmoProperty("icon", o.target) === o) {
      setGizmoProperty("icon", o.target, null);
    }

    if (o.target && getGizmoProperty("persistent", o.target) === o) {
      setGizmoProperty("persistent", o.target, null);
    }

    if (o) {
      o.target = null;
    }
  }
  forEachInstanceList(o, t, e) {
    o = this._getPool(o).pool;
    o = o[t];

    if (o) {
      o.forEach(e);
    }
  }
  createGizmo(o, t) {
    var { pool: o, typeDefs } = this._getPool(o);
    if (!o || !typeDefs) {
      return null;
    }
    typeDefs = typeDefs[t];
    let r = o[t];

    if ((r = r || (o[t] = [])) && r[0] && r[0].constructor !== typeDefs) {
      r.forEach((o) => {
        o.destroy();
      });

      r.length = 0;
    }

    if (!typeDefs) {
      return null;
    }

    for (const s of r) {
      if (!s.visible()) {
        return s;
      }
    }
    const s = new typeDefs(null);
    r.push(s);
    return s;
  }
  destroyGizmo(s) {
    this.unmountGizmo(s);
    s.destroy();

    [
      this._transformPool,
      this._componentsPool,
      this._iconPool,
      this._persistentPool,
    ].forEach((o) => {
      for (const r in o) {
        var t;
        var e = o[r];

        if (e && -1 !== (t = e.indexOf(s))) {
          e.splice(t, 1);
        }
      }
    });
  }
  clearAllGizmos() {
    [
      this._transformPool,
      this._componentsPool,
      this._iconPool,
      this._persistentPool,
    ].forEach((o) => {
      for (const e in o) {
        var t = o[e];

        if (t) {
          t.forEach((o) => {
            this.unmountGizmo(o);
            o.destroy();
          });
        }
      }
    });
  }
}
exports.GizmoPool = GizmoPool;
