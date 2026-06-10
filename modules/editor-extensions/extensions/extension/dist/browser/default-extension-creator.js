const { existsSync, readFile, writeFile, ensureDir } = require("fs-extra");

const { join, dirname } = require("path");

const packages = {
  methods: {
    async create(e, a) {
      var t;
      var e_dist = e.dist;
      a.description = `i18n:${e.name}.description`;
      var i = join(e_dist, "README.zh-CN.md");
      var s = join(e_dist, "README.md");

      if (existsSync(i)) {
        t = await readFile(i, { encoding: "utf-8" });
        await writeFile(i, t.replace(/{name}/g, e.name));
      }

      if (existsSync(s)) {
        i = await readFile(s, { encoding: "utf-8" });
        await writeFile(s, i.replace(/{name}/g, e.name));
      }

      if (a.main) {
        t = join(e_dist, a.main);

        existsSync(t) ||
          ((s = `exports.load = function(){
console.warn("${e.name} is not compiled yet.")
}`),
          await ensureDir(dirname(t)),
          await writeFile(t, s));
      }

      if (a.panels) {
        for (const r in a.panels) {
          if (a.panels[r].title) {
            a.panels[r].title = a.panels[r].title.replace("{name}", e.name);
          }
        }
      }

      if (a.contributions && a.contributions.menu) {
        for (const o of a.contributions.menu) {
          if (o.path) {
            o.path = o.path.replace("{name}", e.name);
          }

          if (o.label) {
            o.label = o.label.replace("{name}", e.name);
          }
        }
      }
    },
  },
};

module.exports = packages;
