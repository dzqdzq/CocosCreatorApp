Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
const common_options_validator_1 = require("./share/common-options-validator");
const platforms_options_1 = require("./share/platforms-options");
function register(t) {
  Object.keys(common_options_validator_1.commonOptionConfigs).forEach((o) => {
    t.contributions.profile.editor["common." + o] = {
      label: common_options_validator_1.commonOptionConfigs[o].label,
      default: common_options_validator_1.commonOptionConfigs[o].default,
    };
  });

  t.contributions.profile.editor.allPlatforms = {
    default: platforms_options_1.PLATFORMS,
  };
}
