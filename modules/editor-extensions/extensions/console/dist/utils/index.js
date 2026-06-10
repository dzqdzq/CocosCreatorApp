Object.defineProperty(exports, "__esModule", { value: true });

exports.fileLink = undefined;
exports.weblink = undefined;
exports.baseLocalLinkClause = undefined;
exports.winLocalLinkClause2 = undefined;
exports.unixLocalLinkClause2 = undefined;
exports.winLocalLinkClause = undefined;
exports.winDrivePrefix = undefined;
exports.unixLocalLinkClause = undefined;

exports.replaceHttpAndLocalPath2UILink = replaceHttpAndLocalPath2UILink;
exports.transformText = transformText;
const platform_1 = require("./platform");
const pathPrefix = "(\\.\\.?|\\~)";
const pathSeparatorClause = "\\/";
const excludedPathCharactersClause = "[^\\0\\s!`&*()\\[\\]'\":;\\\\]";

exports.unixLocalLinkClause =
  "((" +
  pathPrefix +
  "|(" +
  excludedPathCharactersClause +
  ")+)?(" +
  pathSeparatorClause +
  "(" +
  excludedPathCharactersClause +
  ")+)+)";

exports.winDrivePrefix = "(?:\\\\\\\\\\?\\\\)?[a-zA-Z]:";
const winPathPrefix = "(" + exports.winDrivePrefix + "|\\.\\.?|\\~)";

const winPathSeparatorClause = "(\\\\|\\/)";
const winExcludedPathCharactersClause = "[^\\0<>\\?\\|\\/\\s!`&*()\\[\\]'\":;]";

exports.winLocalLinkClause =
  "((" +
  winPathPrefix +
  "|(" +
  winExcludedPathCharactersClause +
  ")+)?(" +
  winPathSeparatorClause +
  "(" +
  winExcludedPathCharactersClause +
  ")+)+)";

const excludedPathCharactersClause2 = "[^\\0\\s!`&*()\\[\\]'\":;\\\\\\/]";

function replaceHttpAndLocalPath2UILink(e) {
  return e
    .split(" ")
    .map((e) =>
      e.replace(
        new RegExp(
          `(${exports.weblink.source})|(${exports.baseLocalLinkClause})|(${exports.fileLink.source})`,
          "g"
        ),
        (e) => `{link[${e}](${e})}`
      )
    )
    .join(" ");
}
exports.unixLocalLinkClause2 = `^~?(\\/${excludedPathCharactersClause2}+)+\\/?$`;
exports.winLocalLinkClause2 = `^[a-zA-Z]:((\\\\|\\/)${excludedPathCharactersClause2}*)+$`;

exports.baseLocalLinkClause = platform_1.isWindows
  ? exports.winLocalLinkClause2
  : exports.unixLocalLinkClause2;

exports.weblink =
  /^(((http|https|ftp):\/\/)|(www\.))[\w-]+(\.[\w-]+)+([\w-.,@?^=%&:/~+#-\(\)]*[\w@?^=%&/~+#-\(\)])?/;
exports.fileLink = /^(file:\/\/\/[^)]+)$/g;
const renderTypes = {
  link(e, a) {
    return `<ui-link value="${(a = a.replace(/:\d+/g, ""))}">${
      e || a
    }</ui-link>`;
  },
  message(a, r) {
    let e = [];
    try {
      e = JSON.parse(r);
    } catch (e) {
      console.debug(e);
      return `<span>${a}-${r}<span>`;
    }
    return `<ui-link type="message" value='${r}'>${a || e[2]}</ui-link>`;
  },
  asset(e, a) {
    return `<ui-link type="${
      a.startsWith("db://") ? "assetUrl" : "assetUuid"
    }" value="${a}">${e || a}</ui-link>`;
  },
  node(e, a) {
    return `<ui-link type="nodeUuid" value="${a}">${e || a}</ui-link>`;
  },
  image(e, a) {
    return `
        <ui-link value="${a}">
            <ui-image value="${a}" max-height>${e || a}</ui-image>
        </ui-link>
        `;
  },
  i18n(e, a) {
    return Editor.I18n.t(a);
  },
  hidden() {
    return "";
  },
};
function transformText(e) {
  return e.replace(
    /\{([\w]+)(?:\[([^[]*)\])?(?:\(([^()]*)\))\}/gi,
    (e, a, r, t) => {
      a = a.toLowerCase();
      return renderTypes[a] ? renderTypes[a](r, t) : e;
    }
  );
}
