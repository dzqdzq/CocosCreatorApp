Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAny = loadAny;
exports.createNodeByAsset = createNodeByAsset;
exports.createShouldHideInHierarchyCanvasNode =
  createShouldHideInHierarchyCanvasNode;
const cc_1 = require("cc");

const { instantiate } = cc_1;

const {
  createNodeMetrics,
  createLODMetrics,
  getUICanvasNode,
} = require("./utils");

async function loadAny(e) {
  return new Promise((n, c) => {
    cc_1.assetManager.assets.remove(e);

    cc_1.assetManager.loadAny(e, (e, a) => {
      if (e) {
        c(e);
      } else {
        n(a);
      }
    });
  });
}
async function createNodeByAsset(e) {
  var { uuid, type: e, autoAdaptToCreate, canvasRequired } = e;
  let t;
  let r;
  let o = canvasRequired;
  switch (e) {
    case "cc.AnimationClip": {
      t = await loadAny(uuid);
      var s = (r = new cc_1.Node(t.name)).addComponent(cc_1.Animation);

      if (s) {
        s.defaultClip = t;
      }

      break;
    }
    case "cc.AudioClip": {
      t = await loadAny(uuid);
      s = (r = new cc_1.Node(t.name)).addComponent(cc_1.AudioSource);

      if (s) {
        s.clip = t;
      }

      break;
    }
    case "cc.BitmapFont": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      s = r.addComponent(cc_1.Label);

      if (s) {
        s.font = t;
      }

      break;
    }
    case "cc.LabelAtlas": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      s = r.addComponent(cc_1.Label);
      s.font = t;
      s.fontSize = t.fontSize;

      if (t.fntConfig) {
        i = t.fntConfig.commonHeight;
        s.lineHeight = i || s.lineHeight;
      }

      break;
    }
    case "cc.Mesh": {
      t = await loadAny(uuid);
      var i = (r = new cc_1.Node(t.name)).addComponent(cc_1.MeshRenderer);

      if (i) {
        i.mesh = t;
      }

      await createNodeMetrics(uuid);
      break;
    }
    case "cc.ParticleAsset": {
      o = true;
      t = await loadAny(uuid);
      s = (r = new cc_1.Node(t.name)).addComponent(cc_1.ParticleSystem2D);

      if (s) {
        s.file = t;
      }

      break;
    }
    case "cc.Prefab": {
      t = await loadAny(uuid);
      r = cce.Prefab.createNodeFromPrefabAsset(t);
      await createNodeMetrics(uuid);
      await createLODMetrics(r);

      if (r && r.getComponentsInChildren(cc_1.UITransform).length > 0) {
        o = r.getComponentsInChildren(cc_1.Canvas).length === 0;
      }

      break;
    }
    case "cc.Script": {
      i = (await cce.Script.queryScriptName(uuid)) || "";
      s = (await cce.Script.queryScriptCid(uuid)) || "";
      r = new cc_1.Node(i);

      if (s && s !== "MissingScript" && s !== "cc.MissingScript") {
        r.addComponent(cc_1.js.getClassById(s));
      }

      break;
    }
    case "cc.SpriteFrame":
      {
        t = await loadAny(uuid);
        let e = false;
        var i = await loadAny(
          (e = autoAdaptToCreate
            ? !cce.Camera.is2D && !getUICanvasNode(cc_1.director.getScene())
            : e)
            ? "279ed042-5a65-4efe-9afb-2fc23c61e15a"
            : "9db8cd0b-cbe4-42e7-96a9-a239620c0a9d"
        );
        i.name = t.name;
        r = cc.instantiate(i);
        r.name = t.name;

        if (e) {
          o = false;
          (s = r.getComponent(cc_1.SpriteRenderer)) && (s.spriteFrame = t);
        } else {
          o = true;
          r.layer = cc_1.Layers.Enum.UI_2D;

          (i = r.getComponent(cc_1.Sprite)) &&
            ((i.spriteFrame = t),
            (s = await Editor.Message.request(
              "asset-db",
              "query-asset-meta",
              uuid
            ))) &&
            ((d =
              s.userData.borderBottom !== 0 &&
              s.userData.borderLeft !== 0 &&
              s.userData.borderRight !== 0 &&
              s.userData.borderTop !== 0),
            (s = s.userData.trimType === "none"),
            d
              ? (i.type = cc_1.Sprite.Type.SLICED)
              : s &&
                ((i.trim = false), (i.sizeMode = cc_1.Sprite.SizeMode.RAW)));
        }
      }
      break;
    case "cc.TTFFont": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      var d = r.addComponent(cc_1.Label);

      if (d) {
        d.font = t;
      }

      break;
    }
    case "cc.TerrainAsset": {
      t = await loadAny(uuid);
      s = (r = new cc_1.Node(t.name)).addComponent(cc_1.Terrain);

      if (s) {
        s._asset = t;
      }

      break;
    }
    case "cc.TiledMapAsset": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      i = r.addComponent(cc_1.TiledMap);

      if (i) {
        i.tmxAsset = t;
      }

      break;
    }
    case "cc.VideoClip": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      d = r.addComponent(cc_1.VideoPlayer);

      if (d) {
        d.clip = t;
      }

      break;
    }
    case "dragonBones.DragonBonesAsset": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      s = r.addComponent(cc_1.dragonBones.ArmatureDisplay);

      if (s) {
        s.dragonAsset = t;
      }

      break;
    }
    case "dragonBones.DragonBonesAtlasAsset": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      i = r.addComponent(cc_1.dragonBones.ArmatureDisplay);

      if (i) {
        i.dragonAtlasAsset = t;
      }

      break;
    }
    case "sp.SkeletonData": {
      o = true;
      t = await loadAny(uuid);
      r = new cc_1.Node(t.name);
      r.layer = cc_1.Layers.Enum.UI_2D;
      d = r.addComponent(cc_1.sp.Skeleton);

      if (d) {
        d.skeletonData = t;
      }

      break;
    }
    default: {
      t = await loadAny(uuid);
      r = cc.instantiate(t);
    }
  }
  return { node: r, canvasRequired: o };
}
const pendingCanvasPromises = new Map();
async function createShouldHideInHierarchyCanvasNode(c) {
  var e = c
    .getComponentsInChildren(cc_1.Canvas)
    .find((e) => e.node.name === "should_hide_in_hierarchy");
  if (e) {
    return e.node;
  }
  if (pendingCanvasPromises.has(c)) {
    return pendingCanvasPromises.get(c);
  }
  e = (async () => {
    let e = "f773db21-62b8-4540-956a-29bacf5ddbf5";

    var a = await loadAny(
      (e =
        cce.SceneFacadeManager._projectType === "2d"
          ? "4c33600e-9ca9-483b-b734-946008261697"
          : e)
    );

    var a = instantiate(a);

    a.children.forEach((e) => {
      e.objFlags |= cc_1.CCObject.Flags.HideInHierarchy;
    });

    a._prefab = null;
    a.parent = c;
    a.name = "should_hide_in_hierarchy";
    a.objFlags |= cc_1.CCObject.Flags.LockedInEditor;
    var n = a.children[0];

    if (n) {
      n.setParent = () => {
        var e = Editor.I18n.t("scene.messages.setInternalCameraParent");
        console.error(e);
      };
    }

    return a;
  })();
  pendingCanvasPromises.set(c, e);
  try {
    return await e;
  } finally {
    pendingCanvasPromises.delete(c);
  }
}
