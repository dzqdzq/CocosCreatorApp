exports.migrateGlobal = async (t) => {
  if (t && typeof t == "object") {
    for (const o in t) {
      var e;

      if (o !== "__version__" && "string" == typeof (e = t[o])) {
        delete t[o];
        t[o] = { path: e };
      }
    }
  }
};
