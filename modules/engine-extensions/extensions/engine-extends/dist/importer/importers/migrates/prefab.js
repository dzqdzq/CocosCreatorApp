Object.defineProperty(exports, "__esModule", { value: true });
exports.migratePrefab = undefined;
exports.beforeMigratePrefab = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const PrefabInfo = { __type__: "cc.PrefabInfo", targetOverrides: [] };

const addPrefabInfo = (e, _) => {
  let r;
  let n;
  var [t] = _;
  if (!(t = t && (t.data || t.scene)) || (n = _[t.__id__])) {
    if ((t = n._prefab && n._prefab.__id__)) {
      r = _[t];
    } else {
      r = JSON.parse(JSON.stringify(PrefabInfo));
      _.push(r);
      n._prefab = { __id__: _.length - 1 };
    }

    r.targetOverrides = e;
    return r;
  }
  console.warn("Can not find root node, root info: " + _[0]);
};

const TargetOverrideInfo = {
  __type__: "cc.TargetOverrideInfo",
  source: null,
  sourceInfo: null,
  propertyPath: [],
  target: null,
  targetInfo: null,
};

const createTargetOverrideInfo = () =>
  JSON.parse(JSON.stringify(TargetOverrideInfo));

const PrefabLink = {
  __type__: "cc.PrefabLink",
  _name: "",
  _objFlags: 0,
  node: { __id__: 2 },
  _enabled: true,
  __prefab: null,
  prefab: null,
  _id: "a6NH7Dj9tMVbatCdgoxYyz",
};

const addPrefabLink = (e, _, r) => {
  var n;
  var r = e[r];
  return r && r.asset
    ? (((n = JSON.parse(JSON.stringify(PrefabLink))).node = { __id__: _ }),
      (n.prefab = { __uuid__: r.asset.__uuid__ }),
      e.push(n),
      e.length - 1)
    : -1;
};

const PrefabInstance = {
  __type__: "cc.PrefabInstance",
  fileId: "",
  prefabRootNode: null,
  mountedChildren: [],
  propertyOverrides: [],
  removedComponents: [],
};

const addPrefabInstance = (e, _, r) => {
  var n = JSON.parse(JSON.stringify(PrefabInstance));

  if (r) {
    n.prefabRootNode = { __id__: 1 };
  }

  n.fileId = Editor.Utils.UUID.generate();
  _.push(n);
  _[e].instance = { __id__: _.length - 1 };
  return n;
};

const CCPropertyOverrideInfo = {
  __type__: "CCPropertyOverrideInfo",
  targetInfo: null,
  propertyPath: [],
  value: null,
};

const createPropertyOverrideInfo = (e, _) => {
  var r = JSON.parse(JSON.stringify(CCPropertyOverrideInfo));
  var n = [];

  n.push(
    e === "_lpos"
      ? "position"
      : e === "_lrot"
      ? "rotation"
      : e === "_lscale"
      ? "scale"
      : e
  );

  r.propertyPath = n;
  r.value = _;
  return r;
};

const TargetInfo = { __type__: "cc.TargetInfo", localID: [] };

const createTargetInfo = (e) => {
  var _ = JSON.parse(JSON.stringify(TargetInfo));
  _.localID = e;
  return _;
};

const CompPrefabInfo = { __type__: "cc.CompPrefabInfo", fileId: "" };

const addCompPrefabInfo = (e, _) => {
  var r;
  var e = _[e];

  if (
    e.__type__ !== "cc.Node" &&
    e.node &&
    _[e.node.__id__]._prefab &&
    !e.__prefab
  ) {
    r = JSON.parse(JSON.stringify(CompPrefabInfo));
    r.fileId = Editor.Utils.UUID.generate();
    _.push(r);
    e.__prefab = { __id__: _.length - 1 };
  }
};

const MountedChildrenInfo = {
  __type__: "cc.MountedChildrenInfo",
  targetInfo: null,
  nodes: [],
};

const addMountedChildrenInfo = (e, _, r, n) => {
  var t = JSON.parse(JSON.stringify(MountedChildrenInfo));
  var n = ((t.nodes = n), createTargetInfo(r));
  return { prefabInstanceID: e, mountedChildrenInfo: t, targetInfo: n };
};

const INSTANCE_RESERVED_KEYWORDS = [
  "__type__",
  "_objFlags",
  "_parent",
  "_prefab",
  "_id",
];

