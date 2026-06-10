Object.defineProperty(exports, "__esModule", { value: true });
exports.walkChild = walkChild;
exports.walk = walk;
exports.setLayer = setLayer;
exports.getUICanvasNode = getUICanvasNode;
exports.getUITransformParentNode = getUITransformParentNode;
exports.hasOneKindOfComponent = hasOneKindOfComponent;
exports.getNodeName = getNodeName;
exports.visitNode = visitNode;
exports.createNodeMetrics = createNodeMetrics;
exports.createLODMetrics = createLODMetrics;
const cc_1 = require("cc");
function walkChild(e, t) {
  if ((t[e.uuid] = e).children) {
    e.children.forEach((e) => {
      exports.walkChild(e, t);
    });
  }
}
function walk(e, t) {
  exports.walkChild(e, t);
}
function setLayer(e, t, r) {
  e.layer = t;
  for (const n of e.children) {
    setLayer(n, t, r);
  }
}
function getUICanvasNode(r, r_parent = true) {
  if (r) {
    if (hasOneKindOfComponent(r, cc_1.Canvas)) {
      return r;
    }
    let t = cc_1.director.getScene();

    if (cce.SceneFacadeManager.queryMode() === "prefab" && r_parent) {
      r_parent =
        cce.SceneFacadeManager._facadeFSM.prefabSceneFacade._sceneProxy;
      t = r_parent.getRootNode();
    }

    if (r !== t) {
      let r_parent = r.parent;

      while (r_parent) {
        if (hasOneKindOfComponent(r_parent, cc_1.Canvas)) {
          return r;
        }
        if (r_parent === t) {
          break;
        }
        r_parent = r_parent.parent;
      }
    }

    var n = r.children.slice();
    for (let r_parent = n.length - 1; r_parent >= 0; r_parent--) {
      var a = n[r_parent];
      if (hasOneKindOfComponent(a, cc_1.Canvas)) {
        return a;
      }
    }
  }
  return null;
}
function getUITransformParentNode(r) {
  if (r) {
    if (hasOneKindOfComponent(r, cc_1.UITransformComponent)) {
      return r;
    }
    let t = cc_1.director.getScene();
    var r_parent = cce.SceneFacadeManager.queryMode();

    if (r_parent === "prefab") {
      r_parent =
        cce.SceneFacadeManager._facadeFSM.prefabSceneFacade._sceneProxy;
      t = r_parent.getRootNode();
    }

    if (r !== t) {
      let r_parent = r.parent;

      while (r_parent) {
        if (hasOneKindOfComponent(r_parent, cc_1.UITransformComponent)) {
          return r_parent;
        }
        if (r_parent === t) {
          break;
        }
        r_parent = r_parent.parent;
      }
    }
  }
  return null;
}
function hasOneKindOfComponent(t, r) {
  if (t && t.components) {
    for (let e = 0; e < t.components.length; e++) {
      if (t.components[e] instanceof r) {
        return true;
      }
    }
  }
  return false;
}
function getNodeName(e, t) {
  if (t && Array.isArray(t.children)) {
    for (var r = t.children.map((e) => (e && e.name) || ""); r.includes(e); ) {
      if (/(\d+)$/.test(e)) {
        e = e.replace(/(\d+)$/, (e, t) => {
          var r = parseInt(t, 10);
          return (r += 1).toString().padStart(t.length, "0");
        });
      } else {
        e += "-001";
      }
    }
  }
  return e;
}
function visitNode(e, t, r = false) {
  r = t(e, !!r);
  if (!r) {
    var e_children = e.children;
    for (let e = e_children.length - 1; e >= 0; --e) {
      visitNode(e_children[e], t, true);
    }
  }
}
async function createNodeMetrics(e) {
  if (e && e.includes("@")) {
    try {
      var [t, ,] = e.split("@");
      var r = await Editor.Message.request("asset-db", "query-asset-meta", t);

      if (
        r &&
        r.importer &&
        (r.importer === "fbx" || r.importer === "gltf") &&
        (r.userData &&
          r.userData.meshSimplify &&
          r.userData.meshSimplify.enable &&
          Editor.Metrics._trackEventWithTimer({
            category: "createNode",
            id: "A100010",
            value: 1,
          }),
        r.userData) &&
        r.userData.fbx &&
        r.userData.fbx.smartMaterialEnabled
      ) {
        Editor.Metrics._trackEventWithTimer({
          category: "createNode",
          id: "A100011",
          value: 1,
        });
      }
    } catch (e) {
      console.debug(e);
    }
  }
}
async function createLODMetrics(e) {
  if (e && e._components && e.getComponent("cc.LODGroup")) {
    Editor.Metrics._trackEventWithTimer({
      category: "LOD",
      id: "A100001",
      value: 1,
    });
  }
}
