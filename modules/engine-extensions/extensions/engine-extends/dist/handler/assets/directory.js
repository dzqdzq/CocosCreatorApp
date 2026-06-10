Object.defineProperty(exports, "__esModule", { value: true });

const { queryUrl } = require("@editor/asset-db");

const { ensureDirSync } = require("fs-extra");

const { basename } = require("path");

const { mergeBundleConfig } = require("./migrates/migrate-bundle-config");

const InternalBundleName = ["internal", "resources", "main"];

const DirectoryHandler = {
  name: "directory",
  importer: {
    version: "1.2.0",
    migrations: [
      { version: "1.1.0", migrate: migrateSubpackageSettings },
      { version: "1.2.0", migrate: migrateBundleConfig },
    ],
    async import(e) {
      if (queryUrl(e.uuid) === "db://assets/resources") {
        e.userData.isBundle = true;
        e.userData.bundleConfigID = e.userData.bundleConfigID ?? "default";
        e.userData.bundleName = "resources";
        e.userData.priority = 8;
      }

      return true;
    },
  },
  iconInfo: {
    default: { value: "directory", type: "icon" },
    generateThumbnail(e) {
      return e.userData.isBundle
        ? { value: "bundle-folder", type: "icon" }
        : { value: "directory", type: "icon" };
    },
  },
  createInfo: {
    generateMenuInfo() {
      return [
        { label: "i18n:ENGINE.assets.newFolder", fullFileName: "folder" },
      ];
    },
    async create(e) {
      ensureDirSync(e.target);
      return e.target;
    },
  },
  async validate(e) {
    return e.isDirectory();
  },
};

function migrateSubpackageSettings(e) {
  e.userData.isBundle = false;
  e.userData.priority = 1;
  e.userData.bundleName = "";
  e.userData.compressionType = {};
  e.userData.isRemoteBundle = {};

  if (e.userData.isSubpackage) {
    e.userData.isBundle = e.userData.isSubpackage;
    e.userData.bundleName = e.userData.subpackageName || "";
    e.userData.priority = 5;
  }

  e.userData.isSubpackage = undefined;
  e.userData.subpackageName = undefined;
}
async function migrateBundleConfig(a) {
  if (a.userData.isBundle && !a.userData.bundleConfigID) {
    console.debug("migrateBundleConfig for asset with config " + a.userData);
    var { compressionType, isRemoteBundle, bundleName } = a.userData;
    var u = "auto_" + Editor.Utils.UUID.generate();
    let e = bundleName || basename(a.source).replace(/[^a-zA-Z0-9_-]/g, "_");

    if (InternalBundleName.includes(e) && a.url !== "db://assets/resources") {
      e = e + "_" + u;

      console.warn(
        `Bundle {asset(${a.url})} ` +
          Editor.I18n.t(
            "builder.asset_bundle.duplicate_reserved_keyword_message",
            { name: e }
          )
      );
    }

    bundleName = mergeBundleConfig(compressionType, isRemoteBundle, e);
    Editor.Profile.setProject(
      "builder",
      "bundleConfig.custom." + u,
      bundleName
    );
    a.userData.bundleConfigID = u;
    delete a.userData.compressionType;
    delete a.userData.isRemoteBundle;
  }
}
exports.default = DirectoryHandler;
