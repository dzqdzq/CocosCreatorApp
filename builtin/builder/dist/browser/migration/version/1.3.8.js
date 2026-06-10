var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
const lodash_1 = __importDefault(require("lodash"));
async function migrateLocal(e) {
  const s = await Editor.Profile.getConfig("engine", "builder");
  if (s && s.options) {
    var s_options = s.options;
    for (const i in s_options) {
      if (s_options[i].cleanupImageCache) {
        Editor.Profile.setConfig(
          i,
          "builder.common.overwriteProjectSettings.macroConfig",
          { cleanupImageCache: s_options[i].cleanupImageCache }
        );
      }
    }
  }
  Editor.Profile.removeConfig("engine", "builder");

  if (e.BuildTaskManager && e.BuildTaskManager.taskMap) {
    const n =
      (await Editor.Profile.getConfig("engine", "modules.includeModules")) ||
      [];

    const r = await Editor.Profile.getConfig(
      "wechatgame",
      "builder.taskOptionsMap"
    );

    const l = await Editor.Profile.getConfig(
      "bytedance-mini-game",
      "builder.taskOptionsMap"
    );

    const d = await Editor.Profile.getConfig(
      "web-mobile",
      "builder.taskOptionsMap"
    );

    const c = await Editor.Profile.getConfig(
      "web-desktop",
      "builder.taskOptionsMap"
    );

    Object.values(e.BuildTaskManager.taskMap).forEach((e) => {
      var t;
      var i;
      var o;
      var e_id = e.id;

      if (
        s &&
        s.taskOptionsMap &&
        ((e.options.overwriteProjectSettings = {
          includeModules: {
            physics: "inherit-project-setting",
            "physics-2d": "inherit-project-setting",
          },
        }),
        s.taskOptionsMap[e_id]) &&
        s.taskOptionsMap[e_id].cleanupImageCache
      ) {
        t = s.taskOptionsMap[e_id].cleanupImageCache;

        e.options.overwriteProjectSettings.macroConfig = {
          cleanupImageCache:
            t === "inheritProjectSetting" ? "inherit-project-setting" : t,
        };

        delete s.taskOptionsMap[e_id].cleanupImageCache;
      }

      switch (e.options.platform) {
        case "wechatgame": {
          if (r) {
            (i = r[e_id]).wasm &&
              (lodash_1.default.set(
                e.options,
                "overwriteProjectSettings.includeModules.physics",
                "physics-ammo"
              ),
              (e.options.nativeCodeBundleMode = "wasm"),
              delete i.wasm);

            lodash_1.default.set(
              e.options,
              "overwriteProjectSettings.includeModules.gfx-webgl2",
              i.enabelWebGL2 === "sameAsProjectSetting"
                ? "inherit-project-setting"
                : "off"
            );

            delete i.enabelWebGL2;
          }

          break;
        }
        case "bytedance-mini-game": {
          if (l && (i = l[e_id]).physX) {
            lodash_1.default.set(
              e.options,
              "overwriteProjectSettings.includeModules.physics",
              "physics-physx"
            );

            o = n.includes("physics-physx");
            i.physX.use = i.physX.use === "physX" || o;
          }

          break;
        }
        case "web-desktop": {
          if (c && (i = c[e_id]).cullEngineAsmJsModule) {
            e.options.nativeCodeBundleMode = "wasm";
            delete i.cullEngineAsmJsModule;
          }

          lodash_1.default.set(
            e.options,
            "overwriteProjectSettings.includeModules.gfx-webgl2",
            "inherit-project-setting"
          );

          break;
        }
        case "web-mobile": {
          if (d && (o = d[e_id]).cullEngineAsmJsModule) {
            e.options.nativeCodeBundleMode = "wasm";
            delete o.cullEngineAsmJsModule;
          }

          lodash_1.default.set(
            e.options,
            "overwriteProjectSettings.includeModules.gfx-webgl2",
            "inherit-project-setting"
          );
        }
      }
    });

    await Editor.Profile.setConfig("wechatgame", "builder.taskOptionsMap", r);

    await Editor.Profile.setConfig(
      "bytedance-mini-game",
      "builder.taskOptionsMap",
      l
    );

    await Editor.Profile.setConfig("web-mobile", "builder.taskOptionsMap", d);

    await Editor.Profile.setConfig("web-desktop", "builder.taskOptionsMap", c);
  }
}
