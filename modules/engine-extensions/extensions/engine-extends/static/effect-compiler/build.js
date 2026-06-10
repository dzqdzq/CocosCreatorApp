const ps = require("path");
const fs = require("fs-extra");
const fsJetpack = require("fs-jetpack");
const Module = require("module").Module;
const editorRoot = ps.join(__dirname, "../../../../../../..");

const options = {
  engineRoot: "",
  shouldThrow: false,
  noSource: false,
  stripSpaces: false,
  noOutput: false,
  essentialOnly: false,
  keepNewlines: false,
  filesOrDirs: [],
};

const argc = process.argv.length;
for (let e = 2; e < argc; e++) {
  const b = process.argv[e];

  if (b === "--engine" && e < argc - 1) {
    options.engineRoot = ps.resolve(process.argv[++e]);
  } else if (b === "--default-engine") {
    options.engineRoot = "default";
  } else if (b === "--throw") {
    options.shouldThrow = true;
  } else if (b === "--no-source") {
    options.noSource = true;
  } else if (b === "--strip-spaces") {
    options.stripSpaces = true;
  } else if (b === "--no-output") {
    options.noOutput = true;
  } else if (b === "--essential-only") {
    options.essentialOnly = true;
  } else if (b.startsWith("--keep-newlines")) {
    options.keepNewlines = b.length > 15 ? b.substring(16) : "";
  } else {
    options.filesOrDirs.push(b);
  }
}
const defaultEngineRoot = ps.join(editorRoot, "resources/3d/engine");
const cacheFile = ps.join(__dirname, "engine_root_cache.txt");

const preload = (options.engineRoot
  ? (options.engineRoot === "default" &&
      (options.engineRoot = defaultEngineRoot),
    fs.existsSync(options.engineRoot) &&
      fs.writeFileSync(cacheFile, options.engineRoot))
  : (fs.existsSync(cacheFile) &&
      (options.engineRoot = fs.readFileSync(cacheFile, "utf8")),
    options.engineRoot || (options.engineRoot = defaultEngineRoot)),
console.log("Editor location: " + editorRoot),
Object.assign(global, {
  Manager: { AssetInfo: { engine: options.engineRoot } },
  cc: {},
  CC_EDITOR: false,
  CC_DEV: false,
  CC_TEST: false,
}),
(Module.createRequire || Module.createRequireFromPath)(
  ps.resolve(editorRoot, "app/index.js")
)("cc/preload"))["default"];

