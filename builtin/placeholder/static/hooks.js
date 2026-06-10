exports.register = async (i) => {
  var n = Editor.Package.getPackages();
  const e = { localization: false, importer: false };

  n.forEach((i) => {
    if (i.name === "localization-editor") {
      e.localization = true;
    } else if (i.name === "plugin-import-2x") {
      e.importer = true;
    }
  });

  i.contributions.menu = i.contributions.menu || [];

  if (e.localization === false) {
    i.contributions.menu.push({
      path: "i18n:menu.panel",
      label: "i18n:placeholder.menu.localization",
      message: "install-extension",
      params: ["localization"],
    });
  }

  if (e.importer === false) {
    i.contributions.menu.push({
      path: "i18n:menu.file",
      label: "i18n:placeholder.menu.import",
      message: "install-extension",
      params: ["plugin-import-2x"],
    });
  }
};
