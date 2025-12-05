"use strict";
// https://tools.ietf.org/html/rfc6838
// https://tools.ietf.org/html/rfc2397
Object.defineProperty(exports, "__esModule", { value: true });
const first = `[\\w\\d]`;
const char = `[\\w\\d\\!\\#\\$\\&\\-\\^_\\.\\+]`;
const restrictedName = `${first}${char}*`;
const type = restrictedName;
const subtype = restrictedName;
const parameters = `(?:;[\\w\\-]+\\=[\\w\\-]+)+`;
const mediaType = `(${type})\\/(${subtype})(${parameters})?`;
const data = `.*`;
exports.dataURI = `data:(${mediaType})?(;base64)?,(${data})`;
//# sourceMappingURL=data-uri-regex.js.map