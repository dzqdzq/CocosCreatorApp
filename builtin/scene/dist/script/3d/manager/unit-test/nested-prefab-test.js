var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.nestedPrefabTest = undefined;

const { getTestDir, delay, clearTestDir } = require("./unit-test-interface");

const node_1 = __importDefault(require("../node"));
const cc_1 = require("cc");

const { returnFalseWithLog, getPrefabInfo } = require("./common");

const multi_scene_1 = __importDefault(require("../multi-scene"));
const cubeAssetUUID = "30da77a1-f02d-4ede-aa56-403452ee7fde";
const boxColliderClassName = cc_1.js.getClassName(cc_1.BoxCollider);

const testPrefabAssetUrl = getTestDir() + "/testPrefab.prefab";

const childPrefabAssetUrl = getTestDir() + "/childPrefab.prefab";

const cubeNode2PrefabAssetUrl = getTestDir() + "/CubeNode2.prefab";

class NestedPrefabTest {
  async test(a) {
    console.log("NestedPrefabTest-----------");
    const n = 1000; /* 1e3 */
    await a.loadEmptyScene();
    var e = await a.createNode({ name: "testPrefab" });
    if (!e) {
      return returnFalseWithLog("testNodeUUID check failed");
    }
    var t = await a.createPrefab(e, testPrefabAssetUrl);
    if (!t) {
      return returnFalseWithLog("testPrefabAssetUUID check failed");
    }
    e = (await a.queryNodesByAssetUuid(t))[0];
    await delay(n);
    let i = node_1.default.query(e);
    var r = getPrefabInfo(i);
    if (!r?.fileId) {
      return returnFalseWithLog("rootNodePrefabInfo.fileID check failed");
    }
    r = r.instance?.propertyOverrides;
    if (!r || r.length !== 4) {
      return returnFalseWithLog("property overrides doesn't match");
    }
    let c = "";
    let s = null;
    async function d(e, t = "testPrefab") {
      await delay(n);
      await a.openScene(e);

      if (!(s = cc_1.director.getScene())) {
        return returnFalseWithLog("scene is null");
      }

      i = s.getChildByName(t);
      c = i.uuid;
    }
    await d(t);
    await a.createNode({
      name: "childCylinderNode",
      assetUuid: "ab3e16f9-671e-48a7-90b7-d0884d9cbb85",
      parent: c,
    });

    var r = await a.createNode({
      name: "childPrefab",
      assetUuid: cubeAssetUUID,
      parent: c,
    });

    var r =
      (await a.createNode({
        name: "CubeNode",
        assetUuid: cubeAssetUUID,
        parent: r,
      }),
      await a.createPrefab(r, childPrefabAssetUrl));

    await delay(n);
    await a.saveScene();
    await delay(n);
    await a.openScene(r);

    if (multi_scene_1.default.useMultipleEdit) {
      multi_scene_1.default.multiSceneClose(t, "prefab");
    }

    await a.saveScene();
    await delay(n);
    await d(t);

    if (multi_scene_1.default.useMultipleEdit) {
      multi_scene_1.default.multiSceneClose(r, "prefab");
    }

    var o = i.children[1];

    var u = "CubeNode2";

    var l = await a.createNode({
      name: u,
      assetUuid: cubeAssetUUID,
      parent: o.uuid,
    });

    await a.createNode({
      name: "CubeNode2Child",
      assetUuid: cubeAssetUUID,
      parent: l,
    });
    let f = o.children[0];
    node_1.default.createComponent(f.uuid, boxColliderClassName);
    await a.saveScene();
    await a.closeScene();
    await delay(n);
    await d(t);

    if ((o = i.children[1]).children.length !== 2) {
      return returnFalseWithLog(
        "mounted child in nested prefab save failed. " + o.children.length
      );
    }

    if (!(f = o.children[0]).getComponent(boxColliderClassName)) {
      return returnFalseWithLog(
        "mounted component in nested prefab save failed"
      );
    }
    if (o.children[1].children.length !== 1) {
      return returnFalseWithLog(
        "mounted component in nested prefab save failed"
      );
    }
    l = o.children[1].uuid;
    await a.createPrefab(l, cubeNode2PrefabAssetUrl);
    await delay(n);

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    i = s.getChildByName("testPrefab");
    c = i.uuid;
    l = (o = i.children[1]).children[1];
    if (l.name !== u) {
      return returnFalseWithLog(
        "mounted prefabInstance node in nested prefab save failed"
      );
    }
    u = "CubeNode2NewName";

    await a.setNodeProperty({
      uuid: l.uuid,
      path: "name",
      dump: { type: "String", value: u },
    });

    await a.saveScene();
    await a.closeScene();
    await delay(n);
    await d(t);

    if ((l = (o = i.children[1]).children[1]).name !== u) {
      return returnFalseWithLog(
        "mounted prefabInstance node in nested prefab change name failed"
      );
    }

    await a.unlinkPrefab(l.uuid, false);
    await a.saveScene();
    await a.closeScene();
    await delay(n);
    await d(t);

    if ((l = (o = i.children[1]).children[1]).name !== u) {
      return returnFalseWithLog(
        "mounted prefabInstance node in nested prefab change name failed"
      );
    }

    if (l.children.length !== 1) {
      return returnFalseWithLog(
        "mounted prefabInstance node in nested prefab unWrap failed"
      );
    }
    await a.duplicateNode(o.uuid);
    var u = i.children[2];
    var l = getPrefabInfo(o);
    var _ = getPrefabInfo(u);
    if (l?.instance && _?.instance && l.instance.fileId === _.instance.fileId) {
      return returnFalseWithLog(
        "duplicate prefabInstance node has the same fileId"
      );
    }
    a.unlinkPrefab(o.uuid, false);
    a.unlinkPrefab(u.uuid, false);
    await a.saveScene();
    await a.closeScene();
    await delay(n);

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    i = s.getChildByName("testPrefab");
    c = i.uuid;
    o = i.children[1];
    u = i.children[2];

    if (o.uuid === u.uuid) {
      return returnFalseWithLog(
        "unWrap duplicate prefabInstance node has the same uuid"
      );
    }

    l = getPrefabInfo(o);
    _ = getPrefabInfo(u);

    if (l && _ && l.fileId === _.fileId) {
      return returnFalseWithLog(
        "unWrap duplicate prefabInstance node has the same fileId"
      );
    }

    await d(t);
    o = i.children[1];
    u = i.children[2];
    a.removeNode({ uuid: o.uuid });
    a.removeNode({ uuid: u.uuid });
    a.createNode({ parent: c, type: "cc.Prefab", assetUuid: r });
    await delay(n);
    o = i.children[1];
    f = o.children[0];

    a.setNodeProperty({
      uuid: f.uuid,
      path: "__comps__.0.shadowCastingMode",
      dump: { type: "Enum", value: 1 },
    });

    await a.saveScene();
    await a.closeScene();
    await delay(n);
    await d(t);
    o = i.children[1];
    l = (f = o.children[0]).getComponent(cc_1.MeshRenderer);
    return l?.shadowCastingMode !== 1
      ? returnFalseWithLog(
          "component value in nested prefab not saved correctly"
        )
      : (await a.saveScene(),
        await a.closeScene(),
        await delay(n),
        (s = cc_1.director.getScene())
          ? ((e = (i = s.getChildByName("testPrefab")).uuid),
            a.removeNode({ uuid: e }),
            true)
          : returnFalseWithLog("scene is null"));
  }
  async clear() {
    cce.Selection.clear();
    await clearTestDir();
    return true;
  }
}
const nestedPrefabTest = new NestedPrefabTest();
exports.nestedPrefabTest = nestedPrefabTest;
