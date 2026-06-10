Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectNode = getSelectNode;
const cc_1 = require("cc");

const UI_GROUP_COMPONENTS = [
  cc_1.Button,
  cc_1.EditBox,
  cc_1.PageView,
  cc_1.ProgressBar,
  cc_1.RichText,
  cc_1.ScrollView,
  cc_1.Slider,
  cc_1.Toggle,
  cc_1.ToggleContainer,
].map((e) => cc_1.js.getClassName(e));

function getUIRootNode(e) {
  let e_parent = e.parent;

  while (e_parent) {
    if (e_parent === e_parent.scene) {
      return null;
    }
    for (const o of UI_GROUP_COMPONENTS) {
      if (e_parent.getComponent(o)) {
        return e_parent;
      }
    }
    e_parent = e_parent.parent;
  }

  return null;
}
function getPrefabRootNode(e) {
  return (e && e.prefab && e.prefab.root) || null;
}
function getSelectNode(e, t) {
  var o = e;
  let c = null;
  if (
    !(c = getUIRootNode(e[0])) &&
    (c = getPrefabRootNode(e[0])) &&
    (!t || t === c.uuid) &&
    cce.Scene.rootNode === c
  ) {
    return e[0];
  }

  if (c) {
    -1 !== (e = e.indexOf(c)) && o.splice(e, 1);
    o.unshift(c);
  }

  let [r] = o;
  if (t) {
    for (let e = 0; e < o.length; e++) {
      if (o[e] && t === o[e].uuid) {
        r = (r = o[e + 1]) || o[0];
        break;
      }
    }
  }
  return r;
}
