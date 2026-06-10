var ExtensionSourceType;
var ExtensionInstalledPath;
var ExtensionManagerTab;
var ErrorCode;
Object.defineProperty(exports, "__esModule", { value: true });

exports.ErrorCode = undefined;
exports.ExtensionManagerTab = undefined;
exports.ExtensionInstalledPath = undefined;
exports.ExtensionSourceType = undefined;

((E) => {
  E.Cocos = "Cocos Official";
  E.Purchased = "Purchased";
  E.BuiltIn = "Built-in";
  E.Custom = "Custom";
})(
  ExtensionSourceType ||
    (exports.ExtensionSourceType = ExtensionSourceType = {})
);

((E) => {
  E.Global = "Global";
  E.Project = "Project";
})(
  ExtensionInstalledPath ||
    (exports.ExtensionInstalledPath = ExtensionInstalledPath = {})
);

((E) => {
  E.Cocos = "cocos_official";
  E.Purchased = "purchased";
  E.BuiltIn = "builtin";
  E.Installed = "installed";
  E.Search = "search_list";
  E.ForcedUpdate = "hard_update";
})(
  ExtensionManagerTab ||
    (exports.ExtensionManagerTab = ExtensionManagerTab = {})
);

((E) => {
  E[(E.PARAM_ERROR = 1)] = "PARAM_ERROR";
  E[(E.SYSTEM_FIELD_OCCUPANCY = 2)] = "SYSTEM_FIELD_OCCUPANCY";
  E[(E.SYSTEM_FIELD_LOCK = 3)] = "SYSTEM_FIELD_LOCK";
  E[(E.UPLOAD_FILE_MISS = 1000) /* 1e3 */] = "UPLOAD_FILE_MISS";
  E[(E.UPLOAD_FILE_ERROR = 1001)] = "UPLOAD_FILE_ERROR";
  E[(E.EXTENSION_CONFIG_MISS = 1002)] = "EXTENSION_CONFIG_MISS";
  E[(E.EXTENSION_CONFIG_NAME_MISS = 1003)] = "EXTENSION_CONFIG_NAME_MISS";
  E[(E.EXTENSION_CONFIG_VERSION_MISS = 1004)] = "EXTENSION_CONFIG_VERSION_MISS";
  E[(E.EXTENSION_CONFIG_EDITOR_MISS = 1005)] = "EXTENSION_CONFIG_EDITOR_MISS";
  E[(E.EXTENSION_CONFIG_EDITOR_ERROR = 1006)] = "EXTENSION_CONFIG_EDITOR_ERROR";
  E[(E.EXTENSION_EXISTS = 1007)] = "EXTENSION_EXISTS";
  E[(E.STORAGE_OSS_STORE_ERROR = 2001)] = "STORAGE_OSS_STORE_ERROR";
  E[(E.STORAGE_OSS_DELETE_ERROR = 2002)] = "STORAGE_OSS_DELETE_ERROR";
  E[(E.RECORD_EXISTS_ERROR = 3001)] = "RECORD_EXISTS_ERROR";
  E[(E.RECORD_NOT_EXISTS_ERROR = 3002)] = "RECORD_NOT_EXISTS_ERROR";
  E[(E.SERVER_ERROR = 5000) /* 5e3 */] = "SERVER_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
