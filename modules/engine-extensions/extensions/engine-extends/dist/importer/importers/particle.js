Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticleImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const image_utils_1 = require("./utils/image-utils");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const cc_1 = require("cc");
const utils_1 = require("../utils");
const BlendFactor = cc_1.gfx.BlendFactor;
const { PositionType, EmitterMode } = cc_1.ParticleSystem2D;
const plist = require("plist");

const defaultParticlesUseData = {
  totalParticles: 150,
  life: 1,
  lifeVar: 0,
  emissionRate: 10,
  duration: -1,
  srcBlendFactor: BlendFactor.SRC_ALPHA,
  dstBlendFactor: BlendFactor.ONE_MINUS_CONSTANT_ALPHA,
  startColor: new cc_1.Color(255, 255, 255, 255),
  startColorVar: new cc_1.Color(0, 0, 0, 0),
  endColor: new cc_1.Color(255, 255, 255, 0),
  endColorVar: new cc_1.Color(0, 0, 0, 0),
  startSize: 50,
  startSizeVar: 0,
  endSize: 0,
  endSizeVar: 0,
  positionType: PositionType.FREE,
  sourcePos: new cc_1.Vec2(0, 0),
  posVar: new cc_1.Vec2(0, 0),
  angle: 90,
  angleVar: 20,
  startSpin: 0,
  startSpinVar: 0,
  endSpin: 0,
  endSpinVar: 0,
  emitterMode: EmitterMode.GRAVITY,
  gravity: new cc_1.Vec2(0, 0),
  speed: 180,
  speedVar: 50,
  radialAccel: 80,
  radialAccelVar: 0,
  tangentialAccel: 0,
  tangentialAccelVar: 0,
  rotationIsDir: false,
  startRadius: 0,
  startRadiusVar: 0,
  endRadius: 0,
  endRadiusVar: 0,
  rotatePerS: 0,
  rotatePerSVar: 0,
  spriteFrameUuid: "",
};

