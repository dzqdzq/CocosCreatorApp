Object.defineProperty(exports, "__esModule", { value: true });

exports.validatePasteEnable = undefined;
exports.PROPERTY_CLIPBOARD_HANDLE = undefined;
exports.setVecInput = undefined;
exports.setElementReadonly = undefined;
exports.setElementInvalid = undefined;
exports.getNameByDump = undefined;
exports.getDocsURL = undefined;
exports.isI18nValid = undefined;
exports.isI18nPrefix = undefined;

const render_1 = require("@editor/sentry/render");
const i18nPrefix = "i18n:";

const isI18nPrefix = (e) => e.startsWith(i18nPrefix);

exports.isI18nPrefix = isI18nPrefix;

const isI18nValid = (e) =>
  !!(0, exports.isI18nPrefix)(e) &&
  ((e = e.substring(i18nPrefix.length)), !!Editor.I18n.t(e));

exports.isI18nValid = isI18nValid;

const getDocsURL = (e) => {
  var t =
    (e.displayName && e.displayName.match(/(?<=(cc|sp)\.\s*)(\w+)/)) ||
    (e.type && e.type.match(/(?<=cc\.\s*)(\w+)/));

  var t = t && t.length > 0 ? t[0] : "";
  return t ? Editor.App.urls.api + `/class/${t}?id=` + e.name : "";
};

exports.getDocsURL = getDocsURL;

const getNameByDump = (e) => {
  if (e.displayName && typeof e.displayName == "string") {
    var t = e.displayName.trim();
    if (t && !(0, exports.isI18nPrefix)(t)) {
      return t;
    }
    var r = t.substring(i18nPrefix.length);
    if (Editor.I18n.t(r)) {
      return t;
    }
  }
  let s = e.name || "";
  return (s = (s = (s = (s = s
    .trim()
    .replace(/^\S/, (e) => e.toUpperCase())).replace(/_/g, " ")).replace(
    / \S/g,
    (e) => " " + e.toUpperCase()
  )).replace(/([a-z])([A-Z])/g, "$1 $2")).trim();
};

exports.getNameByDump = getNameByDump;

const setElementInvalid = (e, t) => {
  let e_value = e.value;
  const s = e.value !== null && typeof e.value == "object";

  if (s) {
    e_value = JSON.stringify(e.value);
  }

  if (
    e.values &&
    e.values.some((e) => (s ? JSON.stringify(e) !== e_value : e !== e_value))
  ) {
    t.setAttribute("invalid", "");
  } else {
    t.removeAttribute("invalid");
  }
};

exports.setElementInvalid = setElementInvalid;
const vecAttrs = ["min", "max", "step"];

const setElementReadonly = (e, t) => {
  if (e && e.readonly) {
    t.setAttribute("readonly", "");
  } else {
    t.removeAttribute("readonly");
  }
};

exports.setElementReadonly = setElementReadonly;

const setVecInput = (t, r) => {
  const s = r.getAttribute("local");

  var { value, values } = t;

  var e;

  if (s && value && value[s] !== undefined) {
    if (value[s] === null) {
      e = new Error(`the ${s} of ${value} is null in ` + t.name);
      render_1.sentry.captureException(e);
    } else {
      r.setAttribute("value", value[s].toString());

      values && values.some((e) => e[s] !== value[s])
        ? r.setAttribute("invalid", "")
        : r.removeAttribute("invalid");

      vecAttrs.forEach((e) => {
        if (e in t) {
          r.setAttribute(e, t[e]);
        } else {
          r.removeAttribute(e);
        }
      });

      (0, exports.setElementReadonly)(t, r);
      r.removeAttribute("warn");
      r.removeAttribute("hidden");

      t.lock &&
        (e = t.lock[s]) &&
        (r.setAttribute("warn", ""),
        e.default === value[s] && r.setAttribute("hidden", ""),
        e.message) &&
        r.setAttribute("tooltip", e.message);
    }
  }
};

exports.setVecInput = setVecInput;
exports.PROPERTY_CLIPBOARD_HANDLE = "PROPERTY_CLIPBOARD_HANDLE";

const validatePasteEnable = (r, e) => {
  if (!e) {
    return false;
  }
  try {
    var t = JSON.parse(e);
    const { type, value, enumList = [], bitmaskList = [] } = t;
    if (type === undefined || value === undefined) {
      return false;
    }
    if (
      type !== r.type ||
      Boolean(r.isArray) !== Array.isArray(value) ||
      r.readonly
    ) {
      return false;
    }
    switch (type) {
      case "BitMask": {
        return (
          bitmaskList.length === r.bitmaskList?.length &&
          bitmaskList.every(
            (e, t) =>
              e.name === r.bitmaskList?.[t].name &&
              e.value === r.bitmaskList?.[t].value
          )
        );
      }
      case "Enum": {
        return (
          enumList.length === r.enumList?.length &&
          enumList.every(
            (e, t) =>
              e.name === r.enumList?.[t].name &&
              e.value === r.enumList?.[t].value
          ) &&
          enumList.some((e) => e.value === value)
        );
      }
      default: {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
};

exports.validatePasteEnable = validatePasteEnable;
