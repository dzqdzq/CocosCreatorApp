var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeNode = encodeNode;
exports.encodeScene = encodeScene;
exports.encodeComponent = encodeComponent;
exports.encodeObject = encodeObject;
const utils_1 = __importDefault(require("./utils"));
const dump_defines_1 = require("./dump-defines");
const cc_1 = require("cc");
const utils_2 = require("../../3d/manager/prefab/utils");

const attributeProps = [
  "enumList",
  "radioGroup",
  "bitmaskList",
  "displayName",
  "group",
  "multiline",
  "step",
  "slide",
  "tooltip",
  "animatable",
  "unit",
  "radian",
  "displayOrder",
];

const autoI18nAttributeNames = ["displayName", "tooltip"];
function encodeNode(t) {
  var t_constructor = t.constructor;

  var o = Object.keys(cc.Layers.Enum).map((e, t) => ({
    name: e,
    value: cc.Layers.Enum[e],
  }));

  o.sort((e, t) => e.value - t.value);

  var a = Object.keys(cc_1.MobilityMode).map((e, t) => ({
    name: e,
    value: cc_1.MobilityMode[e],
  }));

  var n = cce.SceneFacadeManager._projectType === "2d";

  var n = {
    active: encodeObject(t.active, { displayName: "Active", default: null }, t),
    locked: encodeObject(
      Boolean(t.objFlags & cc.Object.Flags.LockedInEditor),
      { displayName: "Locked", default: false, animatable: false },
      t
    ),
    name: encodeObject(
      t.name,
      { displayName: "Name", default: null, animatable: false },
      t
    ),
    position: encodeObject(
      t.position,
      {
        displayName: "i18n:scene.cc.Node.properties.position.displayName",
        default: new cc.math.Vec3(),
        tooltip: "i18n:scene.cc.Node.properties.position.tooltip",
      },
      t,
      "position"
    ),
    rotation: encodeObject(
      t.eulerAngles,
      {
        name: "eulerAngles",
        displayName: "i18n:scene.cc.Node.properties.eulerAngles.displayName",
        default: new cc.math.Vec3(),
        tooltip:
          "i18n:scene.cc.Node.properties.eulerAngles." +
          (n ? "tooltip2D" : "tooltip3D"),
      },
      t,
      n ? "angle" : "eulerAngles"
    ),
    scale: encodeObject(
      t.scale,
      {
        displayName: "i18n:scene.cc.Node.properties.scale.displayName",
        default: new cc.math.Vec3(1, 1, 1),
        tooltip: "i18n:scene.cc.Node.properties.scale.tooltip",
      },
      t,
      "scale"
    ),
    mobility: encodeObject(
      t.mobility,
      {
        displayName: "i18n:scene.cc.Node.properties.mobility.displayName",
        tooltip: "i18n:scene.cc.Node.properties.mobility.tooltip",
        default: 0,
        type: "Enum",
        enumList: a,
      },
      t,
      "mobility"
    ),
    layer: encodeObject(
      t.layer,
      {
        displayName: "i18n:scene.cc.Node.properties.layer.displayName",
        tooltip: "i18n:scene.cc.Node.properties.layer.tooltip",
        default: 1073741824,
        type: "Enum",
        enumList: o,
        readonly: false,
        animatable: false,
      },
      t,
      "layer"
    ),
    uuid: encodeObject(
      t.uuid,
      { displayName: "UUID", default: null, animatable: false },
      t
    ),
    parent: encodeObject(t.parent, { ctor: cc.Node }, t),
    children: t.children
      .map((e) => {
        if (e && !(e.objFlags & cc.Object.Flags.HideInHierarchy)) {
          return encodeObject(e, { ctor: cc.Node }, t);
        }
      })
      .filter(Boolean),
    __type__: utils_1.default.getTypeName(t_constructor),
    __comps__: t._components.map((e) => encodeComponent(e)),
    mountedRoot: utils_2.prefabUtils.getMountedRoot(t)?.uuid,
  };

  if (
    t._prefab &&
    ((a = utils_2.prefabUtils.getPrefabStateInfo(t)),
    (n.__prefab__ = {
      uuid: (t._prefab.asset && t._prefab.asset._uuid) || "",
      fileId: t._prefab.fileId,
      rootUuid: t._prefab.root && t._prefab.root.uuid,
      sync: true,
      prefabStateInfo: a,
    }),
    t._prefab.targetOverrides &&
      (n.__prefab__.targetOverrides = encodeTargetOverrides(
        t._prefab.targetOverrides
      )),
    t._prefab.instance &&
      (n.__prefab__.instance = encodeObject(
        t._prefab.instance,
        { default: null },
        t
      )),
    (o = utils_2.prefabUtils.getRemovedComponents(t)).length > 0)
  ) {
    n.removedComponents = o.map((e) => ({
      name: cc_1.js.getClassName(e),
      fileID: e.__prefab.fileId,
    }));
  }

  _checkObjFlags(t, n);
  return n;
}
function encodeScene(o) {
  var o_constructor = o.constructor;
  const a = {
    active: encodeObject(o.active, { default: null }),
    locked: encodeObject(false, { default: false }),
    name: encodeObject(o.name || o_constructor.name, { default: null }),
    uuid: encodeObject(o.uuid, { default: null }),
    autoReleaseAssets: encodeObject(o.autoReleaseAssets, {
      displayName: "Auto Release Assets",
      default: false,
    }),
    children: o.children
      .map((e) => {
        if (e && !(e.objFlags & cc.Object.Flags.HideInHierarchy)) {
          return encodeObject(e, { ctor: cc.Node });
        }
      })
      .filter(Boolean),
    parent: "",
    __type__: utils_1.default.getTypeName(o_constructor),
    _globals: {},
    isScene: true,
  };

  if (o._globals) {
    o._globals.constructor.__props__.map((e) => {
      var t = cc.Class.attr(o._globals.constructor, e);
      a._globals[e] = encodeObject(o._globals[e], t, o._globals);
    });
  }

  if (o._prefab?.targetOverrides) {
    a.targetOverrides = encodeTargetOverrides(o._prefab.targetOverrides);
  }

  return a;
}
function encodeComponent(a) {
  var e;
  var a_constructor = a.constructor;
  var o = utils_2.prefabUtils.getMountedRoot(a);
  let n = o?.uuid;

  if (
    o &&
    (o = o._prefab) &&
    o.root &&
    (o = o.root._prefab?.instance?.prefabRootNode) &&
    o !== cce.Scene.rootNode
  ) {
    n = undefined;
  }

  const c = {
    value: {
      uuid: encodeObject(a.uuid, { default: null, visible: false }, a),
      name: encodeObject(a.name, { default: null, visible: false }, a),
      enabled: encodeObject(a.enabled, { default: null, visible: false }, a),
    },
    default: undefined,
    type: utils_1.default.getTypeName(a_constructor),
    readonly: false,
    visible: true,
    cid: a.__cid__,
    mountedRoot: n,
  };

  a_constructor.__props__.forEach((t) => {
    if (c.value) {
      try {
        var e;
        var o;

        if (t in a) {
          e = cc.Class.attr(a, t);

          (o = encodeObject(a[t], e, a, t)).type !== "Unknown" &&
            (c.value[t] = o);

          _checkConstructorRewriteType(o, a[t], e);
        }
      } catch (e) {
        console.warn(
          `Component property dump failed:
Node: ${a.node.name}(${a.node.uuid})
Component: ${c.type}(${a.uuid})
Property: ` + t
        );

        console.warn(e);
        delete c.value[t];
      }
    }
  });

  c.editor = {
    inspector: a_constructor._inspector || "",
    icon: a_constructor._icon || "",
    help: a_constructor._help || "",
    _showTick:
      typeof a.start == "function" ||
      typeof a.update == "function" ||
      typeof a.lateUpdate == "function" ||
      typeof a.onEnable == "function" ||
      typeof a.onDisable == "function",
  };

  if (c.value) {
    o = c.value.__scriptAsset;

    a instanceof cc._MissingScript
      ? ((e =
          (e = (e = a._$erialized) && e.__type__) &&
          EditorExtends.UuidUtils.decompressUuid(a._$erialized.__type__)),
        (o.visible = !(!e || !EditorExtends.UuidUtils.isUuid(e))),
        (o.value = { uuid: e }))
      : ((o.visible = !!a.__scriptUuid), (o.value = { uuid: a.__scriptUuid }));

    o.displayOrder = -999;
  }

  if (a_constructor) {
    c.extends = utils_1.default.getTypeInheritanceChain(a_constructor);
  }

  return c;
}
function _checkConstructorRewriteType(e, t, o) {
  if (
    t &&
    typeof t == "object" &&
    !Array.isArray(t) &&
    t.constructor &&
    o &&
    o.ctor &&
    !(t instanceof o.ctor)
  ) {
    e.type = "Unknown";
  }
}
function _checkFuncAttribute(e, t, o) {
  var t = t[e];
  if (t !== undefined) {
    return typeof t != "function"
      ? typeof t == "boolean"
        ? !!t
        : t
      : o
      ? "boolean" == typeof (t = t.call(o))
        ? !!t
        : t
      : void console.warn(`try to use ${e} function without owner`);
  }
}
function _checkAttributes(o, a, n) {
  ["visible", "min", "max"].forEach((e) => {
    var t = _checkFuncAttribute(e, a, n);

    if (t !== undefined) {
      o[e] = t;
    }
  });

  if (!a.ctor && a.type) {
    o.type = "" + a.type;
  }

  if ("enumList" in a && a.type === "Enum") {
    o.type = "Enum";
  }

  if (a && a.hasGetter && !a.hasSetter) {
    o.readonly = true;
  }

  attributeProps.forEach((e) => {
    if (a.hasOwnProperty(e)) {
      o[e] = a[e];
    }
  });

  if (typeof o.name == "string" && n && typeof n == "object") {
    var e = findClassName(n, o.name);
    if (e) {
      for (const t of autoI18nAttributeNames) {
        if (!Object.prototype.hasOwnProperty.call(a, t)) {
          o[t] = `i18n:ENGINE.classes.${e}.properties.${o.name}.` + t;
        }
      }
    }
  }
}
const MAX_RECURSION_DEPTH = 10;
const TARGET_CLASS_NAME = ["cc.", "sp."];
function findClassName(e, t) {
  let o = 0;
  let a = e;

  while (a && o < MAX_RECURSION_DEPTH) {
    const n = cc_1.js.getClassName(a);
    if (
      n &&
      TARGET_CLASS_NAME.find((e) => n.startsWith(e)) &&
      Object.prototype.hasOwnProperty.call(a, t)
    ) {
      return n;
    }
    a = Object.getPrototypeOf(a);
    o++;
  }

  return "";
}
function _encodeByType(e, t, o, a) {
  e = e || "";
  e = dump_defines_1.DumpDefines[e];
  return !!e && (e.encode(t, o, a), true);
}
function _checkObjFlags(e, t) {
  let o = false;
  let a = false;
  let n = false;
  let c = false;
  let r = false;

  e._components.forEach((e) => {
    if (e.objFlags & cc.Object.Flags.IsPositionLocked) {
      o = true;
    }

    if (e.objFlags & cc.Object.Flags.IsSizeLocked) {
      a = true;
    }

    if (e.objFlags & cc.Object.Flags.IsAnchorLocked) {
      n = true;
    }

    if (e.objFlags & cc.Object.Flags.IsScaleLocked) {
      c = true;
    }

    if (e.objFlags & cc.Object.Flags.IsRotationLocked) {
      r = true;
    }
  });

  if (o) {
    t.position.readonly = true;
  }

  if (c) {
    t.scale.readonly = true;
  }

  if (r) {
    t.rotation.readonly = true;
  }

  const l = [];

  t.__comps__.forEach((e) => {
    if (e.cid === "cc.UITransform") {
      l.push(e);
    }
  });

  if (
    l.length &&
    (a &&
      l.forEach((e) => {
        e.value.contentSize.readonly = true;
      }),
    n)
  ) {
    l.forEach((e) => {
      e.value.anchorPoint.readonly = true;
    });
  }
}
function encodeObject(a, n, t = null, e, o) {
  var c = utils_1.default.getConstructor(a, n);
  let r = utils_1.default.getDefault(n);
  if (
    r &&
    typeof r == "object" &&
    r.constructor &&
    Array.isArray(r.constructor.__props__)
  ) {
    const f = { type: utils_1.default.getTypeName(r.constructor), value: {} };

    r.constructor.__props__.forEach((e) => {
      var t = cc.Class.attr(r.constructor, e);
      var t = encodeObject(r[e], t, r, e);

      if (t.type !== "Unknown") {
        f.value[e] = t;
      }
    });

    r = f;
  }
  let l = utils_1.default.getTypeName(c);

  if (
    t === null &&
    n.default !== null &&
    n.default !== undefined &&
    ((u = utils_1.default.getConstructor(n.default, n)),
    utils_1.default.getTypeName(u) !== l)
  ) {
    l = "Unknown";
  }

  var i = {
    name: e,
    value: null,
    default: r,
    type: l,
    readonly: !!n.readonly,
    visible: true,
    animatable: n.animatable === undefined || !!n.animatable,
  };

  if (n.userData) {
    i.userData = n.userData;
  }

  _checkAttributes(i, n, t);

  if (r && Array.isArray(r)) {
    i.isArray = true;
  }

  if (!i.isArray && Array.isArray(a)) {
    i.isArray = true;
  }

  if (i.isArray) {
    if (Array.isArray(a) && i.type !== "Array") {
      var s = Object.assign({}, n);

      s.visible = true;

      if (s.readonly && s.readonly.deep !== undefined) {
        s.readonly = s.readonly.deep;
      }

      var u = utils_1.default.ccClassAttrPropertyDefaultValue(n);
      s.default = getElementDefaultValue(n, u);

      if (!o) {
        i.elementTypeData = encodeObject(s.default, s, u, undefined, true);
      }

      var d = [];

      for (let e = 0; e < a.length; e++) {
        var p = a[e];

        var p =
          (p && p.constructor && (s.ctor = p && p.constructor),
          encodeObject(p, s, t));

        if (p.type !== "Unknown") {
          d.push(p);
        } else {
          d.push(i.elementTypeData);
        }
      }
      i.value = d;
    } else {
      i.type = "Unknown";
    }
  } else {
    e = {};
    e.ctor = c;

    if (!_encodeByType(i.type, a, i, e)) {
      if (ArrayBuffer.isView(a)) {
        _encodeByType("TypedArray", a, i, e);
      } else if (cc.js.isChildClassOf(c, cc.ValueType)) {
        _encodeByType("cc.ValueType", a, i, e);
      } else if (cc.js.isChildClassOf(c, cc.Node)) {
        _encodeByType("cc.Node", a, i, e);
      } else if (cc.js.isChildClassOf(c, cc.Component)) {
        _encodeByType("cc.Component", a, i, e);
      } else if (cc.js.isChildClassOf(c, cc.Asset)) {
        _encodeByType("cc.Asset", a, i, e);
      } else if (c && c.__props__) {
        if (a) {
          const _ = {};

          c.__props__.forEach((e) => {
            var t = cc.Class.attr(a, e);

            if (n.readonly && n.readonly.deep) {
              t.readonly = { deep: true };
            }

            var o = encodeObject(a[e], t, a, e);

            if (o.type !== "Unknown") {
              _[e] = o;
            }

            _checkConstructorRewriteType(o, a[e], t);
          });

          i.value = _;
        } else {
          i.value = null;
        }
      } else {
        if (i.type !== "Unknown") {
          i.value = a;
        }
      }
    }
  }

  if (c) {
    i.extends = utils_1.default.getTypeInheritanceChain(c);
  }

  return i;
}
function getElementDefaultValue(e, t) {
  return e.type
    ? utils_1.default.ccClassAttrPropertyDefaultValue(e)
    : getElementDefaultValueFromParentInitializer(t);
}
function getElementDefaultValueFromParentInitializer(e) {
  if (e && Array.isArray(e) && e.length !== 0) {
    switch (typeof e[0]) {
      case "number": {
        return 0;
      }
      case "string": {
        return "";
      }
      case "boolean": {
        return false;
      }
    }
  }
  return null;
}
function encodeTargetOverrides(e) {
  if (!e || e.length <= 0) {
    return null;
  }
  const t = [];

  e.forEach((e) => {
    if (e.source && e.target) {
      e = {
        source: e.source.uuid,
        sourceInfo: e.sourceInfo ? e.sourceInfo.localID : undefined,
        propertyPath: e.propertyPath,
        target: e.target.uuid,
        targetInfo: e.targetInfo ? e.targetInfo.localID : undefined,
      };

      t.push(e);
    }
  });

  return t;
}
exports.default = {
  encodeNode,
  encodeScene,
  encodeComponent,
  encodeObject,
};
