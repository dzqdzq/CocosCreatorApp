exports.migrateProject = async (e) => {
  if (!e.fbx) {
    e.fbx = {};
  }

  if (!e.fbx.legacyFbxImporter) {
    e.fbx.legacyFbxImporter = {};
  }

  e.fbx.legacyFbxImporter.visible = true;
};
