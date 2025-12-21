"use strict";function data(){return{}}function mounted(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.components=exports.computed=exports.watch=exports.props=exports.template=void 0,exports.data=data,exports.mounted=mounted,exports.template=`
    <div class="control-pointer"
        name = "pointer"
        :style="calcStyle"
    >
        <ui-icon value="play"></ui-icon>
        <span></span>
    </div>
`,exports.props=["position","offset"],exports.watch={},exports.computed={},exports.components={},exports.methods={calcStyle(){return`transform: translateX(${0|this.position}px);`}};