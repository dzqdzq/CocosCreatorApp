var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshPreview = undefined;
const cc_1 = require("cc");

const { promisify } = require("../../../utils/misc");

const node_1 = __importDefault(require("../../../utils/node"));
const Interactive_preview_1 = require("../preview/Interactive-preview");
const regions = [new cc_1.gfx.BufferTextureCopy()];
regions[0].texExtent.depth = 1;
const tempVec3A = new cc_1.Vec3();
const tempVec3B = new cc_1.Vec3();
const tempQuatA = new cc_1.Quat();
function calcModelInfo(e) {
  var t = { vertices: 0, polygons: 0, uvs: [] };
  let i = 0;
  let s = 0;
  var o = [];
  if (e) {
    var r;
    var n = e.getComponent(cc_1.MeshRenderer);
    if (n && n.mesh) {
      for (const l of n.mesh.struct.primitives) {
        var a =
          n.mesh.struct.vertexBundles[l.vertexBundelIndices[0]].view.count;

        if (l.vertexBundelIndices.length !== 0) {
          i += a;
        }

        var c = l.indexView ? l.indexView.count : a;

        switch (l.primitiveMode) {
          case cc_1.gfx.PrimitiveMode.TRIANGLE_LIST: {
            s += c / 3;
            break;
          }
          case cc_1.gfx.PrimitiveMode.TRIANGLE_STRIP:
          case cc_1.gfx.PrimitiveMode.TRIANGLE_FAN: {
            s += c - 2;
          }
        }
      }
      if (n.mesh.struct.vertexBundles) {
        for (const m of n.mesh.struct.vertexBundles) {
          for (const u of m.attributes) {
            var u_name = u.name;
            if (u_name.indexOf(cc_1.gfx.AttributeName.ATTR_TEX_COORD) === 0) {
              let e = 0;
              u_name = u_name.charAt(
                cc_1.gfx.AttributeName.ATTR_TEX_COORD.length
              );

              if (u_name) {
                e = Number.parseInt(u_name);
              }

              if (!o.includes(e)) {
                o.push(e);
              }
            }
          }
        }
      }

      if (n.mesh.struct.minPosition) {
        r = n.mesh.struct.minPosition;
        t.minPosition = { x: r.x, y: r.y, z: r.z };
      }

      if (n.mesh.struct.maxPosition) {
        r = n.mesh.struct.maxPosition;
        t.maxPosition = { x: r.x, y: r.y, z: r.z };
      }
    }

    e.children.forEach((e) => {
      e = calcModelInfo(e);
      i += e.vertices;
      s += e.polygons;
    });

    t.vertices = i;
    t.polygons = s;
    t.uvs = o;
  }
  return t;
}
class MeshPreview extends Interactive_preview_1.InteractivePreview {
  lightComp;
  _modelComp;
  _modelInfo = { vertices: 0, polygons: 0, uvs: [] };
  _defaultMat;
  init(e, t) {
    super.init(e, t);
  }
  createNodes(e) {
    this.lightComp = new cc.Node("Mesh Preview Light").addComponent(
      cc_1.DirectionalLight
    );

    this.lightComp.node.setRotationFromEuler(-45, -45, 0);
    this.lightComp.node.parent = e;
    this._modelNode = new cc_1.Node("Mesh Preview Mesh");
    this._modelNode.parent = this.scene;
    this._modelComp = this._modelNode.addComponent(cc_1.MeshRenderer);
    this._defaultMat = new cc_1.Material();
    this._defaultMat.initialize({ effectName: "builtin-standard" });
    this._modelComp.material = this._defaultMat;
  }
  async setMesh(e) {
    if (!e) {
      console.warn("invalid uuid");
      return null;
    }
    if (!this._modelNode) {
      console.warn("invalid mode node");
      return null;
    }
    cc_1.assetManager.assets.remove(e);
    e = await promisify(cc_1.assetManager.loadAny)(e);
    this._modelComp.mesh = e;
    this._modelNode.parent = this.scene;
    for (let e = 0; e < this._modelComp.mesh.struct.primitives.length; e++) {
      this._modelComp.setMaterial(this._defaultMat, e);
    }
    this._modelInfo = calcModelInfo(this._modelNode);
    this.cameraComp.enabled = true;
    this.resetCamera();

    this.perfectCameraView(
      node_1.default.getBoundaryOfMeshNodes([this._modelNode])
    );

    return this._modelInfo;
  }
  resetCamera() {
    if (this._modelNode) {
      super.resetCamera(this._modelNode);
    }
  }
  async getModelUVs(e) {
    if (!e) {
      console.warn("invalid uuid");
      return null;
    }
    if (!this._modelNode) {
      console.warn("invalid mode node");
      return null;
    }

    if (!this._modelComp.mesh) {
      this.setMesh(e);
    }

    var t = this._modelComp.mesh;
    if (!t.allowDataAccess) {
      return [];
    }
    var i;
    var s;
    var o;
    var r;
    var n = t.readIndices(0);
    var a = [];
    for ([i, s] of Object.entries(cc_1.gfx.AttributeName)) {
      if (i.includes("ATTR_TEX_COORD") && (o = t.readAttributeFormat(0, s))) {
        r = t.readAttribute(0, s);
        a.push({ name: s, buffer: r, format: { count: o.count }, index: n });
      }
    }
    return a;
  }
  getModelInfo() {
    return this._modelInfo;
  }
  setLightEnable(e) {
    if (this.lightComp.enabled !== e) {
      this.lightComp.enabled = e;
    }
  }
}
exports.MeshPreview = MeshPreview;
