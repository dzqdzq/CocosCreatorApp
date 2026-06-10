Object.defineProperty(exports, "__esModule", { value: true });
exports.gradientDump = undefined;
class GradientDump {
  encode(e, o, c) {
    const l = JSON.parse(JSON.stringify(e));
    delete l._color;

    if (e.colorKeys.length > 0) {
      e.colorKeys.forEach((e, o) => {
        var c = [];
        c[0] = e.color.r;
        c[1] = e.color.g;
        c[2] = e.color.b;
        l.colorKeys[o].color = c;
      });
    }

    o.value = l;
  }
  decode(e, o, c, l) {
    var a = new (cc.js.getClassByName("cc.Gradient"))();
    if (c.value.alphaKeys.length > 0) {
      for (const n of c.value.alphaKeys) {
        var r = new (cc.js.getClassByName("cc.AlphaKey"))();
        r.time = n.time;
        r.alpha = n.alpha;
        a.alphaKeys.push(r);
      }
    }
    if (c.value.colorKeys.length > 0) {
      for (const y of c.value.colorKeys) {
        var s = cc.js.getClassByName("cc.ColorKey");
        var t = cc.js.getClassByName("cc.Color");
        var s = new s();
        s.time = y.time;

        if (y.color) {
          s.color = new t(...y.color);
        }

        a.colorKeys.push(s);
      }
    }
    e[o.key] = a;
  }
}
exports.gradientDump = new GradientDump();
