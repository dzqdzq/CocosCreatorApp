Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

function migrateProject(e) {
  if (
    e["splash-setting"] &&
    e["splash-setting"].base64src &&
    ((e = e["splash-setting"]),
    "data:image/png;base64," +
      readFileSync(join(__dirname, "../../../../static//logo.png")).toString(
        "base64"
      ) ===
      e.base64src)
  ) {
    delete e.base64src;
  }
}
