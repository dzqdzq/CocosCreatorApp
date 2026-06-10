function compareVersion(e, r, t = ".") {
  return (
    typeof e != "string" ||
    typeof r != "string" ||
    ((e = e.replace(t, "").padStart(3, "0")),
    (r = r.replace(t, "").padStart(3, "0")),
    Number(e) > Number(r))
  );
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareVersion = compareVersion;
