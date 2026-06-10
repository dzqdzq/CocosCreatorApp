async function compressImage(c, b = 2097152, m = 2000 /* 2e3 */) {
  return new Promise((i, l) => {
    blobToDataUrl(c).then((e) => {
      const s = new Image();
      s.src = e;
      s.crossOrigin = "anonymous";

      s.onload = async () => {
        var n = document.createElement("canvas");
        var a = n.getContext("2d");
        if (a) {
          let { width, height } = s;

          if (width > m) {
            height *= m / width;
            width = m;
          }

          n.width = width;
          n.height = height;
          a.drawImage(s, 0, 0, width, height);
          let o = 0.9;

          for (var t; o > 0.1; ) {
            if ((t = await canvasToBlob(n, c.type, o)).size <= b) {
              return void i(t);
            }
            o -= 0.1;
          }
          l(new Error(c.name + " size exceeds maximum limit"));
        } else {
          l(new Error("canvas context not available"));
        }
      };

      s.onerror = l;
    });
  });
}
function canvasToBlob(e, n, a) {
  return new Promise((r, o) => {
    e.toBlob((e) => (e ? r(e) : o(new Error("Blob creation failed"))), n, a);
  });
}
function blobToDataUrl(n) {
  return new Promise((e, r) => {
    const o = new FileReader();

    o.onload = () => {
      e(o.result);
    };

    o.onerror = r;
    o.readAsDataURL(n);
  });
}
function blobToUint8Array(n) {
  return new Promise((e, r) => {
    const o = new FileReader();

    o.onload = () => {
      e(new Uint8Array(o.result));
    };

    o.onerror = r;
    o.readAsArrayBuffer(n);
  });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressImage = compressImage;
exports.blobToDataUrl = blobToDataUrl;
exports.blobToUint8Array = blobToUint8Array;
