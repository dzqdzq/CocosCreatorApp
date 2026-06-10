Object.defineProperty(exports, "__esModule", { value: true });
const dumpEncode = cce.Dump.encode;
const DumpDecode = cce.Dump.decode;
class EditStateComponent {
  async change(o, e) {
    for (const t of Object.keys(e)) {
      await DumpDecode.decodePatch(t, e[t], o);
    }
  }
  encode(t) {
    const t_constructor = t.constructor;
    if (!t_constructor.__props__) {
      return null;
    }
    const r = {};

    t_constructor.__props__.forEach((e) => {
      try {
        var o;

        if (t[e] !== undefined) {
          o = cc.Class.attr(t_constructor, e);
          r[e] = dumpEncode.encodeObject(t[e], o, t);
          this.modifyProp(r[e], e);
        }
      } catch (o) {
        console.warn(
          `Component property dump failed:
Component: ${t.constructor.name}
Property: ` + e
        );

        console.warn(o);
      }
    });

    return r;
  }
  reset(c) {
    const c_constructor = c.constructor;

    if (c_constructor.__props__) {
      c_constructor.__props__.forEach((o) => {
        try {
          var e = cc.Class.attr(c_constructor, o);

          if (e && cc.Class._isCCClass(e.ctor) && c[o] === null) {
            c[o] = new e.ctor();
          }

          if (Array.isArray(c[o])) {
            for (const t of c[o]) {
              this.reset(t);
            }
          }
        } catch (o) {
          console.warn(o);
        }
      });
    }
  }
  modifyProp(o, e) {
    o.name = e;

    if (o.value && typeof o.value == "object") {
      for (const t in o.value) {
        if (typeof o.value[t] == "object") {
          this.modifyProp(o.value[t], t);
        }
      }
    }
  }
}
exports.default = new EditStateComponent();
