const join = require("path").join;
const { existsSync, outputJSONSync } = require("fs-extra");
const lodash = require("lodash");
exports.migrateProject = async (e) => {
  join(Editor.Project.path, "settings", Editor.App.version, "./packages");
  lodash.get(e, "script.useDefineForClassFields", false);
  lodash.get(e, "script.allowDeclareFields", false);
};
