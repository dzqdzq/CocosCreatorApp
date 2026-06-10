var NormalImportSetting;
var TangentImportSetting;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TangentImportSetting = undefined;
exports.NormalImportSetting = undefined;

((t) => {
  t[(t.optional = 0)] = "optional";
  t[(t.exclude = 1)] = "exclude";
  t[(t.require = 2)] = "require";
  t[(t.recalculate = 3)] = "recalculate";
})(
  (NormalImportSetting =
    exports.NormalImportSetting || (exports.NormalImportSetting = {}))
);

((t) => {
  t[(t.exclude = 0)] = "exclude";
  t[(t.optional = 1)] = "optional";
  t[(t.require = 2)] = "require";
  t[(t.recalculate = 3)] = "recalculate";
})(
  (TangentImportSetting =
    exports.TangentImportSetting || (exports.TangentImportSetting = {}))
);
