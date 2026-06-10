function migrateProject(e) {
  var t;
  var r;
  var s;
  var o;

  if (
    e["splash-setting"] &&
    e["splash-setting"].clearColor &&
    (({ r: t, g: r, b: s, a: o } = e["splash-setting"].clearColor), t) &&
    r &&
    s &&
    o
  ) {
    e["splash-setting"].clearColor = { x: t, y: r, z: s, w: o };
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
