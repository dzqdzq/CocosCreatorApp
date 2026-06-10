var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAssetWithFilterConfig = checkAssetWithFilterConfig;
exports.matchFilterConfig = matchFilterConfig;
exports.filterAssetWithBundleConfig = filterAssetWithBundleConfig;
const minimatch_1 = __importDefault(require("minimatch"));
function checkAssetWithFilterConfig(t, e) {
  var i;
  return (
    !e ||
    !e.length ||
    (!!(i =
      !(i = e.filter((e) => e.range === "include")).length ||
      i.some((e) => matchFilterConfig(t, e))) &&
      ((e = e.filter((e) => e.range === "exclude")).length
        ? !e.some((e) => matchFilterConfig(t, e))
        : i))
  );
}
function matchFilterConfig(e, t) {
  var i = t.range === "include";
  let n = i;
  if (t.type === "asset" && t.assets) {
    n = t.assets.length ? t.assets.includes(e.uuid) : i;
  } else if (t.type === "url" && t.patchOption) {
    if (t.patchOption.value) {
      switch (t.patchOption.patchType) {
        case "beginWith": {
          n = new RegExp("^" + t.patchOption.value, "i").test(e.url);
          break;
        }
        case "endWith": {
          n = new RegExp(t.patchOption.value + "$", "i").test(e.url);
          break;
        }
        case "contain": {
          n = new RegExp(t.patchOption.value, "i").test(e.url);
          break;
        }
        case "glob": {
          n = (0, minimatch_1.default)(e.url, t.patchOption.value, {
            nocase: true,
          });
        }
      }
    } else {
      n = i;
    }
  }
  return n;
}
function filterAssetWithBundleConfig(e, t) {
  return e.filter((e) => checkAssetWithFilterConfig(e, t));
}
