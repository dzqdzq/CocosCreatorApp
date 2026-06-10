Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderTextureHandler = undefined;

const { readJSON } = require("fs-extra");

const {
  getFilterString,
  getWrapModeString,
  applyTextureBaseAssetUserData,
} = require("../texture-base");

const cc_1 = require("cc");

const { getDependUUIDList } = require("../../utils");

const migration_utils_1 = require("../utils/migration-utils");
function fillUserdata(e, t, r) {
  if (!(t in e.userData)) {
    e.userData[t] = r;
  }
}
const migrations = [
  { version: "1.1.0", migrate: migrateAssetContent },
  { version: "1.2.0", migrate: migrateRenderTextureData },
  {
    version: "1.2.1",
    migrate(e) {
      delete e.userData.redirect;
    },
  },
];
async function migrateAssetContent(e) {
  var t;
  var r;
  var a;
  var i;
  var e = e.getSwapSpace().json || (await readJSON(e.source));

  if (e.content) {
    ({ name: t, width: r, height: a } = e.content);
    i = new cc_1.RenderTexture();
    t && (i._name = t);
    r && (i._width = r);
    a && (i._height = a);
    delete e.content;
    Object.assign(e, JSON.parse(EditorExtends.serialize(i)));
  }
}
async function migrateRenderTextureData(e) {
  var e = e.getSwapSpace().json || (await readJSON(e.source));
  var { _name, _width, _height } = e;
  e.content = { base: "2,2,0,0,0,0", w: _width, h: _height, n: _name };
  delete e._name;
  delete e._width;
  delete e._height;
}

exports.RenderTextureHandler = {
  name: "render-texture",
  assetType: "cc.RenderTexture",
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newRenderTexture",
          fullFileName: "render-texture.rt",
          template: `db://internal/default_file_content/${exports.RenderTextureHandler.name}/default.rt`,
        },
      ];
    },
  },
  importer: {
    version: "1.2.1",
    migrations,
    migrationHook: migration_utils_1.migrationHook,
    async import(e) {
      var t = await readJSON(e.source);
      var t = cc.deserialize(t);

      var t =
        ((t.name = e.basename || ""),
        fillUserdata(e, "width", t.width),
        fillUserdata(e, "height", t.height),
        fillUserdata(e, "anisotropy", t._anisotropy),
        fillUserdata(e, "minfilter", getFilterString(t._minFilter)),
        fillUserdata(e, "magfilter", getFilterString(t._magFilter)),
        fillUserdata(e, "mipfilter", getFilterString(t._mipFilter)),
        fillUserdata(e, "wrapModeS", getWrapModeString(t._wrapS)),
        fillUserdata(e, "wrapModeT", getWrapModeString(t._wrapT)),
        t.resize(e.userData.width, e.userData.height),
        applyTextureBaseAssetUserData(e.userData, t),
        EditorExtends.serialize(t));

      var t = (await e.saveToLibrary(".json", t), getDependUUIDList(t));

      var t =
        (e.setData("depends", t),
        await e.createSubAsset("spriteFrame", "rt-sprite-frame", {
          displayName: e.basename,
        }));

      t.userData.imageUuidOrDatabaseUri = e.uuid;
      t.userData.width = e.userData.width;
      t.userData.height = e.userData.height;
      return true;
    },
  },
};

exports.default = exports.RenderTextureHandler;
