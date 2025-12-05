"use strict";function data(){return{collapse:!1,twinkle:""}}function mounted(){this.refresh()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.watch=exports.computed=exports.components=exports.data=exports.props=exports.template=void 0,exports.template=`
    <div class="state" type="PoseNode"
        :style="style"
        :twinkle="twinkle"
        :collapse="collapse"
        :inline="isInline"
        :pose-input="isPoseInput"
        :pose-output="isPoseOutput"
        :is-parent="isParent"
        @mousedown="mouseDown($event)"
        @dblclick="crumb"
    >
        <div class="name" ref="name">
            <div class="avatar inputs" ref="inputs-avatar"></div>
            <div class="avatar outputs" ref="outputs-avatar"></div>
            <ui-icon class="collapse" value="arrow-right"
                v-if="!isInline"
                @click="toggleCollapse"
                @dblclick.stop
            ></ui-icon>
            <ui-label class="label"
                :value="dump.name"
            ></ui-label>
            <ui-icon class="insert" value="add"
                v-if="canInsertInput"
                @click.stop="showInputsMenu()"
                @dblclick.stop
            ></ui-icon>
            <ui-icon class="icon" value="arrow-triangle-sharp"
                v-if="isParent"
            ></ui-icon>
        </div>
        <pose-node-outputs ref="outputs"
            :dump="dump"
        ></pose-node-outputs>
        <pose-node-inputs ref="inputs"
            :dump="dump"
        ></pose-node-inputs>
    </div>
`,exports.props=["dump"],exports.data=data,exports.components={"pose-node-outputs":require("./pose-node-outputs"),"pose-node-inputs":require("./pose-node-inputs")},exports.computed={style(){var t=this,e=Math.ceil(t.dump.top),o=Math.ceil(t.dump.left);let s=t.isRootOutputNode?"#CD3A58":"#227f9b";var n=(s=null!=(n=t.dump.appearance)&&n.themeColor?t.dump.appearance.themeColor:s)+"80",t=""+s;return{top:e+"px",left:o+"px","--theme-color":s,"--background-color":n,"--border-color":t}},canNotCopy(){return this.$root.queryData.cannotRemoveStateType.includes(this.dump.type)},isRootOutputNode(){return this.dump.id===this.$root.queryData.view.poseExpr.rootOutputNode},isParent(){return this.dump.enterable},isInline(){var t,e=this;let o=!(null==(t=e.dump.appearance)||!t.inline);return o=1<e.dump.inputs.length||1<e.dump.outputs.length?!1:o},isPoseInput(){return 1===this.dump.inputs.length&&5===this.dump.inputs[0].type},isPoseOutput(){return 1===this.dump.outputs.length&&5===this.dump.outputs[0].type},canInsertInput(){return this.dump.inputInsertInfos&&Object.keys(this.dump.inputInsertInfos).length}},exports.watch={dump(){this.refresh()}},exports.methods={refresh(){var t=this;t.collapse=!!t.dump.editorData.collapse,t.setPosition()},resize(){this.setPosition()},setPosition(){var t=this,e=(t.dump.width=t.$el.offsetWidth,t.dump.height=t.$el.offsetHeight,t.$parent.getPosition({width:t.dump.width,height:t.dump.height,centerX:t.dump.editorData.centerX,centerY:t.dump.editorData.centerY}));t.dump.top=e.top,t.dump.left=e.left},mouseDown(t){const p=this;function e(t){var e,o,s,n;p.mouseDownPoint&&"right"!==p.mouseDownPoint.button&&(t.stopPropagation(),t.preventDefault(),{clientX:s,clientY:n,left:e,top:o}=p.mouseDownPoint,s=t.clientX-s,t=t.clientY-n,Math.abs(s)<4&&Math.abs(t)<4||(p.mouseDownPoint.hasMoved=!0,n=p.$parent.$parent.graph,p.dump.left=e+s/n.scale,p.dump.top=o+t/n.scale))}p.mouseDownPoint={$element:t.target,hasMoved:!1,clientX:t.clientX,clientY:t.clientY,offsetX:t.offsetX,offsetY:t.offsetY,button:0===t.button?"left":"right",left:p.dump.left,top:p.dump.top},"right"===p.mouseDownPoint.button&&t.stopPropagation(),document.addEventListener("mousemove",e),document.addEventListener("mouseup",function t(){p.mouseDownPoint&&"right"===p.mouseDownPoint.button?p.mouseDownPoint.hasMoved||p.contextMenu(p.mouseDownPoint.$element):p.mouseDownPoint.hasMoved?p.$root.movePoseNode(p.dump.id,p.getCenterXY()):p.$parent.select(p.dump),document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",t),p.mouseDownPoint=null})},contextMenu(t){const e=this;var o;e.dump.id!==e.$parent.graph.rootOutputNode&&(o=[],e.canNotCopy||o.push({label:Editor.I18n.t("animation-graph.pose.node.copy"),click(){e.$root.copyPoseNode(e.dump.id)}},{label:Editor.I18n.t("animation-graph.pose.node.duplicate"),click(){e.$root.duplicatePoseNode(e.dump.id)}},{type:"separator"}),o.push({label:Editor.I18n.t("animation-graph.pose.node.removeThis"),click(){e.$root.removePoseNode(e.dump.id)}}),o.length)&&Editor.Menu.popup({menu:o})},getCenter(){var t=this,e=t.$el.offsetWidth,o=t.$el.offsetHeight;return{left:t.dump.left+e/2,top:t.dump.top+o/2}},getPointCenter(t,e){var o=this,s=o.$el.getBoundingClientRect(),t=t?"outputs":"inputs";let n=o.$refs[t].$refs["point-"+e][0];o.$el.hasAttribute("collapse")&&(n=o.$refs[t+"-avatar"]);var e=o.$parent.$parent.graph,t=n.getBoundingClientRect(),p=t.width/2,i=t.height/2,u=o.dump.left+(t.left-s.left)/e.scale,o=o.dump.top+(t.top-s.top)/e.scale;return{left:u+p/e.scale,top:o+i/e.scale,clientX:t.left+p,clientY:t.top+i}},getCenterXY(){var t=this;return t.$parent.getCenterXY({width:t.dump.width,height:t.dump.height,left:t.dump.left,top:t.dump.top})},addShadowLine(t,e){e[(t?1:3)-1]=this.dump.id,this.$parent.addShadowLine(t,e)},crumb(){this.dump.enterable&&this.$parent.crumbPoseNode(this.dump.id)},toggleCollapse(){this.$root.toggleCollapsePoseNode(this.dump.id,!this.collapse)},showInputsMenu(){const t=this;var e=t.dump.inputInsertInfos,o=[];for(const n in e){var s=e[n];o.push({label:s.displayName,click(){t.$root.addPoseNodeInput(t.dump.id,n)}})}Editor.Menu.popup({menu:o})}},exports.mounted=mounted;