var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, i, c) =>
    new (i = i || Promise)((n, t) => {
      function o(e) {
        try {
          s(c.next(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        try {
          s(c.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function s(e) {
        var t;

        if (e.done) {
          n(e.value);
        } else {
          ((t = e.value) instanceof i
            ? t
            : new i((e) => {
                e(t);
              })
          ).then(o, r);
        }
      }
      s((c = c.apply(e, a || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressTextures = undefined;
const fs_extra_1 = require("fs-extra");

const compressTextures = (n) =>
  __awaiter(undefined, undefined, undefined, function* () {
    console.debug("Execute compress task " + n);
    for (let e = 0; e < n.length; e++) {
      var t = n[e];

      if (t.format === "jpg") {
        t.dest = t.dest.replace(".png", ".jpg");
        yield pngToJPG(t.src, t.dest, t.quality);
        n.splice(e, 1);
        e--;
      }
    }
  });

async function pngToJPG(n, o, r) {
  var e = await getImage(n);
  var t = document.createElement("canvas");

  var e =
    (t.getContext("2d").drawImage(e, 0, 0), t.toDataURL("image/jpeg", r / 100));

  await fs_extra_1.outputFile(o, e);
  console.debug("pngToJPG", o);
}
function getImage(o) {
  return new Promise((e, t) => {
    const n = new Image();

    n.onload = () => {
      e(n);
    };

    n.onerror = (e) => {
      t(e);
    };

    n.src = o.replace("#", "%23");
  });
}
exports.compressTextures = compressTextures;
