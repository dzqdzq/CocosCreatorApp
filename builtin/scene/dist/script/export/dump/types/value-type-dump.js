Object.defineProperty(exports, "__esModule", { value: true });
exports.valueTypeDump = undefined;
class ValueTypeDump {
  encode(l, c, a) {
    try {
      var o = cce.Utils.serialize(l, { stringify: false, forceInline: true });
      delete o.__type__;
      c.value = o;
    } catch (e) {
      console.warn("Value dump failed.");
      console.warn(e);
      l = a.ctor;
      o = cce.Utils.serialize(new l(), { stringify: false, forceInline: true });
      delete o.__type__;
      c.value = o;
    }
  }
  decode(l, c, a, e) {
    e = e.ccType;
    const o = new e();

    e.__props__.forEach((e) => {
      if (a.value[e] === undefined) {
        o[e] = l[c.key][e];
      } else {
        o[e] = a.value[e];
      }
    });

    l[c.key] = o;
  }
}
exports.valueTypeDump = new ValueTypeDump();
