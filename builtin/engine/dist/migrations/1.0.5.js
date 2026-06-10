function migrateProject(e) {
  if (e.modules) {
    const r = "dragonbones";
    var t;
    var o = "dragon-bones";
    var n = e.modules.includeModules;

    var n =
      (n && n.length && 0 <= (t = n.findIndex((e) => e === r)) && (n[t] = o),
      e.modules.cache);

    if (typeof n == "object" && Object.keys(n).length && r in n) {
      n[o] = n[r];
      delete n[r];
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
