var RefsBuilder;

var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, s, r = s) => {
        var a = Object.getOwnPropertyDescriptor(t, s);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[s];
            },
          };
        }

        Object.defineProperty(e, r, a);
      }
    : (e, t, s, r) => {
        e[(r = r === undefined ? s : r)] = t[s];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var s = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              s[s.length] = t;
            }
          }
          return s;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var s = a(e), r = 0; r < s.length; r++) {
          if (s[r] !== "default") {
            __createBinding(t, e, s[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMAT_VERSION = undefined;
exports.reduceEmptyArray = reduceEmptyArray;
exports.getRootData = getRootData;
const cc_1 = require("cc");
const cc = __importStar(require("cc"));

const { serializeBuiltinValueType } = require("cc/editor/serialization");

const types_1 = require("./types");
const create_class_mask_1 = __importDefault(require("./create-class-mask"));
const base_builder_1 = require("../base-builder");

const { EMPTY_PLACEHOLDER, CUSTOM_OBJ_DATA_CLASS, CUSTOM_OBJ_DATA_CONTENT } =
  cc_1.deserialize._macros;

exports.FORMAT_VERSION = 1;
const INNER_OBJ_PLACEHOLDER = 0;
function reduceEmptyArray(e) {
  return e && e.length > 0 ? e : EMPTY_PLACEHOLDER;
}
(RefsBuilder || (RefsBuilder = {})).Impl = class {
  beforeOffsetRefs = new Array();
  afterOffsetRefs = new Array();
  ctx;
  constructor(e) {
    this.ctx = e;
  }
  addRef(e, t, s) {
    return s.instanceIndex < e.instanceIndex
      ? s.instanceIndex
      : ((t = [NaN, t, s.instanceIndex]),
        e.indexed
          ? ((t[0] = e.instanceIndex), this.afterOffsetRefs.push(t), NaN)
          : ((t[0] = INNER_OBJ_PLACEHOLDER),
            this.beforeOffsetRefs.push(t),
            ~(this.beforeOffsetRefs.length - 1)));
  }
  build() {
    if (
      this.beforeOffsetRefs.length === 0 &&
      this.afterOffsetRefs.length === 0
    ) {
      return null;
    }
    var e = this.beforeOffsetRefs.length;
    var t = this.beforeOffsetRefs.concat(this.afterOffsetRefs);
    var s = new Array(3 * t.length + 1);
    let r = 0;
    for (const n of t) {
      s[r++] = n[0];
      var [, a] = n;

      if (typeof a == "number") {
        s[r++] = ~a;
      } else {
        this.ctx.sharedStrings.traceString(a, s, r++);
      }

      s[r++] = n[2];
    }
    s[r] = e;
    return s;
  }
};
class CompiledBuilder extends base_builder_1.Builder {
  noNativeDep;
  sharedUuids = new types_1.TraceableDict();
  sharedStrings = new types_1.TraceableDict();
  refsBuilder;
  dependAssets = new Array();
  rootNode;
  normalNodes = new Array();
  advancedNodes = new Array();
  classNodes = new Array();
  data = new Array(11);
  constructor(e) {
    super(e);

    if (e.forceInline) {
      throw new Error("CompiledBuilder doesn't support `forceInline`");
    }

    this.noNativeDep = !("noNativeDep" in e && !e.noNativeDep);
    this.refsBuilder = new RefsBuilder.Impl(this);
  }
  setProperty_Array(e, t, s, r) {
    r = new types_1.ArrayNode(r.writeOnlyArray.length);
    this.advancedNodes.push(r);
    this.setDynamicProperty(t, s, r);
    return r;
  }
  setProperty_Dict(e, t, s, r) {
    var a = new types_1.DictNode();
    this.advancedNodes.push(a);
    this.setDynamicProperty(t, s, a);
    return a;
  }
  setProperty_Class(e, t, s, r) {
    r = new types_1.ClassNode(r.type);
    this.normalNodes.push(r);
    this.classNodes.push(r);
    this.setDynamicProperty(t, s, r);
    return r;
  }
  setProperty_CustomizedClass(e, t, s, r) {
    r = new types_1.CustomClassNode(r.type, r.content);
    this.advancedNodes.push(r);
    this.classNodes.push(r);
    this.setDynamicProperty(t, s, r);
    return r;
  }
  setProperty_ParsedObject(e, t, s, r) {
    e.setDynamic(s, t);
  }
  setProperty_Raw(e, t, s, r, a) {
    t.setStatic(s, 0, r);
  }
  setProperty_ValueType(e, t, s, r, a) {
    if (!t) {
      throw new Error(
        "CompiledBulider: Not support serializing ValueType as root object."
      );
    }
    r = serializeBuiltinValueType(r);
    if (!r) {
      return null;
    }
    let n = 8;

    if (a && a.defaultValue instanceof cc.ValueType) {
      n = 5;
    }

    t.setStatic(s, n, r);
    return r;
  }
  setProperty_TypedArray(e, t, s, r, a) {
    if (!(e instanceof cc.Node) || s !== "_trs") {
      throw new Error(
        "Not support to serialize TypedArray yet. Can only use TypedArray in TRS."
      );
    }
    if (r.length !== 10) {
      throw new Error(`TRS ${r} should contains 10 elements.`);
    }
    e = Array.from(r);
    t.setStatic(s, 7, e);
  }
  setProperty_AssetUuid(e, t, s, r, a) {
    this.dependAssets.push(t, s, r);

    if (t instanceof types_1.CustomClassNode) {
      t.shouldBeIndexed = true;
    }
  }
  setRoot(e) {
    this.rootNode = e;
  }
  setDynamicProperty(e, t, s) {
    if (e) {
      e.setDynamic(s, t);
    }
  }
  collectInstances() {
    this.normalNodes = this.normalNodes.filter((e) => e.refCount > 1);

    this.normalNodes.sort(types_1.Node.compareByRefCount);

    this.advancedNodes = this.advancedNodes.filter(
      (e) => e.shouldBeIndexed || e.refCount > 1
    );

    this.advancedNodes.sort(types_1.Node.compareByRefCount);
    var e;
    var t = this.rootNode;

    if (t instanceof types_1.ClassNode) {
      -1 !== (e = this.normalNodes.indexOf(t)) && this.normalNodes.splice(e, 1);

      this.normalNodes.unshift(t);
    } else if (!this.advancedNodes.includes(t)) {
      this.advancedNodes.length;
      this.advancedNodes.push(t);
    }

    var s = this.normalNodes.length;

    for (let e = 0; e < s; ++e) {
      var r = this.normalNodes[e];
      r.instanceIndex = e;
      r.indexed = true;
    }
    for (let e = 0; e < this.advancedNodes.length; ++e) {
      var a = this.advancedNodes[e];
      a.instanceIndex = s + e;
      a.indexed = true;
    }
  }
  dumpInstances() {
    var e = this.normalNodes.length + this.advancedNodes.length;
    var t = new Array(e);
    var s = this.normalNodes.length;
    for (let e = 0; e < s; ++e) {
      var r = this.normalNodes[e];
      t[e] = r.dumpRecursively(this.refsBuilder);
    }
    for (let e = 0; e < this.advancedNodes.length; ++e) {
      var a = this.advancedNodes[e];
      var n = a.dumpRecursively(this.refsBuilder);

      if (a instanceof types_1.CustomClassNode) {
        t[s + e] = n[CUSTOM_OBJ_DATA_CONTENT];
      } else {
        t[s + e] = n;
      }
    }

    if (
      this.rootNode.instanceIndex !== 0 ||
      typeof t[t.length - 1] == "number" ||
      !this.noNativeDep
    ) {
      e = this.rootNode.instanceIndex;
      t.push(this.noNativeDep ? e : ~e);
    }

    this.data[5] = t;
  }
  dumpInstanceTypes() {
    var e = this.advancedNodes.map((e) =>
      e instanceof types_1.CustomClassNode
        ? e.dumped[CUSTOM_OBJ_DATA_CLASS]
        : ~e.selfType
    );
    this.data[6] = reduceEmptyArray(e);
  }
  dumpDependUuids() {
    var r = { owners: new Array(), keys: new Array(), uuids: new Array() };
    var a = { owners: new Array(), keys: new Array(), uuids: new Array() };
    var n = this.dependAssets;
    for (let s = 0; s < n.length; s += 3) {
      var i = n[s];
      let e = n[s + 1];
      var o = n[s + 2];
      let t;

      if (i.indexed) {
        t = a;
        i.setAssetRefPlaceholderOnIndexed(e);
        t.owners.push(i.instanceIndex);
      } else {
        t = r;
        i.setStatic(e, 6, t.owners.length);
        t.owners.push(INNER_OBJ_PLACEHOLDER);
      }

      if (typeof e == "number") {
        e = ~e;
      }

      t.keys.push(e);
      t.uuids.push(o);
    }
    this.data[8] = r.owners.concat(a.owners);
    var t = (this.data[9] = r.keys.concat(a.keys));
    for (let e = 0; e < t.length; ++e) {
      var s = t[e];

      if (typeof s == "string") {
        this.sharedStrings.traceString(s, t, e);
      }
    }
    var d = (this.data[10] = r.uuids.concat(a.uuids));
    for (let e = 0; e < d.length; ++e) {
      var u = d[e];
      this.sharedUuids.traceString(u, d, e);
    }
  }
  finalizeJsonPart() {
    this.collectInstances();
    this.dumpDependUuids();
    this.dumpInstances();
    this.data[0] = exports.FORMAT_VERSION;

    var { sharedClasses, sharedMasks } = (0, create_class_mask_1.default)(
      this.classNodes
    );

    var sharedClasses =
      ((this.data[3] = sharedClasses),
      (this.data[4] = reduceEmptyArray(sharedMasks)),
      this.dumpInstanceTypes(),
      (this.data[7] = this.refsBuilder.build() || EMPTY_PLACEHOLDER),
      this.sharedStrings.dump());

    this.data[2] = reduceEmptyArray(sharedClasses);
    var sharedMasks = this.sharedUuids.dump();
    this.data[1] = reduceEmptyArray(sharedMasks);
    return this.data;
  }
}
function getRootData(e) {
  var t;
  var [, , , , , e] = e;
  return Array.isArray(e)
    ? "number" == typeof (t = e[e.length - 1])
      ? e[t >= 0 ? t : ~t]
      : e[0]
    : e;
}
exports.default = CompiledBuilder;
