var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoGenerateMaterial = autoGenerateMaterial;

const { queryAsset } = require("@editor/asset-db");

const { readJSONSync, outputJSON } = require("fs-extra");

const { join, dirname } = require("path");

const cc_1 = __importDefault(require("cc"));

const { existsSync } = require("fs");

let defaultSettings = {
  properties: {},
  effectMap: {},
  effectPriority: [],
  _ready: false,
};
async function initDefaultSettings() {
  var e;

  if (!defaultSettings._ready) {
    e = await Editor.Message.request("engine", "query-engine-info");
    defaultSettings = readJSONSync(
      join(e.typescript.builtin, "editor/auto_material_settings.json")
    );
    defaultSettings._ready = true;
  }

  return defaultSettings;
}
async function autoGenerateMaterial() {
  var e = Editor.Selection.getSelected("asset");
  return e.length && (e = await queryTextures(e)).length
    ? generateMaterial(e)
    : (Editor.Dialog.warn(
        Editor.I18n.t("engine-extends.autoMaterial.atLeastOnTexture"),
        { buttons: ["confirm"] }
      ),
      []);
}
async function queryTextures(e) {
  const t = {};
  for (const a of e) {
    var r = queryAsset(a);

    if (r) {
      if (r.meta.importer === "texture") {
        t[r.uuid] = r;
      } else if (r.meta.importer === "directory") {
        (
          await Manager.assetManager.queryAssets({
            pattern: r.url + "/**/*",
            ccType: "cc.Texture2D",
          })
        ).forEach((e) => (t[e.uuid] = queryAsset(e.uuid)));
      } else if (
        r.meta.importer === "image" &&
        r.meta.userData.type === "texture" &&
        (r = Object.values(r.subAssets).find(
          (e) => e.meta.importer === "texture"
        ))
      ) {
        t[r.uuid] = r;
      }
    }
  }
  return Object.values(t);
}
async function generateMaterial(e) {
  const t =
    (await Editor.Profile.getProject("engine-extends", "autoMaterialConfig")) ||
    {};

  const s = {};

  await initDefaultSettings();

  Object.keys(defaultSettings.properties).forEach((e) => {
    if (t[e]) {
      s[t[e]] = e;
    } else {
      s[defaultSettings.properties[e].matchString] = e;
    }
  });

  const n = [];

  const u = {};

  e.forEach((e) => {
    var t = e.displayName || e._name;
    const r = [];
    var a;
    var t = t.split("_");
    let i = -1;

    t.forEach((e, t) => {
      if (s[e]) {
        -1 === i && (i = t);
        r.push(s[e]);
      }
    });

    if (r.length) {
      if ((t = t.splice(0, i).join("_"))) {
        if (u[t]) {
          u[t].textureConfigs.push({ properties: r, uuid: e.uuid });
        } else {
          a = join(findAssetDirName(e), t + ".mtl");
          existsSync(a) && n.push(a);

          u[t] = {
            textureConfigs: [{ properties: r, uuid: e.uuid }],
            dest: a,
          };
        }
      } else {
        console.error("Invalid texture name " + e.url);
      }
    } else {
      console.error("Can not find invalid config in texture name " + e.url);
    }
  });

  if (!Object.keys(u).length) {
    return [];
  }

  if (
    n.length &&
    (n.length > 6 && ((n.length = 6), n.push("......")),
    (
      await Editor.Dialog.info(
        "" +
          Editor.I18n.t("engine-extends.autoMaterial.hasExistTip", {
            url: `
${n.join("\n")} 
`,
          }),
        {
          title: Editor.I18n.t("ENGINE.assets.autoGenerateMaterial"),
          buttons: [
            Editor.I18n.t("engine-extends.autoMaterial.cancel"),
            Editor.I18n.t("engine-extends.autoMaterial.overwrite"),
          ],
          cancel: 0,
          default: 0,
        }
      )
    ).response === 0)
  ) {
    return [];
  }
  return createMaterialsFromConfigs(u);
}
async function createMaterialsFromConfigs(a) {
  return Promise.all(
    Object.keys(a).map(async (e) => {
      var t = a[e];
      const r = createMaterial(e, t.textureConfigs);
      t.textureConfigs.forEach((e) => {
        updateMaterialTexture(
          r,
          EditorExtends.serialize.asAsset(e.uuid, cc_1.default.Texture2D),
          e.properties
        );
      });
      e = EditorExtends.serialize(r);
      await outputJSON(t.dest, JSON.parse(e), { spaces: 4 });
      return t.dest;
    })
  );
}
function findAssetDirName(e) {
  return e.parent && e.parent.source
    ? dirname(e.parent.source)
    : join(Editor.Project.path, "assets");
}
function createMaterial(e, t) {
  var r = new cc_1.default.Material();
  r.name = e;
  let a = "";
  for (const i of defaultSettings.effectPriority) {
    for (const s of t) {
      if (s.properties.includes(i)) {
        a = defaultSettings.effectMap[i];
        break;
      }
    }
    if (a) {
      break;
    }
  }

  r._effectAsset = EditorExtends.serialize.asAsset(
    a || defaultSettings.effectMap.default,
    cc_1.default.EffectAsset
  );

  return r;
}
function updateMaterialTexture(e, t, r) {
  const a = e._defines[0] || {};
  const i = e._props[0] || {};

  r.forEach((e) => {
    a[defaultSettings.properties[e].defineName] = true;
    i[e] = t;
  });

  e._defines = [a];
  e._props = [i];
}