function getBlendFactor2DTo3D(e) {
  switch (e) {
    case 0: {
      return BlendFactor.ZERO;
    }
    case 1: {
      return BlendFactor.ONE;
    }
    case 770: {
      return BlendFactor.SRC_ALPHA;
    }
    case 772: {
      return BlendFactor.DST_ALPHA;
    }
    case 771: {
      return BlendFactor.ONE_MINUS_SRC_ALPHA;
    }
    case 773: {
      return BlendFactor.ONE_MINUS_DST_ALPHA;
    }
    case 768: {
      return BlendFactor.SRC_COLOR;
    }
    case 774: {
      return BlendFactor.DST_COLOR;
    }
    case 769: {
      return BlendFactor.ONE_MINUS_SRC_COLOR;
    }
    case 775: {
      return BlendFactor.ONE_MINUS_DST_COLOR;
    }
  }
  return e;
}
class ParticleImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.2";
  }
  get name() {
    return "particle";
  }
  get assetType() {
    return "cc.ParticleAsset";
  }
  async validate(e) {
    try {
      return (
        plist.parse(await fs_extra_1.readFile(e.source, "utf8"))
          .maxParticles !== undefined
      );
    } catch (e) {
      return false;
    }
  }
  async import(e) {
    const e_userData = e.userData;
    Object.keys(defaultParticlesUseData).forEach((e) => {
      if (!(e in e_userData)) {
        e_userData[e] = defaultParticlesUseData[e];
      }
    });
    var r = path_1.extname(e.source);
    if (!(await e.existsInLibrary(".json")) && this.assetDB) {
      var t = plist.parse(await fs_extra_1.readFile(e.source, "utf8"));
      await this.syncParticleData(e);
      var i = this.createParticle(e);

      if (t.blendFuncSource) {
        t.blendFuncSource = getBlendFactor2DTo3D(t.blendFuncSource);
      }

      if (t.blendFuncDestination) {
        t.blendFuncDestination = getBlendFactor2DTo3D(t.blendFuncDestination);
      }

      if (t.textureImageData) {
        delete t.textureFileName;
        delete t.spriteFrameUuid;
      } else if (t.spriteFrameUuid) {
        if (!t.spriteFrameUuid.endsWith("@f9941")) {
          t.spriteFrameUuid = t.spriteFrameUuid + "@f9941";
        }

        e.depend(t.spriteFrameUuid);
        e_userData.spriteFrameUuid = t.spriteFrameUuid;

        i.spriteFrame = EditorExtends.serialize.asAsset(
          t.spriteFrameUuid,
          cc_1.SpriteFrame
        );

        delete t.textureFileName;
        delete t.textureImageData;
      } else if (t.textureFileName) {
        var s = path_1.basename(t.textureFileName);
        var s = path_1.join(path_1.dirname(e.source), s);
        e.depend(s);
        var o = this.assetDB.pathToUuid(s);
        if (!fs_extra_1.existsSync(s)) {
          console.error(
            "Particle import failed: Unable to find file Texture, the path: " +
              s
          );

          return false;
        }
        if (!o) {
          return false;
        }
        {
          const e = this.assetDB.getAsset(o);
          await image_utils_1.changeImageDefaultType(e, "sprite-frame");
          s = o + "@f9941";

          i.spriteFrame = EditorExtends.serialize.asAsset(s, cc_1.SpriteFrame);

          e_userData.spriteFrameUuid = s;
          t.spriteFrameUuid = s;
          delete t.textureFileName;
          delete t.textureImageData;
        }
      }

      o = plist.build(t);
      s = (await e.saveToLibrary(r, o), EditorExtends.serialize(i));
      t = (await e.saveToLibrary(".json", s), utils_1.getDependUUIDList(s));
      e.setData("depends", t);
    }
    return true;
  }
  createParticle(e) {
    var a = new cc.ParticleAsset();
    a.name = e.basename;
    a._setRawAsset(e.extname);
    return a;
  }
  async syncParticleData(a) {
    var a_userData = a.userData;
    var a = plist.parse(await fs_extra_1.readFile(a.source, "utf8"));

    a_userData.totalParticles = parseInt(a.maxParticles || 0);
    a_userData.life = parseFloat(a.particleLifespan || 0);
    a_userData.lifeVar = parseFloat(a.particleLifespanVariance || 0);

    a_userData.emissionRate =
      a.emissionRate ||
      Math.min(a_userData.totalParticles / a_userData.life, Number.MAX_VALUE);

    a_userData.duration = parseFloat(a.duration || 0);

    a_userData.srcBlendFactor = parseInt(
      a.blendFuncSource || BlendFactor.SRC_ALPHA
    );

    a_userData.dstBlendFactor = parseInt(
      a.blendFuncDestination || BlendFactor.ONE_MINUS_SRC_ALPHA
    );

    var a_userData_startColor = a_userData.startColor;

    var a_userData_startColor =
      ((a_userData_startColor.r = 255 * parseFloat(a.startColorRed || 0)),
      (a_userData_startColor.g = 255 * parseFloat(a.startColorGreen || 0)),
      (a_userData_startColor.b = 255 * parseFloat(a.startColorBlue || 0)),
      (a_userData_startColor.a = 255 * parseFloat(a.startColorAlpha || 0)),
      a_userData.startColorVar);

    var a_userData_startColor =
      ((a_userData_startColor.r =
        255 * parseFloat(a.startColorVarianceRed || 0)),
      (a_userData_startColor.g =
        255 * parseFloat(a.startColorVarianceGreen || 0)),
      (a_userData_startColor.b =
        255 * parseFloat(a.startColorVarianceBlue || 0)),
      (a_userData_startColor.a =
        255 * parseFloat(a.startColorVarianceAlpha || 0)),
      a_userData.endColor);

    var a_userData_startColor =
      ((a_userData_startColor.r = 255 * parseFloat(a.finishColorRed || 0)),
      (a_userData_startColor.g = 255 * parseFloat(a.finishColorGreen || 0)),
      (a_userData_startColor.b = 255 * parseFloat(a.finishColorBlue || 0)),
      (a_userData_startColor.a = 255 * parseFloat(a.finishColorAlpha || 0)),
      a_userData.endColorVar);

    var a_userData_startColor =
      ((a_userData_startColor.r =
        255 * parseFloat(a.finishColorVarianceRed || 0)),
      (a_userData_startColor.g =
        255 * parseFloat(a.finishColorVarianceGreen || 0)),
      (a_userData_startColor.b =
        255 * parseFloat(a.finishColorVarianceBlue || 0)),
      (a_userData_startColor.a =
        255 * parseFloat(a.finishColorVarianceAlpha || 0)),
      (a_userData.startSize = parseFloat(a.startParticleSize || 0)),
      (a_userData.startSizeVar = parseFloat(a.startParticleSizeVariance || 0)),
      (a_userData.endSize = parseFloat(a.finishParticleSize || 0)),
      (a_userData.endSizeVar = parseFloat(a.finishParticleSizeVariance || 0)),
      (a_userData.positionType = parseFloat(
        a.positionType !== undefined ? a.positionType : 0
      )),
      (a_userData.sourcePos = new cc_1.Vec2(0, 0)),
      parseFloat(a.sourcePositionVariancex || 0));

    var i = parseFloat(a.sourcePositionVariancey || 0);
    a_userData.posVar = new cc_1.Vec2(a_userData_startColor, i);
    a_userData.angle = parseFloat(a.angle || 0);
    a_userData.angleVar = parseFloat(a.angleVariance || 0);
    a_userData.startSpin = parseFloat(a.rotationStart || 0);
    a_userData.startSpinVar = parseFloat(a.rotationStartVariance || 0);
    a_userData.endSpin = parseFloat(a.rotationEnd || 0);
    a_userData.endSpinVar = parseFloat(a.rotationEndVariance || 0);
    a_userData.emitterMode = parseInt(a.emitterType || 0);

    if (a_userData.emitterMode === EmitterMode.GRAVITY) {
      a_userData_startColor = parseFloat(a.gravityx || 0);
      i = parseFloat(a.gravityy || 0);
      a_userData.gravity = new cc_1.Vec2(a_userData_startColor, i);
      a_userData.speed = parseFloat(a.speed || 0);
      a_userData.speedVar = parseFloat(a.speedVariance || 0);
      a_userData.radialAccel = parseFloat(a.radialAcceleration || 0);
      a_userData.radialAccelVar = parseFloat(a.radialAccelVariance || 0);
      a_userData.tangentialAccel = parseFloat(a.tangentialAcceleration || 0);
      a_userData.tangentialAccelVar = parseFloat(
        a.tangentialAccelVariance || 0
      );
      let e = a.rotationIsDir || "";

      if (e !== null) {
        e = e.toString().toLowerCase();
        a_userData.rotationIsDir = e === "true" || e === "1";
      } else {
        a_userData.rotationIsDir = false;
      }
    } else {
      if (a_userData.emitterMode === EmitterMode.RADIUS) {
        a_userData.startRadius = parseFloat(a.maxRadius || 0);
        a_userData.startRadiusVar = parseFloat(a.maxRadiusVariance || 0);
        a_userData.endRadius = parseFloat(a.minRadius || 0);
        a_userData.endRadiusVar = parseFloat(a.minRadiusVariance || 0);
        a_userData.rotatePerS = parseFloat(a.rotatePerSecond || 0);
        a_userData.rotatePerSVar = parseFloat(a.rotatePerSecondVariance || 0);
      }
    }
  }
}
exports.ParticleImporter = ParticleImporter;
