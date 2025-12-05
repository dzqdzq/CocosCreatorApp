"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.importConfig=exports.exportConfig=exports.ready=exports.$=exports.template=exports.style=void 0;const Vue=require("vue/dist/vue.js"),lodash=(Vue.config.productionTip=!1,Vue.config.devtools=!1,require("lodash"));let panel=null,vm=null;const vueTemplate=`
<div class="container">
    <div v-if="config.preview" class="preview" @confirm="onConfirm">
        <div>
            <ui-icon value="setting" tooltip="i18n:preferences.menu.position_info"
                :type="types['preview.simulator_debugger']"
                @click.stop="onChangePosition($event.target.pageX, $event.target.pageY, 'preview.simulator_debugger')">
            </ui-icon>
            <ui-prop>
                <ui-label slot="label" value="i18n:preview.project.general.simulatorDebugger"></ui-label>
                <ui-checkbox slot="content" path="preview.simulator_debugger"
                    :value="config.preview.simulator_debugger"
                ></ui-checkbox>
            </ui-prop>
        </div>
        <div>
            <ui-icon value="setting" tooltip="i18n:preferences.menu.position_info"
                :type="types['preview.wait_for_connect']"
                @click.stop="onChangePosition($event.target.pageX, $event.target.pageY, 'preview.wait_for_connect')">
            </ui-icon>
            <ui-prop :tooltip="config.preview.simulator_debugger ? '' : 'i18n:preview.project.general.waitForConnectTips'">
                <ui-label slot="label" value="i18n:preview.project.general.waitForConnect"></ui-label>
                <ui-checkbox slot="content" path="preview.wait_for_connect"
                    :value="config.preview.wait_for_connect"
                    :disabled="waitForConnectDisabled"
                ></ui-checkbox>
            </ui-prop>
        </div>
    </div>
    <div class="http">
        <!-- 初始服务器端口号选择 -->
        <div class="subtab">Server HTTP</div>
        <div>
            <!-- <ui-icon value="warn"></ui-icon> -->
            <ui-icon value="setting" class="server-port"
                tooltip="i18n:preferences.menu.move_local"
            ></ui-icon>
            <ui-setting type="local" package="server">
                <ui-prop>
                    <div slot="label">
                        <ui-label value="i18n:preferences.general.server_port"></ui-label>
                        <ui-icon value="help" tooltip="i18n:preferences.general.serverPortHelpTips"></ui-icon>
                    </div>
                    <ui-num-input slot="content" path="server_port"
                        step="1"
                        preci="0"
                        min="1024"
                        max="65535"
                    ></ui-num-input>
                </ui-prop>
            </ui-setting>
        </div>

        <div class="subtab">Server HTTPS</div>
        <div>
            <!-- <ui-icon value="warn"></ui-icon> -->
            <ui-icon value="setting" class="server-port"
                tooltip="i18n:preferences.menu.move_local"
            ></ui-icon>
            <ui-setting type="local" package="server">
                <ui-prop>
                    <div slot="label">
                        <ui-label value="i18n:server.https.enable"></ui-label>
                        <ui-icon value="help" tooltip="i18n:preferences.general.serverPortHelpTips"></ui-icon>
                    </div>
                    <ui-checkbox slot="content" path="https.enable"></ui-checkbox>
                </ui-prop>
            </ui-setting>
        </div>
        <div>
            <!-- <ui-icon value="warn"></ui-icon> -->
            <ui-icon value="setting" class="server-port"
                tooltip="i18n:preferences.menu.move_local"
            ></ui-icon>
            <ui-setting type="local" package="server">
                <ui-prop>
                    <div slot="label">
                        <ui-label value="i18n:server.https.port"></ui-label>
                        <ui-icon value="help" tooltip="i18n:preferences.general.serverPortHelpTips"></ui-icon>
                    </div>
                    <ui-num-input slot="content" path="https.port"
                        step="1"
                        preci="0"
                        min="1024"
                        max="65535"
                    ></ui-num-input>
                </ui-prop>
            </ui-setting>
        </div>
        <div>
            <!-- <ui-icon value="warn"></ui-icon> -->
            <ui-icon value="setting" class="server-port"
                tooltip="i18n:preferences.menu.move_local"
            ></ui-icon>
            <ui-setting type="local" package="server">
                <ui-prop>
                    <div slot="label">
                        <ui-label value="i18n:server.https.key"></ui-label>
                        <ui-icon value="help" tooltip="i18n:preferences.general.serverPortHelpTips"></ui-icon>
                    </div>
                    <ui-file slot="content" path="https.key"></ui-file>
                </ui-prop>
            </ui-setting>
        </div>
        <div>
            <!-- <ui-icon value="warn"></ui-icon> -->
            <ui-icon value="setting" class="server-port"
                tooltip="i18n:preferences.menu.move_local"
            ></ui-icon>
            <ui-setting type="local" package="server">
                <ui-prop>
                    <div slot="label">
                        <ui-label value="i18n:server.https.cert"></ui-label>
                        <ui-icon value="help" tooltip="i18n:preferences.general.serverPortHelpTips"></ui-icon>
                    </div>
                    <ui-file slot="content" path="https.cert"></ui-file>
                </ui-prop>
            </ui-setting>
        </div>
        <div>
            <!-- <ui-icon value="warn"></ui-icon> -->
            <ui-icon value="setting" class="server-port"
                tooltip="i18n:preferences.menu.move_local"
            ></ui-icon>
            <ui-setting type="local" package="server">
                <ui-prop>
                    <div slot="label">
                        <ui-label value="i18n:server.https.ca"></ui-label>
                        <ui-icon value="help" tooltip="i18n:preferences.general.serverPortHelpTips"></ui-icon>
                    </div>
                    <ui-file slot="content" path="https.ca"></ui-file>
                </ui-prop>
            </ui-setting>
        </div>
    </div>
