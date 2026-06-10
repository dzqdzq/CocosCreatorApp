var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = undefined;
exports.file = undefined;
exports.connection = connection;
exports.disconnect = disconnect;
exports.reload = reload;
exports.close = close;
exports.queryConnectNum = queryConnectNum;
const ejs_1 = __importDefault(require("ejs"));

const { join, basename, dirname } = require("path");

const { readFile, existsSync, pathExists } = require("fs-extra");

const { waitForProgrammingFacet } = require("../programming/FacetInstance");

const url_1 = require("url");
const plugin_1 = require("../browser/plugin");
const preview_settings_1 = require("../browser/preview-settings");

const { generateBundleIndex } = require("../browser/simulator");

const Mobiledetect = require("mobile-detect");

exports.file = [
  {
    url: "/",
    path: join(Editor.Project.path, "preview-template"),
  },
  { url: "/", path: join(__dirname, "../../static/resources") },
];

exports.get = [
  {
    url: "/engine_external/",
    async handle(e, r, t) {
      var a;
      var e = e.query.url;
      var s = "external:";

      if (typeof e == "string" && e.startsWith(s)) {
        a = (await Editor.Message.request("engine", "query-engine-info")).native
          .path;

        s = e.replace(s, join(a, "external/"));
        a = await readFile(s);
        r.send(a);
      } else {
        t(new Error("请求 external 资源失败，请使用 external 协议: " + e));
      }
    },
  },
  {
    url: "/settings.js",
    async handle(e, r, t) {
      try {
        var a =
          await preview_settings_1.previewSettingsManager.querySettingsData(
            "browser",
            { startScene: e.query.scene }
          );
        if (!a || !a.settings) {
          return t(new Error("构建 settings 出错"));
        }

        if (e.query.splashPreview !== "true") {
          a.settings.splashScreen.totalTime = 50;
        }

        r.status(200).send(
          "window._CCSettings = " + JSON.stringify(a.settings)
        );
      } catch (e) {
        console.error(e);
        t(new Error("Get settings failed"));
      }
    },
  },
  {
    url: "/game-view/settings.json",
    async handle(e, r, t) {
      try {
        var a =
          await preview_settings_1.previewSettingsManager.querySettingsData(
            "game-view",
            { startScene: e.query.scene }
          );
        if (!a || !a.settings) {
          return t(new Error("构建 settings 出错"));
        }

        if (a.settings.plugins.jsList) {
          a.settings.plugins.jsList = [];
        }

        r.status(200).send("" + JSON.stringify(a.settings));
      } catch (e) {
        console.error(e);
        return t(new Error("Get settings failed!"));
      }
    },
  },
  {
    url: "/src/effect.bin",
    async handle(e, r, t) {
      var a = join(Editor.Project.tmpDir, "asset-db/effect/effect.bin");
      r.sendFile(a);
    },
  },
  {
    url: "/scene/*.json",
    async handle(e, r, t) {
      var e = e.params[0];

      var a = new Error(
        Editor.I18n.t("preview.load_current_scene_error", { scene: e })
      );

      if (e === "current_scene") {
        var s = await Editor.Message.request("scene", "query-scene-json");
        if (!s) {
          return t(a);
        }
        r.end(s);
      } else if (e) {
        return (s = await Editor.Message.request(
          "asset-db",
          "query-asset-info",
          e
        )) &&
          s.library[".json"] &&
          (e = s.library[".json"])
          ? void r.sendFile(e)
          : t(a);
      }
    },
  },
  {
    url: /\/(?:remote|assets)\/[^\/]+\/(import|native)\/(.*)/,
    handle: handleLibraryFile,
  },
  {
    url: "/query-extname/*",
    async handle(e, r, t) {
      e = e.params[0];

      e = await Editor.Message.request("asset-db", "query-asset-info", e);

      if (e && e.library[".bin"] && Object.keys(e.library).length === 1) {
        r.status(200).send(".cconb");
      } else {
        r.status(200).send("");
      }
    },
  },
  {
    url: /(\/(game-view|simulator|browser))?\/(remote|assets)\/([^\/]+)\/(config|cc\.config)\.json$/,
    handle: handlerBundleConfig,
  },
  {
    url: /(\/(game-view|simulator|browser))?\/(remote|assets)\/([^\/]+)\/index\.js$/,
    handle: handlerBundleIndex,
  },
  {
    url: "/plugins/*",
    async handle(e, r, t) {
      var a =
        await preview_settings_1.previewSettingsManager.queryScript2library(
          "browser"
        );
      return a
        ? ((a = a[e.params[0]]), existsSync(a) ? void r.sendFile(a) : t())
        : t(new Error("构建 settings 出错"));
    },
  },
  {
    url: "/",
    async handle(e, r, t) {
      var a = await waitForProgrammingFacet();
      var s = e.header("user-agent");
      var n = new Mobiledetect(s);
      let i = e.query.scene;
      i =
        i || (await Editor.Profile.getConfig("preview", "general.start_scene"));
      var o = await handleDeviceMap();
      var l = await Editor.Profile.getConfig("preview", "preview");

      l.device = l.device || "Default";

      if (e.query.debug === "false") {
        l.showFps = false;
      }

      var c = e.query.splashPreview === "true";

      var e = {
        title: "Cocos Creator - " + basename(Editor.Project.path),
        tip_sceneIsEmpty: Editor.I18n.t("preview.scene_is_empty"),
        enableDebugger:
          e.query.debug !== "false" &&
          (!!n.mobile() || -1 !== s?.indexOf("MicroMessenger")),
        devices: o,
        config: l,
        cocosTemplate: join(__dirname, "../../static/views/script.ejs"),
        cocosToolBar: join(__dirname, "../../static/views/toolbar.ejs"),
        settingsJs:
          "/settings.js?scene=" + i + (c ? "&splashPreview=true" : ""),
        packImportMapURL: "/scripting/x/" + a.packImportMapURL,
        packResolutionDetailMapURL:
          "/scripting/x/" + a.packResolutionDetailMapURL,
      };

      await plugin_1.pluginManager.runHooks("browser", "renderData", e);

      var n = join(Editor.Project.path, "preview-template", "index.ejs");

      if (existsSync(n)) {
        try {
          console.log(`Use preview template {link(${n})}`);
          var u = await ejs_1.default.renderFile(n, e);
          return void r.end(u);
        } catch (e) {
          console.error(e);
        }
      }
      s = await ejs_1.default.renderFile(
        join(__dirname, "../../static/views/index.ejs"),
        e
      );
      r.status(200).send(s);
      Editor.Message.send("preview", "ready");
    },
  },
  {
    url: "/preview-app/*",
    async handle(e, r, t) {
      r.sendFile(
        join(__dirname, "..", "..", "preview-app", "dist", e.params[0])
      );
    },
  },
  {
    url: "/node_modules/*",
    async handle(e, r, t) {
      let a = join(__dirname, "../../../../node_modules", e.params[0]);

      if (!existsSync(a)) {
        a = a.replace("app.asar", "app.asar.unpacked");
      }

      if (!existsSync(a)) {
        t();
      }

      r.sendFile(a);
    },
  },
  {
    url: "/scripting/polyfills/*",
    async handle(e, r) {
      var t = join(
        dirname(require.resolve("@editor/build-polyfills/package.json")),
        "prebuilt",
        "preview"
      );

      var t = join(t, e.params[0]);
      r.sendFile(t);
    },
  },
  {
    url: "/scripting/systemjs/*",
    async handle(e, r) {
      var t = await waitForProgrammingFacet();
      r.sendFile(join(t.systemJsHomeDir, e.params[0]));
    },
  },
  {
    url: "/scripting/userland/macro",
    async handle(e, r, t) {
      await waitForProgrammingFacet();
      var a = join(Editor.Project.path, "./temp/programming/custom-macro.js");
      r.sendFile(a);
    },
  },
  {
    url: "/scripting/import-map-global",
    async handle(e, r, t) {
      var a = await (await waitForProgrammingFacet()).getGlobalImportMap();
      r.json(a);
    },
  },
  {
    url: "/scripting/x/*",
    async handle(e, r, t) {
      var a = await waitForProgrammingFacet();

      var s =
        Object.keys(e.query).length === 0
          ? ""
          : "?" + new url_1.URLSearchParams(e.query).toString();

      var e = e.params[0] + s;
      var n = await a.loadPackResource(e);
      switch (n.type) {
        case "json": {
          r.json(n.json);
          break;
        }
        case "chunk": {
          r.sendFile(n.chunk.path);
          break;
        }
        default: {
          t(new Error("Unknown pack resource type"));
        }
      }
    },
  },
  {
    url: "/scripting/engine/*",
    async handle(e, r, t) {
      var a = await waitForProgrammingFacet();
      let s = join(a.engineRoot, e.params[0]);

      if (!(await pathExists(s))) {
        s += ".js";
      }

      if (!(await pathExists(s))) {
        return t();
      }

      r.sendFile(s, { dotfiles: "allow" });
    },
  },
  {
    url: "/missing-asset/*",
    async handle(e, r, t) {
      e = e.params[0].match(/[^@]*/)[0];

      e = await Editor.Message.request(
        "asset-db",
        "query-missing-asset-info",
        e
      );

      r.json(e);
    },
  },
];

