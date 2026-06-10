const ps = require("path");
const engineLocation = getEngineLocation();
function getEngineLocation() {
  let t = "";
  try {
    var e = require("../../../workflow/.user.json");

    if (typeof e.customJavascriptEngine == "string") {
      t = e.customJavascriptEngine;
    }
  } catch {}
  t = t || ps.join(__dirname, "resources", "3d", "engine");
  return ps.join(t, "bin", ".cache", "editor-ci", "ci");
}
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: [String.raw`**/test/**/*.(test|spec).(ts|tsx)`],
  setupFiles: ["./test/setup-jest.ts"],
  moduleNameMapper: {
    "^cc$": "<rootDir>/test/cc",
    "^cc/(.*)": "<rootDir>/../../node_modules/cc/$1",
  },
  moduleFileExtensions: ["ts", "js", "json", "node", "jsx"],
  globals: {
    CC_DEV: true,
    CC_TEST: true,
    ENGINE_LOCATION: engineLocation,
    "ts-jest": { tsconfig: "tsconfig.spec.json", diagnostics: false },
  },
};
