exports.load = () => {
  var { sentry, initOptions } = require("@editor/sentry/render");
  sentry.init(initOptions);
};

exports.unload = () => {
  var r = require("@editor/sentry/render").sentry;
  r.close();
};
