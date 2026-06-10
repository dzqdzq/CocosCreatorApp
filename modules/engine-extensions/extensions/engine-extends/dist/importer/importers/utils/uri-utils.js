function convertsEncodedSeparatorsInURI(e) {
  let o = false;
  var n = e
    .pathname()
    .split("/")
    .map((e) => {
      var n = decodeURIComponent(e).split(/[\\\/]/g);
      return n.length > 1
        ? ((o = true), n.map((e) => encodeURIComponent(e)).join("/"))
        : e;
    });

  if (o) {
    e.pathname(n.join("/"));
  }

  return e;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertsEncodedSeparatorsInURI = undefined;
exports.convertsEncodedSeparatorsInURI = convertsEncodedSeparatorsInURI;
