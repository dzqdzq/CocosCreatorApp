Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = walk;
exports.walkAsync = walkAsync;
exports.getComponent = getComponent;
exports.walkNode = walkNode;
exports.walkNodeAsync = walkNodeAsync;
exports.getPrefabOfNode = getPrefabOfNode;
exports.isNestedPrefab = isNestedPrefab;
exports.walkPrefabInstances = walkPrefabInstances;

const { queryAsset } = require("@editor/asset-db");

const { readJSONSync } = require("fs-extra");

const { existsSync } = require("fs");

function walk(e, _) {
  if (Array.isArray(e)) {
    for (const n of e) {
      walk(n, _);
    }
  } else if (e && typeof e == "object") {
    if ("__uuid__" in e) {
      _(e);
    } else {
      for (const t of Object.values(e)) {
        walk(t, _);
      }
    }
  }
}
async function walkAsync(e, _) {
  if (Array.isArray(e)) {
    for (const n of e) {
      await walk(n, _);
    }
  } else if (e && typeof e == "object") {
    if ("__uuid__" in e) {
      await _(e);
    } else {
      for (const t of Object.values(e)) {
        await walk(t, _);
      }
    }
  }
}
function getComponent(e, _, n) {
  if (!(typeof _ != "number" || _ < 0)) {
    for (const a of e[_]._components) {
      var t = e[a.__id__];
      if (n.test(t.__type__)) {
        return t;
      }
    }
  }
  return null;
}
function walkNode(_, e, n) {
  var t;

  if (e && typeof e.__id__ == "number" && e.__id__ >= 0) {
    t = _[e.__id__];
    n(t, e);

    t._children &&
      t._children.forEach((e) => {
        walkNode(_, e, n);
      });
  }
}
async function walkNodeAsync(_, e, n) {
  if (e && typeof e.__id__ == "number" && !(e.__id__ < 0)) {
    var t = _[e.__id__];
    await n(t, e);

    if (t._children) {
      for (let e = 0; e < t._children.length; e++) {
        await walkNodeAsync(_, t._children[e], n);
      }
    }
  }
}
function getPrefabOfNode(e, _) {
  if (e && _[e]) {
    e = _[e];
    if (e && e.__type__ === "cc.Node") {
      e = e._prefab?.__id__;
      if (e && _[e]) {
        return _[e];
      }
    }
  }
}
function isNestedPrefab(e, _, n) {
  return (
    !(!e?._prefab?.__id__ || !_[e._prefab.__id__]?.asset?.__uuid__) &&
    _[e._prefab.__id__]?.asset?.__uuid__ !== n
  );
}
const walkPrefabInstanceChildren = async (_, n, t, a, s) => {
  for (let e = 0; e < _.length; e++) {
    var o = _[e];
    await walkNodeAsync(n, o, async (e, _) => {
      if (isNestedPrefab(e, n, s)) {
        await walkPrefabInstances(e, n, t, a);
      } else {
        a(e);

        e._components &&
          e._components.forEach((e) => {
            e = n[e.__id__];

            if (e) {
              a(e);
            }
          });
      }
    });
  }
};
async function walkPrefabInstances(e, n, t, a) {
  if (e?._prefab?.__id__) {
    a(e, n);
    var e = n[e._prefab.__id__];
    var s = e?.asset?.__uuid__;
    if (s) {
      var o = queryAsset(s);
      if (o && o.source) {
        let _ = [];
        let e;

        e = o.source.includes("@")
          ? (o.init ||
              (o._assetDB.taskManager.pause(t.task),
              await o.waitInit(),
              o._assetDB.taskManager.resume(t.task)),
            o.library + ".json")
          : o.source;

        if (existsSync(e)) {
          try {
            _ = readJSONSync(e);
          } catch (e) {
            console.warn(e);
          }
        }

        if (!_[0] || !_[0]?.data?.__id__) {
          return;
        }
        o = _[_[0].data.__id__];

        if (o?._children) {
          await walkPrefabInstanceChildren(o._children, _, t, a, s);
        }

        if (o?._components) {
          o._components.forEach((e) => {
            e = _[e.__id__];

            if (e) {
              a(e);
            }
          });
        }
      }
      o = e?.instance?.__id__;
      if (o && n[o]) {
        e = n[o];
        if (e.mountedChildren && e.mountedChildren.length > 0) {
          const r = [];

          e.mountedChildren.forEach((e) => {
            e = n[e.__id__];
            if (e && e.nodes) {
              for (const _ of e.nodes) {
                r.push(_);
              }
            }
          });

          await walkPrefabInstanceChildren(r, n, t, a, s);
        }

        if (e.mountedComponents && e.mountedComponents.length > 0) {
          e.mountedComponents.forEach((e) => {
            e = n[e.__id__];
            if (e && e.components) {
              for (const _ of e.components) {
                if (_.__id__ && n[_.__id__]) {
                  a(n[_.__id__]);
                }
              }
            }
          });
        }
      }
    }
  }
}
