Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const remote_1 = require("@electron/remote");

const { spawn } = require("child_process");

const { dirname, extname, basename, join } = require("path");

const {
  ensureDirSync,
  existsSync,
  remove,
  readFileSync,
  readJSONSync,
  outputJSONSync,
  removeSync,
} = require("fs-extra");

const cc_1 = require("cc");

const { queryVirtualElement, emitVirtualEvent } = require("../extension/scene");

function load() {}
function unload() {}
function broadcastSceneChange() {
  var e = cc.director.getScene();
  Editor.Message.broadcast("scene:change-node", e.uuid);
  cce.SceneFacadeManager.recordNode(e);
  cce.SceneFacadeManager.snapshot();
  cce.Engine.repaintInEditMode();
}
async function findGenerationPath(e, t, a) {
  let r = await Editor.Message.request("asset-db", "query-url", t);
  return (e = r && r.includes("db://internal")
    ? ((r = (r = (r = dirname(r)).replace(
        "db://internal/",
        Editor.Project.path + "/assets/internal/"
      )).replace(/\\/g, "/")),
      a && ensureDirSync(r),
      r)
    : dirname(e));
}
exports.methods = {
  queryComponentRender(e) {
    e = e[0];
    e = cce.Component.query(e);
    return queryVirtualElement(e);
  },
  emitComponentRenderEvent(e, t, a, r) {
    e = e[0];
    e = cce.Component.query(e);
    emitVirtualEvent(e, t, a, r);
  },
  queryNodeWorldTransform(e) {
    e = cce.Node.query(e);
    return e
      ? {
          worldPosition: [
            e.worldPosition.x,
            e.worldPosition.y,
            e.worldPosition.z,
          ],
          worldRotation: [
            e.worldRotation.x,
            e.worldRotation.y,
            e.worldRotation.z,
            e.worldRotation.w,
          ],
          worldScale: [e.worldScale.x, e.worldScale.y, e.worldScale.z],
        }
      : null;
  },
  setNodeWorldTransform(e, t) {
    e = cce.Node.query(e);

    if (e) {
      e.setWorldPosition(...t.worldPosition);
      e.setWorldRotation(...t.worldRotation);
      e.setWorldScale(...t.worldScale);
    }
  },
  async generateVector(t) {
    var r = await Editor.Message.request(
      "asset-db",
      "query-path",
      t.replace(/@[^@]+$/, "")
    );
    if (r) {
      var t = await Editor.Message.request("asset-db", "query-asset-meta", t);
      var s = t.userData.isRGBE ? "rgbm" : "bgra8";
      var o = extname(r);
      var n = basename(r, o);

      var n = join(Editor.Project.tmpDir, "inspector", n + "_diffusion");

      var c = n + ".txt";
      if (existsSync(c)) {
        try {
          await remote_1.shell.trashItem(c);
        } catch (e) {}
      }
      if (existsSync(c)) {
        try {
          await remove(c);
        } catch (e) {
          console.error(e);
        }
      }
      try {
        let a;
        var i = [
          "--hemispherelightingcoef",
          "--filter",
          "irradiance",
          "--dstFaceSize",
          "32",
          "--output0params",
          "png," + s + ",latlong",
          "--input",
          r,
          "--output0",
          n,
        ];

        if (t.userData.isRGBE && o !== ".hdr") {
          i.splice(0, 0, "--rgbm");
        }

        ensureDirSync(dirname(n));

        a =
          process.platform === "darwin"
            ? spawn(join(Editor.App.path, "../tools/cmft/cmftRelease64"), i)
            : spawn(
                join(Editor.App.path, "../tools/cmft/cmftRelease64.exe"),
                i
              );

        await new Promise((e, t) => {
          a.on("close", () => {
            e(undefined);
          });
        });

        let e = ["", ""];
        if (existsSync(c)) {
          e = readFileSync(c, "utf8")
            .split(/\n/)
            .map((e) => e.trim());
        } else if (t.importer === "texture-cube") {
          return void console.warn(
            Editor.I18n.t("inspector.scene.recommendErpTextureCube")
          );
        }

        if (!e[0]) {
          e[0] = "";
        }

        if (!e[1]) {
          e[1] = "";
        }

        var l = e[0].split(",").map((e) => parseFloat(e.trim()));

        var d = e[1].split(",").map((e) => parseFloat(e.trim()));

        cc.director.getScene().globals.ambient.skyColor = new cc_1.Vec4(
          l[0],
          l[1],
          l[2],
          0
        );

        cc.director.getScene().globals.ambient.groundAlbedo = new cc_1.Vec4(
          d[0],
          d[1],
          d[2],
          0
        );

        broadcastSceneChange();
      } catch (e) {
        console.error(e);
      }
    }
  },
  async generateDiffuseMap(e) {
    var t = await Editor.Message.request(
      "asset-db",
      "query-path",
      e.replace(/@[^@]+$/, "")
    );
    if (!t) {
      return null;
    }
    const r = await Editor.Message.request("asset-db", "query-asset-meta", e);
    var s = r.userData.isRGBE ? "rgbm" : "bgra8";
    var o = extname(t);
    var n = basename(t, o);
    var e = await findGenerationPath(t, e, true);
    var e = join(e, n + "_diffusion");
    var n = e + ".png";
    if (existsSync(n)) {
      try {
        await remote_1.shell.trashItem(n);
      } catch (e) {}
    }
    if (existsSync(n)) {
      try {
        await remove(n);
      } catch (e) {
        console.error(e);
      }
    }
    try {
      let a;
      var c;

      var i = [
        "--filter",
        "irradiance",
        "--dstFaceSize",
        "32",
        "--output0params",
        "png," + s + ",latlong",
        "--input",
        t,
        "--output0",
        e,
      ];

      if (r.userData.isRGBE && o !== ".hdr") {
        i.splice(0, 0, "--rgbm");
      }

      a =
        process.platform === "darwin"
          ? spawn(join(Editor.App.path, "../tools/cmft/cmftRelease64"), i)
          : spawn(join(Editor.App.path, "../tools/cmft/cmftRelease64.exe"), i);

      await new Promise((e, t) => {
        a.on("close", () => {
          e(undefined);
        });
      });

      var l = n + ".meta";

      if (existsSync(l)) {
        const r = readJSONSync(l);
        r.userData.type = "texture cube";
        outputJSONSync(l, r, { spaces: 2 });
      } else {
        outputJSONSync(
          l,
          {
            ver: "0.0.0",
            importer: "*",
            userData: { type: "texture cube", isRGBE: r.userData.isRGBE },
          },
          { spaces: 2 }
        );
      }
      await Editor.Message.request("asset-db", "refresh-asset", n);

      if (n) {
        const d = await Editor.Message.request("asset-db", "query-uuid", n);

        if (
          d &&
          (c = await new Promise((a) => {
            cc.assetManager.loadAny(d + "@b47c0", (e, t) => {
              if (e) {
                console.error("asset can't be load:" + d);
                a(null);
              } else {
                a(t);
              }
            });
          }))
        ) {
          cc.director.getScene().globals.skybox.diffuseMap = c;
          broadcastSceneChange();
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
  async bakeReflectionConvolution(e) {
    var t = await Editor.Message.request(
      "asset-db",
      "query-path",
      e.replace(/@[^@]+$/, "")
    );
    if (!t) {
      return null;
    }
    const r = await Editor.Message.request("asset-db", "query-asset-meta", e);
    var s = r.userData.isRGBE ? "rgbm" : "bgra8";
    var o = extname(t);
    var n = basename(t, o);
    var e = await findGenerationPath(t, e, true);
    var c = join(e, n + "_reflection");
    var i = c + ".png";
    if (existsSync(i)) {
      try {
        await remote_1.shell.trashItem(i);
      } catch (e) {}
    }
    if (existsSync(i)) {
      try {
        await remove(i);
      } catch (e) {
        console.error(e);
      }
    }
    try {
      let a;

      var l = [
        "--srcFaceSize",
        "1536",
        "--bypassoutputtype",
        "--output0params",
        "png," + s + ",latlong",
        "--input",
        t,
        "--output0",
        c,
      ];

      if (r.userData.isRGBE && o !== ".hdr") {
        l.splice(0, 0, "--rgbm");
      }

      a =
        process.platform === "darwin"
          ? spawn(join(Editor.App.path, "../tools/cmft/cmftRelease64"), l)
          : spawn(join(Editor.App.path, "../tools/cmft/cmftRelease64.exe"), l);

      await new Promise((e, t) => {
        a.on("close", () => {
          e(undefined);
        });
      });

      var d = join(dirname(e), n + "_reflection_convolution");

      for (let e = 0; e < 6; e++) {
        var p = join(d, "mipmap_" + e.toString() + ".png");

        if (existsSync(p)) {
          removeSync(p);
        }
      }
      var u;
      var _ = i + ".meta";
      if (existsSync(_)) {
        const r = readJSONSync(_);
        r.userData.type = "texture cube";
        outputJSONSync(_, r, { spaces: 2 });
      } else {
        outputJSONSync(
          _,
          {
            ver: "0.0.0",
            importer: "*",
            userData: { type: "texture cube", isRGBE: r.userData.isRGBE },
          },
          { spaces: 2 }
        );
      }
      await Editor.Message.request("asset-db", "refresh-asset", i);

      if (existsSync(_)) {
        const r = readJSONSync(_);

        if (r.subMetas?.b47c0) {
          r.subMetas.b47c0.userData.mipBakeMode = 2;
          outputJSONSync(_, r, { spaces: 2 });
          await Editor.Message.request("asset-db", "refresh-asset", i);
        }
      }

      if (i) {
        const f = await Editor.Message.request("asset-db", "query-uuid", i);

        if (
          f &&
          (u = await new Promise((a) => {
            cc.assetManager.loadAny(f + "@b47c0", (e, t) => {
              if (e) {
                console.error("asset can't be load:" + f);
                a(null);
              } else {
                a(t);
              }
            });
          }))
        ) {
          cc.director.getScene().globals.skybox.reflectionMap = u;
          broadcastSceneChange();
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
  async setReflectionConvolutionMap(e) {
    var t = await Editor.Message.request(
      "asset-db",
      "query-path",
      e.replace(/@[^@]+$/, "")
    );
    if (!t) {
      return null;
    }
    var a = extname(t);
    var a = basename(t, a);
    var t = await findGenerationPath(t, e, false);
    var e = join(t, a + "_reflection") + ".png";
    if (existsSync(e)) {
      const r = await Editor.Message.request("asset-db", "query-uuid", e);

      if (
        r &&
        (t = await new Promise((a) => {
          cc.assetManager.loadAny(r + "@b47c0", (e, t) => {
            if (e) {
              console.error("asset can't be load:" + r);
              a(null);
            } else {
              a(t);
            }
          });
        }))
      ) {
        cc.director.getScene().globals.skybox.reflectionMap = t;
        broadcastSceneChange();
      }
    } else {
      if (cc.director.getScene().globals.skybox.reflectionMap) {
        cc.director.getScene().globals.skybox.reflectionMap = null;
        broadcastSceneChange();
      }
    }
  },
  async setSkyboxEnvMap(r) {
    var e;

    if (r) {
      if (
        (e = await new Promise((a) => {
          cc.assetManager.loadAny(r, (e, t) => {
            if (e) {
              console.error("asset can't be load:" + r);
              a(null);
            } else {
              a(t);
            }
          });
        }))
      ) {
        cc.director.getScene().globals.skybox.updateEnvMap(e);
      }
    } else {
      cc.director.getScene().globals.skybox.updateEnvMap(null);
      broadcastSceneChange();
    }
  },
};
