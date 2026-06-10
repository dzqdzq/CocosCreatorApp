Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeProperties = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
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
function handleFormerlySerializedAs(e, r, t, s, a) {
  let o = defineRE.exec(s);
  let i = false;
  for (o && o[0].length >= s.length - 1 && (i = true); o; ) {
    var n = r[o[1]] || o[2] || "";
    var o_index = o.index;
    var l = o.index + o[0].length;
    s = s.substring(0, o_index) + n + s.substring(l);
    defineRE.lastIndex = 0;
    o = defineRE.exec(s);
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
  if (i) {
    return e[t] !== s && ((e[t] = s), true);
  }
  const f = e[p[1]];
  return (
    f !== undefined &&
    ((c = (p[2] && p[2].toLowerCase()) || "") && typeof f != "object"
      ? (console.warn(
          `formerlySerializedAs: '${s}' expected an object, get ${typeof f} in ${a}, upgrade skipped`
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
          : ((a = c.split("").map((e) => getVectorComponent(f, e))),
            (e[t] = serializeAsVector(a))),
        true))
  );
}
async function upgradeProperties(r, e) {
  var e_uuid = e.uuid;
  var s = r._effectAsset && r._effectAsset.__uuid__;
  let a = false;
  if (!s) {
    return false;
  }
  s = asset_db_1.queryAsset(s);
  if (!s) {
    return false;
  }
  e._assetDB.taskManager.pause(e.task);
  await s.waitInit();
  e._assetDB.taskManager.resume(e.task);
  var o = fs_extra_1.readJSONSync(s.library + ".json").techniques[r._techIdx]
    .passes;
  for (let e = 0; e < o.length; e++) {
    var i = o[e].migrations;
    if (i) {
      var n = r._props[e];
      var d = r._defines[e];
      if (i.properties && n && d) {
        for (const p of Object.keys(i.properties)) {
          var l = i.properties[p].formerlySerializedAs;

          if (l) {
            a = handleFormerlySerializedAs(n, d, p, l, e_uuid) || a;
          }
        }
        for (const f of Object.keys(i.properties)) {
          if (i.properties[f].removeImmediately) {
            delete n[f];
            a = true;
          }
        }
      }
      if (i.macros && d) {
        for (const u of Object.keys(i.macros)) {
          var c = i.macros[u].formerlySerializedAs;

          if (c) {
            a = handleFormerlySerializedAs(d, d, u, c, e_uuid) || a;
          }
        }
        for (const g of Object.keys(i.macros)) {
          if (i.macros[g].removeImmediately) {
            delete d[g];
            a = true;
          }
        }
      }
    }
  }
  return a;
}
exports.upgradeProperties = upgradeProperties;
