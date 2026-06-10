const ps = require("path");
const fs = require("fs");
const fsJetpack = require("fs-jetpack");
const { Module } = require("module");
const editorRoot = ps.resolve(__dirname, "../../../../../../../..");
const engineRoot = ps.join(editorRoot, "resources/3d/engine");

Object.assign(global, {
  Manager: { AssetInfo: { engine: engineRoot } },
  cc: {},
  CC_EDITOR: false,
  CC_DEV: false,
  CC_TEST: false,
});

(Module.createRequire || Module.createRequireFromPath)(
  ps.resolve(editorRoot, "app", "index.js")
)("cc/location").set(engineRoot);

const shdcLib = require(ps.resolve(__dirname, ".."));
shdcLib.options.noSource = true;
shdcLib.options.throwOnWarning = true;
shdcLib.options.skipParserTest = true;

const errorTests = () => {
  const t = /EFX\d\d\d\d/i;
  const n = /\/\/\s*@efx-([\w-]*)/g;
  return fsJetpack
    .find(ps.resolve(__dirname, "./errors"), {
      matching: "*.effect",
      recursive: false,
    })
    .reduce((r, e) => {
      var s = ps.basename(e, ".effect");
      var c = fs.readFileSync(e, { encoding: "utf8" });
      n.lastIndex = 0;
      let a = n.exec(c);

      while (a) {
        if (a[1] === "no-check") {
          return r;
        }
        a = n.exec(c);
      }

      try {
        shdcLib.buildEffect(s, c);
        r.push("no error reported from " + s);
      } catch (e) {
        if (
          typeof e != "string" ||
          e.match(new RegExp(s.match(t)[0], "g")).length !== 2
        ) {
          r.push(e);
        }
      }
      return r;
    }, []);
};

const featureTests = () => {
  const spacesRE = /[\s\n]+/g;
  const identifierRE = /\w/;

  const replacer = (e, r, s) =>
    r && identifierRE.test(s[r - 1]) && identifierRE.test(s[r + e.length])
      ? " "
      : "";

  const checkRE = /\/\/\s*@check(.*)/g;

  const objEquals = (s, r) =>
    Array.isArray(r)
      ? r.every((e, r) => s && objEquals(s[r], e))
      : typeof r == "object"
      ? Object.keys(r).every((e) => s && objEquals(s[e], r[e]))
      : s === r;

  const { UniformBinding } = shdcLib.mappings;
  return fsJetpack
    .find(__dirname, { matching: "*.effect", recursive: false })
    .reduce((acc, file) => {
      const name = ps.basename(file, ".effect");
      const content = fs.readFileSync(file, { encoding: "utf8" });
      try {
        const effect = shdcLib.buildEffect(name, content);
        for (const shader of effect.shaders) {
          shader.glsl1.vert = shader.glsl1.vert.replace(spacesRE, replacer);

          shader.glsl1.frag = shader.glsl1.frag.replace(spacesRE, replacer);

          shader.glsl3.vert = shader.glsl3.vert.replace(spacesRE, replacer);

          shader.glsl3.frag = shader.glsl3.frag.replace(spacesRE, replacer);

          shader.glsl4.vert = shader.glsl4.vert.replace(spacesRE, replacer);

          shader.glsl4.frag = shader.glsl4.frag.replace(spacesRE, replacer);
        }
        checkRE.lastIndex = 0;
        let count = 1;
        let cap = checkRE.exec(content);

        while (cap) {
          if (!eval(cap[1])) {
            acc.push(`${name}.effect check #${count} failed`);
          }

          cap = checkRE.exec(content);
          count++;
        }
      } catch (e) {
        acc.push(e);
      }
      return acc;
    }, []);
};

errorTests().forEach((e) => console.log(e));

featureTests().forEach((e) => console.log(e));
