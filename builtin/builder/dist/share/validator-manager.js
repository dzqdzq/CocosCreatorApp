Object.defineProperty(exports, "__esModule", { value: true });
exports.validatorManager = undefined;
exports.validator = undefined;
const validator_1 = require("./validator");
class ValidatorManager {
  validators = {};
  defaultValidator = new validator_1.Validator();
  addRule(a, r, t) {
    let e = this.defaultValidator;

    if (t) {
      this.validators[t] = this.validators[t] || new validator_1.Validator();
      e = this.validators[t];
    }

    e.add(a, r);
  }
  async check(a, r, t, e = "") {
    if (Array.isArray(r)) {
      try {
        if (["", undefined, null].includes(a) && !r.includes("required")) {
          return "";
        }
        for (const l of r) {
          var i = this.validators[e] || this.defaultValidator;
          if (!i.has(l)) {
            console.warn(`Rule ${l} is not exist.(pkgName: ${e})`);
            return "";
          }
          var o = await i.checkRuleWithMessage(l, a, t);
          if (o) {
            return o;
          }
        }
      } catch (a) {
        return a.message;
      }
    }
    return "";
  }
}
exports.validator = new validator_1.Validator();
exports.validatorManager = new ValidatorManager();
