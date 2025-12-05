"use strict";function data(){return{twinkle:""}}function mounted(){this.refresh()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.watch=exports.computed=exports.data=exports.props=exports.template=void 0,exports.template=`
    <div class="state"
        :style="style"
        :twinkle="twinkle"
        :subtype="subType"
        @mousedown="mouseDown($event)"
        @dblclick="crumb"
    >
        <div class="name" ref="name">
            <ui-icon class="image" value="pose"
                v-if="isPoseExpr"
            ></ui-icon>
            <ui-label class="label"
                :value="dump.name"
            ></ui-label>
            <ui-icon class="icon" value="arrow-triangle-sharp"
                v-if="isParent"
            ></ui-icon>
        </div>
        <div class="starter"
            @mousedown.left.stop="mouseDownStarter($event)"
        >
            <ui-icon class="icon" value="add"></ui-icon>
        </div>
    </div>
`,exports.props=["dump"],exports.data=data,exports.computed={style(){return{top:Math.ceil(this.dump.top)+"px",left:Math.ceil(this.dump.left)+"px"}},isParent(){var t=this;return t.isSubStateMachine||t.isBlendMotion||t.isPoseExpr},isSubStateMachine(){return this.dump.type===this.$root.queryData.envType.SubStateMachine},isBlendMotion(){var t=this;return t.dump.type===t.$root.queryData.envType.MotionState&&t.dump.props.motion&&t.$root.queryData.animationBlendType.includes(t.dump.props.motion.type)},isPoseExpr(){return this.dump.type===this.$root.queryData.envType.PoseExprState},canNotAddComponent(){return this.$root.stateCanNotAddComponent(this.dump.type)},canNotRemove(){return this.$root.stateCanNotRemove(this.dump.type)},canNotCopy(){return this.$root.stateCanNotCopy(this.dump.type)},subType(){var t;return null==(t=null==(t=this.dump.props)?void 0:t.motion)?void 0:t.type}},exports.watch={dump(){this.refresh()}},exports.methods={refresh(){const t=this;window.requestAnimationFrame(()=>{t.setPosition()})},resize(){this.setPosition()},setPosition(){var t=this,e=(t.dump.width=t.$el.offsetWidth,t.dump.height=t.$el.offsetHeight,t.$parent.getPosition({width:t.dump.width,height:t.dump.height,centerX:t.dump.editorData.centerX,centerY:t.dump.editorData.centerY}));t.dump.top=e.top,t.dump.left=e.left},mouseDown(t){const a=this;function e(t){var e,o,n,i;a.mouseDownPoint&&"right"!==a.mouseDownPoint.button&&(t.stopPropagation(),t.preventDefault(),{clientX:n,clientY:i,left:e,top:o}=a.mouseDownPoint,n=t.clientX-n,t=t.clientY-i,Math.abs(n)<4&&Math.abs(t)<4||(a.mouseDownPoint.hasMoved=!0,i=a.$parent.$parent.graph,a.dump.left=e+n/i.scale,a.dump.top=o+t/i.scale))}a.mouseDownPoint={$element:t.target,hasMoved:!1,clientX:t.clientX,clientY:t.clientY,offsetX:t.offsetX,offsetY:t.offsetY,button:0===t.button?"left":"right",left:a.dump.left,top:a.dump.top},"right"===a.mouseDownPoint.button&&t.stopPropagation(),document.addEventListener("mousemove",e),document.addEventListener("mouseup",function t(){a.mouseDownPoint&&"right"===a.mouseDownPoint.button?a.mouseDownPoint.hasMoved||a.contextMenu(a.mouseDownPoint.$element):a.mouseDownPoint.hasMoved?a.$root.moveState(a.dump.index,{editorData:a.getCenterXY()}):a.$parent.select(a.dump),document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",t),a.mouseDownPoint=null})},mouseDownStarter(t){this.$parent.addShadowLine(this.dump.id)},crumb(){this.$parent.crumbState(this.dump.index)},contextMenu(t){const e=this;var o=[];e.canNotCopy||o.push({label:Editor.I18n.t("animation-graph.state.copy"),click(){e.$root.copyState(e.dump.index)}},{label:Editor.I18n.t("animation-graph.state.duplicate"),click(){e.$root.duplicateState(e.dump.index)}},{type:"separator"}),e.isParent&&(o.push({label:Editor.I18n.t("animation-graph.crumbs.edit"),click(){e.$parent.select(e.dump),e.$root.crumbState(e.dump.index)}}),o.push({type:"separator"})),e.isBlendMotion&&(o.push({label:Editor.I18n.t("animation-graph.state.turnMotionStateIntoSubStateMachine"),click(){e.$root.turnMotionStateIntoSubStateMachine(e.dump.index)}}),o.push({type:"separator"})),"ExitState"!==e.dump.type&&(o.push({label:Editor.I18n.t("animation-graph.transition.add"),click(){e.$parent.addShadowLine(e.dump.id)}}),o.push({type:"separator"})),e.canNotAddComponent||(o.push({label:Editor.I18n.t("animation-graph.component.add"),click(){e.$root.addComponent(e.dump.index,t)}}),o.push({type:"separator"})),e.canNotRemove||o.push({label:Editor.I18n.t("animation-graph.state.remove"),click(){e.$root.removeState(e.dump.index)}}),Editor.Menu.popup({menu:o})},getCenter(){var t=this,e=t.$el.offsetWidth,o=t.$el.offsetHeight;return{left:t.dump.left+e/2,top:t.dump.top+o/2}},getCenterXY(){var t=this;return t.$parent.getCenterXY({width:t.dump.width,height:t.dump.height,left:t.dump.left,top:t.dump.top})}},exports.mounted=mounted;