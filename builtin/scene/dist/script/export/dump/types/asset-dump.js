Object.defineProperty(exports, "__esModule", { value: true });
exports.assetDump = undefined;
class AssetDump {
  encode(e, s, u) {
    e = (e && e._uuid) || "";
    s.value = { uuid: e.startsWith("pm_") ? "" : e };
  }
  async decode(a, e, t, s) {
    if (Array.isArray(t.value)) {
      var u;
      var l = [];
      for (let e = 0; e < t.value.length; e++) {
        const a = t.value[e];

        if (a && a.value.uuid && !a.value.uuid.startsWith("ui-")) {
          if (
            (u = await new Promise((u) => {
              cc.assetManager.loadAny(a.value.uuid, (e, s) => {
                if (e) {
                  console.error("asset can't be load:" + a.value.uuid);
                  u(null);
                } else {
                  u(s);
                }
              });
            }))
          ) {
            l[e] = u;
          } else {
            (u = EditorExtends.serialize.asAsset(
              t.value.uuid,
              cc.js.getClassById(t.type)
            )).initDefault();

            l[e] = u;
          }
        } else {
          l[e] = null;
        }
      }
      a[e.key] = l;
    } else {
      var i;

      if (t.value && t.value.uuid && !t.value.uuid.startsWith("ui-")) {
        if (
          (i = await new Promise((u) => {
            cc.assetManager.loadAny(t.value.uuid, (e, s) => {
              if (e) {
                console.error("asset can't be load:" + t.value.uuid);
                u(null);
              } else {
                u(s);
              }
            });
          }))
        ) {
          a[e.key] = i;
        } else {
          (i = EditorExtends.serialize.asAsset(
            t.value.uuid,
            cc.js.getClassById(t.type)
          )).initDefault();

          a[e.key] = i;
        }
      } else {
        a[e.key] = null;
      }
    }
  }
}
exports.assetDump = new AssetDump();
