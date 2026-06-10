const { readFileSync, outputFileSync } = require("fs-extra");

const { join } = require("path");

const packages = {
  methods: {
    async create(s, e) {
      var s_dist = s.dist;
      e.title = `i18n:${s.name}.title`;
      e.description = `i18n:${s.name}.description`;

      [
        join(s_dist, "source", "global.ts"),
        join(s_dist, "dist", "global.js"),
        join(s_dist, "@types", "index.d.ts"),
      ].forEach((e) => {
        let t = readFileSync(e, { encoding: "utf-8" });

        t = t.replace(
          "PACKAGE_NAME = 'cocos-build-template';",
          `PACKAGE_NAME = '${s.name}';`
        );

        outputFileSync(e, t);
      });

      console.log(`create build extension in ${s_dist} success`);
    },
  },
};

module.exports = packages;
