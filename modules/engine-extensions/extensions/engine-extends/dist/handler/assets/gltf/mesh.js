var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfMeshHandler = undefined;
const reader_manager_1 = require("./reader-manager");

const { getDependUUIDList } = require("../../utils");

const cc_1 = require("cc");
const fs_extra_1 = __importDefault(require("fs-extra"));

const { unwrapLightmapUV } = require("../utils/uv-unwrap");

const { ensureDir } = require("fs-extra");

const {
  getDefaultSimplifyOptions,
  simplifyMesh,
  optimizeMesh,
  clusterizeMesh,
  compressMesh,
} = require("./meshOptimizer");

exports.GltfMeshHandler = {
  name: "gltf-mesh",
  assetType: "cc.Mesh",
  iconInfo: {
    default: { type: "icon", value: "gltf-mesh" },
    async generateThumbnail(t) {
      var r = { type: "icon", value: "gltf-mesh" };
      try {
        let e = await Editor.Message.request(
          "scene",
          "query-thumbnail",
          [t.uuid],
          [Manager.assetManager.queryAssetProperty(t, "type")]
        );

        if (Array.isArray(e)) {
          e = e[0];
        }

        r.value = e;
        r.type = "image";
      } catch (e) {
        console.warn(`Query asset ${t.url} thumbnail failed!`);
      }
      return r;
    },
  },
  instantiation: ".mesh",
  importer: {
    version: "1.1.1",
    async import(e) {
      if (!e.parent) {
        return false;
      }
      var uuid = await reader_manager_1.glTfReaderManager.getOrCreate(e.parent);
      var temp = e.parent.userData.generateLightmapUVNode;
      var r = e.parent.userData;
      var e_userData = e.userData;
      let n = uuid.createMesh(
        e.userData.gltfIndex,
        temp,
        r.addVertexColor ?? false
      );

      if (e_userData.lodOptions) {
        uuid = getDefaultSimplifyOptions();
        uuid.targetRatio = e_userData.lodOptions.faceCount;
        n = await simplifyMesh(n, uuid);
      }

      let a = 0;

      e_userData.triangleCount = 0;

      n.struct.primitives?.forEach((e) => {
        if (e && e.indexView) {
          a += e.indexView.count / 3;
        }
      });

      e_userData.triangleCount = a;
      n.allowDataAccess = e.parent.userData.allowMeshDataAccess ?? true;

      if (temp) {
        var u = [];
        var l = [];
        let r = 0;
        for (let e = 0; e < n.struct.primitives.length; e++) {
          var m = n.readAttribute(e, cc_1.gfx.AttributeName.ATTR_POSITION);
          let uuid;
          uuid =
            n.struct.vertexBundles[e].view.stride === 2 ||
            n.struct.vertexBundles[e].view.stride === 4
              ? n.readIndices(e)
              : (console.warn("Invalid indeces stride"), []);
          for (let e = 0; e < m.length; ++e) {
            u.push(m[e]);
          }
          for (let e = 0; e < uuid.length; ++e) {
            l.push(uuid[e] + r);
          }
          n.readAttribute(e, cc_1.gfx.AttributeName.ATTR_TEX_COORD1);
          r += n.struct.vertexBundles[e].view.count;
        }
        var uuid = u.length / 3;
        var e_userData = new Uint8Array(8 + 4 * u.length + 4 * l.length);
        var temp = new Int32Array(e_userData.buffer, 0);
        temp[0] = uuid;
        temp[1] = l.length;
        var o = new Float32Array(e_userData.buffer, 8);
        var f = new Int32Array(e_userData.buffer, 8 + 4 * u.length);
        for (let e = 0; e < u.length; e++) {
          o[e] = u[e];
        }
        for (let e = 0; e < l.length; e++) {
          f[e] = l[e];
        }

        var { uuid, temp } = e;

        var e_userData =
          (await ensureDir(temp),
          await fs_extra_1.default.promises.writeFile(
            temp + `/${uuid}_in.bin`,
            e_userData
          ),
          await unwrapLightmapUV(
            temp + `/${uuid}_in.bin`,
            temp + `/${uuid}_out.bin`
          ),
          await fs_extra_1.default.promises.readFile(
            temp + `/${uuid}_out.bin`
          ));

        var temp = new Uint8Array(e_userData);
        var p = new Float32Array(temp.buffer, 4);
        let a = 0;
        for (let r = 0; r < n.struct.primitives.length; r++) {
          var h = n.readAttribute(r, cc_1.gfx.AttributeName.ATTR_TEX_COORD1);
          var d = n.struct.vertexBundles[r].attributes;
          let uuid = 0;
          if (h.length > 0) {
            for (
              let e = 0;
              e < d.length &&
              d[e].name !== cc_1.gfx.AttributeName.ATTR_TEX_COORD1;
              e++
            ) {
              var _ = n.readAttributeFormat(r, d[e].name);

              if (_) {
                uuid += _.size;
              }
            }
            if (uuid > 0) {
              for (let e = 0; e < n.struct.vertexBundles[r].view.count; e++) {
                var c =
                  n.struct.vertexBundles[r].view.offset +
                  uuid +
                  e * n.struct.vertexBundles[r].view.stride;

                var g = new DataView(n.data.buffer);
                g.setFloat32(c, p[a], true);
                g.setFloat32(c + 4, p[a + 1], true);
                a += 2;
              }
            }
          }
        }
      }

      if (r.meshSimplify && r.meshSimplify.enable) {
        n = await simplifyMesh(n, r.meshSimplify);
      }

      if (r.meshOptimize && r.meshOptimize.enable) {
        n = await optimizeMesh(n, r.meshOptimize);
      }

      if (r.meshCluster && r.meshCluster.enable) {
        n = await clusterizeMesh(n, r.meshCluster);
      }

      if (
        (n =
          r.meshCompress && r.meshCompress.enable
            ? await compressMesh(n, r.meshCompress)
            : n).data.byteLength !== 0
      ) {
        n._setRawAsset(".bin");
        await e.saveToLibrary(".bin", Buffer.from(n.data));
      }

      uuid = EditorExtends.serialize(n);
      await e.saveToLibrary(".json", uuid);
      e_userData = getDependUUIDList(uuid);
      e.setData("depends", e_userData);
      return true;
    },
  },
};

exports.default = exports.GltfMeshHandler;
