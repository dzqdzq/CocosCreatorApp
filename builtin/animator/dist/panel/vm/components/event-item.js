Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const defaultParams = { string: "param", number: 0, boolean: false };
function data() {
  return { isEmpty: false };
}
function mounted() {}

exports.template = `
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
`;

exports.props = ["event", "index"];
exports.watch = {};

exports.computed = {
  selectEvent() {
    return this.selectInfo ? this.selectInfo.data : null;
  },
};

exports.components = {};

exports.methods = {
  onConfirm(a) {
    var t = this;
    var n = a.target.getAttribute("name");
    if (n) {
      var i = a.target.getAttribute("index");
      var o = a.target.value;
      var t_event = t.event;
      let e;
      switch (n) {
        case "changeParamType": {
          (e = t_event.params).splice(i, 1, defaultParams[o]);
          break;
        }
        case "param": {
          if ((e = t_event.params)[i] === o) {
            return;
          }
          e.splice(i, 1, o);
        }
      }
      t.$emit("update", t.event, t.index);
    }
  },
  async onMouseDown(e) {
    var a = this;
    var t = e.currentTarget.getAttribute("name");
    var n = e.currentTarget.getAttribute("index");
    var a_event = a.event;
    let o = false;
    switch (t) {
      case "delFunc": {
        return void a.$emit("update", null, a.index);
      }
      case "addParams": {
        o = true;
        a_event.params.push("param");
        break;
      }
      case "delParams": {
        o = true;
        a_event.params.splice(n, 1);
        break;
      }
      case "clearParams": {
        if (a_event.params.length) {
          o = true;
          a_event.params = [];
        }
      }
    }

    if (o) {
      a.$emit("update", a.event, a.index);
    }
  },
  validateFunName(e) {
    this.isEmpty = e.target.value === "";
  },
  updateFunName(e) {
    var a = this;
    var t = e.target.value;

    if (t) {
      if (t !== a.event.func) {
        a.$emit("update", Object.assign(a.event, { func: t }), a.index);
      }
    } else {
      a.$emit("showToast", Editor.I18n.t("animator.event.enter_func_name"));

      e.target.value = a.event.func;
      a.isEmpty = false;
    }
  },
};
