Object.defineProperty(exports, "__esModule", { value: true });
exports.asAsset = asAsset;
exports.setName = setName;
exports.findRootObject = findRootObject;
const cc_1 = require("cc");

const { error } = cc_1;

const base_builder_1 = require("./base-builder");
class DynamicBuilder extends base_builder_1.Builder {
  forceInline;
  serializedList = [];
  constructor(e) {
    super(e);
    this.forceInline = !!e.forceInline;
  }
  setProperty_Array(e, r, t, a) {
    return this.addObject(
      a.writeOnlyArray,
      r,
      t,
      a.formerlySerializedAs,
      false
    );
  }
  setProperty_Dict(e, r, t, a) {
    return this.addObject({}, r, t, a?.formerlySerializedAs, false);
  }
  addObject(e, r, t, a, i) {
    let s = -1;
    let d = e;

    if ((!this.forceInline && i) || !r) {
      s = this.serializedList.length;
      this.serializedList.push(e);
      this.forceInline || (d = { __id__: s });
    }

    if (r && ((r.data[t] = d), a)) {
      r.data[a] = d;
    }

    return { data: e, id: s };
  }
  setProperty_Class(e, r, t, a) {
    var i = { __type__: a.type };
    return this.addObject(
      i,
      r,
      t,
      a.formerlySerializedAs,
      !a.uniquelyReferenced
    );
  }
  setProperty_CustomizedClass(e, r, t, a) {
    var i = { __type__: a.type, content: a.content };
    return this.addObject(i, r, t, a.formerlySerializedAs, true);
  }
  setProperty_ParsedObject(e, r, t, a) {
    if (!this.forceInline && t.id >= 0) {
      e.data[r] = { __id__: t.id };
    } else {
      e.data[r] = t.data;
    }

    if (a) {
      e.data[a] = e.data[r];
    }
  }
  setProperty_Raw(e, r, t, a, i) {
    r.data[t] = a;

    if (i?.formerlySerializedAs) {
      r.data[i.formerlySerializedAs] = a;
    }
  }
  setProperty_ValueType(e, r, t, a, i) {
    var s = { __type__: cc_1.js.getClassId(a, false) };
    var d = a.constructor.__values__;
    if (d) {
      for (let e = 0; e < d.length; e++) {
        var n = d[e];
        s[n] = a[n];
      }
    }
    return r
      ? ((r.data[t] = s),
        i?.formerlySerializedAs && (r.data[i.formerlySerializedAs] = s),
        { data: s, id: -1 })
      : (this.serializedList.push(s), { data: s, id: 0 });
  }
  setProperty_TypedArray(e, r, t, a, i) {
    let s;
    var d;
    var n;

    s = this.hasBinaryBuffer
      ? ((d = a instanceof DataView) ||
          this.mainBufferBuilder.alignAs(a.constructor.BYTES_PER_ELEMENT),
        (n = this.mainBufferBuilder.append(a)),
        {
          __type__: "TypedArrayRef",
          ctor: a.constructor.name,
          offset: n,
          length: d ? a.byteLength : a.length,
        })
      : {
          __type__: "TypedArray",
          ctor: a.constructor.name,
          array: Array.from(a),
        };

    if (r) {
      r.data[t] = s;
      i?.formerlySerializedAs && (r.data[i.formerlySerializedAs] = s);
    } else {
      this.serializedList.push(s);
    }
  }
  setProperty_AssetUuid(e, r, t, a, i) {
    r.data[t] = { __uuid__: a };

    if (i?.formerlySerializedAs) {
      r.data[i.formerlySerializedAs] = r.data[t];
    }

    if (i?.expectedType) {
      r.data[t].__expectedType__ = i.expectedType;
    }
  }
  setRoot(e) {
    console.assert(e.id === 0, "Wrong root object to serialize, id is " + e.id);
  }
  finalizeJsonPart() {
    var e = this.serializedList;
    let r;
    return (r = e.length !== 1 || Array.isArray(e[0]) ? e : e[0]);
  }
}
function asAsset(e, r = cc_1.Asset) {
  return e
    ? (((r = new r())._uuid = e), r)
    : (error("[EditorExtends.serialize.asAsset] The uuid must be non-nil!"),
      null);
}
function setName(e, r) {
  if (Array.isArray(e)) {
    e[0]._name = r;
  } else {
    e._name = r;
  }
}
function findRootObject(r, t) {
  if (Array.isArray(r)) {
    for (let e = 0; e < r.length; e++) {
      var a = r[e];
      if (a.__type__ === t) {
        return a;
      }
    }
  } else if (r.__type__ === t) {
    return r;
  }
  return null;
}
exports.default = DynamicBuilder;
