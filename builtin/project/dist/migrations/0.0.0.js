Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;

const { migrateDesignResolution } = require("./1.0.5");

const { migratePreserveSymlinks } = require("./1.0.6");

async function migrateProject(e) {
  try {
    await migrateDesignResolution(e);
  } catch (e) {
    console.error(e);
  }
  await migratePreserveSymlinks(e);
}
