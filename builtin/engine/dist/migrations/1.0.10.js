async function migrateProject(c) {
  var { modules: c, macroConfig } = c;
  if (c) {
    let e = false;

    if (
      -1 !== c.includeModules.findIndex((e) => e === "custom-pipeline") &&
      macroConfig &&
      macroConfig.CUSTOM_PIPELINE_NAME
    ) {
      e = true;
      c.includeModules.push("custom-pipeline");
      c.includeModules.push("custom-pipeline-post-process");
      c.cache["custom-pipeline-post-process"] = { _value: true };
    } else {
      c.includeModules.push("legacy-pipeline");
    }

    if (c.cache.graphcis) {
      delete c.cache.graphcis;
    }

    delete c.cache["custom-pipeline"];

    c.cache["render-pipeline"] = {
      _option: e ? "custom-pipeline" : "legacy-pipeline",
    };

    c.includeModules = Array.from(new Set(c.includeModules));
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
