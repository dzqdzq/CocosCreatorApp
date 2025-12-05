"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,r,i){void 0===i&&(i=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&("get"in a?t.__esModule:!a.writable&&!a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,i,a)}:function(e,t,r,i){e[i=void 0===i?r:i]=t[r]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&__createBinding(t,e,r);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.transformPluginScript=void 0;const babel=__importStar(require("@babel/core"));async function transformPluginScript(e,t){var r=!(5e5<e.length),r=await babel.transformAsync(e,{compact:r,plugins:[[wrapPluginScript(t)]]});return r?{code:r.code}:{code:e}}exports.transformPluginScript=transformPluginScript;const wrapPluginScript=n=>{const l=babel.template.statements(`(function(root) {
    %%HIDE_COMMONJS%%;
    %%HIDE_AMD%%;
    %%SIMULATE_GLOBALS%%;
    (function() {
        %%ORIGINAL_CODE%%
    }).call(root);
})(
    // The environment-specific global.
    (function() {
        if (typeof globalThis !== 'undefined') return globalThis;
        if (typeof self !== 'undefined') return self;
        if (typeof window !== 'undefined') return window;
        if (typeof global !== 'undefined') return global;
        if (typeof this !== 'undefined') return this;
        return {};
    }).call(this),
);
`,{preserveComments:!0,syntacticPlaceholders:!0});return{visitor:{Program:(e,t)=>{let r;n.hideCommonJs&&(r=babel.types.variableDeclaration("var",["exports","module","require"].map(e=>babel.types.variableDeclarator(babel.types.identifier(e),babel.types.identifier("undefined")))));let i;n.hideAmd&&(i=babel.types.variableDeclaration("var",["define"].map(e=>babel.types.variableDeclarator(babel.types.identifier(e),babel.types.identifier("undefined")))));let a;n.simulateGlobals&&0!==n.simulateGlobals.length&&(a=babel.types.variableDeclaration("var",n.simulateGlobals.map(e=>babel.types.variableDeclarator(babel.types.identifier(e),babel.types.identifier("root"))))),e.node.body=l({ORIGINAL_CODE:e.node.body,SIMULATE_GLOBALS:a,HIDE_COMMONJS:r,HIDE_AMD:i})}}}};