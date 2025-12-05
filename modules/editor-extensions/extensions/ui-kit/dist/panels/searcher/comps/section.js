"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.props=exports.template=exports.name=void 0,exports.name="comps-section",exports.template=`
<ui-section class="section"
    :header="header"
    :expand="expand"
>
    <div class="line"
        v-for="(info, key) in data"
        v-if="info.name"
        :key="key"
        :value="key"
        @dblclick.stop="onSelect(key, info)"
        @click.stop="onSelect(key, info)"
    >
        <ui-icon default="component" color="true" :value="info.iconName"></ui-icon>
        <ui-icon value="location" class="location"
            v-if="info.assetUuid"
            @click.stop="twinkle(info.assetUuid)"
        ></ui-icon>
        <span class="name">{{getName(info)}}</span>
        <ui-icon color="true" class="select" value="check-b"></ui-icon>
    </div>
    <comps-section
        v-else
        :header="key"
        :data="info"
        :expand="expand"
        @confirm="onSelect"
    ></comps-section>
</ui-section>
`,exports.props=["data","header","expand"],exports.methods={getName(e){var o=e.path.split(/\//);return o?o[o.length-1]:e.name},onSelect(e,o){this.$emit("confirm",e,o)},twinkle(e){Editor.Message.send("assets","twinkle",e)}};