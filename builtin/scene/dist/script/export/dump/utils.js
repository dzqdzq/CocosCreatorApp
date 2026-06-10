Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefault = getDefault;
exports.getConstructor = getConstructor;
exports.getType = getType;
exports.getTypeName = getTypeName;
exports.getTypeInheritanceChain = getTypeInheritanceChain;
exports.parsingPath = parsingPath;
exports.generatePath = generatePath;
exports.ccClassAttrPropertyDefaultValue = ccClassAttrPropertyDefaultValue;
const cc_1 = require("cc");
function getDefault(e) {
  let t;
  return (t = typeof e.default == "function" ? e.default() : e.default);
}
function getConstructor(e, t) {
  return t && t.ctor ? t.ctor : e == null ? null : e.constructor;
}
function getType(e) {
  return e ? cc.js.getClassId(e) || e.name : "Unknown";
}
function getTypeName(e) {
  return cc.js.getClassName(e) || "Unknown";
}
function getTypeInheritanceChain(e) {
  return cc.Class.getInheritanceChain(e)
    .map((e) => getTypeName(e))
    .filter(Boolean);
}
function parsingPath(e, t) {
  t = (
    (e =
      t instanceof cc_1.Node
        ? (e = (e = (e = e.replace(/^__comps__/, "_components")).replace(
            /^position$/,
            "_lpos"
          )).replace(/^scale$/, "_lscale")).replace(/^rotation$/, "eulerAngles")
        : e) || ""
  ).split(".");

  e = t.pop() || "";
  return { search: t.join("."), key: e };
}
function walkProps(e, t, r) {
  var n = e?.constructor?.__props__;
  if (n) {
    for (const a of n) {
      if (e[a] === t) {
        return r + "." + a;
      }
      if (e[a]?.constructor?.__props__) {
        return walkProps(e[a], t, r + "." + a);
      }
    }
  }
}
function generatePath(t, e, r, n) {
  var a = t.constructor.__props__;
  if (a.includes(r) && t[r] === n) {
    return r;
  }
  walkProps(t, r, n);
  for (const o of a) {
    t[o];
  }
  for (let e = 0; e < t.components.length; e++) {
    walkProps(t.components[e], r, "__comps__." + e);
  }
  return "";
}
function ccClassAttrPropertyDefaultValue(e) {
  if (e.type === undefined) {
    return e.default ? getDefault(e) : null;
  }
  var t = { Boolean: false, String: "", Float: 0, Integer: 0, BitMask: 0 }[
    e.type
  ];
  if (t !== undefined) {
    return t;
  }
  switch (e.type) {
    case "Enum": {
      return (e.enumList[0] && e.enumList[0].value) || 0;
    }
    case "Object": {
      var e_ctor = e.ctor;
      if (
        cc.js.isChildClassOf(e_ctor, cc.Asset) ||
        cc.js.isChildClassOf(e_ctor, cc.Node) ||
        cc.js.isChildClassOf(e_ctor, cc.Component)
      ) {
        return null;
      }
      try {
        return new e_ctor();
      } catch (e) {
        console.error(e);
        return null;
      }
    }
  }
  return null;
}
exports.default = {
  getDefault,
  getConstructor,
  getType,
  getTypeName,
  getTypeInheritanceChain,
  parsingPath,
  generatePath,
  ccClassAttrPropertyDefaultValue,
};