function main() {
  const i = require(ps.join(
    editorRoot,
    "app/modules/engine-extensions/extensions/engine-extends/static/effect-compiler"
  ));

  i.options.throwOnWarning = i.options.throwOnError = options.shouldThrow;

  i.options.noSource = options.noSource;
  i.options.skipParserTest = true;
  const o = { dir: "" };

  const r = { dir: ps.join(options.engineRoot, "editor/assets/chunks") };
  i.options.chunkSearchFn = (t) => {
    var n = { name: undefined, content: undefined };
    for (let s = 0; s < t.length; s++) {
      var i = t[s];
      let e = ps.resolve(o.dir, i + ".chunk");
      if (
        fs.existsSync(e) ||
        ((e = ps.resolve(r.dir, i + ".chunk")), fs.existsSync(e))
      ) {
        n.name = i;
        n.content = fs.readFileSync(e, { encoding: "utf-8" });
        break;
      }
    }
    return n;
  };
  var s = (e) => {
    var s = fsJetpack.find(e, { matching: "*.chunk", recursive: false });
    for (let e = 0; e < s.length; ++e) {
      var t = ps.basename(s[e], ".chunk");
      var n = fs.readFileSync(s[e], { encoding: "utf8" });
      i.addChunk(t, n);
    }
  };
  s(ps.join(options.engineRoot, "editor/assets/chunks"));

  const $ = (e, s) => e.replace(/\n/g, "\n" + " ".repeat(s));

  const v = (e) =>
    JSON.stringify(e)
      .replace(/([,{]|":)/g, "$1 ")
      .replace(/([}])/g, " $1");

  const y = (e, s = v) => {
    let t = "";
    if (!e.length) {
      return "[]";
    }
    for (const n of e) {
      t += `  ${$(s(n), 2)},
`;
    }
    return `[
${t.slice(0, -2)}
]`;
  };

  const R = (() => {
    const t = /\s*?\n\s*/g;
    const n = /[\s\n]+/g;
    const i = /\w/;

    const o = (e, s, t) =>
      s && i.test(t[s - 1]) && i.test(t[s + e.length]) ? " " : "";

    const r = (e, s) => {
      if (options.stripSpaces) {
        e = e.replace(n, o);
      }

      if (options.essentialOnly) {
        e = e.replace(t, "\n");
      }

      return s.includes(options.keepNewlines)
        ? `\`${e}\``
        : `"${e.replace(/\n/g, "\\n")}"`;
    };

    return (e, s) => {
      var t = "{\n";
      return (
        (t += `  "vert": ${$(r(e.vert, s + ".vert"), 4)},
`) +
        `  "frag": ${$(r(e.frag, s + ".frag"), 4)},
` +
        "}"
      );
    };
  })();

  const n = (() => {
    const m = (e) =>
      `{"name": "${e.name}", "defines": ${v(e.defines)}, "binding": ${
        e.binding
      }, ` +
      (e.descriptorType ? '"descriptorType": ' + e.descriptorType + ", " : "") +
      `"stageFlags": ${e.stageFlags}, "members": ${y(e.members)}}`;

    const t = (e) => {
      let s = "";
      var {
        name: e,
        hash,
        glsl4,
        glsl3,
        glsl1,
        builtins,
        defines,
        blocks,
        samplerTextures,
        buffers,
        images,
        textures,
        samplers,
        subpassInputs,
        attributes,
        varyings,
      } = e;

      s =
        (s += "{\n") +
        `  "name": "${e}",
` +
        `  "hash": ${hash},
`;

      if (glsl4) {
        s += `  "glsl4": ${$(R(glsl4, "glsl4"), 2)},
  `;
      }

      if (glsl3) {
        s += `  "glsl3": ${$(R(glsl3, "glsl3"), 2)},
  `;
      }

      if (glsl1) {
        s += `  "glsl1": ${$(R(glsl1, "glsl1"), 2)},
  `;
      }

      if (varyings) {
        s += `  "varyings": ${$(y(varyings), 2)},
  `;
      }

      s =
        (s =
          (s =
            (s =
              (s =
                (s =
                  (s =
                    (s =
                      (s =
                        (s =
                          (s =
                            (s =
                              (s += '  "builtins": {\n') +
                              `    "statistics": ${v(builtins.statistics)},
`) +
                            `    "globals": ${v(builtins.globals)},
`) +
                          `    "locals": ${v(builtins.locals)}
` +
                          "  },\n") +
                        `  "defines": ${$(y(defines), 2)},
`) +
                      `  "attributes": ${$(y(attributes), 2)},
`) +
                    `  "blocks": ${$(y(blocks, m), 2)},
`) +
                  `  "samplerTextures": ${$(y(samplerTextures), 2)},
`) +
                `  "buffers": ${$(y(buffers), 2)},
`) +
              `  "images": ${$(y(images), 2)},
`) +
            `  "textures": ${$(y(textures), 2)},
`) +
          `  "samplers": ${$(y(samplers), 2)},
`) +
        `  "subpassInputs": ${$(y(subpassInputs), 2)}
` +
        "}";

      return s;
    };

    return (e) => {
      if (options.essentialOnly) {
        i.stripEditorSupport(e);
      }

      let s = "";

      s =
        (s =
          (s =
            (s += "{\n") +
            `  "name": "${e.name}",
`) +
          (e._uuid
            ? `  "_uuid": "${e._uuid}",
`
            : "")) +
        `  "techniques": ${$(y(e.techniques), 2)},
`;

      if (!options.essentialOnly) {
        s += `  "dependencies": ${$(y(e.dependencies), 2)},
  `;

        e.editor &&
          (s += `  "editor": ${$(v(e.editor), 2)},
`);
      }

      s =
        s +
        `  "shaders": ${$(y(e.shaders, t), 2)}
` +
        "}";

      return s;
    };
  })();

  var t = (() => {
    const i = {
      "pipeline/planar-shadow": { techs: [] },
      "pipeline/skybox": { techs: [] },
      "pipeline/deferred-lighting": { techs: [] },
      "pipeline/bloom": { techs: [] },
      "pipeline/post-process": { techs: [] },
      "util/profiler": { techs: [] },
      "util/splash-screen": { techs: [] },
      "builtin-standard": { techs: [0] },
      "builtin-unlit": { techs: [0] },
      "builtin-sprite": { techs: [] },
      "builtin-particle": { techs: [0] },
      "builtin-particle-gpu": { techs: [0] },
      "builtin-particle-trail": { techs: [0] },
      "builtin-billboard": { techs: [0] },
      "builtin-terrain": { techs: [0] },
      "builtin-graphics": { techs: [] },
      "builtin-clear-stencil": { techs: [] },
      "builtin-spine": { techs: [0] },
      "builtin-occlusion-query": { techs: [0] },
      "builtin-geometry-renderer": { techs: [] },
      "builtin-debug-renderer": { techs: [0] },
    };
    return (e, s, t) => {
      s = i[s];
      if (s !== undefined) {
        const n = Object.assign({}, t);

        if (s.techs.length) {
          n.techniques = s.techs.reduce((e, s) => {
            e.push(n.techniques[s]);
            return e;
          }, []);

          n.shaders = n.shaders.filter((s) =>
            n.techniques.some((e) => e.passes.some((e) => e.program === s.name))
          );
        }

        n.shaders = n.shaders.map((e) => Object.assign({}, e));

        n.techniques = n.techniques.map((e) => {
          e = Object.assign({}, e);

          e.passes = e.passes.map((e) => Object.assign({}, e));

          return e;
        });

        e.push(n);
      }
    };
  })();

  const l = (e, s) => {
    let t = null;
    if (options.shouldThrow) {
      try {
        t = i.buildEffect(e, s);
      } catch (e) {
        console.log(e);
      }
    } else {
      t = i.buildEffect(e, s);
    }
    return t;
  };

  const a = (e, s) => {
    if (!options.noOutput) {
      fs.ensureDirSync(ps.dirname(e));
      fs.writeFileSync(e, s, { encoding: "utf8" });
      console.log(e + " saved.");
    }
  };

  if (options.filesOrDirs.length) {
    const S = (e) => {
      var s = ps.basename(e, ".effect");
      var t = fs.readFileSync(e, { encoding: "utf8" });
      o.dir = ps.dirname(e);
      var t = l(s, t);

      if (t) {
        a(
          ps.join(ps.dirname(e), s + ".ts"),
          "/* eslint-disable */\n" +
            `${""}export const effect = ${n(t)};
`
        );
      }
    };
    for (let e = 0; e < options.filesOrDirs.length; e++) {
      var c = options.filesOrDirs[e];

      var p = ((s) => {
        try {
          return fs.lstatSync(s);
        } catch (e) {
          console.error(s, "does not exist!");
        }
        return null;
      })(c);

      if (p) {
        if (p.isDirectory()) {
          s(c);

          fsJetpack
            .find(c, { matching: "*.effect", recursive: false })
            .forEach((e) => S(e));
        } else {
          s(ps.dirname(c));
          S(c);
        }
      }
    }
    process.exit();
  }
  var u = ps.join(options.engineRoot, "editor/assets");
  var d = fsJetpack.find(u, { matching: "**/*.effect" });
  var e = ps.join(editorRoot, "effects.ts");
  var g = ps.join(options.engineRoot, "test/fixtures/builtin-effects.ts");
  var f = ps.join(options.engineRoot, "test/fixtures/builtin-glsl4.ts");
  var h = [];
  var b = [];
  for (let e = 0; e < d.length; ++e) {
    var m = ps
      .relative(ps.join(u, "effects"), ps.dirname(d[e]))
      .replace(/\\/g, "/");

    var m = m + (m.length ? "/" : "") + ps.basename(d[e], ".effect");
    var x = fs.readFileSync(d[e], { encoding: "utf8" });
    var x = l(m, x);

    if (x) {
      h.push(x);
      t(b, m, x, d[e]);
    }
  }

  a(
    e,
    `
${""}export const effects = ${y(h, n)};
`
  );

  options.essentialOnly = true;
  e = b.map(({ shaders }) =>
    shaders.map((e) => {
      var s = e.glsl4 || null;
      delete e.glsl4;
      return s;
    })
  );

  a(
    f,
    "/* eslint-disable */\n" +
      `${""}export const glsl4 = ${y(e, (e) => y(e, (e) => R(e, version)))};
`
  );

  a(
    g,
    "/* eslint-disable */\n// absolute essential effects\n" +
      `${""}export const effects = ${y(b, n)};
`
  );
}
(async () => {
  await preload({
    root: options.engineRoot,
    editorExtensions: false,
    requiredModules: ["cc/editor/offline-mappings"],
  });

  main();
})().catch((e) => {
  console.error(e);
});
