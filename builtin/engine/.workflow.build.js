"use strict";const join=require("path")["join"],{writeFileSync,readFileSync,readdirSync,statSync,outputFileSync}=require("fs-extra");function readDirRecurse(e,t,r=""){for(const c of readdirSync(e)){var n=join(e,c),s=statSync(n),i=join(r,c);s.isFile()?t(i):readDirRecurse(n,t,i)}}exports.tsc=function(){return["./static/engine-compiler","./","./source/editor-extends"]},exports.less=function(){return[{source:"./source/contributions/project/modules/project-modules.less",dist:"./dist/contributions/project/modules/project-modules.css"},{source:"./source/contributions/preferences/engine.less",dist:"./dist/contributions/preferences/engine.css"}]},exports.file=function(e){var t=join(__dirname,"./static/cc-template.d.ts"),r=join(__dirname,"./modules/cc/cc.d.ts"),n=join(e.enginePath,"./bin/.declarations/cc.d.ts"),s=join(e.enginePath,"./bin/.declarations/cc.editor.d.ts");writeFileSync(r,`
/// <reference path="${n}"/>

/// <reference path="${s}"/>

${readFileSync(t)}

`.replace(/\\/g,"\\\\"));const i=join(__dirname,"./modules/cc/editor");return readDirRecurse(join(e.enginePath,"editor","exports"),e=>{var t=e.endsWith(".ts")?e.substr(0,e.length-3):e,t=join(i,t+".js"),e=`
const modsMgr = require('cc/mods-mgr');
module.exports = modsMgr.syncImport('${"cc/editor/"+((e=e).endsWith(".ts")?e.substr(0,e.length-3):e).replace(/\\/g,"\\\\")}');
`;outputFileSync(t,e,{encoding:"utf8"})}),[{source:"./source",dist:"./dist",filter(e){return/\.html$/.test(e)}},{source:"./modules/cc",dist:"../../node_modules/cc"}]},exports.npm=function(){return[{message:"安装编译原生引擎插件依赖的模块",params:["install","--production","--no-save"],path:join(__dirname,"./static/engine-compiler"),detail:"安装编译原生引擎插件依赖的模块失败"}]};