Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelAtlasHandler = undefined;

const { queryAsset } = require("@editor/asset-db");

const cc_1 = require("cc");

const { basename } = require("path");

const { getDependUUIDList } = require("../utils");

const fntParser = require("../../../static/utils/fnt-parser");
const FONT_SIZE = 0.88;

const defaultLabelAtlasUserData = {
  itemWidth: 2,
  itemHeight: 2,
  fontSize: 0,
  startChar: "",
  spriteFrameUuid: "",
  _fntConfig: {},
};

function createLabelAtlas(e) {
  var t = new cc.LabelAtlas();
  t.name = basename(e.source, e.extname);
  t.fontSize = e.userData.fontSize;
  t.fntConfig = e.userData._fntConfig;
  return t;
}
function createFntConfigString(t, e) {
  var t_userData = t.userData;
  var { itemWidth, itemHeight, fontSize } = t_userData;
  var e = e.meta;
  var { rawWidth, rawHeight } = e.userData;
  let d = null;
  if (
    t_userData.itemWidth > 0 &&
    t_userData.itemHeight > 0 &&
    t_userData.itemWidth <= rawWidth &&
    t_userData.itemHeight <= rawHeight
  ) {
    var e = e.displayName;
    var f = t_userData.startChar.charCodeAt(0);

    d = `info face="Arial" size=${fontSize} bold=0 italic=0 charset="" unicode=0 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spaceing=0,0
`;

    d =
      (d += `common lineHeight=${itemHeight} base=${fontSize} scaleW=${rawWidth} scaleH=${rawHeight} pages=1 packed=0
`) +
      `page id=0 file="${e}"
` +
      "chars count=0\n";

    let a = 0;
    for (let t = itemHeight; t <= rawHeight; t += itemHeight) {
      for (
        let e = 0;
        e < rawWidth && e + itemWidth <= rawWidth;
        e += itemWidth
      ) {
        var u = f + a;
        var c = e;
        var m = t - itemHeight;
        var h = String.fromCharCode(u);

        d += `char id=${u}     x=${c}   y=${m}   width=${itemWidth}     height=${itemHeight}     xoffset=0     yoffset=0    xadvance=${itemWidth}    page=0 chnl=0 letter="${h}"
`;

        ++a;
      }
    }
    return fntParser.parseFnt(d);
  }
  {
    let e = `LabelAtlas '${t._url}' fnt data invalid, `;

    if (t_userData.itemWidth <= 0 || t_userData.itemWidth > rawWidth) {
      e += `the item width must range from 1 - ${rawWidth}.`;
    } else if (
      t_userData.itemHeight <= 0 ||
      t_userData.itemHeight > rawHeight
    ) {
      e += `the item height must range from 1 - ${rawHeight}.`;
    }

    console.warn(e);
    return null;
  }
}

exports.LabelAtlasHandler = {
  name: "label-atlas",
  assetType: "cc.LabelAtlas",
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newLabelAtlas",
          fullFileName: "label-atlas.labelatlas",
          template: `db://internal/default_file_content/${exports.LabelAtlasHandler.name}/default.labelatlas`,
        },
      ];
    },
  },
  importer: {
    version: "1.0.1",
    async import(e) {
      const e_userData = e.userData;
      Object.keys(defaultLabelAtlasUserData).forEach((e) => {
        if (!(e in e_userData)) {
          e_userData[e] = defaultLabelAtlasUserData[e];
        }
      });
      var a = createLabelAtlas(e);
      if (e_userData.spriteFrameUuid) {
        e.depend(e_userData.spriteFrameUuid);
        var r = queryAsset(e.userData.spriteFrameUuid);
        if (!r) {
          return false;
        }
        a.fontSize = e_userData.fontSize = e_userData.itemHeight * FONT_SIZE;

        a.spriteFrame = EditorExtends.serialize.asAsset(
          e_userData.spriteFrameUuid,
          cc_1.SpriteFrame
        );

        a.fntConfig = e_userData._fntConfig = createFntConfigString(e, r);
      }
      a.name = e.basename || "";
      r = EditorExtends.serialize(a);
      await e.saveToLibrary(".json", r);
      a = getDependUUIDList(r);
      e.setData("depends", a);
      return true;
    },
  },
};

exports.default = exports.LabelAtlasHandler;
