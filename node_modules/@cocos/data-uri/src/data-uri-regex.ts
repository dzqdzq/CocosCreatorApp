
// https://tools.ietf.org/html/rfc6838
// https://tools.ietf.org/html/rfc2397

const first = `[\\w\\d]`;
const char = `[\\w\\d\\!\\#\\$\\&\\-\\^_\\.\\+]`;
const restrictedName = `${first}${char}*`
const type = restrictedName;
const subtype = restrictedName;
const parameters = `(?:;[\\w\\-]+\\=[\\w\\-]+)+`;
const mediaType = `(${type})\\/(${subtype})(${parameters})?`;
const data = `.*`;
export const dataURI = `data:(${mediaType})?(;base64)?,(${data})`;