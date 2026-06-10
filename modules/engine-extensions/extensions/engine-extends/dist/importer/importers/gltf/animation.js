var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[a];
          },
        });
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var a in e) {
        if (a !== "default" && Object.prototype.hasOwnProperty.call(e, a)) {
          __createBinding(t, e, a);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfAnimationImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc = __importStar(require("cc"));
const embedded_player_1 = require("cc/editor/embedded-player");
const url_1 = require("url");
const serialize_library_1 = require("../utils/serialize-library");
const split_animation_1 = require("../utils/split-animation");
const load_asset_sync_1 = require("./load-asset-sync");
const original_animation_1 = require("./original-animation");
const utils_1 = require("../../utils");
class GltfAnimationImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.16";
  }
  get name() {
    return "gltf-animation";
  }
  get assetType() {
    return "cc.AnimationClip";
  }
  get instantiation() {
    return ".animation";
  }
  get migrations() {
    return [{ version: "1.0.16", migrate: migrateEvents_3_3_0 }];
  }
  async import(e) {
    if (!e.parent) {
      return false;
    }
    var extension = e.userData;

    if (extension.events == null) {
      extension.events = [];
    }

    var data = e.parent.getFilePath(
      original_animation_1.getOriginalAnimationLibraryPath(
        e.parent,
        extension.gltfIndex
      )
    );

    const i = url_1.pathToFileURL(data).href;
    var data = await new Promise((a, r) => {
      cc.assetManager.loadAny(
        { url: i },
        { preset: "remote" },
        null,
        (e, t) => {
          if (e) {
            r(e);
          } else {
            a(t);
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
      ? split_animation_1.splitAnimation(
          data,
          e_userData_span.from,
          e_userData_span.to
        )
      : data;
    n.name = e._name;

    if (n.name.endsWith(".animation")) {
      n.name = n.name.substr(0, n.name.length - ".animation".length);
    }

    n.events = extension.events.map((e) => ({
      frame: e.frame,
      func: e.func,
      params: e.params.slice(),
    }));

    n.wrapMode =
      null != (data = extension.wrapMode)
        ? data
        : cc.AnimationClip.WrapMode.Loop;

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
      var s;
      var l;
      var o;
      var d;
      var m;
      var data = extension.embeddedPlayers;
      for ({
        begin: s,
        end: l,
        reconciledSpeed: o,
        editorExtras: d,
        playable: m,
      } of data) {
        var p;
        var u;
        var _ = new embedded_player_1.EmbeddedPlayer();

        if (d !== undefined) {
          _[cc.editorExtrasTag] = JSON.parse(JSON.stringify(d));
        }

        _.begin = s;
        _.end = l;
        _.reconciledSpeed = o;

        if (m.type === "animation-clip") {
          p = new embedded_player_1.EmbeddedAnimationClipPlayable();
          p.path = m.path;

          m.clip &&
            (p.clip =
              null !=
              (u = load_asset_sync_1.loadAssetSync(m.clip, cc.AnimationClip))
                ? u
                : null);

          _.playable = p;
        } else if (m.type === "particle-system") {
          u = new embedded_player_1.EmbeddedParticleSystemPlayable();
          u.path = m.path;
          _.playable = u;
        }

        n[embedded_player_1.addEmbeddedPlayerTag](_);
      }
    }

    n.hash;
    var { extension, data } = serialize_library_1.serializeForLibrary(n);
    var extension =
      (await e.saveToLibrary(extension, data), utils_1.getDependUUIDList(data));
    e.setData("depends", extension);
    return true;
  }
}
function migrateEvents_3_3_0(e) {
  var t = e.meta.userData.events;

  if (t) {
    t = t.map((e) => ({
      frame: e.frame,
      func: e.functionName,
      params: e.parameters.slice(),
    }));

    e.meta.userData.events = t;
  }
}
exports.GltfAnimationImporter = GltfAnimationImporter;
