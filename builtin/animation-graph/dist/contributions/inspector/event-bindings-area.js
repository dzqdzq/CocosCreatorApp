"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const template=`
    <ui-section class="config"
        header="Event Bindings"
        cache-expand="asset-animation-graph-state-event-bindings"
        :expand="Object.values(eventBindings).some((eventName) => !!eventName)"
    >
        <ui-prop
            class="prop"
            v-for="([eventKind, eventName]) of Object.entries(eventBindings)"
            :key="eventKind"
        >
            <ui-label class="name" slot="label" :value="eventKind"></ui-label>
            <ui-input
                slot="content"
                :value="eventName"
                @confirm.stop="$emit('change', eventKind, $event.target.value.trim())"
                @change.stop
            ></ui-input>
        </ui-prop>
    </ui-section>
`,eventBindingsArea={props:["eventBindings"],emits:["change"],template:template};exports.default=eventBindingsArea;