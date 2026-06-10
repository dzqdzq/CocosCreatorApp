var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeDracoGeometry = decodeDracoGeometry;
const draco3dgltf_1 = __importDefault(require("draco3dgltf"));
const decoderModule = draco3dgltf_1.default.createDecoderModule({});
function decodeDracoGeometry(e) {
  var r = new decoderModule.Decoder();
  var e = decodeDracoData(e.buffer, r, e);
  decoderModule.destroy(r);
  return e;
}
function decodeDracoData(e, r, t) {
  var o = new decoderModule.DecoderBuffer();
  o.Init(new Int8Array(e), e.byteLength);
  var d = r.GetEncodedGeometryType(o);
  let n;
  let c;
  switch (d) {
    case decoderModule.TRIANGULAR_MESH: {
      n = new decoderModule.Mesh();
      c = r.DecodeBufferToMesh(o, n);
      break;
    }
    case decoderModule.POINT_CLOUD: {
      n = new decoderModule.PointCloud();
      c = r.DecodeBufferToPointCloud(o, n);
      break;
    }
    default: {
      throw new Error(`Unknown geometry type ${d}.`);
    }
  }
  if (c.ok() && n.ptr !== 0) {
    e = { vertices: decodeAttributes(n, r, t) };

    if (d === decoderModule.TRIANGULAR_MESH && t.indices) {
      t = decodeIndices(n, r, t.indices);
      e.indices = t;
    }

    decoderModule.destroy(n);
    decoderModule.destroy(o);
    return e;
  }
  throw new Error("Decoding failed: " + c.error_msg());
}
function decodeAttributes(e, t, o) {
  var d = e.num_points();
  var n = {};
  for (const A of Object.keys(o.attributes)) {
    var { uniqueId, storageConstructor, components } = o.attributes[A];
    var i = components * d;
    var l = t.GetAttributeByUniqueId(e, uniqueId);
    if (l.num_components() !== components) {
      throw new Error(
        `Decompression error: components-per-attribute of ${A} mismatch.`
      );
    }
    let r;
    switch (storageConstructor) {
      case Float32Array: {
        r = new decoderModule.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(e, l, r);
        break;
      }
      case Int8Array: {
        r = new decoderModule.DracoInt8Array();
        t.GetAttributeInt8ForAllPoints(e, l, r);
        break;
      }
      case Int16Array: {
        r = new decoderModule.DracoInt16Array();
        t.GetAttributeInt16ForAllPoints(e, l, r);
        break;
      }
      case Int32Array: {
        r = new decoderModule.DracoInt32Array();
        t.GetAttributeInt32ForAllPoints(e, l, r);
        break;
      }
      case Uint8Array: {
        r = new decoderModule.DracoUInt8Array();
        t.GetAttributeUInt8ForAllPoints(e, l, r);
        break;
      }
      case Uint16Array: {
        r = new decoderModule.DracoUInt16Array();
        t.GetAttributeUInt16ForAllPoints(e, l, r);
        break;
      }
      case Uint32Array: {
        r = new decoderModule.DracoUInt32Array();
        t.GetAttributeUInt32ForAllPoints(e, l, r);
        break;
      }
      default: {
        throw new Error("THREE.DRACOLoader: Unexpected attribute type.");
      }
    }
    if (i !== r.size()) {
      throw new Error(`Decompression error: ${A} data size mismatch.`);
    }
    var s = new storageConstructor(i);
    for (let e = 0; e < i; ++e) {
      s[e] = r.GetValue(e);
    }
    n[A] = s;
    decoderModule.destroy(r);
  }
  return n;
}
function decodeIndices(r, t, e) {
  var o = r.num_faces();
  var d = new e(3 * o);
  var n = new decoderModule.DracoInt32Array();
  for (let e = 0; e < o; ++e) {
    t.GetFaceFromMesh(r, e, n);
    var c = 3 * e;
    d[c] = n.GetValue(0);
    d[1 + c] = n.GetValue(1);
    d[2 + c] = n.GetValue(2);
  }
  decoderModule.destroy(n);
  return d;
}
