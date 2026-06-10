function getParent(e) {
  return e ? e.parentElement || e.getRootNode().host : null;
}
function getParentRecursive(e, t) {
  let r = e;
  do {
    if (t((r = getParent(r)))) {
      break;
    }
  } while (r);
  return r;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentRecursive = getParentRecursive;
