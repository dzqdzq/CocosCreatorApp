async function getPreviewUrl(e, r = false) {
  var t = await Editor.Message.request("preview", "query-preview-url");
  var i = new URL(t);
  return r && i.protocol === "http:"
    ? `http://localhost:${await Editor.Message.request(
        "server",
        "query-port"
      )}/web-mobile/${e}/index.html`
    : t + `/web-mobile/${e}/index.html`;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewUrl = getPreviewUrl;
