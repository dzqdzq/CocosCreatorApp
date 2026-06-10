var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const ObjectWalker = __importStar(require("../missing-reporter/object-walker"));

const { compressUuid } = require("../utils/uuid");

const lodash = require("lodash");
class NodeManager extends events_1.EventEmitter {
  allow = false;
  _map = {};
  add(e, t) {
    if (this.allow) {
      this._map[e] = t;
      try {
        this.emit("add", e, t);
      } catch (e) {
        console.error(e);
      }
    }
  }
  remove(e) {
    if (this.allow && this._map[e]) {
      var t = this._map[e];
      delete this._map[e];
      try {
        this.emit("remove", e, t);
      } catch (e) {
        console.error(e);
      }
    }
  }
  clear() {
    if (this.allow) {
      this._map = {};
    }
  }
  getNode(e) {
    return this._map[e] ?? null;
  }
  getNodes() {
    return this._map;
  }
  getNodesByAsset(s) {
    const a = [];

    if (s) {
      ObjectWalker.walkProperties(
        cc.director.getScene().children,
        (e, t, r, i) => {
          let n = false;

          if (r._uuid) {
            n = r._uuid.includes(s) || compressUuid(r._uuid, true).includes(s);
          }

          let u = false;

          if (r.__scriptUuid) {
            u =
              r.__scriptUuid.includes(s) ||
              compressUuid(r.__scriptUuid, false).includes(s);
          }

          if (
            (n || u) &&
            (r = lodash.findLast(i, (e) => e instanceof cc.Node)) &&
            !a.includes(r.uuid)
          ) {
            a.push(r.uuid);
          }
        },
        { dontSkipNull: false, ignoreSubPrefabHelper: true }
      );
    }

    return a;
  }
  getNodesInScene() {
    return this._map;
  }
  changeNodeUUID(e, t) {
    var r;

    if (e !== t && (r = this._map[e])) {
      r._id = t;
      this._map[t] = r;
      delete this._map[e];
    }
  }
}
exports.default = NodeManager;
