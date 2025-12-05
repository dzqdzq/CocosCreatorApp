"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.PreviewRowAux=void 0;const vue_js_1=require("vue/dist/vue.js"),lodash_1=require("lodash"),animation_ctrl_1=require("../../share/animation-ctrl"),animation_editor_1=require("../../share/animation-editor"),grid_ctrl_1=require("../../share/grid-ctrl"),utils_1=require("../../utils"),pop_menu_1=require("../../share/pop-menu"),global_data_1=require("../../share/global-data"),hooks_1=require("../hooks"),template=`
    <div :style="elStyle" class="content-item preview-row">
        <div
            tabindex="-1"
            class="row-wrap"
            :style="wrapStyle"
            @mousedown.self="onRowMousedown"
            @contextmenu="onRowContextmenu"
        >
            <!-- 关键帧显示 -->
            <div
                v-for="(frame, index) in keyFrames"
                :key="getFrameKey(frame)"
                :style="queryKeyStyle(frame.x)"
                :index="index"
                class="key"
                name="aux-key"
                @mousedown="onKeyMousedown($event, index)"
                @contextmenu="onKeyContextmenu($event, index)"
            ></div>

            <div
                v-for="(item, index) in selectKey"
                :key="'active_' + getFrameKey(item)"
                :style="queryKeyStyle(item.x)"
                class="active key"
                name="key"
            ></div>
        </div>
    </div>
`;exports.PreviewRowAux=(0,vue_js_1.defineComponent)({name:"PreviewRowAux",props:{name:{type:String,default:""},keyFrames:{type:Array,default:()=>[]},selectInfo:{type:Object,default:void 0},scroll:{type:Object,default:void 0},listIndex:{type:Number,default:0},offset:{type:Number,default:0},updateFrame:{type:Number,default:0},updatePosition:{type:Number,default:0},updateSelect:{type:Number,default:0},hidden:{type:Boolean,default:!1}},emits:{"select-key":null,"remove-key":null,"paste-key":null,"create-key":null},setup(l,m){const s=(0,hooks_1.useBaseStore)(),i=(0,hooks_1.useAuxCurveStore)(),a=(0,vue_js_1.ref)([]),e=(0,vue_js_1.computed)(()=>l.listIndex*animation_editor_1.animationEditor.LINE_HEIGHT-(l.scroll?.top??0));var t=(0,vue_js_1.computed)(()=>({transform:`translateY(${(0,vue_js_1.unref)(e)}px)`})),r=(0,vue_js_1.computed)(()=>({transform:`translateX(${l.offset}px)`}));async function p(e){var t,a=i.copyKeyframeSnap;if(null!=a)return t={...a.curve,newValue:a.dump.value},animation_ctrl_1.animationCtrl.copyAuxKey({name:a.name,frame:a.frame,data:t},{name:l.name,frame:e,data:t})}function n(){global_data_1.Flags.mouseDownName="",global_data_1.Flags.startDragGridInfo=null}function o(e){let t=!1;var a=(0,pop_menu_1.getPopMenuMap)(pop_menu_1.onAuxKeyContextMenus,!1);const r=l.name,n=l.keyFrames[e]["frame"];let o=[n];if(l.selectInfo&&Array.isArray(l.selectInfo.keyframes)){for(const u of l.selectInfo.keyframes)if(u.key===r&&u.frame===n){t=!0;break}t&&(o=l.selectInfo.keyframes.map(e=>e.frame))}return o=Array.from(new Set(o)),a.copyAuxKey.enabled=0<o.length,a.copyAuxKey.click=()=>{var t,e;o.length<1||(t=n,(e=l.keyFrames.find(e=>e.frame===t))&&null!=e.curve&&null!=e.dump&&(e={clip:s.currentClip,name:l.name,frame:e.frame,curve:(0,lodash_1.cloneDeep)(e.curve),dump:(0,lodash_1.cloneDeep)(e.dump)},i.setCopyKeyframe(e)))},null!=i.copyKeyframeSnap?(a.pasteAuxKey.enabled=!0,a.pasteAuxKey.click=()=>{p(n).then(()=>{m.emit("paste-key",r,n)})}):a.pasteAuxKey.enabled=!1,a.removeAuxKey.enabled=!0,a.removeAuxKey.click=()=>{animation_ctrl_1.animationCtrl.removeAuxKey(r,n).then(()=>{m.emit("remove-key",r,n),t&&m.emit("select-key",r,null)})},Object.values(a)}return(0,vue_js_1.watch)(()=>l.selectInfo,(e,t)=>{a.value=e?function(t){if(!t||!t.keyframes||!animation_ctrl_1.animationCtrl.clipsDump)return[];var a=[],r=new Set,n=l.keyFrames;for(let e=0;e<n.length;e++){const u=n[e];var o;r.has(u.frame)||null!=(o=t.keyframes.find(e=>e.key===u.prop&&u.frame===e.rawFrame))&&(a.push({key:o.key,frame:o.frame,rawFrame:o.rawFrame,x:o.x,offsetFrame:o.offsetFrame}),r.add(o.frame))}return a}(e):[]}),(0,hooks_1.useTickUpdate)(()=>l.updatePosition,()=>{var e=(0,vue_js_1.unref)(a);if(0<e.length)for(const t of e)t.x=grid_ctrl_1.gridCtrl.frameToCanvas(t.frame)}),{selectKey:a,elStyle:t,wrapStyle:r,getKeyMenu:o,queryKeyStyle:function(e){return{transform:`translateX(${Number.isFinite(e)?e:0}px) translateX(-50%) rotate(45deg)`}},getFrameKey:function(e){return e.frame+"__"+e.prop},onKeyMousedown:function(e,t){var a;0!==e.button||(a=(0,utils_1.checkCtrlOrCommand)(e),t=l.keyFrames[t],t={keyframes:[{key:l.name,rawFrame:t.frame,frame:t.frame,x:t.x,offsetFrame:0}],ctrl:a,offset:0,offsetFrame:0,startX:e.x},m.emit("select-key",l.name,t),a)||(global_data_1.Flags.mouseDownName="aux-key")},onKeyContextmenu:function(e,t){e.stopPropagation(),n();var a=o(t);-1<t&&t<=l.keyFrames.length-1&&(t=l.keyFrames[t],a.push({label:"Frame: "+t.frame,enabled:!1})),Editor.Menu.popup({x:e.pageX,y:e.pageY+10,menu:a})},onRowMousedown:function(e){m.emit("select-key",l.name,null)},onRowContextmenu:function(e){e.stopPropagation(),n();var t=function(e){const t=(0,pop_menu_1.getPopMenuMap)(pop_menu_1.onAuxRowContextMenus,!1),a=l.name;t.createAuxKey={...pop_menu_1.popMenuMap.createAuxKey,enabled:!0,click(){animation_ctrl_1.animationCtrl.createAuxKey(a,e).then(()=>{m.emit("create-key",a,e)})}},null!=i.copyKeyframeSnap&&(t.pasteAuxKey.enabled=!0,t.pasteAuxKey.click=()=>{p(e).then(()=>{m.emit("paste-key",a,e)})});return Object.values(t)}(e=grid_ctrl_1.gridCtrl.pageToFrame(e.x));t.push({...pop_menu_1.popMenuMap.separator}),t.push({label:"frame: "+e,enabled:!1}),Editor.Menu.popup({menu:t})}}},template:template});