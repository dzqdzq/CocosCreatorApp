const VuePlugin = require("rollup-plugin-vue");
const commonjs = require("@rollup/plugin-commonjs");
const postcss = require("rollup-plugin-postcss");
const babel = require("@rollup/plugin-babel").babel;
const typescript = require("rollup-plugin-typescript2");
const terser = require("rollup-plugin-terser").terser;
const json = require("@rollup/plugin-json");
const url = require("@rollup/plugin-url");
const del = require("rollup-plugin-delete");
const { join, relative, dirname } = require("path");
const writeFileSync = require("fs").writeFileSync;
exports.getTaskConfig = (t, o) => {
  var f_defaultOptions = process.env.NODE_ENV !== "production";
  const n = join(o, t.distDir);
  var i = join(o, t.sourceDir);
  var r = join(__dirname, "./", "normalize-component.js").replace(/\\/g, "/");
  var l = join(__dirname, "./", "style-injector.js").replace(/\\/g, "/");
  var u = join(o, t.tsconfigPath);
  var p = {};
  for (
    let f_defaultOptions = 0;
    f_defaultOptions < t.sources.length;
    f_defaultOptions++
  ) {
    var s = t.sources[f_defaultOptions];
    p[s.replace(".ts", "")] = join(i, s);
  }

  var a = new RegExp(
    "\\.(" +
      [
        "png",
        "jpe?g",
        "gif",
        "svg",
        "ico",
        "webp",
        "avif",
        "mp4",
        "webm",
        "ogg",
        "mp3",
        "wav",
        "flac",
        "aac",
        "woff2?",
        "eot",
        "ttf",
        "otf",
        "wasm",
        "webmanifest",
        "pdf",
        "txt",
      ].join("|") +
      ")(\\?.*)?$"
  );

  var c = {
    vue: {
      defaultOptions: {
        defaultLang: { script: "ts" },
        css: true,
        isWebComponent: true,
        normalizer: "~" + r,
        styleInjectorShadow: "~" + l,
      },
      pluginModule: VuePlugin,
    },
    commonjs: { defaultOptions: {}, pluginModule: commonjs },
    postcss: {
      defaultOptions: { inject: false, extract: false },
      pluginModule: postcss,
    },
    babel: {
      defaultOptions: { babelHelpers: "bundled" },
      pluginModule: babel,
    },
    typescript: {
      defaultOptions: { tsconfig: u },
      pluginModule: typescript,
      enable: t.tsconfigPath,
    },
    terser: {
      defaultOptions: {},
      pluginModule: terser,
      enable: !f_defaultOptions,
    },
    json: { defaultOptions: {}, pluginModule: json },
    url: {
      defaultOptions: {
        limit: 0,
        fileName: "[dirname][name][extname]",
        destDir: n,
        publicPath: n + "/",
        sourceDir: join(o, i),
        include: a,
      },
      pluginModule: url,
    },
    del: {
      defaultOptions: { targets: t.distDir + "/*", runOnce: true, cwd: o },
      pluginModule: del,
      enable: !f_defaultOptions,
    },
    relativeRoot: {
      defaultOptions: {},
      pluginModule() {
        return {
          name: "relative-root",
          resolveImportMeta(e, t) {
            return e === "relativePath"
              ? `"${relative(dirname(join(n, t.chunkId)), o).replace(
                  /\\/g,
                  "/"
                )}"`
              : null;
          },
        };
      },
    },
    importEditorCC: {
      defaultOptions: {},
      pluginModule() {
        return {
          name: "import-editor-cc",
          async writeBundle(e, t) {
            for (const i in t) {
              var o = t[i];

              if (o && o.imports && o.imports.includes("cc")) {
                writeFileSync(join(n, o.fileName), d + o.code, {
                  encoding: "utf8",
                });
              }
            }
          },
        };
      },
    },
  };

  const d =
    "{const {join} = require('path');const __editorModulePath__ = join(Editor.App.path,'node_modules');module.paths.push(__editorModulePath__);}";
  var g = [];
  for (const b in c) {
    var f = c[b];
    var m = t.pluginSetting && t.pluginSetting[b];
    if ((f.enable !== false && !m) || (m && m.enable !== false)) {
      let f_defaultOptions = f.defaultOptions;

      if (m) {
        f_defaultOptions =
          typeof m.options == "function"
            ? m.options(f.defaultOptions)
            : f.defaultOptions;
      }

      g.push(f.pluginModule(f_defaultOptions));
    }
  }

  if (t.extraPlugin) {
    g.push(...t.extraPlugin);
  }

  r = {
    input: p,
    plugins: g,
    external: ["vue", "fs", "path", "cc", "child_process", "events"],
  };

  l =
    typeof t.inputOptions == "function"
      ? Object.assign({}, t.inputOptions(r), { plugins: g, input: p })
      : r;

  if (!l.input) {
    console.error("请配置 rollup 的入口！");
  }

  u = { format: t.format || "cjs", dir: n };
  let j;

  if (
    !(j =
      typeof t.outputOptions == "function"
        ? Object.assign({}, t.outputOptions(u), { format: t.format, dir: n })
        : u).dir
  ) {
    console.error("请配置 rollup 的输出目录！");
  }

  if (!j.format) {
    console.error("请配置 rollup 的输出格式！");
  }

  return { inputOptions: l, outputOptions: j, sourceDir: i };
};
