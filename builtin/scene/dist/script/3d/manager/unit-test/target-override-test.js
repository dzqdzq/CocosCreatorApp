var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetOverrideTest = undefined;

const { getTestDir, delay, clearTestDir } = require("./unit-test-interface");

const node_1 = __importDefault(require("../node"));
const cc_1 = require("cc");

const { find } = cc_1;

const { returnFalseWithLog, getPrefabInfo } = require("./common");

const multi_scene_1 = __importDefault(require("../multi-scene"));
const testPrefabAssetUrl = getTestDir() + "/Root.prefab";

const childPrefabAssetUrl = getTestDir() + "/childNode.prefab";

const testRefClassName = "TestPrefabRef";
const testRefCompUrl = getTestDir() + "/__testRef__.ts";

const testRefCompContent = ` 
  ${""}import { _decorator, Component, Node } from 'cc';
  const { ccclass, property, type } = _decorator;

  @ccclass('${testRefClassName}')
  ${""}export class TestRef extends Component {
      @type(Node)
      public refNode: Node|null = null;
      
      @type(Component)
      public refComp: Component|null = null;

      start () {
      }
  }
`;

let testRefScriptURL = null;
class TargetOverrideTest {
  async test(e) {
    console.log("targetOverrideTest-----------");
    await e.loadEmptyScene();
    var t = 1000; /* 1e3 */
    var r = await e.createNode({ name: "Root" });
    if (!r) {
      return returnFalseWithLog("testsNodeUUID is null");
    }
    var o = await e.createPrefab(r, testPrefabAssetUrl);
    if (!o) {
      return returnFalseWithLog("testPrefabAssetUUID is null");
    }
    await delay(t);

    if (!(r = (await e.queryNodesByAssetUuid(o))[0])) {
      return returnFalseWithLog("testNodeUUID is null");
    }

    let n = node_1.default.query(r);
    if (!n) {
      return returnFalseWithLog("can't find rootNode");
    }
    var a = getPrefabInfo(n);
    if (!a?.fileId) {
      return false;
    }
    var i = a.instance?.propertyOverrides;
    if (!i || i.length !== 4) {
      return returnFalseWithLog("property overrides doesn't match");
    }
    await e.openScene(o);
    i = await Editor.Message.request(
      "asset-db",
      "create-asset",
      testRefCompUrl,
      testRefCompContent,
      { overwrite: true }
    );
    if (!i) {
      return returnFalseWithLog("assetInfo is null");
    }
    testRefScriptURL = i.url;
    await delay(2000 /* 2e3 */);

    if (!cc.js.getClassByName(testRefClassName)) {
      return returnFalseWithLog(
        `创建${testRefClassName}失败,请确保脚本创建后有触发编译`
      );
    }

    let s = cc_1.director.getScene();
    if (!s) {
      return returnFalseWithLog("scene is null");
    }
    var i = (n = s.getChildByName("Root")).uuid;

    await e.createNode({
      name: "childCylinderNode",
      assetUuid: "ab3e16f9-671e-48a7-90b7-d0884d9cbb85",
      parent: i,
    });

    var u = await e.createNode({
      name: "childNode",
      assetUuid: "30da77a1-f02d-4ede-aa56-403452ee7fde",
      parent: i,
    });

    var c = await e.createNode({ name: "testOutRef", parent: u });

    await e.createComponent({ uuid: c, component: testRefClassName });
    var d = await e.createNode({ name: "testInRef", parent: u });
    await e.createComponent({ uuid: d, component: testRefClassName });
    var l = await e.createPrefab(u, childPrefabAssetUrl);

    await e.saveScene();
    await delay(t);
    await e.openScene(l);

    if (multi_scene_1.default.useMultipleEdit) {
      multi_scene_1.default.multiSceneClose(o, "prefab");
    }

    await delay(t);

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    var i = (n = s.children[0]).uuid;
    var m = node_1.default.query(i);
    m.children[0].uuid;
    var d = m.children[1].uuid;

    await e.setNodeProperty({
      uuid: d,
      path: "__comps__.0.refNode",
      dump: { type: "cc.Node", value: { uuid: i } },
    });

    node_1.default.query(d).getComponent(testRefClassName).refNode = n;
    await e.saveScene();
    await delay(t);
    await e.openScene(o);

    if (multi_scene_1.default.useMultipleEdit) {
      multi_scene_1.default.multiSceneClose(l, "prefab");
    }

    await delay(t);

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    i = (n = s.getChildByName("Root")).uuid;
    m = await e.createNode({
      name: "childNode2",
      assetUuid: l,
      parent: i,
      type: "cc.Prefab",
    });
    let f = node_1.default.query(m);
    d = f.children[0];
    e.createComponent({ uuid: i, component: testRefClassName });

    await e.setNodeProperty({
      uuid: i,
      path: "__comps__.0.refNode",
      dump: { type: "cc.Node", value: { uuid: d.uuid } },
    });

    let _ = node_1.default.query(i).children[1];
    let p = _.children[0];

    await e.setNodeProperty({
      uuid: p.uuid,
      path: "__comps__.0.refNode",
      dump: { type: "cc.Node", value: { uuid: d.uuid } },
    });

    if (
      !(a = getPrefabInfo(n)) ||
      !a.targetOverrides ||
      a.targetOverrides.length !== 2
    ) {
      return returnFalseWithLog("wrong targetOverrides in prefabInfo");
    }

    if (
      a.targetOverrides[0].target !== f ||
      a.targetOverrides[1].target !== f
    ) {
      return returnFalseWithLog("wrong target in targetOverride");
    }
    console.log("override in prefab mode:", a.targetOverrides[0].targetInfo);
    await e.saveScene();
    await e.closeScene();

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    i = (n = s.getChildByName("Root")).uuid;
    o = await e.createNode({ name: "mountedNode", parent: i });
    e.createComponent({ uuid: o, component: testRefClassName });
    t = node_1.default.query(o);
    d = (f = n.getChildByName("childNode2")).getChildByName("testOutRef");

    await e.setNodeProperty({
      uuid: o,
      path: "__comps__.0.refNode",
      dump: { type: "cc.Node", value: { uuid: d.uuid } },
    });

    await e.setNodeProperty({
      uuid: o,
      path: "__comps__.0.refComp",
      dump: { type: "cc.Component", value: { uuid: f.components[0].uuid } },
    });

    l = getPrefabInfo(s);
    if (!l || !l.targetOverrides || l.targetOverrides.length < 0) {
      return returnFalseWithLog("no targetOverrides in scene prefabInfo");
    }
    console.log(l);

    if (
      l.targetOverrides[0].source !== t.getComponent(testRefClassName) ||
      l.targetOverrides[0].target !== n
    ) {
      return returnFalseWithLog("wrong targetOverrides in scene prefabInfo");
    }

    await e.softReloadScene();

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    (n = s.getChildByName("Root")).uuid;
    u = (_ = n.children[1]).uuid;
    f = n.children[2];
    m = n.children[3];
    c = (p = _.children[0]).uuid;
    d = f.children[0];

    if (p.getComponent(testRefClassName).refNode !== d) {
      return returnFalseWithLog("wrong testOutRef in prefab");
    }

    if (m.getComponent(testRefClassName).refNode !== d) {
      return returnFalseWithLog("wrong testOutRef in scene");
    }
    if (m.getComponent(testRefClassName).refComp !== f.components[0]) {
      return returnFalseWithLog("wrong testOutRef component in scene");
    }
    e.createComponent({ uuid: u, component: testRefClassName });

    await e.setNodeProperty({
      uuid: u,
      path: "__comps__.1.refNode",
      dump: { type: "cc.Node", value: { uuid: c } },
    });

    await e.softReloadScene();

    if (!(s = cc_1.director.getScene())) {
      return returnFalseWithLog("scene is null");
    }

    if (!(_ = find("Root/childNode"))) {
      return returnFalseWithLog("can't find childNode");
    }
    if (!(p = find("Root/childNode/testOutRef"))) {
      return returnFalseWithLog("can't find testOutRefNode");
    }
    if (_.getComponent(testRefClassName).refNode !== p) {
      return returnFalseWithLog("wrong mountedComponent ref to prefab");
    }
    (n = s.getChildByName("Root")).uuid;
    cce.Selection.clear();
    a = await e.createNode({ name: "normalNode" });
    e.createComponent({ uuid: a, component: testRefClassName });
    let g = node_1.default.query(a);
    d = (f = n.children[2]).children[0];

    await e.setNodeProperty({
      uuid: a,
      path: "__comps__.0.refNode",
      dump: { type: "cc.Node", value: { uuid: d.uuid } },
    });

    await e.setNodeProperty({
      uuid: a,
      path: "__comps__.0.refComp",
      dump: { type: "cc.Component", value: { uuid: f.components[0].uuid } },
    });

    return !(l = getPrefabInfo(s)) ||
      !l.targetOverrides ||
      l.targetOverrides.length < 0
      ? returnFalseWithLog("no targetOverrides in scene prefabInfo")
      : (console.log(l),
        l.targetOverrides[4].source !== g.getComponent(testRefClassName) ||
        l.targetOverrides[4].target !== n
          ? returnFalseWithLog("wrong targetOverrides in scene prefabInfo")
          : (await e.softReloadScene(),
            (s = cc_1.director.getScene())
              ? ((n = s.getChildByName("Root")),
                (g = s.getChildByName("normalNode")),
                n.uuid,
                (_ = n.children[1]).uuid,
                (f = n.children[2]),
                (p = _.children[0]).uuid,
                (d = f.children[0]),
                p.getComponent(testRefClassName).refNode !== d
                  ? returnFalseWithLog("wrong testOutRef in prefab")
                  : g.getComponent(testRefClassName).refNode !== d
                  ? returnFalseWithLog("wrong testOutRef in scene")
                  : g.getComponent(testRefClassName).refComp !== f.components[0]
                  ? returnFalseWithLog("wrong testOutRef component in scene")
                  : ((r = n.uuid),
                    (a = g.uuid),
                    e.removeNode({ uuid: r }),
                    e.removeNode({ uuid: a }),
                    true))
              : returnFalseWithLog("scene is null")));
  }
  async clear() {
    cce.Selection.clear();
    await clearTestDir();
    return true;
  }
}
const targetOverrideTest = new TargetOverrideTest();
exports.targetOverrideTest = targetOverrideTest;
