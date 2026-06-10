Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
const webOptions = {
  options: {
    enableAdsense: {
      label: "i18n:adsense-h5g-plugin.options.enableAdsense",
      default: false,
      render: { ui: "ui-checkbox" },
    },
    adsensePropertyCode: {
      label: "i18n:adsense-h5g-plugin.options.adsensePropertyCode",
      description: "i18n:adsense-h5g-plugin.options.adsensePropertyCodeTips",
      render: {
        ui: "ui-input",
        attributes: {
          placeholder:
            "i18n:adsense-h5g-plugin.options.adsensePropertyCodePlaceholder",
        },
      },
      verifyRules: ["adsensePropertyCodeRule"],
    },
    enableTestAd: {
      label: "i18n:adsense-h5g-plugin.options.enableTestAd",
      description: "i18n:adsense-h5g-plugin.options.enableTestAdTips",
      default: false,
      render: { ui: "ui-checkbox" },
    },
  },
  verifyRuleMap: {
    adsensePropertyCodeRule: {
      message: "i18n:adsense-h5g-plugin.adsensePropertyCodeRule_msg",
      func(e) {
        return new RegExp("^ca-pub-\\d+$").test(e);
      },
    },
  },
  panel: "./panel",
};
exports.configs = {
  "*": { hooks: "./hooks" },
  "web-desktop": { ...webOptions },
  "web-mobile": { ...webOptions },
};
