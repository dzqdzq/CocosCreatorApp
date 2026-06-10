Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMeshes = mergeMeshes;
const cc_1 = require("cc");
function mergeMeshes(t = []) {
  if (t.length === 0) {
    console.warn("mergeMeshes: meshes is empty");
    return new cc_1.Mesh();
  }
  if (t.length === 1) {
    return t[0];
  }
  if (t.every((e) => e.struct.compressed)) {
    return new cc_1.Mesh();
  }
  if (
    !((e) => {
      var t = e.map((e) => e.struct.encoded);

      var r = e.map((e) => e.struct.compressed);

      var s = e.map((e) => e.struct.quantized);

      if (
        !(
          t.every((e) => e === undefined) &&
          r.every((e) => e === undefined) &&
          s.every((e) => e === undefined)
        )
      ) {
        var [n] = t;
        for (let e = 1; e < t.length; e++) {
          if (t[e] !== n) {
            return false;
          }
        }
        var [i] = r;
        for (let e = 1; e < r.length; e++) {
          if (r[e] !== i) {
            return false;
          }
        }
        var [c] = s;
        for (let e = 1; e < s.length; e++) {
          if (s[e] !== c) {
            return false;
          }
        }
      }
      return true;
    })(t)
  ) {
    console.warn("mergeMeshes: encoded state is not the same");
    return new cc_1.Mesh();
  }
  if (
    !((e) => {
      var t = e.map((e) => e.struct.jointMaps);
      if (!t.every((e) => e === undefined)) {
        var [r] = t;
        var r_length = r.length;
        for (let e = 1; e < t.length; e++) {
          var n = t[e];
          if (n.length !== r_length) {
            return false;
          }
          for (let t = 0; t < n.length; t++) {
            var i = r[t].length;
            if (n[t].length !== i) {
              return false;
            }
            for (let e = 0; e < i; e++) {
              if (n[t][e] !== r[t][e]) {
                return false;
              }
            }
          }
        }
      }
      return true;
    })(t)
  ) {
    console.warn("mergeMeshes: jointMap is not the same");
    return new cc_1.Mesh();
  }
  if (!t.map((e) => e.struct.morph).every((e) => e === undefined)) {
    console.warn("mergeMeshes: morph is not supported");
    return new cc_1.Mesh();
  }

  var e = t.reduce((e, t) => e + t.data.byteLength, 0);

  var r = new Uint8Array(e);
  var s = [];
  var n = [];
  let i = 0;
  let c = 0;
  var o = t[0].struct.minPosition || new cc_1.Vec3(1000000000 /* 1e9 */);
  var a = t[0].struct.maxPosition || new cc_1.Vec3(-1000000000 /* -1e9 */);
  for (let e = 0; e < t.length; e++) {
    var u = t[e];
    var u_data = u.data;
    r.set(u_data, i);

    s.push(
      ...u.struct.vertexBundles.map((e) => {
        e.view.offset += i;
        return e;
      })
    );

    n.push(
      ...u.struct.primitives.map((e) => {
        var t = e;

        t.vertexBundelIndices = e.vertexBundelIndices.map((e) => e + c);

        if (t.indexView) {
          t.indexView.offset += i;
        }

        return t;
      })
    );

    i += u_data.byteLength;
    c += u.struct.vertexBundles.length;
    o.x = Math.min(o.x, u.struct.minPosition?.x || 1000000000 /* 1e9 */);
    o.y = Math.min(o.y, u.struct.minPosition?.y || 1000000000 /* 1e9 */);
    o.z = Math.min(o.z, u.struct.minPosition?.z || 1000000000 /* 1e9 */);
    a.x = Math.max(a.x, u.struct.maxPosition?.x || -1000000000 /* -1e9 */);
    a.y = Math.max(a.y, u.struct.maxPosition?.y || -1000000000 /* -1e9 */);
    a.z = Math.max(a.z, u.struct.maxPosition?.z || -1000000000 /* -1e9 */);
  }

  var e = {
    struct: {
      vertexBundles: s,
      primitives: n,
      minPosition: o,
      maxPosition: a,
      jointMaps: t[0].struct.jointMaps,
      dynamic: t[0].struct.dynamic,
      compressed: t[0].struct.compressed,
      quantized: t[0].struct.quantized,
      encoded: t[0].struct.encoded,
    },
    data: r,
  };

  var h = new cc_1.Mesh();
  h.reset(e);
  h.hash;
  return h;
}
