"use strict";
const e = require("fs");
const t = require("path");
const o = require("../utils/cache");
const n = require("../utils/operation");
const i = require("../utils/communication");
const r = require("../utils/event");
let s = "";

let d = function(e,t){
  if (o.recording) {
    n.rename();
    r.emit("nodes_focus",true);
    return;
  }
  Editor.Ipc.sendToPanel("scene","scene:set-property",{id:e.id,path:"name",type:"String",value:t,isSubProp:false});
  Editor.Ipc.sendToPanel("scene","scene:undo-commit");
  e.name = t;
  n.rename();
  r.emit("nodes_focus",true);
};

exports.template = e.readFileSync(t.join(__dirname,"../template/node.html"),"utf-8");
exports.props = ["start","node"];
exports.data = function(){return {style:{"padding-left":15*this.node.level+20,"padding-right":10,transform:`translateY(${20*this.start}px)`},lastClickTime:0,lockRename:false};};

exports.methods = {t:e=>Editor.T(`HIERARCHY.${e}`),onUpdateStyle(e){
  this.style.transform = `translateY(${20*e}px)`;
  return this.style;
},onMouseDown(e){
  if (!this.node.ignore) {
    clearTimeout(this._renameTimer);
    clearTimeout(this._inputBlurTimer);
    e.stopPropagation();
    Editor.Selection.setContext("node",this.node.id);

    if (2===e.button) {
      i.popup("node",{x:e.clientX,y:e.clientY});
    }

    s = this.node.id;
  }
},onMouseEnter(){Editor.Selection.hover("node",this.node.id)},onMouseUp(e){
  if (this.node.ignore) {
    return;
  }if (s!==this.node.id) {
    return;
  }
  s = "";

  if (2!==e.button) {
    Editor.Selection.setContext("node");
  }

  if(e.ctrlKey||e.metaKey){
    let e = Editor.Selection.curSelection("node");
    let t = e.indexOf(this.node.id);

    if (-1!==t) {
      e.splice(t,1);
    } else {
      e.push(this.node.id);
    }

    Editor.Selection.select("node",e,true,true);
    return;
  }if(e.shiftKey){
    let e=Editor.Selection.curSelection("node");if (!e||e.length<=0) {
      e = this.node.id;
      Editor.Selection.select("node",e,true,true);
      return;
    }
    let t = o.queryNodes();
    let n = o.queryNode(e[0]);
    if (n.index===this.node.index) {
      e = this.node.id;
      Editor.Selection.select("node",e,true,true);
      return;
    }
    e = [];
    let i=n.index>this.node.index?-1:1;for(let o=n.index;o!==this.node.index+i;o+=i){
      let n=t[o];

      if (n.show) {
        e.push(n.id);
      }
    }
    Editor.Selection.select("node",e,true,true);
    return;
  }let t=this.node.id;Editor.Selection.select("node",t,true,true)
},onMouseLeave(){
  Editor.Selection.hover("node",null);
  s = "";
},onClick(){if (this.node.ignore) {
  return;
}let e=(new Date).getTime();return e-this.lastClickTime>=2e3?(this.lastClickTime=e,void 0):this.node.locked||!this.node.selected||this.node.rename?(n.rename(),void 0):(this._renameTimer=setTimeout(()=>{n.rename(this.node.id)},300),void 0)},onDBClick(){
  if (!this.node.ignore) {
    clearTimeout(this._renameTimer);

    if (!this.node.rename) {
      Editor.Ipc.sendToPanel("scene","scene:center-nodes",[this.node.id]);
    }
  }
},onIClick(e){
  if (this.node.ignore) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  let t=!this.node.fold;

  if (e.altKey) {
    n.recFoldNodes(this.node.id,t);
  }

  n.fold(this.node.id,t);
},onIDBClick(e){
  e.stopPropagation();
  e.preventDefault();
},onIMouseDown(e){
  e.stopPropagation();
  e.preventDefault();
},onIMouseUp(e){
  e.stopPropagation();
  e.preventDefault();
},onInputBlur(e){
  e.stopPropagation();
  if (this.lockRename) {
    this.lockRename = false;
    return;
  }let t=e.target;
  this._inputBlurTimer = setTimeout(()=>{d(this.node,t.value)},300);
},onInputKeydown(e){switch(e.stopPropagation(),e.keyCode){case 13:
  this.lockRename = true;
  d(this.node,e.target.value);
  break;case 27:
  this.lockRename = true;
  n.rename();}},onInputMouseDown(e){e.stopPropagation()},onInputClick(e){
  e.stopPropagation();
  e.preventDefault();
},onLockClick(e){
  e.stopPropagation();
  e.preventDefault();
  Editor.Ipc.sendToPanel("scene","scene:change-node-lock",this.node.id);
}};

exports.directives = {init(){requestAnimationFrame(()=>{
  let e=this.vm.$el.getElementsByTagName("input")[0];

  if (e) {
    e.focus();
    e.select();
  }
})}};