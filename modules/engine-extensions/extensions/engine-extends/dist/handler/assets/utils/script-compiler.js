"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,r,i){void 0===i&&(i=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&("get"in n?t.__esModule:!n.writable&&!n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,i,n)}:function(e,t,r,i){e[i=void 0===i?r:i]=t[r]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(){var n=function(e){return(n=Object.getOwnPropertyNames||function(e){var t,r=[];for(t in e)Object.prototype.hasOwnProperty.call(e,t)&&(r[r.length]=t);return r})(e)};return function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r=n(e),i=0;i<r.length;i++)"default"!==r[i]&&__createBinding(t,e,r[i]);return __setModuleDefault(t,e),t}}();Object.defineProperty(exports,"__esModule",{value:!0}),exports.transformPluginScript=transformPluginScript;const babel=__importStar(require("@babel/core"));async function transformPluginScript(e,t){var r=!(5e5<e.length),r=await babel.transformAsync(e,{compact:r,plugins:[[wrapPluginScript(t)]]});return r?{code:r.code}:{code:e}}const wrapPluginScript=a=>{const l=babel.template.statements(`(function(root) {
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
`,{preserveComments:!0,syntacticPlaceholders:!0});return{visitor:{Program:(e,t)=>{let r;a.hideCommonJs&&(r=babel.types.variableDeclaration("var",["exports","module","require"].map(e=>babel.types.variableDeclarator(babel.types.identifier(e),babel.types.identifier("undefined")))));let i;a.hideAmd&&(i=babel.types.variableDeclaration("var",["define"].map(e=>babel.types.variableDeclarator(babel.types.identifier(e),babel.types.identifier("undefined")))));let n;a.simulateGlobals&&0!==a.simulateGlobals.length&&(n=babel.types.variableDeclaration("var",a.simulateGlobals.map(e=>babel.types.variableDeclarator(babel.types.identifier(e),babel.types.identifier("root"))))),e.node.body=l({ORIGINAL_CODE:e.node.body,SIMULATE_GLOBALS:n,HIDE_COMMONJS:r,HIDE_AMD:i})}}}};