Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const cc_1 = require("cc");
const types_1 = require("./types");

const {
  CLASS_PROP_TYPE_OFFSET,
  MASK_CLASS,
  OBJ_DATA_MASK,
  CUSTOM_OBJ_DATA_CLASS,
} = cc_1.deserialize._macros;

class Type {
  properties = new Map();
  nodes = new Array();
  constructor(e) {
    this.setNodeProperties(e);
    this.nodes.push(e);
  }
  setNodeProperties(t) {
    var s = this.properties;
    for (const e of t.simpleKeys) {
      s.set(e, 0);
    }
    for (let e = 0; e < t.advanceds.length; e += 2) {
      var r = t.advanceds[e];
      s.set(r, t.advanceds[e + 1]);
    }
  }
  addNode(t) {
    var s = this.properties;
    let r = false;
    for (const e of t.simpleKeys) {
      if (s.has(e)) {
        if (s.get(e) !== 0) {
          return false;
        }
      } else {
        r = true;
      }
    }
    for (let e = 0; e < t.advanceds.length; e += 2) {
      var a = t.advanceds[e];
      if (s.has(a)) {
        if (s.get(a) !== t.advanceds[e + 1]) {
          return false;
        }
      } else {
        r = true;
      }
    }

    if (r) {
      this.setNodeProperties(t);
    }

    this.nodes.push(t);
    return true;
  }
  static shouldUseSameMask(e) {
    var t = this.simpleKeys;

    var { simpleKeys, advanceds } = e;

    var r = this.advanceds;
    if (t.length !== simpleKeys.length || r.length !== advanceds.length) {
      return false;
    }
    for (let e = 0; e < t.length; ++e) {
      if (t[e] !== simpleKeys[e]) {
        return false;
      }
    }
    for (let e = 0; e < r.length; e += 2) {
      if (r[e] !== advanceds[e]) {
        return false;
      }
    }
    return true;
  }
  dump(e, t, s) {
    var r = new types_1.TraceableDict();
    var a = new types_1.TraceableDict();
    var n = new Array();
    for (let e = 0; e < this.nodes.length; ++e) {
      var i = this.nodes[e];
      var o = n.find(Type.shouldUseSameMask, i);
      if (o) {
        s.trace(o, i.dumped, OBJ_DATA_MASK);
      } else {
        var d = [types_1.TraceableDict.PLACEHOLDER];
        for (let e = 0; e < i.simpleKeys.length; ++e) {
          var c = i.simpleKeys[e];
          r.traceString(c, d, d.length);
          d.push(types_1.TraceableDict.PLACEHOLDER);
        }
        const d_length = d.length;
        for (let e = 0; e < i.advanceds.length; e += 2) {
          var l = i.advanceds[e];
          a.traceString(l, d, d.length);
          d.push(types_1.TraceableDict.PLACEHOLDER);
        }
        d.push(d_length);
        t.trace(this, d, MASK_CLASS);
        s.trace(i, i.dumped, OBJ_DATA_MASK).result = d;
        n.push(i);
      }
    }
    var p = r.dump();
    var h = a.dump(p.length);
    var u = p.concat(h);
    const d_length = CLASS_PROP_TYPE_OFFSET + 1 - p.length;

    p = h.map((e) => this.properties.get(e));

    h = [e, u, d_length, ...p];
    t.get(this).result = h;
  }
}
function registerType(e, t) {
  for (const s of e) {
    if (s.addNode(t)) {
      return;
    }
  }
  const s = new Type(t);
  e.push(s);
}
function default_1(t) {
  var e;
  var s;
  var r = new types_1.TraceableDict();
  var a = new types_1.TraceableDict();
  var n = new Map();
  for (let e = 0; e < t.length; ++e) {
    var i = t[e];
    var i_ctor = i.ctor;
    if (i instanceof types_1.CustomClassNode) {
      r.traceString(i_ctor, i.dumped, CUSTOM_OBJ_DATA_CLASS);
    } else {
      let e = n.get(i_ctor);

      if (!e) {
        e = [];
        n.set(i_ctor, e);
      }

      registerType(e, i);
    }
  }
  for ([e, s] of n) {
    for (const d of s) {
      d.dump(e, r, a);
    }
  }
  return { sharedClasses: r.dump(), sharedMasks: a.dump() };
}
