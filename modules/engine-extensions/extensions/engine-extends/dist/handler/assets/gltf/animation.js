var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, t, i = t) => {
        var r = Object.getOwnPropertyDescriptor(a, t);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : a.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return a[t];
            },
          };
        }

        Object.defineProperty(e, i, r);
      }
    : (e, a, t, i) => {
        e[(i = i === undefined ? t : i)] = a[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, a) => {
        Object.defineProperty(e, "default", { enumerable: true, value: a });
      }
    : (e, a) => {
        e.default = a;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var a;
          var t = [];
          for (a in e) {
            if (Object.prototype.hasOwnProperty.call(e, a)) {
              t[t.length] = a;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var a = {};
      if (e != null) {
        for (var t = r(e), i = 0; i < t.length; i++) {
          if (t[i] !== "default") {
            __createBinding(a, e, t[i]);
          }
        }
      }
      __setModuleDefault(a, e);
      return a;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfAnimationHandler = undefined;
const cc = __importStar(require("cc"));
const embedded_player_1 = require("cc/editor/embedded-player");
const exotic_animation_1 = require("cc/editor/exotic-animation");

const { pathToFileURL } = require("url");

const { serializeForLibrary } = require("../utils/serialize-library");

const { splitAnimation } = require("../utils/split-animation");

const { loadAssetSync } = require("../utils/load-asset-sync");

const { getOriginalAnimationLibraryPath } = require("./original-animation");

const { getDependUUIDList } = require("../../utils");

const assert_1 = __importDefault(require("assert"));
function migrateEvents_3_3_0(e) {
  var a = e.meta.userData.events;

  if (a) {
    a = a.map((e) => ({
      frame: e.frame,
      func: e.functionName,
      params: e.parameters.slice(),
    }));

    e.meta.userData.events = a;
  }
}

exports.GltfAnimationHandler = {
  name: "gltf-animation",
  assetType: "cc.AnimationClip",
  instantiation: ".animation",
  importer: {
    version: "1.0.18",
    versionCode: 3,
    migrations: [{ version: "1.0.16", migrate: migrateEvents_3_3_0 }],
    async import(e) {
      if (!e.parent) {
        return false;
      }
      var extension = e.userData;

      extension.events ??= [];

      var e_userData_embeddedPlayers = e.parent.getFilePath(
        getOriginalAnimationLibraryPath(extension.gltfIndex)
      );

      let r = pathToFileURL(e_userData_embeddedPlayers).href;
      r = r && r.replace(".bin", ".cconb");
      e_userData_embeddedPlayers = await new Promise((t, i) => {
        cc.assetManager.loadAny(
          { url: r },
          { preset: "remote" },
          null,
          (e, a) => {
            if (e) {
              i(e);
            } else {
              t(a);
            }
          }
        );
      });
      let e_userData_span = extension.span;
      var n = (e_userData_span =
        e_userData_span &&
        e_userData_span.from === 0 &&
        e_userData_span.to === e.parent.userData.duration
          ? undefined
          : e_userData_span)
        ? splitAnimation(
            e_userData_embeddedPlayers,
            e_userData_span.from,
            e_userData_span.to
          )
        : e_userData_embeddedPlayers;
      n.name = e._name;

      if (n.name.endsWith(".animation")) {
        n.name = n.name.substr(0, n.name.length - ".animation".length);
      }

      n.events = extension.events.map((e) => ({
        frame: e.frame,
        func: e.func,
        params: e.params.slice(),
      }));

      n.wrapMode = extension.wrapMode ?? cc.AnimationClip.WrapMode.Loop;

      if (extension.speed !== undefined) {
        n.speed = extension.speed;
      }

      if (extension.sample !== undefined) {
        n.sample = extension.sample;
      }

      if (extension.editorExtras !== undefined) {
        n[cc.editorExtrasTag] = JSON.parse(
          JSON.stringify(extension.editorExtras)
        );
      }

      if (extension.embeddedPlayers) {
        var o;
        var l;
        var s;
        var d;
        var p;
        var e_userData_embeddedPlayers = extension.embeddedPlayers;
        for ({
          begin: o,
          end: l,
          reconciledSpeed: s,
          editorExtras: d,
          playable: p,
        } of e_userData_embeddedPlayers) {
          var c;
          var u = new embedded_player_1.EmbeddedPlayer();

          if (d !== undefined) {
            u[cc.editorExtrasTag] = JSON.parse(JSON.stringify(d));
          }

          u.begin = o;
          u.end = l;
          u.reconciledSpeed = s;

          if (p.type === "animation-clip") {
            c = new embedded_player_1.EmbeddedAnimationClipPlayable();
            c.path = p.path;

            p.clip &&
              (c.clip = loadAssetSync(p.clip, cc.AnimationClip) ?? null);

            u.playable = c;
          } else if (p.type === "particle-system") {
            c = new embedded_player_1.EmbeddedParticleSystemPlayable();
            c.path = p.path;
            u.playable = c;
          }

          n[embedded_player_1.addEmbeddedPlayerTag](u);
        }
      }

      const m = n[exotic_animation_1.additiveSettingsTag];
      m.enabled = false;
      m.refClip = null;
      e_userData_embeddedPlayers = [];
      if (extension.additive !== undefined) {
        const m = n[exotic_animation_1.additiveSettingsTag];

        if (
          extension.additive.enabled &&
          ((m.enabled = true), extension.additive.refClip)
        ) {
          e_userData_embeddedPlayers.push(extension.additive.refClip);
          m.refClip =
            loadAssetSync(extension.additive.refClip, cc.AnimationClip) ?? null;
        }
      }
      if (extension.auxiliaryCurves !== undefined) {
        for (var [_, { curve: f }] of Object.entries(
          extension.auxiliaryCurves
        )) {
          f = cc.deserialize(f, undefined, undefined);
          _ =
            ((0, assert_1.default)(f instanceof cc.RealCurve),
            n.addAuxiliaryCurve_experimental(_));
          _.preExtrapolation = f.preExtrapolation;
          _.postExtrapolation = f.postExtrapolation;
          _.assignSorted(f.keyframes());
        }
      }
      n.hash;

      var { extension, data } = serializeForLibrary(n);

      var extension =
        (await e.saveToLibrary(extension, data), getDependUUIDList(data));
      e.setData(
        "depends",
        Array.from(new Set([...extension, ...e_userData_embeddedPlayers]))
      );
      return true;
    },
  },
};

exports.default = exports.GltfAnimationHandler;
