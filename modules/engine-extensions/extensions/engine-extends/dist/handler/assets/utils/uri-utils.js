function convertsEncodedSeparatorsInURI(e) {
  let t = false;
  var n = e
    .pathname()
    .split("/")
    .map((e) => {
      var n = decodeURIComponent(e).split(/[\\\/]/g);
      return n.length > 1
        ? ((t = true), n.map((e) => encodeURIComponent(e)).join("/"))
        : e;
    });

  if (t) {
    e.pathname(n.join("/"));
  }

  return e;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertsEncodedSeparatorsInURI = convertsEncodedSeparatorsInURI;
