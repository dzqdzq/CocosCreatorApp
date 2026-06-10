Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;

const { migrateGenMipmaps } = require("./1.3.4");

async function migrateProject(e) {
  migrateGenMipmaps(e);
}
