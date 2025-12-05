"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const regexes = __importStar(require("./data-uri-regex"));
const dataURIRegex = new RegExp(regexes.dataURI);
function parse(dataURI) {
    const dataURIMatches = dataURI.match(dataURIRegex);
    if (dataURIMatches === null) {
        return null;
    }
    const [, mediaType, mimeTypeType, mimeTypeSubtype, mimeTypeParameters, base64, data,] = dataURIMatches;
    const result = {
        data,
    };
    if (mediaType) {
        result.mediaType = {
            value: mediaType,
            type: mimeTypeType,
            subtype: mimeTypeSubtype,
        };
        if (mimeTypeParameters) {
            result.mediaType.parameters = mimeTypeParameters;
        }
    }
    if (base64) {
        result.base64 = true;
    }
    return result;
}
exports.parse = parse;
exports.defaultMediaType = 'text/plain;charset=US-ASCII';
//# sourceMappingURL=index.js.map