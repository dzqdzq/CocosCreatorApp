exports.init = () => {
  require('./patch-app-path').patchAppPathToBundleRoot('editor/preload');

  var { sentry, initOptions } = require("@editor/sentry/render");
  sentry.init(initOptions);

  if (require("@editor/creator/dist/app").initSync) {
    require("@editor/creator/dist/app").initSync();
  }

  if (require("@editor/creator/dist/dialog").initSync) {
    require("@editor/creator/dist/dialog").initSync();
  }

  if (require("@editor/creator/dist/edit-mode").initSync) {
    require("@editor/creator/dist/edit-mode").initSync();
  }

  if (require("@editor/creator/dist/i18n").initSync) {
    require("@editor/creator/dist/i18n").initSync();
  }

  if (require("@editor/creator/dist/message").initSync) {
    require("@editor/creator/dist/message").initSync();
  }

  if (require("@editor/creator/dist/layout").initSync) {
    require("@editor/creator/dist/layout").initSync();
  }

  if (require("@editor/creator/dist/menu").initSync) {
    require("@editor/creator/dist/menu").initSync();
  }

  if (require("@editor/creator/dist/metrics").initSync) {
    require("@editor/creator/dist/metrics").initSync();
  }

  if (require("@editor/creator/dist/network").initSync) {
    require("@editor/creator/dist/network").initSync();
  }

  if (require("@editor/creator/dist/package").initSync) {
    require("@editor/creator/dist/package").initSync();
  }

  if (require("@editor/creator/dist/panel").initSync) {
    require("@editor/creator/dist/panel").initSync();
  }

  if (require("@editor/creator/dist/profile").initSync) {
    require("@editor/creator/dist/profile").initSync();
  }

  if (require("@editor/creator/dist/project").initSync) {
    require("@editor/creator/dist/project").initSync();
  }

  if (require("@editor/creator/dist/selection").initSync) {
    require("@editor/creator/dist/selection").initSync();
  }

  if (require("@editor/creator/dist/task").initSync) {
    require("@editor/creator/dist/task").initSync();
  }

  if (require("@editor/creator/dist/theme").initSync) {
    require("@editor/creator/dist/theme").initSync();
  }

  if (require("@editor/creator/dist/ui-kit").initSync) {
    require("@editor/creator/dist/ui-kit").initSync();
  }

  if (require("@editor/creator/dist/user").initSync) {
    require("@editor/creator/dist/user").initSync();
  }

  if (require("@editor/creator/dist/utils").initSync) {
    require("@editor/creator/dist/utils").initSync();
  }

  if (require("@editor/creator/dist/module").initSync) {
    require("@editor/creator/dist/module").initSync();
  }

  if (require("@editor/creator/dist/clipboard").initSync) {
    require("@editor/creator/dist/clipboard").initSync();
  }
};
