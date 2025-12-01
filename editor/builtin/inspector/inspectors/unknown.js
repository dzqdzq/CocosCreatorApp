(() => {
  "use strict";
  Editor.Panel.extend({
    dependencies: ["packages://inspector/share/meta-header.js"],
    template:
      '\n      <cc-meta-header\n        :target="target"\n      ></cc-meta-header>\n    ',
  });
})();
