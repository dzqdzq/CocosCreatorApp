function migrateProject(o) {
  var e;
  var t;

  if (
    o.modules &&
    ((e = ["animation", "skeletal-animation", "marionette"]),
    (t = o.modules.includeModules) &&
      (t.push(...e),
      (o.modules.includeModules = Array.from(new Set(t)).sort())),
    o.modules.cache) &&
    Object.keys(o.modules.cache).length
  ) {
    e.forEach((e) => {
      o.modules.cache[e] = {
        _value: !o.modules.cache[e] || o.modules.cache[e]._value,
      };
    });
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
