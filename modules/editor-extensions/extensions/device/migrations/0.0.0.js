exports.migrateGlobal = (e) => {
  delete e.enable;
  Editor.Profile.removeConfig("device", "enable", "global");
};

exports.migrateLocal = (e) => {
  delete e.enable;
};
