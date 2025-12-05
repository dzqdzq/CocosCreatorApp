"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.components=exports.computed=exports.watch=exports.data=exports.props=exports.template=void 0;const defaultParams={string:"param",number:0,boolean:!1};function data(){return{isEmpty:!1}}function mounted(){}exports.template=`
<div @change="onConfirm" v-if="event">
    <ui-section class="config" expand>
        <div slot="header" class="header" :style="isEmpty ? {border: '1px solid red'} : {}" @click.stop>
            <ui-input name="funcName" placeholder="please input function name"
                :value="event.func"
                :index="index"
                @blur="updateFunName"
                @change.stop="validateFunName"
            ></ui-input>
            <ui-button class="transparent icon del" 
                @mousedown="onMouseDown"
                tooltip="i18n:animator.event.del_func" 
                name="delFunc"
                :index="index"
            >
                <ui-icon value="del"></ui-icon>
            </ui-button>
        </div>
        <div class="params">
            <div class="line">
                <ui-label value="i18n:animator.event.params"></ui-label>
                <div>
                    <ui-button 
                        class="transparent icon" 
                        tooltip="i18n:animator.event.add_params"
                        name="addParams" 
                        :index="index"
                        @mousedown="onMouseDown"
                    >
                        <ui-icon value="add"></ui-icon>
                    </ui-button>
                    <ui-button 
                        class="transparent icon" 
                        tooltip="i18n:animator.event.clear_params"
                        name="clearParams" 
                        :index="index"
                        @mousedown="onMouseDown"
                    >
                        <ui-icon value="clear"></ui-icon>
                    </ui-button>
                </div>
            </div>
            <div class="line" :key="paramIndex" v-for="(val, paramIndex) in event.params">
                <span class="name">{{paramIndex + 1}}</span>
                <ui-select :value="typeof(val)" name="changeParamType" 
                    :index="paramIndex"
                >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                </ui-select>
                <ui-input v-if="typeof(val) === 'string'"
                    name="param"
                    :value="val"
                    :index="paramIndex"
                ></ui-input>
                <ui-num-input v-if="typeof(val) === 'number'" 
                    name="param"
                    :value="val"
                    :index="paramIndex"
                ></ui-num-input>
                <ui-checkbox v-if="typeof(val) === 'boolean'" 
                    name="param"
                    :value="val"
                    :index="paramIndex"
                ></ui-checkbox>
                <ui-button 
                    class="transparent icon operate" 
                    tooltip="i18n:animator.event.del_params"
                    name="delParams" 
                    :index="paramIndex"
                    @mousedown="onMouseDown"
                >
                    <ui-icon value="del"></ui-icon>
                </ui-button>
            </div>
        </div>
    </ui-section>
</div>
`,exports.props=["event","index"],exports.data=data,exports.watch={},exports.computed={selectEvent(){return this.selectInfo?this.selectInfo.data:null}},exports.components={},exports.methods={onConfirm(a){var t=this,n=a.target.getAttribute("name");if(n){var i=a.target.getAttribute("index"),o=a.target.value,r=t.event;let e;switch(n){case"changeParamType":(e=r.params).splice(i,1,defaultParams[o]);break;case"param":if((e=r.params)[i]===o)return;e.splice(i,1,o)}t.$emit("update",t.event,t.index)}},async onMouseDown(e){var a=this,t=e.currentTarget.getAttribute("name"),n=e.currentTarget.getAttribute("index"),i=a.event;let o=!1;switch(t){case"delFunc":return void a.$emit("update",null,a.index);case"addParams":o=!0,i.params.push("param");break;case"delParams":o=!0,i.params.splice(n,1);break;case"clearParams":i.params.length&&(o=!0,i.params=[])}o&&a.$emit("update",a.event,a.index)},validateFunName(e){this.isEmpty=""===e.target.value},updateFunName(e){var a=this,t=e.target.value;t?t!==a.event.func&&a.$emit("update",Object.assign(a.event,{func:t}),a.index):(a.$emit("showToast",Editor.I18n.t("animator.event.enter_func_name")),e.target.value=a.event.func,a.isEmpty=!1)}},exports.mounted=mounted;