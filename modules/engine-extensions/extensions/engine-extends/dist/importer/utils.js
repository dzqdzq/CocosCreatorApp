var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.getTrimRect = undefined;
exports.getPixiel = undefined;
exports.clamp = undefined;
exports.linkToAssetTarget = undefined;
exports.i18nTranslate = undefined;
exports.getDependUUIDList = undefined;

const electron_i18n_1 = __importDefault(require("@base/electron-i18n"));
function getDependUUIDList(e) {
  var t;

  if (typeof e == "string") {
    if (
      !e.match(
        /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}(@[a-z0-9]+){0,}/g
      )
    ) {
      return [];
    }
  }

  (t = new cc.deserialize.Details()).reset();
  cc.deserialize(e, t, { createAssetRefs: true, ignoreEditorOnly: true });
  return t.uuidList;
}
function i18nTranslate(e, ...t) {
  let r = electron_i18n_1.default.translation(e);
  if (typeof t[0] == "object") {
    var [i] = t;
    var e = r.match(/{(\w+)}/g);
    if (e) {
      for (const n of e) {
        var a = n.substr(1, n.length - 2);
        r = r.replace(n, i[a]);
      }
    }
  }
  return r;
}
function linkToAssetTarget(e) {
  return `{asset(${e})}`;
}
function clamp(e, t, r) {
  return e < t ? t : r < e ? r : e;
}
function getPixiel(e, t, r, i) {
  t = 4 * t + r * i * 4;
  return { r: e[t], g: e[1 + t], b: e[2 + t], a: e[3 + t] };
}
function getTrimRect(e, t, r, i) {
  var a = i;
  let n = t;
  let o = r;
  let s = 0;
  let l = 0;
  let f;
  let c;
  for (c = 0; c < r; c++) {
    for (f = 0; f < t; f++) {
      if (getPixiel(e, f, c, t).a >= a) {
        o = c;
        c = r;
        break;
      }
    }
  }
  for (c = r - 1; c >= o; c--) {
    for (f = 0; f < t; f++) {
      if (getPixiel(e, f, c, t).a >= a) {
        l = c - o + 1;
        c = 0;
        break;
      }
    }
  }
  for (f = 0; f < t; f++) {
    for (c = o; c < o + l; c++) {
      if (getPixiel(e, f, c, t).a >= a) {
        n = f;
        f = t;
        break;
      }
    }
  }
  for (f = t - 1; f >= n; f--) {
    for (c = o; c < o + l; c++) {
      if (getPixiel(e, f, c, t).a >= a) {
        s = f - n + 1;
        f = 0;
        break;
      }
    }
  }
  return [n, o, s, l];
}
exports.getDependUUIDList = getDependUUIDList;
exports.i18nTranslate = i18nTranslate;
exports.linkToAssetTarget = linkToAssetTarget;
exports.clamp = clamp;
exports.getPixiel = getPixiel;
exports.getTrimRect = getTrimRect;
