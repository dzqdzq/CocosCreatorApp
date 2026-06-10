Object.defineProperty(exports, "__esModule", { value: true });

exports.CustomClassNode = undefined;
exports.ClassNode = undefined;
exports.DictNode = undefined;
exports.ArrayNode = undefined;
exports.Node = undefined;
exports.TraceableDict = undefined;
exports.TraceableItem = undefined;

const cc_1 = require("cc");

const {
  DICT_JSON_LAYOUT,
  CLASS_TYPE,
  CLASS_KEYS,
  CLASS_PROP_TYPE_OFFSET,
  CUSTOM_OBJ_DATA_CONTENT,
  MASK_CLASS,
} = cc_1.deserialize._macros;

class TraceableItem {
  tracers = [];
  keys = [];
  static compareByRefCount(e, t) {
    return t.tracers.length - e.tracers.length;
  }
  static NO_RESULT = Object.create(null);
  result = TraceableItem.NO_RESULT;
  constructor() {}
  traceBy(e, t) {
    this.tracers.push(e);
    this.keys.push(t);
  }
  movedTo(t) {
    for (let e = 0; e < this.tracers.length; e++) {
      this.tracers[e][this.keys[e]] = t;
    }
  }
}
exports.TraceableItem = TraceableItem;
class TraceableDict {
  static PLACEHOLDER = 0;
  values = new Map();
  trace(e, t, s) {
    let r = this.values.get(e);

    if (!r) {
      r = new TraceableItem();
      this.values.set(e, r);
    }

    r.traceBy(t, s);
    return r;
  }
  traceString(e, t, s) {
    this.trace(e, t, s).result = e;
  }
  get(e) {
    return this.values.get(e);
  }
  getSortedItems() {
    var e = Array.from(this.values.values());
    e.sort(TraceableItem.compareByRefCount);
    return e;
  }
  dump(t = 0) {
    var s = this.getSortedItems();
    for (let e = 0; e < s.length; e++) {
      s[e].movedTo(t + e);
    }
    return s.map((e) => e.result);
  }
}
exports.TraceableDict = TraceableDict;
class Node {
  selfType;
  refCount = 0;
  indexed = false;
  shouldBeIndexed = false;
  _index = -1;
  get instanceIndex() {
    return this._index;
  }
  set instanceIndex(e) {
    if (this.indexed) {
      throw new Error("Should not change instanceIndex on indexed object");
    }
    this._index = e;
  }
  get refType() {
    return this.indexed ? 1 : this.selfType;
  }
  static compareByRefCount(e, t) {
    return t.refCount - e.refCount;
  }
  constructor(e) {
    this.selfType = e;
  }
  setStatic(e, t, s) {}
  setDynamic(e, t) {
    ++e.refCount;
  }
  static AssetPlaceholderType = 0;
  static AssetPlaceholderValue = null;
  setAssetRefPlaceholderOnIndexed(e) {}
  dumpRecursively(e) {}
}
class ArrayNode extends (exports.Node = Node) {
  types;
  datas;
  static DeriveTypes = [
    [0, 0],
    [4, 9],
    [6, 3],
    [1, 2],
  ];
  constructor(e) {
    super(12);
    this.types = new Array(e);
    this.datas = new Array(e);
  }
  setStatic(e, t, s) {
    this.types[e] = t;
    this.datas[e] = s;
  }
  setDynamic(e, t) {
    super.setDynamic(e);
    this.types[t] = undefined;
    this.datas[t] = e;
  }
  setAssetRefPlaceholderOnIndexed(e) {
    this.types[e] = Node.AssetPlaceholderType;
    this.datas[e] = Node.AssetPlaceholderValue;
  }
  dumpRecursively(t) {
    for (let e = 0; e < this.datas.length; ++e) {
      var s;
      var r = this.datas[e];

      if (r instanceof Node) {
        if (r.indexed) {
          s = t.addRef(this, e, r);

          isFinite(s)
            ? ((this.types[e] = 1), (this.datas[e] = s))
            : ((this.types[e] = 0), (this.datas[e] = null));
        } else {
          r.instanceIndex = this.instanceIndex;
          s = r.dumpRecursively(t);
          this.types[e] = r.refType;
          this.datas[e] = s;
        }
      }
    }
    for (let e = 0; e < ArrayNode.DeriveTypes.length; ++e) {
      const [a, i] = ArrayNode.DeriveTypes[e];
      if (this.types.every((e) => e === a)) {
        this.selfType = i;
        return this.datas;
      }
    }
    this.selfType = 12;
    return [this.datas, ...this.types];
  }
}
exports.ArrayNode = ArrayNode;
class DictNode extends Node {
  data = [null];
  json = Object.create(null);
  dynamics = Object.create(null);
  constructor() {
    super(11);
    this.data[DICT_JSON_LAYOUT] = this.json;
  }
  setStatic(e, t, s) {
    if (t === 0) {
      this.json[e] = s;
    } else {
      this.data.push(e, t, s);
    }
  }
  setDynamic(e, t) {
    super.setDynamic(e);
    this.dynamics[t] = e;
  }
  dumpRecursively(e) {
    for (const r in this.dynamics) {
      var t;
      var s = this.dynamics[r];

      if (s.indexed) {
        t = e.addRef(this, r, s);
        isFinite(t) && this.data.push(r, 1, t);
      } else {
        s.instanceIndex = this.instanceIndex;
        t = s.dumpRecursively(e);

        s.refType === 0 ? (this.json[r] = t) : this.data.push(r, s.refType, t);
      }
    }
    return this.data.length === 1
      ? ((this.selfType = 0), this.json)
      : this.data;
  }
}
exports.DictNode = DictNode;
class ClassNode extends Node {
  ctor;
  simpleKeys = new Array();
  simpleValues = [];
  advanceds = new Array();
  dumped;
  static fromData(t, s, r) {
    var e = t[CLASS_TYPE];
    var a = new ClassNode(e);
    a.dumped = r;
    a.simpleValues = null;
    var i = t[CLASS_KEYS];
    var d = t[CLASS_PROP_TYPE_OFFSET];
    var n = s[s.length - 1];
    let c = MASK_CLASS + 1;
    for (; c < n; ++c) {
      var o = i[s[c]];
      a.simpleKeys.push(o);
    }
    for (let e = n; e < r.length; ++e) {
      var l = i[s[e]];
      var h = t[s[e] + d];
      a.advanceds.push(l, h);
    }
    return a;
  }
  constructor(e) {
    super(4);
    this.ctor = e;
  }
  setStatic(e, t, s) {
    if (t === 0) {
      this.simpleKeys.push(e);
      this.simpleValues.push(s);
    } else {
      this.advanceds.push(e, t, s);
    }
  }
  setDynamic(e, t) {
    super.setDynamic(e);
    this.advanceds.push(t, undefined, e);
  }
  dumpRecursively(t) {
    var s = this.advanceds;
    for (
      let TraceableDict_PLACEHOLDER = s.length - 3;
      TraceableDict_PLACEHOLDER >= 0;
      TraceableDict_PLACEHOLDER -= 3
    ) {
      var r;
      var a = s[TraceableDict_PLACEHOLDER + 2];

      if (a instanceof Node) {
        if (a.indexed) {
          r = t.addRef(this, s[TraceableDict_PLACEHOLDER], a);
          isFinite(r)
            ? ((s[TraceableDict_PLACEHOLDER + 1] = 1),
              (s[TraceableDict_PLACEHOLDER + 2] = r))
            : s.splice(TraceableDict_PLACEHOLDER, 3);
        } else {
          a.instanceIndex = this.instanceIndex;
          r = a.dumpRecursively(t);

          a.refType === 0
            ? (this.simpleKeys.push(s[TraceableDict_PLACEHOLDER]),
              this.simpleValues.push(r),
              s.splice(TraceableDict_PLACEHOLDER, 3))
            : ((s[TraceableDict_PLACEHOLDER + 1] = a.refType),
              (s[TraceableDict_PLACEHOLDER + 2] = r));
        }
      }
    }
    var TraceableDict_PLACEHOLDER = TraceableDict.PLACEHOLDER;
    this.dumped = [TraceableDict_PLACEHOLDER].concat(this.simpleValues);
    for (
      let TraceableDict_PLACEHOLDER = 0;
      TraceableDict_PLACEHOLDER < s.length;
      TraceableDict_PLACEHOLDER += 3
    ) {
      this.dumped.push(s[TraceableDict_PLACEHOLDER + 2]);
    }
    this.simpleValues = null;

    this.advanceds = this.advanceds.filter((e, t) => t % 3 != 2);

    return this.dumped;
  }
}
exports.ClassNode = ClassNode;
class CustomClassNode extends Node {
  ctor;
  content;
  dumped;
  static fromData(e, t) {
    var s = t[CUSTOM_OBJ_DATA_CONTENT];
    var e = new CustomClassNode(e, s);
    e.dumped = t;
    return e;
  }
  constructor(e, t) {
    super(10);
    this.ctor = e;
    this.content = t;
  }
  setStatic(e, t, s) {
    throw new Error("Should not set property of CustomClass");
  }
  setDynamic(e, t) {
    throw new Error("Should not set property of CustomClass");
  }
  dumpRecursively(e) {
    var TraceableDict_PLACEHOLDER = TraceableDict.PLACEHOLDER;
    this.dumped = [TraceableDict_PLACEHOLDER, this.content];
    return this.dumped;
  }
}
exports.CustomClassNode = CustomClassNode;
