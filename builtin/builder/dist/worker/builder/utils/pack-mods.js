"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.packMods=packMods;const fs_extra_1=__importDefault(require("fs-extra")),path_1=__importDefault(require("path")),concat_with_sourcemaps_1=__importDefault(require("concat-with-sourcemaps"));async function packMods(e,t,a,r){var n=r["sourceMaps"],o=new concat_with_sourcemaps_1.default(!0,"all.js","\n");r.wrap&&o.add(null,"System.register([], function(_export, _context) { return { execute: function () {");for(const u of e)o.add(null,u.code,u.map);0!==Object.keys(t).length&&o.add(null,`(function(r) {
${Object.keys(t).map(e=>`  r('${e}', '${t[e]}');`).join("\n")} 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});`),r.wrap&&o.add(null,"} }; });"),n&&o.sourceMap&&("inline"===n?(e=Buffer.from(o.sourceMap).toString("base64"),o.add(null,"//# sourceMappingURL=data:application/json;charset=utf-8;base64,"+e)):o.add(null,`//# sourceMappingURL=${path_1.default.basename(a)}.map`)),await fs_extra_1.default.ensureDir(path_1.default.dirname(a)),await fs_extra_1.default.writeFile(a,o.content.toString()),n&&o.sourceMap&&"inline"!==n&&await fs_extra_1.default.writeFile(a+".map",o.sourceMap)}