var FntLoader = {
  INFO_EXP: /info .*?(?=\/>)|info .*/gi,
  COMMON_EXP: /common .*?(?=\/>)|common .*/gi,
  PAGE_EXP: /page .*?(?=\/>)|page .*/gi,
  CHAR_EXP: /char .*?(?=\/>)|char .*/gi,
  KERNING_EXP: /kerning .*?(?=\/>)|kerning .*/gi,
  ITEM_EXP: /\w+=[^ \r\n]+/gi,
  NUM_EXP: /^\-?\d+(?:\.\d+)?$/,
  _parseStrToObj(e) {
    var t = e.match(this.ITEM_EXP);
    var r = {};
    if (t) {
      for (var a = 0, n = t.length; a < n; a++) {
        var o = t[a];
        var i = o.indexOf("=");
        var s = o.substring(0, i);
        var o = o.substring(i + 1);

        if (o[0] === '"') {
          if ((o = o.substring(1, o.length - 1)).match(this.NUM_EXP)) {
            o = parseFloat(o);
          }
        } else if (o.match(this.NUM_EXP)) {
          o = parseFloat(o);
        }

        r[s] = o;
      }
    }
    return r;
  },
  parseFnt(e) {
    var t = this;
    var r = {};
    var a = e.match(t.INFO_EXP);
    if (a) {
      for (
        var a = t._parseStrToObj(a[0]),
          n = t._parseStrToObj(e.match(t.COMMON_EXP)[0]),
          a =
            ((r.commonHeight = n.lineHeight),
            (r.fontSize = parseInt(a.size)),
            cc.game.renderType === cc.game.RENDER_TYPE_WEBGL &&
              ((a = cc.configuration.getMaxTextureSize()),
              n.scaleW > a.width || n.scaleH > a.height) &&
              Editor.log(
                "cc.LabelBMFont._parseCommonArguments(): page can't be larger than supported"
              ),
            n.pages !== 1 &&
              Editor.log(
                "cc.LabelBMFont._parseCommonArguments(): only supports 1 page"
              ),
            t._parseStrToObj(e.match(t.PAGE_EXP)[0])),
          o =
            (a.id !== 0 &&
              Editor.log(
                "cc.LabelBMFont._parseImageFileName() : file could not be found"
              ),
            (r.atlasName = a.file),
            e.match(t.CHAR_EXP)),
          i = (r.fontDefDictionary = {}),
          s = 0,
          c = o.length;
        s < c;
        s++
      ) {
        var g = t._parseStrToObj(o[s]);
        i[g.id] = {
          rect: { x: g.x, y: g.y, width: g.width, height: g.height },
          xOffset: g.xoffset,
          yOffset: g.yoffset,
          xAdvance: g.xadvance,
        };
      }
      var h = (r.kerningDict = {});
      var E = e.match(t.KERNING_EXP);
      if (E) {
        s = 0;

        for (c = E.length; s < c; s++) {
          var f = t._parseStrToObj(E[s]);
          h[(f.first << 16) | (65535 & f.second)] = f.amount;
        }
      }
    }
    return r;
  },
};
module.exports = FntLoader;
