"use strict";function mounted(){this.$el.render(this.dump)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.watch=exports.props=exports.template=void 0,exports.template=`
<ui-prop
    @change="change()"
></ui-prop>
`,exports.props=["dump"],exports.watch={dump(){this.$el.render(this.dump)}},exports.methods={change(){this.$el.dispatch("change-dump")}},exports.mounted=mounted;