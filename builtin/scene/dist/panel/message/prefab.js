Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.apply = apply;
let $scene;
let $loading = null;
function init(e) {
  $scene = e.$.scene;
  $loading = e.$.loading;
}
function apply(e) {
  e["create-prefab"] = async (e, n) =>
    $scene ? await $scene.callSceneMethod("createPrefab", [e, n]) : null;

  e["getdata-prefab"] = async (e) =>
    $scene ? await $scene.callSceneMethod("getPrefabData", [e]) : null;

  e["link-prefab"] = async (e, n) =>
    $scene ? await $scene.callSceneMethod("linkPrefab", [e, n]) : null;

  e["unlink-prefab"] = async (e, n) =>
    $scene
      ? await $scene.callSceneMethod("unlinkPrefab", [e, n ?? false])
      : null;
}
