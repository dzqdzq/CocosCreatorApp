const join = require("path").join;
exports.register = async (t) => {
  var e = await Editor.Message.request("engine", "query-engine-info");
  var o = join(e.typescript.path, "editor/inspector/contributions/asset.js");
  var e = join(e.typescript.path, "editor/inspector/contributions/node.js");

  var o = ((t.contributions.inspector.type.asset = o),
  (t.contributions.inspector.type.node = e),
  require(o)).config;

  var e = require(e).config;
  t.contributions.inspector.header.asset = o.header;
  t.contributions.inspector.section.asset = o.section;
  t.contributions.inspector.footer.asset = o.footer;
  t.contributions.inspector.header.node = e.header ?? {};
  t.contributions.inspector.section.node = e.section ?? {};
  t.contributions.inspector.footer.node = e.footer ?? {};
};
