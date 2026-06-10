function getDocUrl(e, r = "manual") {
  return e ? new URL(e, Editor.App.urls[r]).href : "";
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocUrl = getDocUrl;