</div>
`,PreviewPreferenceVM=Vue.extend({name:"PreviewPreferenceVM",data(){return{config:{preview:{simulator_debugger:null,wait_for_connect:null}},types:{"preview.simulator_debugger":"global","preview.wait_for_connect":"global"},waitForConnectDisabled:!1}},watch:{"config.preview.simulator_debugger":{async handler(e){this.waitForConnectDisabled=!1,e||(this.waitForConnectDisabled=!0,lodash.set(this.config,"preview.wait_for_connect",!1),await Editor.Profile.setConfig("preview","preview.wait_for_connect",!1,this.types["preview.wait_for_connect"]))},deep:!0}},async mounted(){var e=await Editor.Profile.getConfig("preview","preview.simulator_debugger"),i=await Editor.Profile.getConfig("preview","preview.wait_for_connect");this.config.preview.simulator_debugger=e,this.config.preview.wait_for_connect=i;for(const t of Object.keys(this.types))await this.refresh(t)},methods:{async refresh(e){var i=await Editor.Profile.getConfig("preview",e,"local");this.types[e]=null!=i?"local":"global"},async onConfirm(e){var i=e.target.value,e=e.target.getAttribute("path");lodash.set(this.config,e,i),await Editor.Profile.setConfig("preview",e,i,this.types[e])},onChangePosition(e,i,t){Editor.Menu.popup({x:e,y:i,menu:[{label:Editor.I18n.t("preferences.menu.move_local"),enabled:"global"===this.types[t],click:async()=>{var e=await Editor.Profile.getConfig("preview",t);await Editor.Profile.setConfig("preview",t,e),await this.refresh(t)}},{label:Editor.I18n.t("preferences.menu.move_global"),enabled:"local"===this.types[t],click:async()=>{var e=await Editor.Profile.getConfig("preview",t,"local");await Editor.Profile.setConfig("preview",t,e,"global"),await Editor.Profile.removeConfig("preview",t,this.types[t]),await this.refresh(t)}}]})}},template:vueTemplate});function ready(){panel=this,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new PreviewPreferenceVM).$mount(panel.$.container)}async function exportConfig(){var i={};for(const o of["preview.simulator_debugger","preview.wait_for_connect"]){let e="global";var t=await Editor.Message.request("preferences","query-config","preview",o,"local");null!=t&&(e="local"),i[o]={type:e,value:await Editor.Message.request("preferences","query-config","preview",o)}}return i}async function importConfig(e){e["preview.simulator_debugger"]&&await Editor.Message.request("preferences","set-config","preview","preview.simulator_debugger",e["preview.simulator_debugger"].value,e["preview.simulator_debugger"].type),e["preview.wait_for_connect"]&&await Editor.Message.request("preferences","set-config","preview","preview.wait_for_connect",e["preview.wait_for_connect"].value,e["preview.wait_for_connect"].type)}function close(){null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null}exports.style=`
.preview > div { display: flex; }
.preview ui-icon { visibility: hidden; cursor: pointer; }
.preview ui-icon[type='local'] { color: var(--color-warn-fill); visibility: visible; }
.preview ui-prop { --left-width: 40%; padding-left: 5px; margin-bottom: 4px; flex: 1; }
.preview > div:hover ui-icon { visibility: visible; }
.preview ui-prop[disabled] { pointer-events: none; opacity: 0.6; }
.http > div.subtab { font-size: 10px; opacity: 0.5; }
.http ui-prop { --left-width: 40%; padding-left: 5px; margin-bottom: 4px; flex: 1; }
.http > div { display: flex; }
.http > div > ui-setting { flex: 1; }
.http > div > ui-icon { color: var(--color-warn-fill); }
`,exports.template='<div class="container"></div>',exports.$={container:".container"},exports.ready=ready,exports.exportConfig=exportConfig,exports.importConfig=importConfig,exports.close=close;