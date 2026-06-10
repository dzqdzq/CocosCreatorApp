function setGizmoProperty(e, t, o) {
  let r = "gizmo";

  if (e === "persistent") {
    r = "persistentGizmo";
  } else if (e === "icon") {
    r = "iconGizmo";
  }

  e = t[r];

  if (e) {
    e.target = null;
  }

  if ((t[r] = o)) {
    o.target = t;
  }
}
function getGizmoProperty(e, t) {
  let o = "gizmo";

  if (e === "persistent") {
    o = "persistentGizmo";
  } else if (e === "icon") {
    o = "iconGizmo";
  }

  return t[o];
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGizmoProperty = setGizmoProperty;
exports.getGizmoProperty = getGizmoProperty;
