"use strict";function data(){return{}}function mounted(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.components=exports.computed=exports.watch=exports.data=exports.props=exports.template=void 0,exports.template=`
    <div class="control-pointer"
        name = "pointer"
        :style="calcStyle"
    >
        <ui-icon value="play"></ui-icon>
        <span></span>
    </div>
`,exports.props=["position","offset"],exports.data=data,exports.watch={},exports.computed={},exports.components={},exports.methods={calcStyle(){return`transform: translateX(${0|this.position}px);`}},exports.mounted=mounted;