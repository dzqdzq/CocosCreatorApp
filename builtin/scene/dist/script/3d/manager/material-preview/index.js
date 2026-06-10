Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialPreview = undefined;
const cc_1 = require("cc");
const Interactive_preview_1 = require("../preview/Interactive-preview");
const regions = [new cc_1.gfx.BufferTextureCopy()];
function insertAdditionals(e) {
  if (!e.customAttributes) {
    e.customAttributes = [];
  }

  e.customAttributes.push({
    attr: new cc_1.gfx.Attribute(
      cc_1.gfx.AttributeName.ATTR_TANGENT,
      cc_1.gfx.Format.RGBA32F
    ),
    values: EditorExtends.GeometryUtils.calculateTangents(
      e.positions,
      e.indices,
      e.normals,
      e.uvs
    ),
  });

  return e;
}
regions[0].texExtent.depth = 1;

const primitiveData = {
  box: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.box())),
    scale: new cc_1.Vec3(1, 1, 1),
  },
  sphere: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.sphere())),
    scale: new cc_1.Vec3(1, 1, 1),
  },
  capsule: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.capsule())),
    scale: new cc_1.Vec3(0.8, 0.8, 0.8),
  },
  cylinder: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.cylinder())),
    scale: new cc_1.Vec3(0.8, 0.8, 0.8),
  },
  torus: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.torus())),
    scale: new cc_1.Vec3(1, 1, 1),
  },
  cone: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.cone())),
    scale: new cc_1.Vec3(1, 1, 1),
  },
  quad: {
    mesh: cc_1.utils.createMesh(insertAdditionals(cc_1.primitives.quad())),
    scale: new cc_1.Vec3(1, 1, 1),
  },
};

