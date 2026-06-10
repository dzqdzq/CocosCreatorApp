var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgrammingFacet = createProgrammingFacet;
exports.waitForProgrammingFacet = waitForProgrammingFacet;
exports.getPreviewFacet = getPreviewFacet;
const Facet_1 = require("./Facet");
const path_1 = __importDefault(require("path"));
let programmingFacet;
let createProgrammingFacetPromise = null;
async function createProgrammingFacet() {
  var e = await Editor.Message.request("engine", "query-engine-info");

  var t =
    (await Editor.Message.request("engine", "query-engine-modules-profile"))
      ?.includeModules || [];

  programmingFacet = await Facet_1.ProgrammingFacet.create({
    engine: {
      root: e.typescript.path,
      distRoot: path_1.default.join(
        e.typescript.path,
        "bin",
        ".cache",
        "dev",
        "preview"
      ),
      baseUrl: "/scripting/engine",
      features: t,
    },
  });
}
async function waitForProgrammingFacet() {
  await (createProgrammingFacetPromise =
    createProgrammingFacetPromise || createProgrammingFacet());

  return programmingFacet;
}
function getPreviewFacet() {
  return programmingFacet;
}
