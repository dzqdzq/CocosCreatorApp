async function migrateProject(e) {
  var i;
  var s;
  var e = e.modules;

  if (e && e.cache && e.includeModules && !e.configs) {
    (await Editor.Profile.getConfig("engine", "physics-2d-box2d")) &&
      ((e.cache["physics-2d"]._option = "physics-2d-box2d-wasm"),
      -1 !==
        (i = e.includeModules.findIndex((e) => e === "physics-2d-box2d"))) &&
      e.includeModules.splice(i, 1, "physics-2d-box2d-wasm");

    i = {
      name:
        Editor.I18n.getLanguage() === "zh"
          ? "迁移生成的配置"
          : "Migrated Configuration",
      cache: e.cache,
      flags: e.flags ?? {},
      includeModules: e.includeModules,
      noDeprecatedFeatures: e.noDeprecatedFeatures,
    };

    e.includeModules.includes("2d")
      ? (Object.assign(i.cache, {
          "rich-text": { _value: true },
          mask: { _value: true },
          graphics: { _value: true },
          "affine-transform": { _value: true },
        }),
        i.includeModules.push(
          "rich-text",
          "mask",
          "graphics",
          "affine-transform"
        ))
      : i.cache?.graphics?._value && (i.cache.graphics._value = false);

    i.includeModules.includes("spine") &&
      ((i.cache.spine = { _value: true, _option: "spine-3.8" }),
      (s = i.includeModules.indexOf("spine")),
      i.includeModules.splice(s, 1, "spine-3.8"));

    i.includeModules.includes("custom-pipeline")
      ? ((e.graphics = { pipeline: "custom-pipeline" }),
        i.includeModules.splice(i.includeModules.indexOf("custom-pipeline"), 1),
        i.includeModules.includes("custom-pipeline-post-process")
          ? ((e.graphics["custom-pipeline-post-process"] = true),
            i.includeModules.splice(
              i.includeModules.indexOf("custom-pipeline-post-process"),
              1
            ))
          : (e.graphics["custom-pipeline-post-process"] = false))
      : i.includeModules.includes("legacy-pipeline") &&
        ((e.graphics = { pipeline: "legacy-pipeline" }),
        i.includeModules.splice(
          i.includeModules.indexOf("legacy-pipeline"),
          1
        ));

    e.configs = { migrationsConfig: i };
    e.globalConfigKey = "migrationsConfig";
    delete e.cache;
    delete e.flags;
    delete e.includeModules;
    delete e.noDeprecatedFeatures;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
