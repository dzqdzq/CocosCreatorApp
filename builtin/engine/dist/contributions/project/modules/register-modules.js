Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleConfigCache = undefined;
exports.initEngineModules = initEngineModules;

const { existsSync, readJSONSync } = require("fs-extra");

const { join } = require("path");

const default_config_1 = require("./default-config");
const ignoreModules = ["custom-pipeline-post-process"];
function extractMacros(e) {
  return e.split("||").map((e) => e.trim().substring(1));
}
function initRenderConfig2ModuleConfigCache(e) {
  function t(o, e) {
    if ((exports.moduleConfigCache.features[o] = e).cmakeConfig) {
      exports.moduleConfigCache.moduleCmakeConfig[o] = {
        native: e.cmakeConfig,
      };
    }

    if (e.isNativeModule) {
      exports.moduleConfigCache.nativeCodeModules.push(o);
    }

    if (e.envCondition) {
      exports.moduleConfigCache.envLimitModule[o] = {
        envList: extractMacros(e.envCondition),
        fallback: e.fallback,
      };
    }

    if (e.dependencies) {
      exports.moduleConfigCache.moduleDependMap[o] = e.dependencies;

      e.dependencies.forEach((e) => {
        exports.moduleConfigCache.moduleDependedMap[e] =
          exports.moduleConfigCache.moduleDependedMap[e] || [];
        exports.moduleConfigCache.moduleDependedMap[e].push(o);
      });
    }
  }
  const e_categories = e.categories;

  Object.entries(e.features).forEach(([e, o]) => {
    var i;
    var n;
    i = e;
    n = o;

    if ("options" in (exports.moduleConfigCache.features[i] = n)) {
      Object.entries(n.options).forEach(([e, o]) => {
        t(e, o);
      });
    } else {
      t(i, n);
    }

    if (!ignoreModules.includes(e)) {
      if (o.category && e_categories[o.category]) {
        e_categories[o.category].modules ??= {};
        e_categories[o.category].modules[e] = o;
      } else {
        exports.moduleConfigCache.moduleTreeDump.default[e] = o;
      }
    }

    exports.moduleConfigCache.features[e] = o;
  });

  exports.moduleConfigCache.moduleTreeDump.categories = e_categories;
}
async function initEngineModules(e) {
  e = join(e, "editor", "engine-features", "render-config.json");
  if (existsSync(e)) {
    e = readJSONSync(e);
    if (e && e.features) {
      initRenderConfig2ModuleConfigCache(e);
      var o = await generateConfigFromEngine(e);
      await initGraphicsConfig(o);
      for (const n of default_config_1.defaultConfigs) {
        await generateDefaultConfig(o, n);
      }
      var i = await Editor.Profile.getProject(
        "engine",
        "modules.configs",
        "project"
      );

      if (i) {
        await mergeAndCreateDefaultForLocal(e, i, o);
      }

      await Editor.Profile.setProject(
        "engine",
        "modules.globalConfigKey",
        default_config_1.defaultConfigKey,
        "default"
      );
    } else {
      console.error("render-config.json is not exist in engine!");
    }
  } else {
    console.error("render-config.json is not exist in engine!");
  }
}
async function generateConfigFromEngine(e) {
  const n = {};
  const o = [];
  const t = {};
  function a(i, e) {
    n[i] = { _value: !!e.default };

    if (e.default && (o.push(i), e.flags)) {
      Object.entries(e.flags).forEach(([e, o]) => {
        if (o.default !== undefined) {
          t[e] = o.default;
        }
      });
    }

    if (e.flags) {
      Object.entries(e.flags).forEach(([e, o]) => {
        n[i]._flags ??= {};
        n[i]._flags[e] = Boolean(o.default);
      });
    }
  }

  Object.entries(e.features).forEach(([e, o]) => {
    var i;
    i = e;
    e = o;

    if ("options" in (exports.moduleConfigCache.features[i] = e)) {
      n[i] = { _value: !!e.default };

      Object.entries(e.options).forEach(([e, o]) => {
        a(e, o);

        if (o.default) {
          n[i]._option = e;
          n[i]._value = true;
        }
      });
    } else {
      a(i, e);
    }
  });

  return {
    cache: n,
    flags: t,
    includeModules: Array.from(new Set(o)).sort(),
    noDeprecatedFeatures: { value: false, version: "" },
  };
}
async function generateDefaultConfig(e, o) {
  var { cache: e, flags, includeModules, noDeprecatedFeatures } = e;

  var e =
    (o.diyConfig(e, flags, includeModules),
    {
      name: o.name,
      cache: e,
      flags: flags,
      includeModules: Array.from(new Set(includeModules)).sort(),
      noDeprecatedFeatures: noDeprecatedFeatures,
    });

  await Editor.Profile.setProject(
    "engine",
    "modules.configs." + o.key,
    e,
    "default"
  );
}
async function mergeAndCreateDefaultForLocal(e, o, i) {
  for (const [n, t] of Object.entries(o)) {
    if (default_config_1.defaultConfigs.every((e) => e.key !== n)) {
      await Editor.Profile.setProject(
        "engine",
        `modules.configs.${n}.cache`,
        i.cache,
        "default"
      );

      await Editor.Profile.setProject(
        "engine",
        `modules.configs.${n}.flags`,
        i.flags,
        "default"
      );
    }

    const a = await Editor.Profile.getProject(
      "engine",
      `modules.configs.${n}.cache`
    );

    const s = [];

    Object.entries(e.features).forEach(([e, o]) => {
      var i = a[e];

      if (i) {
        if (i._option) {
          if (i._value) {
            s.push(i._option);
          }
        } else if (i._value) {
          s.push(e);
        }
      } else if (o.default) {
        if (o.default && o.required) {
          s.push(e);
        } else if (o.default && !o.required) {
          a[e] = { _value: false };
        }
      }
    });

    await Editor.Profile.setProject(
      "engine",
      `modules.configs.${n}.includeModules`,
      s.sort(),
      "project"
    );

    await Editor.Profile.setProject(
      "engine",
      `modules.configs.${n}.cache`,
      a,
      "project"
    );
  }
}
async function initGraphicsConfig(e) {
  if (e.includeModules.includes("custom-pipeline")) {
    await Editor.Profile.setProject(
      "engine",
      "modules.graphics.pipeline",
      "custom-pipeline",
      "default"
    );
  }

  if (e.includeModules.includes("legacy-pipeline")) {
    await Editor.Profile.setProject(
      "engine",
      "modules.graphics.pipeline",
      "legacy-pipeline",
      "default"
    );
  }

  if (
    !e.includeModules.includes("custom-pipeline") &&
    !e.includeModules.includes("legacy-pipeline")
  ) {
    await Editor.Profile.setProject(
      "engine",
      "modules.graphics.pipeline",
      "custom-pipeline",
      "default"
    );
  }

  await Editor.Profile.setProject(
    "engine",
    "modules.graphics.custom-pipeline-post-process",
    e.includeModules.includes("custom-pipeline-post-process"),
    "default"
  );
}
exports.moduleConfigCache = {
  moduleDependMap: {},
  moduleDependedMap: {},
  nativeCodeModules: [],
  moduleCmakeConfig: {},
  features: {},
  moduleTreeDump: { default: {}, categories: {} },
  ignoreModules,
  envLimitModule: {},
};
