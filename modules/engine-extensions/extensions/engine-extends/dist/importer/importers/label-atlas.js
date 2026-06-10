Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelAtlasImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const path_1 = require("path");
const utils_1 = require("../utils");
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

class LabelAtlasImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.1";
  }
  get name() {
    return "label-atlas";
  }
  get assetType() {
    return "cc.LabelAtlas";
  }
  get assetExtends() {
    return ["cc.Font"];
  }
  _createFntConfigString(t) {
    var t_userData = t.userData;
    var e = asset_db_1.queryAsset(t.userData.spriteFrameUuid);
    if (!e) {
      return null;
    }
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
      var u = t_userData.startChar.charCodeAt(0);

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
          var c = u + a;
          var m = e;
          var f = t - itemHeight;
          var h = String.fromCharCode(c);

          d += `char id=${c}     x=${m}   y=${f}   width=${itemWidth}     height=${itemHeight}     xoffset=0     yoffset=0    xadvance=${itemWidth}    page=0 chnl=0 letter="${h}"
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
  async import(e) {
    const e_userData = e.userData;
    Object.keys(defaultLabelAtlasUserData).forEach((e) => {
      if (!(e in e_userData)) {
        e_userData[e] = defaultLabelAtlasUserData[e];
      }
    });
    var a = this.createLabelAtlas(e);

    var a =
      (e_userData.spriteFrameUuid &&
        ((a.fontSize = e_userData.fontSize = e_userData.itemHeight * FONT_SIZE),
        (a.spriteFrame = EditorExtends.serialize.asAsset(
          e_userData.spriteFrameUuid,
          cc_1.SpriteFrame
        )),
        (a.fntConfig = e_userData._fntConfig = this._createFntConfigString(e))),
      (a.name = e.basename || ""),
      EditorExtends.serialize(a));

    var a = (await e.saveToLibrary(".json", a), utils_1.getDependUUIDList(a));
    e.setData("depends", a);
    return true;
  }
  createLabelAtlas(e) {
    var t = new cc.LabelAtlas();
    t.name = path_1.basename(e.source, e.extname);
    t.fontSize = e.userData.fontSize;
    t.fntConfig = e.userData._fntConfig;
    return t;
  }
}
exports.LabelAtlasImporter = LabelAtlasImporter;
