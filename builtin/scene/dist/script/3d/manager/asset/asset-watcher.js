Object.defineProperty(exports, "__esModule", { value: true });
exports.assetWatcherManager = undefined;
const cc_1 = require("cc");

const { isValid } = cc_1;

const callbacks_invoker_1 = require("../../../utils/callbacks-invoker");
const ASSET_PROPS = "A$$ETprops";
const DELIMETER = cc_1.CCClass.Attr.DELIMETER;
const ASSET_PROPS_KEY = ASSET_PROPS + DELIMETER + ASSET_PROPS;

const assetListener = (cc_1.assetManager.assetListener =
  new callbacks_invoker_1.CallbacksInvoker());

function removeCaches(e) {
  if (cc_1.assetManager.assets.has(e)) {
    cc_1.assetManager.releaseAsset(cc_1.assetManager.assets.get(e));
  }
}
function getPropertyDescriptorAndOwner(e, t) {
  while (e) {
    var s = Object.getOwnPropertyDescriptor(e, t);
    if (s) {
      return { owner: e, pd: s };
    }
    e = Object.getPrototypeOf(e);
  }

  return null;
}
function forceSetterNotify(e, s) {
  var t = getPropertyDescriptorAndOwner(e.prototype, s);
  if (t) {
    if (!t.owner._modifiedSetters || !t.owner._modifiedSetters.includes(s)) {
      var t_pd = t.pd;
      if (t_pd.configurable === false) {
        console.warn(
          "Failed to register notifier for %s.%s",
          cc_1.js.getClassName(e),
          s
        );
      } else if ("value" in t_pd) {
        console.warn(
          "Cannot watch instance variable of %s.%s",
          cc_1.js.getClassName(e),
          s
        );
      } else {
        const t_pd_set = t_pd.set;

        t_pd.set = function (e, t) {
          t_pd_set.call(this, e, t);

          if (this._watcherHandle) {
            e = getUuidsOfPropValue(this[s]);
            this._watcherHandle.changeWatchAsset(s, e);
          }
        };

        Object.defineProperty(t.owner, s, t_pd);

        if (t.owner._modifiedSetters) {
          t.owner._modifiedSetters.push(s);
        } else {
          t.owner._modifiedSetters = [s];
        }
      }
    }
  } else {
    console.warn(
      "Failed to get property descriptor of %s.%s",
      cc_1.js.getClassName(e),
      s
    );
  }
}
function invokeAssetSetter(t, s, r) {
  if ((t = t.deref())) {
    var a = cc_1.js.getPropertyDescriptor(t, s);
    let e = r;
    if (a && a.get) {
      var n = a.get.call(t);
      if (Array.isArray(n)) {
        for (let e = 0; e < n.length; e++) {
          if (n[e] && r && n[e]._uuid === r._uuid) {
            n[e] = r;
          }
        }
        e = n;
      }
      if (a.set) {
        try {
          if (Array.isArray(n)) {
            a.set.call(t, new Array(e.length).fill(null), true);
          }
        } catch (e) {
          console.error(e);
        }
        a.set.call(t, e, true);

        if (r._uuid) {
          cce.Asset.emit("asset-refresh", r._uuid);
        }
      }
    } else {
      if (
        t &&
        t.constructor &&
        t.constructor.name === "AnimationController" &&
        s === "graph"
      ) {
        t[s] = e;
      }
    }
  }
}
function getUuidsOfPropValue(e) {
  var t = [];
  if (Array.isArray(e)) {
    for (const s of e) {
      if (s instanceof cc_1.Asset && s._uuid) {
        t.push(s._uuid);
      }
    }
  } else {
    if (e instanceof cc_1.Asset && e._uuid) {
      t.push(e._uuid);
    }
  }
  return t;
}
class AssetWatcher {
  owner = null;
  watchingInfos = Object.create(null);
  constructor(e) {
    this.owner = e;
  }
  start() {
    var e = this.owner;
    var e_constructor = e.constructor;
    for (const a of cc_1.CCClass.Attr.getClassAttrs(e_constructor)[
      ASSET_PROPS_KEY
    ].assetProps) {
      var [s] = a;
      forceSetterNotify(e_constructor, s);
      var r = e[s];
      var r = getUuidsOfPropValue(r);
      this.registerListener(r, e, s);
    }
  }
  stop() {
    for (const t in this.watchingInfos) {
      if (t in this.watchingInfos) {
        var e = this.watchingInfos[t];
        if (e) {
          for (const s of e.uuids) {
            assetListener.off(s, e.callback);
          }
        }
      }
    }
    this.watchingInfos = Object.create(null);
  }
  changeWatchAsset(e, t) {
    this.unRegisterListener(e);

    if (t.length > 0) {
      this.registerListener(t, this.owner, e);
    }
  }
  registerListener(e, t, s) {
    this.unRegisterListener(s);
    var r = invokeAssetSetter.bind(null, new WeakRef(t), s);
    for (const a of e) {
      assetListener.on(a, r);
    }
    this.watchingInfos[s] = { uuids: e, callback: r };
  }
  unRegisterListener(e) {
    var t = this.watchingInfos[e];
    if (t) {
      for (const s of t.uuids) {
        assetListener.off(s, t.callback);
      }
      this.watchingInfos[e] = undefined;
    }
  }
}
function parseAssetProps(s, r, a) {
  let n = null;
  var e = cc_1.js.getClassName(s);
  if (a.includes(e)) {
    return null;
  }
  if (!s.__props__) {
    return null;
  }
  var c = cc_1.CCClass.Attr.getClassAttrs(s);
  a = a.concat(e);
  for (let e = 0, t = s.__props__; e < t.length; e++) {
    var o;
    var i = t[e];
    var l = i + DELIMETER;

    if (
      (c[l + "hasSetter"] && c[l + "hasGetter"]) ||
      (s.name === "AnimationController" && i === "graph")
    ) {
      l = c[l + "ctor"];
      o = cc_1.js.isChildClassOf(l, cc_1.Asset);
      i = r.concat(i);

      o
        ? n
          ? n.push(i)
          : (n = [i])
        : cc_1.CCClass._isCCClass(l) &&
          (o = parseAssetProps(l, i, a)) &&
          (n = n ? n.concat(o) : o);
    }
  }
  return n;
}
function getAssetPropsData(e) {
  let t = cc_1.CCClass.Attr.getClassAttrs(e.constructor)[ASSET_PROPS_KEY];
  if (t === undefined) {
    var s = parseAssetProps(e.constructor, [], []);
    t = {};

    if (s) {
      for (const r of s) {
        if (r.length > 1) {
          if (t.nestedAssetProps) {
            t.nestedAssetProps.push(r);
          } else {
            t.nestedAssetProps = [r];
          }
        } else if (r.length === 1) {
          if (t.assetProps) {
            t.assetProps.push(r);
          } else {
            t.assetProps = [r];
          }
        }
      }
    }

    cc_1.CCClass.Attr.setClassAttr(e.constructor, ASSET_PROPS, ASSET_PROPS, t);
  }
  return t;
}
function getPropObj(e, t) {
  let s = e;
  for (let e = 0; e < t.length; e++) {
    var r = t[e];
    if (!(s = s && s[r])) {
      return null;
    }
  }
  return s;
}
function walkNestedAssetProp(e, t) {
  var s = getAssetPropsData(e);
  if (s && s.nestedAssetProps) {
    for (const a of s.nestedAssetProps) {
      var r = a.concat();
      r.pop();

      if (r.length > 0 && (r = getPropObj(e, r))) {
        t(r);
      }
    }
  }
}
function updateAsset(e, s, r = []) {
  if (cc_1.assetManager.references.has(e)) {
    var a = cc_1.assetManager.references.get(e);
    for (let e = 0, t = a.length; e < t; e++) {
      var n = a[e];
      var c = n[0].deref();
      var o = n[1].deref();
      var [, , n] = n;

      if (o && c) {
        if (!r.includes(c)) {
          if (isValid(c, true)) {
            c instanceof cc_1.Material &&
            (s instanceof cc_1.Texture2D || s instanceof cc_1.TextureCube)
              ? c.setProperty(n, s)
              : ((o[n] = s), c.onLoaded && c.onLoaded());

            assetListener.emit(c._uuid, c, s?.uuid);
            r.push(c);
            updateAsset(c._uuid, c, r);
          }
        }
      }
    }
  }
}
class AssetUpdater {
  lockNum = 0;
  timer = null;
  lock() {
    this.lockNum++;
    clearTimeout(this.timer);
  }
  unlock() {
    this.lockNum--;

    if (this.lockNum === 0) {
      this.timer = setTimeout(() => {
        this.update();
      }, 400);
    }
  }
  update() {
    this.queue.forEach((e, t) => {
      if (e) {
        assetListener.emit(t, e);
      } else {
        assetListener.emit(t, null);
        assetListener.off(t);
      }

      updateAsset(t, e);
    });

    this.queue.clear();
  }
  queue = new Map();
  add(e, t) {
    this.queue.set(e, t);
  }
  remove(e) {
    this.queue.delete(e);
  }
}
class AssetWatcherManager {
  updater = new AssetUpdater();
  initHandle(e) {
    var t = getAssetPropsData(e);
    e._watcherHandle = t && t.assetProps ? new AssetWatcher(e) : undefined;

    walkNestedAssetProp(e, (e) => {
      this.initHandle(e);
    });
  }
  startWatch(e) {
    if (!e._watcherHandle) {
      this.initHandle(e);
    }

    if (e._watcherHandle) {
      e._watcherHandle.start();
    }

    walkNestedAssetProp(e, (e) => {
      this.startWatch(e);
    });
  }
  stopWatch(e) {
    if (e._watcherHandle) {
      e._watcherHandle.stop();
    }

    walkNestedAssetProp(e, (e) => {
      this.stopWatch(e);
    });
  }
  isTextureCubeSubImageAsset(e) {
    return (
      e.endsWith("@74afd") ||
      e.endsWith("@8fd34") ||
      e.endsWith("@bb97f") ||
      e.endsWith("@7d38f") ||
      e.endsWith("@e9a6d") ||
      e.endsWith("@40c10")
    );
  }
  async onAssetChanged(s) {
    var e = await Editor.Message.request("asset-db", "query-asset-info", s);
    if (
      e &&
      (s.endsWith("@6c48a") &&
        ((e = s.indexOf("@")), removeCaches(s.substring(0, e))),
      assetListener.hasEventListener(s) ||
        cc_1.assetManager.references.has(s) ||
        this.isTextureCubeSubImageAsset(s))
    ) {
      const r = cc_1.assetManager.assets.get(s);
      removeCaches(s);
      this.updater.lock();

      cc_1.assetManager.loadAny(s, (e, t) => {
        if (e) {
          this.updater.unlock();
          console.error(e);
        } else {
          r && t && r.constructor.name !== t.constructor.name
            ? (this.updater.add(s, null),
              console.warn(
                "The asset type has been modified, and emptied the original reference in the scene."
              ))
            : this.updater.add(s, t);

          this.updater.unlock();
        }
      });
    }
  }
  onAssetDeleted(e, t) {
    var s = cc_1.assetManager.assets.get(e);

    if (s) {
      (s = new s.constructor()).initDefault(e);
      assetListener.emit(e, s);
    }

    removeCaches(e);
  }
}
const assetWatcherManager = new AssetWatcherManager();
exports.assetWatcherManager = assetWatcherManager;