const tempVec3A = new cc_1.Vec3();
const tempVec3B = new cc_1.Vec3();
const tempQuatA = new cc_1.Quat();
const _matInsInfo = { parent: null, owner: null, subModelIdx: 0 };
class MaterialPreview extends Interactive_preview_1.InteractivePreview {
  lightComp;
  modelComp;
  primitive = "sphere";
  material = null;
  dummyUniformBuffer;
  dummyStorageTexture;
  dummySampleTexture;
  dummySampler;
  dummyStorageBuffer;
  uniformBuffer;
  storageBuffer;
  enableGrid = false;
  disablePan = true;
  disableMouseWheel = true;
  init(e, t) {
    super.init(e, t);
    e = cc_1.director.root.device;

    this.uniformBuffer = e.createBuffer(
      new cc_1.gfx.BufferInfo(
        cc_1.gfx.BufferUsageBit.UNIFORM,
        cc_1.gfx.MemoryUsageBit.HOST | cc_1.gfx.MemoryUsageBit.DEVICE,
        16
      )
    );

    this.dummyUniformBuffer = e.createBuffer(
      new cc_1.gfx.BufferViewInfo(
        this.uniformBuffer,
        0,
        this.uniformBuffer.size
      )
    );

    this.storageBuffer = isSceneNative
      ? e.createBuffer(
          new cc_1.gfx.BufferInfo(
            cc_1.gfx.BufferUsageBit.STORAGE,
            cc_1.gfx.MemoryUsageBit.HOST | cc_1.gfx.MemoryUsageBit.DEVICE,
            16
          )
        )
      : this.uniformBuffer;

    this.dummyStorageBuffer = isSceneNative
      ? e.createBuffer(
          new cc_1.gfx.BufferViewInfo(
            this.storageBuffer,
            0,
            this.storageBuffer.size
          )
        )
      : this.dummyUniformBuffer;

    this.dummySampleTexture = e.createTexture(
      new cc_1.gfx.TextureInfo(
        cc_1.gfx.TextureType.TEX2D,
        cc_1.gfx.TextureUsageBit.SAMPLED,
        cc_1.gfx.Format.RGBA8,
        4,
        4
      )
    );

    this.dummyStorageTexture = isSceneNative
      ? e.createTexture(
          new cc_1.gfx.TextureInfo(
            cc_1.gfx.TextureType.TEX2D,
            cc_1.gfx.TextureUsageBit.STORAGE,
            cc_1.gfx.Format.RGBA8,
            4,
            4
          )
        )
      : this.dummySampleTexture;

    this.dummySampler = e.getSampler(new cc_1.gfx.SamplerInfo());
  }
  createNodes(e) {
    this.lightComp = new cc.Node("Material Preview Light").addComponent(
      cc_1.DirectionalLight
    );

    this.lightComp.node.setRotationFromEuler(-45, -45, 0);
    this.lightComp.node.setParent(e);

    this.modelComp = new cc_1.Node("Material Preview Model").addComponent(
      cc_1.MeshRenderer
    );

    this.modelComp.mesh = primitiveData.sphere.mesh;
    e = new cc_1.Material();
    e.initialize({ effectName: "builtin-standard" });
    this.modelComp.material = e;
    this.setMaterial(e);
    this.modelComp.node.setParent(this.scene);
  }
  setMaterial(e) {
    var t;
    var i;

    if (e && e !== this.material) {
      t = this.modelComp;
      _matInsInfo.parent = e;
      _matInsInfo.owner = t;
      i = new cc_1.renderer.MaterialInstance(_matInsInfo);
      t.material = i;
      this.material = e;
      this.updateDs();
      this.cameraComp.enabled = true;
      this.cameraComp.node.getWorldPosition(tempVec3A);
      this.modelComp.node.getWorldPosition(tempVec3B);
      this.viewDist = cc_1.Vec3.distance(tempVec3A, tempVec3B);
    }
  }
  updateDs() {
    var t = this.modelComp.model;
    if (t) {
      for (let e = 0; e < t.subModels.length; e++) {
        var i = t.subModels[e].descriptorSet;
        var r = i.layout.bindings;
        cc_1.director.root.device;
        for (let e = 0; e < r.length; e++) {
          var c = r[e];
          var c_binding = c.binding;
          var c = c.descriptorType;

          if (
            c & cc_1.gfx.DescriptorType.UNIFORM_BUFFER ||
            c & cc_1.gfx.DescriptorType.DYNAMIC_UNIFORM_BUFFER
          ) {
            if (!i.getBuffer(c_binding)) {
              i.bindBuffer(c_binding, this.dummyUniformBuffer);
            }
          } else if (
            c & cc_1.gfx.DescriptorType.STORAGE_BUFFER ||
            c & cc_1.gfx.DescriptorType.DYNAMIC_STORAGE_BUFFER
          ) {
            if (!i.getBuffer(c_binding)) {
              i.bindBuffer(c_binding, this.dummyStorageBuffer);
            }
          } else if (c & cc_1.gfx.DESCRIPTOR_SAMPLER_TYPE) {
            i.getTexture(c_binding) ||
              (c & cc_1.gfx.DescriptorType.SAMPLER_TEXTURE ||
              c & cc_1.gfx.DescriptorType.TEXTURE
                ? i.bindTexture(c_binding, this.dummySampleTexture)
                : c & cc_1.gfx.DescriptorType.STORAGE_IMAGE &&
                  i.bindTexture(c_binding, this.dummyStorageTexture));

            i.getSampler(c_binding) ||
              i.bindSampler(c_binding, this.dummySampler);
          }
        }
        i.update();
      }
    }
  }
  setPrimitive(e) {
    if (e && e !== this.primitive) {
      this.modelComp.mesh = primitiveData[e].mesh;
      this.updateDs();
      this.modelComp.node.setScale(primitiveData[e].scale);
      this.primitive = e;
      this.cameraComp.enabled = true;
    }
  }
  setLightEnable(e) {
    if (this.lightComp.enabled !== e) {
      this.lightComp.enabled = e;
    }
  }
  resetCamera() {
    super.resetCamera(this.modelComp.node);
  }
}
exports.MaterialPreview = MaterialPreview;
