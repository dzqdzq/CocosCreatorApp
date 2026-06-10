const { existsSync, readdirSync, chmodSync, statSync } = require("fs");
const { join, normalize, basename } = require("path");

const {
  ensureDirSync,
  copySync,
  readJSONSync,
  outputJSONSync,
} = require("fs-extra");

const project = require("@editor/project");
const v4 = require("node-uuid").v4;

const {
  getName,
  t,
  basenameNoExt,
  warnDuplicateProject,
  chooseProjectPath,
  errorDialog,
} = require("./util");

const PROJECT_NAME = "NewProject";

const template = {
  name: "empty",
  path: join(__dirname, "../static/template-empty"),
};

async function isEmptyDir(t) {
  try {
    var e = readdirSync(t);
    return !e || !e.length;
  } catch (e) {
    await errorDialog(e.message, t);
    return false;
  }
}
async function changeMode(t) {
  try {
    for (const r of readdirSync(t)) {
      var e = join(t, r);
      chmodSync(e, 511);

      if (statSync(e).isDirectory()) {
        changeMode(e);
      }
    }
  } catch (e) {
    await errorDialog(e.message, t);
  }
}
async function initGit(e) {
  var t = require("child_process").exec;
  try {
    t(
      "git init && git config core.autocrlf input",
      { env: process.env, cwd: e },
      async (e) => {}
    );
  } catch (e) {}
}
async function updateProjectName(e) {
  var r = v4();
  try {
    var a = readJSONSync(join(e, "package.json"));
    a.name = basename(e);
    a.uuid = r;
    outputJSONSync(join(e, "package.json"), a, { spaces: 2 });
  } catch (e) {
    await errorDialog(t("message.rename_project_failed", { error: e.message }));
  }
  return r;
}
async function trackEvent(e, t) {
  try {
    var r = require.resolve("@editor/creator/dist/metrics");
    var a = require(r).Metrics;

    var c = {
      projectId: e,
      projectNm: t,
      template: template.name,
      dimension: "2",
    };

    a.trackEvent({
      sendToCocosAnalyticsOnly: true,
      eventId: "CreateProjectId",
      ...c,
    });

    a.trackEvent({
      category: "CreateProject",
      action: "create",
      label: JSON.stringify(c),
    });
  } catch (e) {
    await errorDialog(e.message, t);
  }
}
exports.createEmptyProject = async () => {
  try {
    var e = await chooseProjectPath(t("template.project_path_palceholder"));
    if (!e) {
      return false;
    }
    var r = getName(join(normalize(e), PROJECT_NAME));
    if (existsSync(r)) {
      if (!(await isEmptyDir(r))) {
        await warnDuplicateProject();
        return false;
      }
    } else {
      ensureDirSync(r);
    }
    copySync(template.path, r);
    await changeMode(r);
    await initGit(r);
    await trackEvent(updateProjectName(r), basenameNoExt(r));
    project.open(r);
    return true;
  } catch (e) {
    await errorDialog(e.message);
    return false;
  }
};