const sockets = [];

let reloadTimer = null;
async function handleDeviceMap() {
  const t = {};
  var e = await Editor.Message.request("device", "query");
  var r = await Editor.Profile.getProject(
    "project",
    "general.designResolution"
  );

  if (r) {
    e.splice(0, 0, {
      name: Editor.I18n.t("preview.web_view.design_resolution"),
      width: r.width,
      height: r.height,
      ratio: 1,
    });
  }

  e.splice(
    1,
    0,
    { name: Editor.I18n.t("preview.web_view.fullScreen") },
    { name: Editor.I18n.t("preview.web_view.webpageFullScreen") },
    { name: "__separator__" }
  );

  e.forEach((e) => {
    let e_name = e.name;

    switch (e.name) {
      case Editor.I18n.t("preview.web_view.design_resolution"):
        e_name = "Default";
        break;
      case Editor.I18n.t("preview.web_view.fullScreen"):
        e_name = "FullScreen";
        break;
      case Editor.I18n.t("preview.web_view.webpageFullScreen"):
        e_name = "WebpageFullScreen";
        break;
    }

    t[e_name] = e;
  });

  return t;
}
async function generateDummyScript(e, r) {
  return r === "simulator"
    ? generateBundleIndex(e)
    : `System.register("virtual:///prerequisite-imports/${e}", [], function () {
        "use strict";
      
        return {
          setters: [],
          execute: function () {}
        };
    });`;
}
let otherLibraryPath = null;
async function queryOtherLibraryPath() {
  if (!otherLibraryPath) {
    try {
      var e = await Editor.Message.request("asset-db", "query-db-infos");
      otherLibraryPath = e.map((e) => e.library);
    } catch (e) {
      console.debug(e);

      otherLibraryPath = [join(Editor.App.temp, "asset-db/library")];
    }
  }
  return otherLibraryPath;
}
async function handlerBundleConfig(r, e, t) {
  var a = r.params[1] !== "undefined" ? r.params[1] : undefined;

  var a = (
    await preview_settings_1.previewSettingsManager.queryBundleConfigs(a)
  ).find((e) => e.name === r.params[3]);

  if (!a) {
    return t();
  }
  e.status(200).send(JSON.stringify(a));
}
async function handlerBundleIndex(e, r, t) {
  var a = e.params[1] !== "undefined" ? e.params[1] : undefined;
  const s = e.params[3];
  if (
    !(
      await preview_settings_1.previewSettingsManager.queryBundleConfigs(a)
    ).find((e) => e.name === s)
  ) {
    return t();
  }
  e = await generateDummyScript(s, a);
  r.status(200).send(e);
}
async function handleLibraryFile(e, r, t) {
  const a = e.params[1].replace(/[^(\\|/|@)]+/g, encodeURIComponent);
  e = (await queryOtherLibraryPath())
    .map((e) => join(e, a))
    .find((e) => existsSync(e));
  if (!e) {
    return t();
  }
  r.sendFile(e);
}
function connection(e) {
  sockets.push(e);

  e.on("changeOption", (e, r) => {
    Editor.Profile.setConfig("preview", "preview." + e, r, "global");
  });

  e.on("preview error", (e) => {
    console.error(e);
  });
}
function disconnect(e) {
  e = sockets.indexOf(e);

  if (-1 !== e) {
    sockets.splice(e, 1);
  }
}
function reload() {
  if (sockets.length !== 0) {
    clearTimeout(reloadTimer);

    reloadTimer = setTimeout(() => {
      sockets.forEach((e) => {
        e.emit("browser:reload");
      });
    }, 200);
  }
}
function close() {
  if (sockets.length !== 0) {
    sockets.forEach((e) => {
      e.emit("browser:close");
    });
  }
}
function queryConnectNum() {
  return sockets.length;
}
