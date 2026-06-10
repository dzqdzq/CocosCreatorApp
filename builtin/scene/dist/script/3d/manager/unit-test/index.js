Object.defineProperty(exports, "__esModule", { value: true });
exports.unitTestMgr = undefined;
const target_override_test_1 = require("./target-override-test");
const nested_prefab_test_1 = require("./nested-prefab-test");
class UnitTestManager {
  _unitTestMap = new Map();
  constructor() {
    this._unitTestMap.set(
      "targetOverrideTest",
      target_override_test_1.targetOverrideTest
    );

    this._unitTestMap.set(
      "nestedPrefabTest",
      nested_prefab_test_1.nestedPrefabTest
    );
  }
  async test(t, r) {
    var r = r.name;
    var s = this._unitTestMap.get(r);
    if (s) {
      let e = false;
      try {
        e = await s.test(t);
      } catch (e) {
        console.error(r + " test unit failed:", e);
      }
      await s.clear();
      return e;
    }
  }
}
const unitTestMgr = new UnitTestManager();
exports.unitTestMgr = unitTestMgr;
