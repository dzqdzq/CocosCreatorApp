var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var i = Object.getOwnPropertyDescriptor(t, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, i);
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = i(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.Particle2DManager = undefined;

const { join, relative } = require("path");

const plist = __importStar(require("plist"));

const { readFileSync } = require("fs");

class Particle2DManager {
  async exportParticlePlist(e) {
    e = EditorExtends.Component.getComponent(e);
    if (e) {
      var t = (
        await Editor.Dialog.save({
          title: "Save Particle",
          path: join(Editor.Project.path, "assets"),
          filters: [{ name: "Particle", extensions: ["plist"] }],
        })
      ).filePath;
      if (t) {
        var a = join(Editor.Project.path, "assets");
        if (Editor.Utils.Path.contains(a, t)) {
          try {
            var r =
              (e.file && e.file._uuid) || "db://internal/default_ui/atom.plist";

            var i = await Editor.Message.request("asset-db", "query-path", r);
            var o = plist.parse(readFileSync(i, "utf8"));
            var n = this._applyPlistData(o, e);
            var s = "db://assets/" + relative(a, t);
            return await Editor.Message.request(
              "asset-db",
              "create-asset",
              s,
              plist.build(n),
              { overwrite: true }
            );
          } catch (e) {
            console.error(e);
          }
        } else {
          await Editor.Dialog.warn(Editor.I18n.t("scene.messages.warning"), {
            detail: Editor.I18n.t(
              "scene.messages.particle_system_2d.export_error"
            ),
            buttons: [Editor.I18n.t("scene.messages.confirm")],
          });
        }
      }
    }
  }
  _applyPlistData(e, t) {
    e.maxParticles = t.totalParticles;
    e.angle = t.angle;
    e.angleVariance = t.angleVar;
    e.duration = t.duration;
    e.startColorRed = t.startColor.r / 255;
    e.startColorGreen = t.startColor.g / 255;
    e.startColorBlue = t.startColor.b / 255;
    e.startColorAlpha = t.startColor.a / 255;
    e.startColorVarianceRed = t.startColorVar.r / 255;
    e.startColorVarianceGreen = t.startColorVar.g / 255;
    e.startColorVarianceBlue = t.startColorVar.b / 255;
    e.startColorVarianceAlpha = t.startColorVar.a / 255;
    e.finishColorRed = t.endColor.r / 255;
    e.finishColorGreen = t.endColor.g / 255;
    e.finishColorBlue = t.endColor.b / 255;
    e.finishColorAlpha = t.endColor.a / 255;
    e.finishColorVarianceRed = t.endColorVar.r / 255;
    e.finishColorVarianceGreen = t.endColorVar.g / 255;
    e.finishColorVarianceBlue = t.endColorVar.b / 255;
    e.finishColorVarianceAlpha = t.endColorVar.a / 255;
    e.startParticleSize = t.startSize;
    e.startParticleSizeVariance = t.startSizeVar;
    e.finishParticleSize = t.endSize;
    e.finishParticleSizeVariance = t.endSizeVar;
    e.positionType = t._positionType;
    e.sourcePositionVariancex = t.posVar.x;
    e.sourcePositionVariancey = t.posVar.y;
    e.rotationStart = t.startSpin;
    e.rotationStartVariance = t.startSpinVar;
    e.rotationEnd = t.endSpin;
    e.rotationEndVariance = t.endSpinVar;
    e.emitterType = t.emitterMode;
    e.gravityx = t.gravity.x;
    e.gravityy = t.gravity.y;
    e.speed = t.speed;
    e.speedVariance = t.speedVar;
    e.radialAcceleration = t.radialAccel;
    e.radialAccelVariance = t.radialAccelVar;
    e.tangentialAcceleration = t.tangentialAccel;
    e.tangentialAccelVariance = t.tangentialAccelVar;
    e.rotationIsDir = t.rotationIsDir;
    e.maxRadius = t.startRadius;
    e.maxRadiusVariance = t.startRadiusVar;
    e.minRadius = t.endRadius;
    e.minRadiusVariance = t.endRadiusVar;
    e.rotatePerSecond = t.rotatePerS;
    e.rotatePerSecondVariance = t.rotatePerSVar;
    e.particleLifespan = t.life;
    e.particleLifespanVariance = t.lifeVar;
    e.emissionRate = t.emissionRate;
    t = t.spriteFrame;

    if (t && t._uuid) {
      e.spriteFrameUuid = t._uuid;
      delete e.textureFileName;
      delete e.textureImageData;
    }

    return e;
  }
}
exports.Particle2DManager = Particle2DManager;
exports.default = new Particle2DManager();
