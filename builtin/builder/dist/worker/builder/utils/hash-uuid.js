Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltinHashType = undefined;
exports.calculate = calculate;
const utils_1 = require("../../../share/utils");
const XXH = require("xxhashjs");
const UNIQUE_ID_SEP = "-";
function unique(t) {
  var r = {};
  for (let e = 0; e < t.length; e++) {
    var s = t[e];
    var a = r[s];

    if (a === undefined) {
      r[s] = 1;
    } else {
      t[e] = s + UNIQUE_ID_SEP + a.toString(16);
      r[s] = a + 1;
    }
  }
}
function calculate(r, t) {
  var s = XXH.h32();
  var a = [];
  for (let e = 0; e < r.length; e++) {
    let t = r[e];
    t = t.slice().sort(utils_1.compareUUID);
    for (let e = 0; e < t.length; e++) {
      s.update(t[e]);
    }
    var l = s.digest().toString(16).padEnd(8, "0");
    a.push(l);
  }
  unique(a);

  if (typeof t == "string") {
    if (t.length < 2) {
      console.error("hashName string length must >= 2");
      return a;
    }
  } else if (!(t = "0123456789abcdef"[t])) {
    console.error("Invalid hashName");
    return a;
  }

  return a.map((e) => t + e);
}
exports.BuiltinHashType = { PackedAssets: 0, AutoAtlasImage: 1 };
