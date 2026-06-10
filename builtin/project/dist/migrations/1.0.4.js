const join = require("path").join;
const outputJSONSync = require("fs-extra").outputJSONSync;
exports.migrateProject = async (i) => {
  if (
    i.physics &&
    i.physics.defaultMaterial &&
    typeof i.physics.defaultMaterial != "string"
  ) {
    const s = {
      __type__: "cc.PhysicMaterial",
      _name: "custom-physics-material",
      _objFlags: 0,
      _native: "",
      _friction: 0.8,
      _rollingFriction: 0.1,
      _spinningFriction: 0.1,
      _restitution: 0.1,
    };
    Object.keys(i.physics.defaultMaterial).forEach((t) => {
      s["_" + t] = i.physics.defaultMaterial[t];
    });

    var t = {
      ver: "1.0.1",
      importer: "physics-material",
      imported: false,
      uuid: Editor.Utils.UUID.generate(false),
      files: [".json"],
    };

    var e = join(Editor.Project.path, "assets", "custom-physics-material.pmtl");
    var e = Editor.Utils.File.getName(e);
    outputJSONSync(e, s);
    outputJSONSync(e + ".meta", t);
    i.physics.defaultMaterial = t.uuid;
  }
};
