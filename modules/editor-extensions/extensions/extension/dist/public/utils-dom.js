function inShadowRoot(t) {
  var t_target = t.target;
  return t.composed && t_target.shadowRoot != null;
}
function getTargetFromEvent(t) {
  var t_target = t.target;
  return t.composed && t_target.shadowRoot
    ? t.composedPath?.()[0] ?? t_target
    : t_target;
}
function elementsContains(t, e) {
  return Array.isArray(t)
    ? t.some((t) => t != null && t.contains(e))
    : t != null && t.contains(e);
}
function containsEventTarget(t, e) {
  if (!inShadowRoot(e)) {
    return elementsContains(t, getTargetFromEvent(e));
  }
  for (const n of e.composedPath()) {
    if (n instanceof Element && elementsContains(t, n)) {
      return true;
    }
  }
  return false;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.inShadowRoot = inShadowRoot;
exports.getTargetFromEvent = getTargetFromEvent;
exports.elementsContains = elementsContains;
exports.containsEventTarget = containsEventTarget;
