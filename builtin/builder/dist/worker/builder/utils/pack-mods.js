"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.packMods=void 0;const fs_extra_1=__importDefault(require("fs-extra")),path_1=__importDefault(require("path")),concat_with_sourcemaps_1=__importDefault(require("concat-with-sourcemaps"));async function packMods(e,t,a,r){var o=r["sourceMaps"],n=new concat_with_sourcemaps_1.default(!0,"all.js","\n");r.wrap&&n.add(null,"System.register([], function(_export, _context) { return { execute: function () {");for(const u of e)n.add(null,u.code,u.map);0!==Object.keys(t).length&&n.add(null,`(function(r) {
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
});`),r.wrap&&n.add(null,"} }; });"),o&&n.sourceMap&&("inline"===o?(e=Buffer.from(n.sourceMap).toString("base64"),n.add(null,"//# sourceMappingURL=data:application/json;charset=utf-8;base64,"+e)):n.add(null,`//# sourceMappingURL=${path_1.default.basename(a)}.map`)),await fs_extra_1.default.ensureDir(path_1.default.dirname(a)),await fs_extra_1.default.writeFile(a,n.content.toString()),o&&n.sourceMap&&"inline"!==o&&await fs_extra_1.default.writeFile(a+".map",n.sourceMap)}exports.packMods=packMods;