Object.defineProperty(exports, "__esModule", { value: true });
exports.useI18n = useI18n;
const i18nPrefixRE = /^i18n:/;
function useI18n() {
  return {
    t: (e, t) => {
      if (i18nPrefixRE.test(e)) {
        e = e.slice(5);
      }

      return Editor.I18n.t(e, t);
    },
  };
}
