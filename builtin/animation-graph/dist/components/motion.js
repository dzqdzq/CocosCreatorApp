"use strict";function data(){return{nodes:{},lines:{}}}function mounted(){this.refresh()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.watch=exports.data=exports.props=exports.components=exports.template=void 0,exports.template=`
    <section>
        <motion-node
            v-for="(dump,id) in nodes" 
            :key="id"
            :ref="id"
            :type="dump.type"
            :active="dump.level.join('')===$root.queryData.view.motionLevel.join('')"
            :dump="dump"
        ></motion-node>
        <svg>
            <path
                v-for="(dump,id) in lines" 
                :key="id"
                :ref="id"
                :d="getLinePath(dump)"
            ></path>
        </svg>
    </section>
`,exports.components={"motion-node":require("./motion-node")},exports.props=["graph"],exports.data=data,exports.watch={graph(){this.refresh()}},exports.methods={refresh(){var e=this;e.nodes={},e.lines={},e.graph&&this.mergeNode(e.graph)},resize(){var e=this;for(const t in e.$refs)Array.isArray(e.$refs[t])&&e.$refs[t].forEach(e=>{e.resize&&e.resize()})},select(t){const o=this;o.$children.forEach(e=>{e.dump.id===t.id&&o.$root.select(t)})},mergeNode(e){var t=this,o=t.$parent.graph,i="state-"+e.level.join("-");if(t.$set(t.nodes,i,Object.assign({id:i,top:o.centerY,left:o.centerX},e)),e.children)for(const n of e.children){var r=t.mergeNode(n);t.mergeLine(i,r,e.level.length-1)}return i},mergeLine(e,t,o){var i=e+"_to_"+t;this.$set(this.lines,i,{id:i,fromStateId:e,toStateId:t,level:o})},getLinePath(e){var t,{fromStateId:e,toStateId:o}=e,e=this.nodes[e],o=this.nodes[o],i=e.left+e.width/2+4,e=e.top+e.height/2;return isNaN(i)||isNaN(e)||(t=o.left+o.width/2+4,o=o.top+o.height/2,isNaN(t))||isNaN(o)?"":"M"+i+" "+e+" "+("C"+i+" "+(e+o)/2+","+t+" "+(e+o)/2+",")+t+" "+o},contextMenu(e){const t=this,o=t.$root.queryData.envType,i=t.nodes["state-0"],r=t.getCenterXY({width:i.width,height:i.height/2,left:e.offsetX,top:e.offsetY});Editor.Menu.popup({menu:[{label:Editor.I18n.t("animation-graph.motion.addAnim"),click(){t.$root.addMotionToMotion(i.level,{type:o.ClipMotion,editorData:r})}},{label:Editor.I18n.t("animation-graph.motion.add1D"),click(){t.$root.addMotionToMotion(i.level,{type:o.AnimationBlend1D,editorData:r})}},{label:Editor.I18n.t("animation-graph.motion.add2D"),click(){t.$root.addMotionToMotion(i.level,{type:o.AnimationBlend2D,editorData:r})}},{type:"separator"},{label:Editor.I18n.t("animation-graph.layer.bestViewport"),click(){t.$parent.bestViewport()}},{type:"separator"},{label:Editor.I18n.t("animation-graph.crumbs.back"),click(){var e=t.$root.queryData.view.crumbs.length-2;t.$root.crumbView(e)}}]})},drop(e,t){var o=this,i=o.$root.queryData.envType,r=o.nodes["state-0"],n=o.getCenterXY({width:r.width,height:r.height/2,left:t.offsetX,top:t.offsetY});o.$root.addMotionToMotion(r.level,{type:i.ClipMotion,uuid:t.uuid,editorData:n})},getCenterXY(e){return this.$parent.getCenterXY(e)},getPosition(e){return this.$parent.getPosition(e)}},exports.mounted=mounted;