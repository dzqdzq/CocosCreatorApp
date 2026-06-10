var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const thumbnail_generator_interface_1 = require("./thumbnail-generator-interface");
const cc_1 = require("cc");
const vec3_1 = require("../../../utils/math/vec3");

const { promisify } = require("util");

const node_1 = __importDefault(require("../../../utils/node"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const buffer_1 = __importDefault(require("../preview/buffer"));
const regions = [new cc_1.gfx.BufferTextureCopy()];
regions[0].texExtent.depth = 1;
const tempVec3A = new cc_1.Vec3();
const tempVec3B = new cc_1.Vec3();
function calcModelInfo(e) {
  var t = { vertices: 0, polygons: 0, uvs: [] };
  let i = 0;
  let s = 0;
  var r = [];
  if (e) {
    var a;
    var o = e.getComponent(cc_1.MeshRenderer);
    if (o && o.mesh) {
      for (const m of o.mesh.struct.primitives) {
        var n =
          o.mesh.struct.vertexBundles[m.vertexBundelIndices[0]].view.count;

        if (m.vertexBundelIndices.length !== 0) {
          i += n;
        }

        var c = m.indexView ? m.indexView.count : n;

        switch (m.primitiveMode) {
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
      if (o.mesh.struct.vertexBundles) {
        for (const u of o.mesh.struct.vertexBundles) {
          for (const l of u.attributes) {
            var l_name = l.name;
            if (l_name.indexOf(cc_1.gfx.AttributeName.ATTR_TEX_COORD) === 0) {
              let e = 0;
              l_name = l_name.charAt(
                cc_1.gfx.AttributeName.ATTR_TEX_COORD.length
              );

              if (l_name) {
                e = Number.parseInt(l_name);
              }

              if (!r.includes(e)) {
                r.push(e);
              }
            }
          }
        }
      }

      if (o.mesh.struct.minPosition) {
        a = o.mesh.struct.minPosition;
        t.minPosition = { x: a.x, y: a.y, z: a.z };
      }

      if (o.mesh.struct.maxPosition) {
        a = o.mesh.struct.maxPosition;
        t.maxPosition = { x: a.x, y: a.y, z: a.z };
      }
    }

    e.children.forEach((e) => {
      e = calcModelInfo(e);
      i += e.vertices;
      s += e.polygons;
    });

    t.vertices = i;
    t.polygons = s;
    t.uvs = r;
  }
  return t;
}
class MeshPreview {
  scene;
  cameraComp;
  lightComp;
  _modelComp;
  camera;
  _modelNode;
  _viewDist = 0;
  previewBuffer;
  _curCameraRot = new cc_1.Quat();
  _viewCenter = new cc_1.Vec3();
  _modelInfo = { vertices: 0, polygons: 0, uvs: [] };
  _defaultMat;
  width = 0;
  height = 0;
  init(e, t) {
    this.scene = new cc.Scene();

    this.cameraComp = new cc.Node("Mesh Thumbnail Camera").addComponent(
      cc_1.Camera
    );

    this.lightComp = new cc.Node("Mesh Thumbnail Light").addComponent(
      cc_1.DirectionalLight
    );

    this._modelNode = new cc_1.Node("Mesh Thumbnail Mesh");
    this._modelNode.parent = this.scene;
    this._modelComp = this._modelNode.addComponent(cc_1.MeshRenderer);
    this._defaultMat = new cc_1.Material();
    this._defaultMat.initialize({ effectName: "builtin-standard" });
    this._modelComp.material = this._defaultMat;
    this.cameraComp.node.parent = this.scene;
    this.cameraComp.node.setPosition(0, 1, 2.5);
    this.cameraComp.node.lookAt(cc_1.Vec3.ZERO);
    this.cameraComp.near = 0.01;
    this.lightComp.node.setRotationFromEuler(-45, -45, 0);
    this.lightComp.node.parent = this.scene;
    this.scene._load();
    this.scene._activate();
    this.cameraComp.clearColor = new cc_1.Color(71, 71, 71, 255);
    this.camera = this.cameraComp.camera;
    this.camera.isWindowSize = false;

    this.previewBuffer = new buffer_1.default(
      "scene:mesh-thumbnail",
      "query-mesh-thumbnail-data",
      this.scene
    );

    this.width = e;
    this.height = t;
    this.previewBuffer.resize(e, t);
    this.camera.changeTargetWindow(this.previewBuffer.window);
    this.cameraComp.enabled = false;
  }
  async setMesh(e) {
    if (e) {
      if (this._modelNode) {
        cc_1.assetManager.assets.remove(e);
        e = await promisify(cc_1.assetManager.loadAny)(e);
        this._modelComp.mesh = e;
        this._modelNode.parent = this.scene;
        for (
          let e = 0;
          e < this._modelComp.mesh.struct.primitives.length;
          e++
        ) {
          this._modelComp.setMaterial(this._defaultMat, e);
        }
        this._modelInfo = calcModelInfo(this._modelNode);
        this.cameraComp.enabled = true;
        this.perfectCameraView();
        return this._modelInfo;
      }
      console.warn("invalid mode node");
    } else {
      console.warn("invalid uuid");
    }
  }
  perfectCameraView() {
    this._viewDist = this.getFitDistance();
    this.cameraComp.node.getWorldRotation(this._curCameraRot);

    vec3_1.MVec3.transformQuat(tempVec3A, cc_1.Vec3.UNIT_Z, this._curCameraRot);

    vec3_1.MVec3.multiplyScalar(tempVec3A, tempVec3A, this._viewDist);
    vec3_1.MVec3.add(tempVec3B, this._viewCenter, tempVec3A);
    this.cameraComp.node.setWorldPosition(tempVec3B);
    this.cameraComp.node.lookAt(this._viewCenter);
    cce.Engine.repaintInEditMode();
  }
  getFitDistance() {
    var e = node_1.default.getBoundaryOfMeshNode(this._modelNode);
    if (!e) {
      return 0;
    }
    this._viewCenter = e.center;
    var e = e.halfExtents.length();
    var t = this.cameraComp.fov;
    var t = (1.2 * e) / Math.tan(((t / 2) * Math.PI) / 180);
    var i = t - e;
    var e = t + e;

    if (i !== e) {
      this.cameraComp.near = i;
      this.cameraComp.far = e;
    }

    return t;
  }
  getModelInfo() {
    return this._modelInfo;
  }
  async generateThumbnail(e, t) {
    var i = await this.previewBuffer.getImageData(
      undefined,
      this.width,
      this.height
    );

    fs_1.default.mkdirSync(path_1.default.dirname(e), { recursive: true });

    var i = (0, sharp_1.default)(i.buffer, {
      raw: { width: this.width, height: this.height, channels: 4 },
    });

    i.flip();
    i.toFile(e, t);
  }
}
class MeshThumbnailGenerator extends thumbnail_generator_interface_1.BaseThumbnailGenerator {
  _mesh;
  _queue;
  _queueLock = false;
  constructor() {
    super();
    this._mesh = new MeshPreview();
    this._mesh.init(this.width, this.height);
    this._queue = [];
  }
  getThumbnail(i, s) {
    return new Promise((e, t) => {
      this._queue.push({ uuid: i, path: s, resolve: e, reject: t });
      this.step();
    });
  }
  step() {
    if (!this._queueLock) {
      const t = this._queue.shift();

      if (t) {
        this._queueLock = true;

        this.generate(t.uuid, t.path)
          .then(() => {
            t.resolve(t.path);
          })
          .catch((e) => {
            t.reject(e);
          })
          .finally(() => {
            setTimeout(() => {
              this._queueLock = false;
              this.step();
            });
          });
      }
    }
  }
  async generate(e, t) {
    await this._mesh.setMesh(e);

    return new Promise((i, s) => {
      this._mesh.generateThumbnail(t, (e, t) => {
        if (e) {
          s(e);
        } else {
          i(t);
        }
      });
    });
  }
}
exports.default = MeshThumbnailGenerator;
