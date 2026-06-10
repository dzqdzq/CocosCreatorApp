var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = packJSONs;
const cc_1 = require("cc");
const types_1 = require("./types");
const builder_1 = require("./builder");

const { reduceEmptyArray } = builder_1;

const create_class_mask_1 = __importDefault(require("./create-class-mask"));

const {
  EMPTY_PLACEHOLDER,
  CUSTOM_OBJ_DATA_CLASS,
  ARRAY_ITEM_VALUES,
  CLASS_PROP_TYPE_OFFSET,
  MASK_CLASS,
  OBJ_DATA_MASK,
  DICT_JSON_LAYOUT,
  PACKED_SECTIONS,
} = cc_1.deserialize._macros;

function genArrayParser(s) {
  return (r, a, t) => {
    for (let e = 0; e < a.length; ++e) {
      s(r, a[e], t);
    }
  };
}
function parseArray(r, a, t) {
  var s = a[ARRAY_ITEM_VALUES];
  for (let e = 0; e < s.length; ++e) {
    var _ = a[e + 1];
    var _ = PARSERS[_];

    if (_) {
      _(r, s[e], t);
    }
  }
}
function parseDict(r, a, t) {
  for (let e = DICT_JSON_LAYOUT + 1; e < a.length; e += 3) {
    var s = a[e + 1];
    var s = PARSERS[s];

    if (s) {
      s(r, a[e + 2], t);
    }
  }
}
function parseClass(r, a, t) {
  var s = r[4][a[OBJ_DATA_MASK]];
  var _ = r[3][s[MASK_CLASS]];
  var e = types_1.ClassNode.fromData(_, s, a);
  t.push(e);
  var l = _[CLASS_PROP_TYPE_OFFSET];
  for (let e = s[s.length - 1]; e < a.length; ++e) {
    var S = _[s[e] + l];
    var S = PARSERS[S];

    if (S) {
      S(r, a[e], t);
    }
  }
}
function parseCustomClass(e, r, a) {
  e = e[3][r[CUSTOM_OBJ_DATA_CLASS]];
  e = types_1.CustomClassNode.fromData(e, r);
  a.push(e);
}
const PARSERS = new Array(13);
function parseInstances(r, a) {
  var [, , , t, , s, _] = r;
  var l = _ === EMPTY_PLACEHOLDER ? 0 : _.length;
  var e = s[s.length - 1];
  let S = s.length - l;

  if (typeof e == "number") {
    --S;
  }

  let n = 0;
  for (; n < S; ++n) {
    parseClass(r, s[n], a);
  }
  if (_) {
    for (let e = 0; e < l; ++e, ++n) {
      var A;
      var u = _[e];
      var o = s[n];

      if (u >= 0) {
        A = t[u];
        A = types_1.CustomClassNode.fromData(A, [u, o]);
        A.instanceIndex = n;
        a.push(A);
        _[e] = A;
      } else {
        u = ~u;
        (A = PARSERS[u]) && A(r, o, a);
      }
    }
  }
}
function parseJSON(e, r, a, t) {
  var [, s, _, , , , , , , o, l] = e;
  for (let e = 0; e < l.length; ++e) {
    var S = s[l[e]];
    r.traceString(S, l, e);
  }
  if (e[7]) {
    var [, , , , , , , n] = e;
    var A = n.length - 1;
    for (let e = 0; e < A; e += 3) {
      var u = n[e + 1];

      if (u >= 0) {
        u = _[u];
        a.traceString(u, n, e + 1);
      }
    }
  }
  for (let e = 0; e < o.length; ++e) {
    var c = o[e];

    if (c >= 0) {
      c = _[c];
      a.traceString(c, o, e);
    }
  }
  parseInstances(e, t);
}
function packJSONs(r) {
  var a = new types_1.TraceableDict();
  var t = new types_1.TraceableDict();
  var s = new Array();
  for (let sharedClasses = 0; sharedClasses < r.length; ++sharedClasses) {
    parseJSON(r[sharedClasses], a, t, s);
  }
  var { sharedClasses, sharedMasks } = (0, create_class_mask_1.default)(s);
  for (let sharedClasses = 0; sharedClasses < r.length; ++sharedClasses) {
    var l = r[sharedClasses];
    var [, , , , , , S] = l;
    if (S) {
      for (let sharedClasses = 0; sharedClasses < S.length; ++sharedClasses) {
        var n = S[sharedClasses];

        if (n instanceof types_1.CustomClassNode) {
          S[sharedClasses] = n.dumped[CUSTOM_OBJ_DATA_CLASS];
        }
      }
    }
    l.splice(0, 5);
  }
  var A = new Array(PACKED_SECTIONS + 1);
  A[0] = builder_1.FORMAT_VERSION;
  A[1] = reduceEmptyArray(a.dump());
  A[2] = reduceEmptyArray(t.dump());
  A[3] = sharedClasses;
  A[4] = reduceEmptyArray(sharedMasks);
  A[PACKED_SECTIONS] = r;
  return A;
}
PARSERS.fill(null);
PARSERS[4] = parseClass;
PARSERS[10] = parseCustomClass;
PARSERS[12] = parseArray;
PARSERS[9] = genArrayParser(parseClass);
PARSERS[11] = parseDict;
