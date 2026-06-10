const { join, relative } = require("path");
exports.getSourcesFromPackageJson = (t, o, e = true) => {
  const i = [];
  function n(n) {
    if (typeof n == "string") {
      let t = relative(o, n);

      if (e) {
        t = t.replace(".js", ".ts");
      }

      i.push(t);
    }
  }
  var r;

  var { panels, main } = t;

  if (panels) {
    for (const u in panels) {
      if (Object.hasOwnProperty.call(panels, u)) {
        const main = panels[u].main;

        if (main) {
          n(main);
        }
      }
    }
  }

  if (main) {
    n(main);
  }

  if (
    t.contributions &&
    ((r = t.contributions.scene) && (r = r.script) && n(r),
    (r = t.contributions.builder) && n(r),
    (r = t.contributions.preferences) && (r = r.custom) && n(r),
    (r = t.contributions.project)) &&
    (t = r.custom)
  ) {
    n(t);
  }

  return i;
};
