Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeProperties = upgradeProperties;

const { queryAsset } = require("@editor/asset-db");

const { existsSync, readJSONSync } = require("fs-extra");

const auxMap = {
  x: "r",
  y: "g",
  z: "b",
  w: "a",
  r: "x",
  g: "y",
  b: "z",
  a: "w",
};
function getVectorComponent(e, r) {
  var t = e[r];
  var e = e[auxMap[r]];
  return t !== undefined ? t : e !== undefined ? e : 0;
}
const idxMap = ["x", "y", "z", "w"];
function serializeAsVector(e) {
  const t = { __type__: "cc.Vec" + e.length };

  e.forEach((e, r) => (t[idxMap[r]] = e));

  return t;
}
const defineRE = /<\s*(\w+)\s*(?:\|\s*(\w+))?\s*>/g;
const targetRE = /(\w+)\s*(?:\.\s*([xyzw]+|[rgba]+))?/i;
function handleFormerlySerializedAs(e, r, t, s, o) {
  let i = defineRE.exec(s);
  let a = false;
  for (i && i[0].length >= s.length - 1 && (a = true); i; ) {
    var n = r[i[1]] || i[2] || "";
    var i_index = i.index;
    var l = i.index + i[0].length;
    s = s.substring(0, i_index) + n + s.substring(l);
    defineRE.lastIndex = 0;
    i = defineRE.exec(s);
  }
  var c;
  var p = targetRE.exec(s);
  if (!p) {
    console.warn(
      `formerlySerializedAs: illegal target '${s}', upgrade skipped`
    );

    return false;
  }
  if (!s.endsWith("!") && e[t] !== undefined) {
    return false;
  }
  if (a) {
    return e[t] !== s && ((e[t] = s), true);
  }
  const f = e[p[1]];
  return (
    f !== undefined &&
    ((c = (p[2] && p[2].toLowerCase()) || "") && typeof f != "object"
      ? (console.warn(
          `formerlySerializedAs: '${s}' expected an object, get ${typeof f} in ${o}, upgrade skipped`
        ),
        false)
      : c.length > 4
      ? (console.warn(
          `formerlySerializedAs: illegal target '${s}', upgrade skipped`
        ),
        false)
      : (c.length === 0
          ? ((e[t] = f), delete e[p[1]])
          : c.length === 1
          ? (e[t] = getVectorComponent(f, c))
          : ((o = c.split("").map((e) => getVectorComponent(f, e))),
            (e[t] = serializeAsVector(o))),
        true))
  );
}
async function upgradeProperties(r, e) {
  var e_uuid = e.uuid;
  var e = r._effectAsset && r._effectAsset.__uuid__;
  let s = false;
  if (!e) {
    return false;
  }
  e = queryAsset(e);
  if (!e || !e.imported) {
    return false;
  }
  var o = e.library + ".json";
  if (!existsSync(o)) {
    console.error(
      `upgradeProperties: the library json of effect(${e.source}) not found, upgrade skipped`
    );

    return false;
  }
  var i = readJSONSync(o).techniques[r._techIdx].passes;
  for (let e = 0; e < i.length; e++) {
    var a = i[e].migrations;
    if (a) {
      var n = r._props[e];
      var d = r._defines[e];
      if (a.properties && n && d) {
        for (const p of Object.keys(a.properties)) {
          var l = a.properties[p].formerlySerializedAs;

          if (l) {
            s = handleFormerlySerializedAs(n, d, p, l, e_uuid) || s;
          }
        }
        for (const f of Object.keys(a.properties)) {
          if (a.properties[f].removeImmediately) {
            delete n[f];
            s = true;
          }
        }
      }
      if (a.macros && d) {
        for (const u of Object.keys(a.macros)) {
          var c = a.macros[u].formerlySerializedAs;

          if (c) {
            s = handleFormerlySerializedAs(d, d, u, c, e_uuid) || s;
          }
        }
        for (const g of Object.keys(a.macros)) {
          if (a.macros[g].removeImmediately) {
            delete d[g];
            s = true;
          }
        }
      }
    }
  }
  return s;
}
