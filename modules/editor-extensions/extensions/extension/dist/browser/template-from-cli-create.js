Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCliTemplatePackageJson = updateCliTemplatePackageJson;
exports.createFromCli = createFromCli;

const { readFileSync } = require("node:fs");

const { join, dirname, basename } = require("node:path");

const { writeJSON, ensureDirSync } = require("fs-extra");

const { spawn } = require("node:child_process");

function updateCliTemplatePackageJson(a) {
  return new Promise((e, t) => {
    try {
      var n = join(a.dist, "package.json");
      var o = JSON.parse(readFileSync(n, "utf-8"));
      o.author = a.author;
      writeJSON(n, o, { spaces: 4 }).then(e).catch(t);
    } catch (e) {
      t(e);
    }
  });
}
function createFromCli(r) {
  return new Promise((t, n) => {
    if (!r.template.cliTemplateName) {
      return n(new Error("template is not valid"));
    }
    ensureDirSync(dirname(r.dist));
    const o = process.platform === "win32" ? "npm.cmd" : "npm";
    console.log(
      "extension:",
      Editor.I18n.t("extension.create_npm_template.fetch")
    );
    var e = spawn(
      o,
      [
        "create",
        "cocos-plugin@latest",
        basename(r.dist),
        "--yes",
        "--",
        "--template",
        r.template.cliTemplateName,
      ],
      { shell: true, cwd: dirname(r.dist) }
    );
    let a = "";

    e.stdout.on("data", (e) => {
      a += e.toString();
    });

    e.on("close", async (e) => {
      if (e !== 0) {
        return n(new Error("create cli template failed, code: " + e));
      }

      if (a.includes("Scaffolding project in")) {
        console.log(
          "extension:",
          Editor.I18n.t("extension.create_npm_template.install")
        );

        spawn(o, ["install"], {
          shell: true,
          cwd: r.dist,
        }).on("close", (e) => {
          if (e !== 0) {
            return n(new Error("install cli template failed, code: " + e));
          }
          spawn(o, ["run", "build"], {
            shell: true,
            cwd: r.dist,
          }).on("close", (e) => {
            if (e !== 0) {
              return n(new Error("build cli template failed, code: " + e));
            }

            console.log(
              "extension:",
              Editor.I18n.t("extension.create_npm_template.done")
            );

            updateCliTemplatePackageJson(r).then(t).catch(n);
          });
        });
      } else {
        n(new Error("create cli template failed, stdout: " + a));
      }
    });
  });
}
