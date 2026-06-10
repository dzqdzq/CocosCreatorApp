Object.defineProperty(exports, "__esModule", { value: true });
exports.splitGroups = splitGroups;
exports.walk = walk;
exports.hasGroups = hasGroups;
const asset_library_1 = require("../manager/asset-library");
const _ = require("lodash");
function splitGroups(r, e = false) {
  if (r.length < 2) {
    return r;
  }
  var s = [r[0]];
  e: for (let e = 1; e < r.length; e++) {
    let t = r[e];
    var s_length = s.length;
    for (let r = 0; r < s_length; r++) {
      let e = s[r];
      var i = _.intersection(e, t);
      var e_length = e.length;
      var t_length = t.length;
      var i_length = i.length;
      if (i_length !== 0) {
        if (i_length === e_length) {
          if (e_length === t_length) {
            continue e;
          }
          t = _.difference(t, i);
        } else {
          if (i_length === t_length) {
            if (e_length !== t_length) {
              e = _.difference(e, i);
              s[r] = e;
              s.push(i);
            }

            continue e;
          }
          t = _.difference(t, i);
          e = _.difference(e, i);
          s[r] = e;
          s.push(i);
        }
      }
    }
    s.push(t);
  }
  if (e) {
    var e = _.flatten(s);
    var t = _.uniq(e);
    if (t.length < e.length) {
      console.warn(
        "Internal error: SizeMinimized.transformGroups: res not unique, transform canceled"
      );

      return r;
    }
    e = _.flatten(r);
    if (_.difference(e, t).length > 0) {
      console.warn(
        "Internal error: SizeMinimized.transformGroups: not have the same members, transform canceled"
      );

      return r;
    }
  }
  return s;
}
async function walk(e, i) {
  const u = [];
  const a = new Set();
  const l = e;

  await (async function r(t) {
    a.add(t.uuid);

    if (!i.getRedirect(t.uuid) && !u.includes(t.uuid)) {
      if (t.meta.files.includes(".json")) {
        u.push(t.uuid);
      }

      var s = (
        (await asset_library_1.buildAssetLibrary.getDependUuids(t.uuid)) || []
      ).filter(
        (e) =>
          !!(e = asset_library_1.buildAssetLibrary.getAsset(e)) &&
          ((e = asset_library_1.buildAssetLibrary.getAssetProperty(e, "type"))
            ? e !== "cc.Texture2D" && cc.js.getClassByName(e)
            : undefined)
      );
      for (let e = 0; e < s.length; e++) {
        var n = s[e];

        if (a.has(n)) {
          if (n === t.uuid || n === l.uuid) {
            console.debug(
              `[json-group] check self or raw asset, skip. ${n} depended by ${t.uuid} has checked in raw asset ${l.uuid}/bundle(${i.name})}`
            );
          }
        } else {
          await r(asset_library_1.buildAssetLibrary.getAsset(n));
        }
      }
    }
  })(e);

  if (!u || u.length < 1) {
    if (e.meta.files.includes(".json")) {
      return [e.uuid];
    }

    return [];
  }

  !u.includes(e.uuid) && e.meta.files.includes(".json") && u.push(e.uuid);

  return [...new Set(u)];
}
function hasGroups(r, t) {
  for (let e = 0; e < t.length; e++) {
    var s = t[e];
    for (let e = 0; e < s.length; e++) {
      if (s[e] === r) {
        return true;
      }
    }
  }
  return false;
}
