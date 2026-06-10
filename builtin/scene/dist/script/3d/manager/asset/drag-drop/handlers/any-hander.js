var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyHandler = undefined;
const cc_1 = require("cc");
const base_handler_1 = require("./base-handler");

const { createNodeByAsset } = require("../../../node/create");

const {
  findCanvas,
  setNodeEditorFlag,
  adjustXY,
  setPositionInNode,
} = require("./utils");

const plugin_1 = __importDefault(require("../../../plugin"));
const dump_1 = __importDefault(require("../../../../../export/dump"));
class AnyHandler extends base_handler_1.BaseHandler {
  excludedTypes = ["cc.Material"];
  dragItems = [];
  temporaryNodes = [];
  currentRaycastResultNodes = [];
  editorCanvasNode = null;
  isDragging = false;
  clear() {
    this.clearEditorCanvas();
    this.clearDragItems();
  }
  clearDragItems() {
    for (const e of this.temporaryNodes) {
      if (e.isValid) {
        e._destroyImmediate();
      }
    }
    this.dragItems.length = 0;
    this.temporaryNodes.length = 0;
    this.currentRaycastResultNodes.length = 0;
    cce.Engine.repaintInEditMode();
  }
  clearEditorCanvas() {
    if (this.editorCanvasNode && this.editorCanvasNode.isValid) {
      this.editorCanvasNode._destroyImmediate();
    }

    this.editorCanvasNode = null;
    cce.Engine.repaintInEditMode();
  }
  findEditorCanvas() {
    let e = this.editorCanvasNode || findCanvas();

    if (!e) {
      this.editorCanvasNode = e = new cc_1.Node("Drag Drop Editor Canvas");
      e.addComponent(cc_1.Canvas);
      setNodeEditorFlag(e);
      cc_1.director.getScene()?.addChild(e);
    }

    return e;
  }
  async createNode(e) {
    try {
      var t = [];
      for (const s of e) {
        try {
          var { node, canvasRequired } = await createNodeByAsset({
            uuid: s.value,
            type: s.type,
            autoAdaptToCreate: true,
            canvasRequired: s.canvasRequired,
          });
          setNodeEditorFlag(node);

          if (canvasRequired) {
            this.findEditorCanvas().addChild(node);
          } else {
            cc_1.director.getScene()?.addChild(node);
          }

          node.position = new cc_1.Vec3(999, 0, 0);
          t.push(node);
        } catch (e) {
          console.error(e);
        }
      }
      return t;
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  async drop(e, t) {
    var a = cc_1.director.getScene();
    if (a && this.temporaryNodes.length !== 0) {
      var a_uuid = a.uuid;
      var a = cce.SceneFacadeManager.beginRecording(a_uuid);
      try {
        var s = t[0].type;
        var i = this.temporaryNodes[0].worldPosition.clone();
        var n = plugin_1.default.getDropHandle(s);
        if (n) {
          Editor.Message.send(
            n.name,
            n.item.message,
            this.currentRaycastResultNodes.map(dump_1.default.dumpNode),
            { x: i.x, y: i.y, z: i.z },
            t
          );
        } else {
          for (const d of t) {
            await cce.SceneFacadeManager.createNode({
              parent: a_uuid,
              assetUuid: d.value,
              name: d.name,
              type: d.type,
              canvasRequired: d.canvasRequired,
              unlinkPrefab: d.unlinkPrefab,
              position: i,
            });
          }
        }
        cce.SceneFacadeManager.endRecording(a);
      } catch (e) {
        cce.SceneFacadeManager.cancelRecording(a);
        console.error(e);
      }
    }
  }
  async onDragLeave(e, t) {
    this.isDragging = false;
    this.clear();
  }
  async onDragOver(e, t) {
    this.isDragging = true;

    if (this.dragItems.length !== t.length) {
      this.clear();
      this.dragItems = t;

      this.createNode(t).then((e) => {
        if (this.isDragging) {
          this.temporaryNodes = e;
        } else {
          for (const t of e) {
            if (t.isValid) {
              t.destroy();
            }
          }
        }
      });
    }

    if (this.temporaryNodes.length > 0) {
      t = adjustXY(e.x, e.y);
      this.currentRaycastResultNodes = this.getRaycastResultNodes(e.x, e.y);

      setPositionInNode(
        t.x,
        t.y,
        this.temporaryNodes,
        this.currentRaycastResultNodes[0],
        this.editorCanvasNode
      );
    }

    cce.Engine.repaintInEditMode();
  }
  async onDrop(e, t) {
    this.clearEditorCanvas();
    await this.drop(e, t);
    this.clearDragItems();
  }
}
exports.AnyHandler = AnyHandler;
