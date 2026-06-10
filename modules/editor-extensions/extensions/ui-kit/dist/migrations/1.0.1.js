Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
const lodash = require("lodash");
function migrateProject(e) {
  e = lodash.get(e, "curve-editor.customPresets");

  if (Array.isArray(e) && e.length) {
    e.forEach((e) => {
      e.outTangentWeight = 1;
      e.inTangentWeight = 1;
      e.tangentWeightMode = 0;
      e.interpMode = 2;
    });
  }
}
