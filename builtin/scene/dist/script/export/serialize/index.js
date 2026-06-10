Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeSafe = serializeSafe;
exports.serialize = serialize;
const cc_1 = require("cc");
const DELIMETER = cc.Class.Attr.DELIMETER;
const debugInfo = [];
const nodeExcludeProps = ["_parent", "_children", "_prefab", "_components"];
const checkedObjectSet = new Set();
function checkComponents(c, t = "") {
  var c_components = c.components;
  if (Array.isArray(c_components)) {
    for (let e = c_components.length - 1; e >= 0; e--) {
      var r = c_components[e];
      if (r) {
        if (r.node !== c) {
          r.node = c;
          debugInfo.push();
        }

        if (checkedObjectSet.has(r)) {
          return;
        }

        checkedObjectSet.add(r);
        checkSerializableProperties(r, t + ":" + r.name);
      } else {
        c_components.splice(e, 1);
      }
    }
  } else {
    debugInfo.push(c.getPathInHierarchy() + "'s components is not array");
  }
}
const baseTypeMap = new Map();
function checkBaseType(e, c, t = "") {
  if (cc.js.isChildClassOf(e.constructor, cc.ValueType)) {
    var a = getDefaultMap(e.constructor);
    for (const r of c) {
      if (typeof e[r] != typeof a[r]) {
        debugInfo.push(`${t}|${r}'s value:${e[r]} is illegal,attr:` + a[r]);
      }
    }
    return true;
  }
  return false;
}
function getDefaultMap(e) {
  let t = baseTypeMap.get(e);
  if (!t) {
    t = {};
    baseTypeMap.set(e, t);
    const e_attrs = e.__attrs__;
    e.__values__.forEach((e) => {
      var c = "" + e + DELIMETER + "default";
      t[e] = e_attrs[c];
    });
  }
  return t;
}
function checkSerializableProperties(e, a = "", c) {
  var e_constructor = e.constructor;
  var c = c ?? e_constructor.__values__;
  var r = getDefaultMap(e_constructor);
  for (const s of c) {
    const i = e[s];
    var n = typeof i;
    if (i && i.constructor && i.constructor.__values__) {
      if (checkedObjectSet.has(i)) {
        return;
      }
      checkedObjectSet.add(i);
      checkSerializableProperties(i, a + "." + s);
    } else {
      if (n == "object") {
        Object.keys(i).forEach((e) => {
          var c = i[e];
          var t = c ? c.constructor : undefined;

          if (t && t.__values__) {
            if (!checkedObjectSet.has(c)) {
              checkedObjectSet.add(c);
              checkSerializableProperties(c, a + "." + e);
            }
          }
        });
      } else if (n != typeof r[s]) {
        debugInfo.push(`${a}.${s}'s value:${e[s]} is illegal,attr:` + r[s]);
        e[s] = r[s];
      }
    }
  }
}
function checkPrefabInfo(e) {
  e = e._prefab;
  if (e) {
    var c = {};
    var e_nestedPrefabInstanceRoots = e.nestedPrefabInstanceRoots;
    if (e_nestedPrefabInstanceRoots) {
      for (let e = e_nestedPrefabInstanceRoots.length - 1; e >= 0; e--) {
        var a = e_nestedPrefabInstanceRoots[e];
        var a_prefab = a._prefab;

        if (a_prefab?.instance) {
          c[a_prefab.instance.fileId] &&
            (debugInfo.push(
              a.getPathInHierarchy() + " prefabInstanceFileId is not unique"
            ),
            (a_prefab.instance.fileId = EditorExtends.UuidUtils.uuid()));

          c[a_prefab.instance.fileId] = true;
        }
      }
    }
  }
}
function checkNode(c, t, e = "") {
  var c_children = c.children;
  if (Array.isArray(c_children)) {
    var r = e + "/" + c.name;
    if (!checkedObjectSet.has(c)) {
      checkedObjectSet.add(c);
      for (let e = c_children.length - 1; e >= 0; e--) {
        var n = c_children[e];

        if (!n || n.objFlags & cc_1.CCObject.Flags.HideInHierarchy) {
          if (n == null) {
            c_children.splice(e, 1);
          }
        } else {
          n.parent !== c &&
            (debugInfo.push(
              r + `/${n.name} parent is illegal ` + n.parent?.name
            ),
            (n.parent = c));

          checkNode(n, t, r);
        }
      }
    }
  } else {
    debugInfo.push(`${e}/${c.name} children is not an array`);
  }
}
function checkScene(e) {
  let c;

  if (e instanceof cc_1.SceneAsset) {
    c = e.scene;
  } else if (e instanceof cc_1.Prefab) {
    c = e.data;
  }

  if (c) {
    e = c.constructor.__values__
      .slice()
      .filter((e) => !nodeExcludeProps.includes(e));

    checkNode(c, e);
    checkPrefabInfo(c);
  }
}
function serializeSafe(e, c) {
  return cce.Utils.serialize(e, c);
}
function serialize(e, c) {
  return cce.Utils.serialize(e, c);
}
