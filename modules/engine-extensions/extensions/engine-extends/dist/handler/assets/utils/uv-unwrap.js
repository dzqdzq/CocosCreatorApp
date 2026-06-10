var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapLightmapUV = unwrapLightmapUV;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
function unwrapLightmapUV(t, e) {
  var r = os_1.default.type() === "Windows_NT" ? ".exe" : "";

  var r = path_1.default.join(
    Editor.App.path,
    "../tools/LightFX",
    "uvunwrap" + r
  );

  return Editor.Utils.Process.quickSpawn(r, ["--input", t, "--output", e], {
    shell: true,
  });
}
