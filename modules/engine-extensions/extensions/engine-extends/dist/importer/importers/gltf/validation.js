var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGlTf = undefined;
const fs_1 = __importDefault(require("fs"));
const gltf_validator_1 = require("gltf-validator");
async function validateGlTf(e, s) {
  var t = {
    uri: e,
    ignoredIssues: [],
    severityOverrides: {
      NON_RELATIVE_URI: 2,
      UNDECLARED_EXTENSION: 1,
      ACCESSOR_TOTAL_OFFSET_ALIGNMENT: 2,
    },
  };
  const i = await (e.endsWith(".glb")
    ? gltf_validator_1.validateBytes(fs_1.default.readFileSync(e), t)
    : gltf_validator_1.validateString(fs_1.default.readFileSync(e).toString()));
  for (const r of i.issues.messages.filter(
    (e) =>
      !(
        e.code !== "VALUE_NOT_IN_RANGE" ||
        !/\/accessors\/\d+\/count/.test(e.pointer) ||
        e.message !== "Value 0 is out of range."
      ) ||
      !(
        e.code !== "ROTATION_NON_UNIT" ||
        !/\/nodes\/\d+\/rotation/.test(e.pointer)
      )
  )) {
    switch (r.severity) {
      case 0: {
        --i.issues.numErrors;
        break;
      }
      case 1: {
        --i.issues.numInfos;
      }
    }

    console.debug(
      `glTf-validator issue(from ${s}) ${JSON.stringify(r)} is ignored.`
    );

    i.issues.messages.splice(i.issues.messages.indexOf(r), 1);
  }
  t = (s) =>
    JSON.stringify(
      i.issues.messages.filter((e) => e.severity === s),
      undefined,
      2
    );

  if (i.issues.numErrors !== 0) {
    console.debug(
      `File ${s} contains errors, ` +
        "this may cause problem unexpectly, please fix them: \n" +
        t(0) +
        `
  `
    );
  } else if (i.issues.numWarnings !== 0) {
    console.debug(
      `File ${s} contains warnings, ` +
        "the result may be not what you want, please fix them if possible: \n" +
        t(1) +
        `
  `
    );
  } else if (i.issues.numHints !== 0 || i.issues.numInfos !== 0) {
    console.debug(
      `Logs from ${s}:` +
        "\n" +
        t(2) +
        `
`
    );
  }
}
exports.validateGlTf = validateGlTf;
