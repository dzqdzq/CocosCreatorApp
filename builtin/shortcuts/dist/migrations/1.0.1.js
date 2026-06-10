async function migrateGlobal(e) {
  const e_userConfig = e.userConfig;

  if (e_userConfig) {
    Object.keys(e_userConfig).forEach((r) => {
      const l = e_userConfig[r];
      Object.keys(l).forEach((e) => {
        var a;
        var t;
        var n = l[e];

        if (n.when && n.when.startsWith("panel.")) {
          a = n.when;
          t = n.when.replace("panel.", "");
          n.when = `PanelName === '${t}'`;
          r.replace(a, n.when);
          t = e.replace(a, n.when);
          delete l[e];
          l[t] = n;
        }
      });
    });
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateGlobal = migrateGlobal;
