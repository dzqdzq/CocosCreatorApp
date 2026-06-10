Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = undefined;

const { existsSync } = require("fs");

class Validator {
  static internalVerifyRules = {
    pathExist: {
      func: (e) =>
        typeof e == "string" &&
        ((e = Editor.UI.__protected__.File.resolveToRaw(e)), existsSync(e)),
      message: "i18n:builder.warn.path_not_exist",
    },
    valid: {
      func: (e) => e != null,
      message: "i18n:builder.verify_rule_message.valid",
    },
    required: {
      func: (e) => e != null && e !== "",
      message: "i18n:builder.verify_rule_message.required",
    },
    normalName: {
      func: (e) => /^[a-zA-Z0-9_-]*$/.test(e),
      message: "i18n:builder.verify_rule_message.normalName",
    },
    noChinese: {
      func: (e) => !/.*[\u4e00-\u9fa5]+.*$/.test(e),
      message: "i18n:builder.verify_rule_message.no_chinese",
    },
    array: {
      func: (e) => Array.isArray(e),
      message: "i18n:builder.verify_rule_message.array",
    },
    string: {
      func: (e) => typeof e == "string",
      message: "i18n:builder.verify_rule_message.string",
    },
    number: {
      func: (e) => typeof e == "number",
      message: "i18n:builder.verify_rule_message.number",
    },
    http: {
      func: (e) => typeof e == "string" && e.startsWith("http"),
      message: "i18n:builder.verify_rule_message.http",
    },
    strictPath: {
      func: () => false,
      message: "i18n:builder.verify_rule_message.strict_path",
    },
    normalPath: {
      func: (e) =>
        typeof e == "string" &&
        /^[a-zA-Z]:[\\]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]*\s+\.)[\w -]+$/.test(
          e
        ),
      message: "i18n:builder.verify_rule_message.normal_path",
    },
  };
  static addRule(e, s) {
    if (!Validator.internalVerifyRules[e]) {
      Validator.internalVerifyRules[e] = s;
    }
  }
  customVerifyRules = {};
  has(e) {
    e = this.customVerifyRules[e] || Validator.internalVerifyRules[e];
    return !(!e || !e.func);
  }
  queryRuleMessage(e) {
    e = this.customVerifyRules[e] || Validator.internalVerifyRules[e];
    return e && e.message;
  }
  checkWithInternalRule(e, s, ...r) {
    var i = Validator.internalVerifyRules[e];
    return i && i.func
      ? i.func(s, ...r)
      : (console.warn(`Invalid check with ${s}: Rule ${e} is not exist.`),
        false);
  }
  async check(e, s, ...r) {
    return !(await this.checkRuleWithMessage(e, s, ...r));
  }
  async checkRuleWithMessage(e, s, ...r) {
    var i = this.customVerifyRules[e] || Validator.internalVerifyRules[e];
    return i && i.func
      ? (await i.func(s, ...r))
        ? ""
        : i.message
      : `Invalid check with ${s}: Rule ${e} is not exist.`;
  }
  add(e, s) {
    if (s && s.func && s.message) {
      this.customVerifyRules[e] = s;
    } else {
      console.warn(`Add rule ${e} failed!`);
    }
  }
}
exports.Validator = Validator;
