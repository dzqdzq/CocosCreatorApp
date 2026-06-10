var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, l = i) => {
        var n = Object.getOwnPropertyDescriptor(t, i);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, l, n);
      }
    : (e, t, i, l) => {
        e[(l = l === undefined ? i : l)] = t[i];
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
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = n(e), l = 0; l < i.length; l++) {
          if (i[l] !== "default") {
            __createBinding(t, e, i[l]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = undefined;
let timer = null;
const type = "cc.ParticleSystem";
const width = 200;
const height = 160;
const bottom = 10;
const right = 10;

const template = `
<style>
  .scene-particle ui-prop { --left-width: 60%; margin-bottom: 4px; }
  .scene-particle .buttons { display: flex; justify-content: space-around; margin-bottom: 8px; }
  .scene-particle .buttons ui-button { padding: 0 8px; width: 56px; }
</style>
<div class="scene-particle">
  <div class="buttons">
      <ui-button class="toggle">
          <ui-icon class="toggle-icon" value="play"></ui-icon>
      </ui-button>
      <ui-button class="reset"><ui-icon value="refresh"></ui-icon></ui-button>
      <ui-button class="stop"><ui-icon value="stop"></ui-icon></ui-button>
  </div>
  <ui-prop>
      <ui-label slot="label" value="Playback Speed"></ui-label>
      <ui-num-input slot="content" class="speed"></ui-num-input>
  </ui-prop>
  <ui-prop>
      <ui-label slot="label" value="Playback Time"></ui-label>
      <ui-num-input slot="content" class="time" disabled></ui-num-input>
  </ui-prop>
  <ui-prop>
      <ui-label slot="label" value="Particle"></ui-label>
      <ui-num-input slot="content" class="total" disabled></ui-num-input>
  </ui-prop>
</div>
`;

async function ready(e, t, l) {
  if (timer !== null) {
    clearTimeout(timer);
  }

  const e_parentElement = e.parentElement;
  if (e_parentElement) {
    t = t.nodes.length > 1;
    if (l[type] && l[type][0].enabled) {
      const u = l[type][0].uuid;
      let i = false;
      l = e.querySelector(".scene-particle .toggle");
      const o = e.querySelector(".scene-particle .toggle .toggle-icon");
      var r = e.querySelector(".scene-particle .reset");
      var a = e.querySelector(".scene-particle .stop");

      l.addEventListener("confirm", () => {
        if (i) {
          e_parentElement.callSceneMethod("pauseParticle", []);
        } else {
          e_parentElement.callSceneMethod("playParticle", []);

          Editor.Metrics._trackEventWithTimer({
            category: "particleSystem",
            id: "A100014",
            value: 1,
          });
        }
      });

      r.addEventListener("confirm", () => {
        e_parentElement.callSceneMethod("restartParticle", []);
      });

      a.addEventListener("confirm", () => {
        e_parentElement.callSceneMethod("stopParticle", []);
      });

      const c = e.querySelector(".scene-particle .speed");
      const s = e.querySelector(".scene-particle .total");
      const p = e.querySelector(".scene-particle .time");

      if (t) {
        c?.setAttribute("invalid", "");
        s?.setAttribute("invalid", "");
        p?.setAttribute("invalid", "");
      }

      c.addEventListener("confirm", (e) => {
        e_parentElement.callSceneMethod("setParticlePlaySpeed", [
          u,
          Number(e.target.value),
        ]);
      });

      !(async function e() {
        var t = await e_parentElement.callSceneMethod("queryParticlePlayInfo", [
          u,
        ]);

        if (t) {
          i = !!t.isPlaying;
          c.setAttribute("value", t.speed);
          s.setAttribute("value", t.particle);
          p.setAttribute("value", t.time);
          o.setAttribute("value", i ? "pause" : "play");

          timer = setTimeout(() => {
            e();
          }, 300);
        }
      })();
    } else {
      e.hidden = true;
    }
  }
}
async function close() {
  if (timer !== null) {
    clearTimeout(timer);
  }
}
function update(e) {}
const configs = {
  ready,
  update,
  type,
  template,
  width,
  height,
  bottom,
  right,
  close,
};
module.exports = configs;
exports.default = __importStar(require("."));