function compareBaseProp(e, _, r, n, t) {
  var a = [];
  for (const f of ["_lpos", "_lrot", "_lscale", "_active", "_name", "_layer"]) {
    var o = _[f];
    var i = r[f];

    if (JSON.stringify(o) !== JSON.stringify(i)) {
      i = createPropertyOverrideInfo(f, o);
      o = createTargetInfo(n);
      a.push({ prefabInstanceID: e, propertyOverrideInfo: i, targetInfo: o });
    }
  }
  return a;
}
function compareComponentIDProp(e, _, r, n, t, a, o, i) {
  var f = t[_];
  if (!f) {
    return null;
  }
  var s = f.__type__ !== "cc.Node";
  let d;
  let c;
  if (s) {
    if (!(c = f.node && f.node.__id__)) {
      return null;
    }
    d = t[c];
  } else {
    d = f;
    c = _;
  }
  var p = d && d._prefab && d._prefab.__id__;
  var l = p && t[p];
  var u = l && l.root && l.root.__id__;
  if (!l || !l.asset || a.has(u) || l.asset.__id__ === 0) {
    return null;
  }
  t = t[u];
  if (!t) {
    return null;
  }
  var b = createTargetOverrideInfo();
  b.propertyPath = e;
  let I = [];
  e = totalPrefab.get(l.asset.__uuid__);
  if (!e) {
    console.warn(
      `Cannot get Base Prefab by UUID: ${l.asset.__uuid__}, PrefabInfo ID: ${c} name: ${d._name}.`
    );

    return null;
  }
  var h = e[0] && e[0].data && e[0].data.__id__;
  var g = e && e[h];
  let v;
  let m;

  if (u === c) {
    v = g;
    m = h;
  } else {
    h = t._children.findIndex((e) => e.__id__ === c);
    m = g._children[h] && g._children[h].__id__;
    v = e[m];
  }

  if (s) {
    t = d._components.findIndex((e) => e.__id__ === _);

    g = v && v._components[t] && v._components[t].__id__;
    h = g && e[g];
    if (!h || f.__type__ !== h.__type__) {
      return void a.set(u, p);
    }
    I = getLocalID(g, e, s);
  } else {
    if (!v) {
      return void a.set(u, p);
    }
    I = getLocalID(m, e, s);
  }

  b.source = { __id__: r };
  t = createTargetInfo(I);
  b.target = { __id__: l.root.__id__ };
  return { emptyProp: i, targetOverrideInfo: b, sourceInfo: n, targetInfo: t };
}
const SKIP_COMPONENT_KEY = ["_name", "_objFlags", "node", "__prefab", "_id"];
function compareComponentProp(_, r, e, n, t, a) {
  var o = [];
  var r_id = r.__id__;
  var f = n[r_id];
  var r = e && e.__id__;
  var s = t[r];
  if (s) {
    let e = [];
    e = f.__prefab ? getLocalID(r, t, true) : getLocalID(r_id, n, true);
    for (const p in f) {
      if (!SKIP_COMPONENT_KEY.includes(p)) {
        var d = f[p];
        if (d) {
          if (a[r_id] === p) {
            continue;
          }
        }
        var c = s[p];

        if (JSON.stringify(d) !== JSON.stringify(c)) {
          c = createPropertyOverrideInfo(p, d);
          d = createTargetInfo(e);

          o.push({
            prefabInstanceID: _,
            propertyOverrideInfo: c,
            targetInfo: d,
          });
        }
      }
    }
  }
  return o;
}
function isEqual(e, _, r, n) {
  if (!e._prefab || !_._prefab) {
    return false;
  }
  var t = n[e._prefab.__id__];
  var a = r[_._prefab.__id__];
  if (!t || !a) {
    return false;
  }
  if ("__uuid__" in a.asset && t.asset.__uuid__ !== a.asset.__uuid__) {
    return false;
  }
  a = !!t.sync;
  if (!a) {
    if (e.__type__ !== _.__type__) {
      return false;
    }
    if (
      (e._children && !_._children) ||
      (!e._children && _._children) ||
      (!e._children && !_._children)
    ) {
      return false;
    }
    if (e._children.length < _._children.length) {
      return false;
    }

    var o = e._children.map((e) => n[e.__id__]);

    var i = _._children.map((e) => r[e.__id__]);

    for (let e = 0; e < o.length; ++e) {
      var f = i[e];
      if (f && !isEqual(o[e], i[e], r, n)) {
        return false;
      }
    }
    if (
      (e._components && !_._components) ||
      (!e._components && _._components) ||
      (!e._components && !_._components)
    ) {
      return false;
    }
    if (e._components.length !== _._components.length) {
      return false;
    }

    var s = e._components.map((e) => n[e.__id__]);

    var d = _._components.map((e) => r[e.__id__]);

    for (let e = 0; e < s.length; ++e) {
      var c = s[e];
      var p = d[e];
      if (!c || !p) {
        return false;
      }
      if (c.__type__ === "cc.SkeletalAnimation" && c._sockets.length > 0) {
        return false;
      }
      if (c.__type__ !== p.__type__) {
        return false;
      }
    }
  }
  return true;
}
function isDiff(e, _) {
  var r;
  var n;
  var t;
  return (
    !e.asset ||
    ((r = e.root && e.root.__id__),
    (e = e.asset && e.asset.__uuid__),
    (n = totalPrefab.get(e))
      ? !isEqual(
          _[r],
          (t = n[0] && n[0].data && n[0].data.__id__) && n[t],
          n,
          _
        )
      : (console.warn(`Cannot get Prefab by UUID: ${e}
PrefabInfo ID: ${r} name: ${_[r]._name} 
`),
        true))
  );
}
function addInstanceFileID(e, _, r) {
  if (e.instance && (_ = _[e.instance.__id__])) {
    r.push(_.fileId);
  }
}
function getLocalID(e, _, r = false) {
  var n;
  var t = [];

  if (r) {
    if (
      (r = _[e]) &&
      ((n = r.node && _[r.node.__id__])._prefab &&
        addInstanceFileID(n._prefab && _[n._prefab.__id__], _, t),
      (n = r.__prefab && r.__prefab.__id__))
    ) {
      r = _[n];
      t.push(r.fileId);
    }
  } else if ((r = (n = _[e])._prefab && _[n._prefab.__id__])) {
    addInstanceFileID(r, _, t);
    t.push(r.fileId);
  }

  return t;
}
function isMountedChild(e, _, r, n) {
  var t = e._prefab && e._prefab.__id__;
  if (t && r[t].sync) {
    return false;
  }
  return e.__type__ !== _.__type__;
}
function compareChildren(_, r, n, t, a, o) {
  let i = [];
  let f = [];
  let s = [];
  if (r._children) {
    for (let e = 0; e < r._children.length; ++e) {
      var d;
      var c;
      var p = r._children[e];
      var p = p && p.__id__;
      var l = p && a[p];

      if (l) {
        if (
          !(c = n._children[e]) ||
          isMountedChild(l, (d = t[(c = c.__id__)]), a, t)
        ) {
          s.push({ __id__: p });
        } else {
          l._prefab
            ? ((i = getLocalID(c, t)),
              (c = compareChildren(_, l, d, t, a, o)) &&
                ((f = f.concat(c.childPropertyOverrides)),
                (s = s.concat(c.childMountedNodes))))
            : (i = getLocalID(p, a));

          c = compareBaseProp(_, l, d, i, a);
          f = f.concat(c);
        }
      }
    }
  }
  if (r._components) {
    for (let e = 0; e < r._components.length; ++e) {
      var u = compareComponentProp(
        _,
        r._components[e],
        n._components[e],
        a,
        t,
        o
      );
      f = f.concat(u);
    }
  }
  return { childPropertyOverrides: f, childMountedNodes: s };
}
function comparePrefab(e, _, r, n) {
  let t = null;
  let a = [];
  var o = e.root && e.root.__id__;
  var i = o && _[o];
  var e = e.asset.__uuid__;
  var childMountedNodes = totalPrefab.get(e);
  if (childMountedNodes) {
    var childPropertyOverrides =
      childMountedNodes[
        childMountedNodes[0] &&
          childMountedNodes[0].data &&
          childMountedNodes[0].data.__id__
      ];
    if (childPropertyOverrides) {
      var d = (
        childPropertyOverrides._prefab &&
        childMountedNodes[childPropertyOverrides._prefab.__id__]
      ).fileId;
      let e = i._prefab && _[i._prefab.__id__];

      if (e && !e.instance) {
        addPrefabInstance(i._prefab.__id__, _, r);
        e = _[i._prefab.__id__];
      }

      var r = e && e.instance && e.instance.__id__;
      var c = compareBaseProp(r, i, childPropertyOverrides, [d], _);
      var c =
        ((a = a.concat(c)),
        compareChildren(r, i, childPropertyOverrides, childMountedNodes, _, n));
      var { childPropertyOverrides, childMountedNodes } = c;
      a = a.concat(childPropertyOverrides);

      if (childMountedNodes.length > 0) {
        n = [d];
        t = addMountedChildrenInfo(r, _, n, childMountedNodes);
      }

      return {
        propertyOverrides: a,
        mountedChildrenInfo: t,
        childMountedNodes: childMountedNodes,
      };
    }
  } else {
    console.warn(
      `Cannot get Base Prefab by UUID: ${e}, PrefabInfo ID: ${o} name: ${i._name}.`
    );
  }
}
function updateReplaceIDs(e, _, r) {
  var n = (JSON.stringify(_).match(/(?<="__id__":)([0-9]+)/g) || []).map((e) =>
    Number(e)
  );
  for (const a of e) {
    for (let _ = 0; _ < n.length; ++_) {
      var t = n[_];
      let e = r[_];

      if (!e) {
        e = { baseID: t, newID: t };
        r.push(e);
      }

      if (t > a) {
        e.newID--;
      }
    }
  }
}
function addRemoveID(e, _) {
  if (!_.includes(e)) {
    _.push(e);
  }
}
function addRemove(e, _, r, n = true) {
  _ = _[e];

  if (_._prefab) {
    addRemoveID(_._prefab.__id__, r);
    _._prefab = null;
  }

  if (_.__prefab) {
    addRemoveID(_.__prefab.__id__, r);
    _.__prefab = null;
  }

  if (_.instance) {
    addRemoveID(_.instance.__id__, r);
    _.instance = null;
  }

  if (n) {
    addRemoveID(e, r);
  }
}
function restoreNormalNodes(_, r, e) {
  var n = _._prefab && _._prefab.__id__;
  if (!n || !r[n].instance) {
    if (_._children) {
      var t = _._children.map((e) => r[e.__id__]);
      for (const _ of t) {
        restoreNormalNodes(_, r, e);
      }
    }
    if (_._components) {
      for (let e = 0; e < _._components.length; ++e) {
        var a = r[_._components[e].__id__];

        if (a && a.__prefab) {
          a.__prefab = null;
        }
      }
    }

    if (n) {
      _._prefab = null;
    }
  }
}
const totalPrefab = new Map();
async function beforeMigratePrefab(e) {
  var _ = e.getSwapSpace().json;
  if (totalPrefab.size === 0) {
    for (const t of await Editor.Message.request("asset-db", "query-assets", {
      ccType: "cc.Prefab",
    })) {
      if (!totalPrefab.has(t.uuid) && t.file) {
        totalPrefab.set(t.uuid, fs_extra_1.readJSONSync(t.file));
      }
    }
  }
  var r = _[0] && _[0].__type__ === "cc.Prefab";
  for (let e = 0; e < _.length; ++e) {
    var n = _[e];
    addCompPrefabInfo(e, _);

    if (
      n.__type__ === "cc.PrefabInfo" &&
      (n.fileId || (n.fileId = Editor.Utils.UUID.generate()), n.sync)
    ) {
      addPrefabInstance(e, _, r);
    }
  }

  if (r) {
    totalPrefab.set(e.uuid, _);
  }
}
function removeAllChild(e, _, r, n = true, t) {
  var a = _[e];
  for (const i of a._children) {
    var o = Number(i.__id__);

    if (!t || !t.includes(o)) {
      addRemove(o, _, r, n);
      removeAllChild(o, _, r, n, t);
    }
  }
  _[e]._children.length = [];
  for (const f of a._components) {
    addRemove(Number(f.__id__), _, r, n);
  }
  _[e]._components.legnth = [];
}
function getTargetOverrideInfoForComponents(r, e, _, n, t, a, o) {
  var i = [];
  var f = n[r];
  var s = n[f.node && f.node.__id__];
  let d = r;
  let c = null;
  var p;
  var l = !t;
  var s = s && s._prefab && n[s._prefab.__id__];

  if (s && !l) {
    p = s.asset && s.asset.__id__ === 0;

    (s.root && a.has(s.root.__id__)) ||
      p ||
      ((p = getLocalID(e, t, true)),
      (c = createTargetInfo(p)),
      (d = s.root.__id__));
  }

  for (const m of _) {
    let _;
    var u;
    var b;
    var I = f[m];
    if (I && Array.isArray(I) && I[0] && I[0].__id__) {
      for (let e = 0; e < I.length; ++e) {
        var h;
        var g;
        var v = I[e];

        if (
          v &&
          ((h = [m, e.toString()]),
          (g = { componentID: r, key: m, idx: e }),
          (_ = compareComponentIDProp(h, v.__id__, d, c, n, a, l, g)))
        ) {
          o[r] = g.key;
          i.push(_);
        }
      }
    } else {
      if (
        I &&
        I.__id__ &&
        ((u = [m]),
        (b = { componentID: r, key: m, idx: -1 }),
        (_ = compareComponentIDProp(u, I.__id__, d, c, n, a, l, b)))
      ) {
        o[r] = b.key;
        i.push(_);
      }
    }
  }
  return i;
}
async function migratePrefab(_) {
  var e = _.getSwapSpace();
  const e_json = e.json;
  var r = [];
  for (const M of e.json) {
    if (
      M.__type__ === "cc.PrefabInfo" &&
      M.asset &&
      M.asset.__uuid__ &&
      M.asset.__uuid__ !== _.uuid
    ) {
      var n = M.asset.__uuid__;
      if (!r.includes(n)) {
        r.push(n);
        var t = asset_db_1.queryAsset(n);
        if (t) {
          if (!t._init) {
            _._assetDB.taskManager.pause(_.task);
            await t.waitInit();
            _._assetDB.taskManager.resume(_.task);
          }

          try {
            const e_json = fs_extra_1.readJSONSync(t.library + ".json");

            if (!totalPrefab.has(n)) {
              totalPrefab.set(n, e_json);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          console.warn(
            `depends aseet uuid: ${n} missing in the scene: ` + _.basename
          );
        }
      }
    }
  }
  const d = e_json[0] && e_json[0].__type__ === "cc.Prefab";
  var a = d ? "prefab" : "scene";
  var o = new Map();
  const f = [];
  const c = new Map();
  let p = [];
  let l = [];
  let u = [];
  let i = [];
  const b = [];
  for (let e = 0; e < e_json.length; ++e) {
    var I = e_json[e];
    if (I.__type__ === "cc.Node" && I._prefab) {
      var h = I._prefab.__id__;
      var g = e_json[h];
      if (g && g.root && g.asset) {
        let e = o.get(g.root.__id__);

        if (e) {
          e.push(h);
        } else {
          e = [h];
        }

        o.set(g.root.__id__, e);
      } else {
        if (!c.get(e)) {
          c.set(e, h);
        }

        console.warn(
          `Prefab asset missing, name: ${I._name} in the ${a} : ${_.basename}.`
        );
      }
    }
  }
  o.forEach((e, _, r) => {
    var n = e_json[_];
    if (n) {
      var n = n._prefab && n._prefab.__id__;
      var t = e_json[n];
      let e = true;

      if ((e = d ? !!t.instance && !t.sync : e)) {
        if (isDiff(t, e_json) && !c.get(_)) {
          c.set(_, n);
        }
      }
    } else {
      console.warn("The prefab is bad. id: " + _);
    }
  });
  for (const J of e_json) {
    if (J.__type__ === "cc.Node" && J._components) {
      const T = J._components
        .map((e, _) => {
          var r = e_json[e.__id__];
          var n = [];
          for (const a in r) {
            var t = r[a];

            if (
              !SKIP_COMPONENT_KEY.includes(a) &&
              t &&
              (Array.isArray(t) ? t[0] && t[0].__id__ : t && t.__id__)
            ) {
              n.push(a);
            }
          }
          if (n.length > 0) {
            return { index: _, __id__: e.__id__, keys: n };
          }
        })
        .filter(Boolean);
      if (T.length !== 0) {
        let e;
        var v;
        var m = J._prefab && J._prefab.__id__;

        if (J._prefab) {
          v = (m = e_json[m]) && m.asset && m.asset.__uuid__;

          0 === (m.asset && m.asset.__id__)
            ? (e = e_json)
            : v &&
              !(e = totalPrefab.get(v)) &&
              console.warn(
                `Cannot get Prefab by UUID: ${v}, the node name: ${J._name} in the ${a} : ` +
                  _.basename
              );
        }

        var y = e && e[1];

        for (const k of T) {
          var { index, __id__, keys } = k;

          var __id__ = getTargetOverrideInfoForComponents(
            __id__,
            y && y._components[index] && y._components[index].__id__,
            keys,
            e_json,
            e,
            c,
            b
          );

          i = i.concat(__id__);
        }
      }
    }
  }

  o.forEach((e, r, _) => {
    var n = e_json[r];
    if (n) {
      var n = n._prefab.__id__;
      var t = e_json[n];
      let e = true;
      let _ = true;

      if (d) {
        _ = !!t.instance && !t.sync;
        e = !!t.instance;
      }

      if ((!_ || !c.has(r)) && e) {
        try {
          var a;
          var o;
          var i;
          var f = comparePrefab(t, e_json, d, b);

          if (f) {
            ({
              propertyOverrides: a,
              mountedChildrenInfo: o,
              childMountedNodes: i,
            } = f);

            o && ((l = l.concat(o)), (p = p.concat(i)));
            u = u.concat(a);
          }
        } catch (e) {
          if (n && !c.has(r)) {
            c.set(r, n);
          }

          console.error(e);
        }
      }
    }
  });

  o.forEach((e, _, r) => {
    if (!c.has(_)) {
      var n = e_json[_];
      var t = n._prefab && n._prefab.__id__;

      if (t && t.instance) {
        removeAllChild(_, e_json, f, true, p);
      }

      for (const o of e) {
        var a = e_json[o];
        if (a.instance) {
          for (const i in n) {
            if (!INSTANCE_RESERVED_KEYWORDS.includes(i)) {
              delete n[i];
            }
          }
        }
        delete a.sync;
        delete a._synced;
      }
    }
  });

  for (const w of u) {
    e_json.push(w.targetInfo);
    var N = e_json.length - 1;

    var N =
      ((w.propertyOverrideInfo.targetInfo = { __id__: N }),
      e_json.push(w.propertyOverrideInfo),
      e_json.length - 1);

    e_json[w.prefabInstanceID].propertyOverrides.push({ __id__: N });
  }
  for (const R of l) {
    e_json.push(R.targetInfo);
    var $ = e_json.length - 1;

    var $ =
      ((R.mountedChildrenInfo.targetInfo = { __id__: $ }),
      e_json.push(R.mountedChildrenInfo),
      e_json.length - 1);

    e_json[R.prefabInstanceID].mountedChildren.push({ __id__: $ });
  }
  if (i.length > 0) {
    var A = [];
    for (const x of i) {
      var D = x.emptyProp && x.emptyProp.componentID;
      if (D) {
        var D = e_json[D];
        var D = D && D.node && D.node.__id__;
        var D = e_json[D];
        var D = D._prefab && D._prefab.__id__;
        var D = e_json[D];
        var D = D && D.root && D.root.__id__;
        if (D && c.has(D)) {
          continue;
        }
      }

      if (x.sourceInfo) {
        e_json.push(x.sourceInfo);
        D = e_json.length - 1;
        x.targetOverrideInfo.sourceInfo = { __id__: D };
      }

      if (x.targetInfo) {
        e_json.push(x.targetInfo);
        D = e_json.length - 1;
        e_json.length;
        x.targetOverrideInfo.targetInfo = { __id__: D };
      }

      e_json.push(x.targetOverrideInfo);
      D = e_json.length - 1;
      D = (A.push({ __id__: D }), x.emptyProp);
      if (D) {
        var L = e_json[D.componentID];
        let e = L[D.key];

        if (Array.isArray(e)) {
          e[D.idx] = null;
        } else {
          e = null;
        }

        L[D.key] = e;
      }
    }
    addPrefabInfo(A, e_json);
  }
  for (const q of p) {
    var C;
    var q_id = q.__id__;
    var j = e_json[q_id];
    var E = e_json[j._prefab.__id__];

    if (!E.instance && (!(C = E.root && E.root.__id__) || !c.has(C))) {
      C = !E;
      addRemove(q_id, e_json, f, C);
      removeAllChild(q_id, e_json, f, C);
      j._prefab = null;
    }
  }

  c.forEach((e, _, r) => {
    var n = e_json[_];

    if (!e_json[e].instance) {
      restoreNormalNodes(n, e_json, f);
      -1 !== (_ = addPrefabLink(e_json, _, e)) &&
        n._components.push({ __id__: _ });
    }
  });

  e.json = e_json;
}
exports.beforeMigratePrefab = beforeMigratePrefab;
exports.migratePrefab = migratePrefab;
