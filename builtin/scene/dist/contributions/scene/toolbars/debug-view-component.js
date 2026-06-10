Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugViewComponent = undefined;
const Vue = require("vue/dist/vue.js");
var DebugViewSingleType;
var DebugViewCompositeType;
Vue.config.productionTip = false;
Vue.config.devtools = false;

((e) => {
  e[(e.NONE = 0)] = "NONE";
  e[(e.VERTEX_COLOR = 1)] = "VERTEX_COLOR";
  e[(e.VERTEX_NORMAL = 2)] = "VERTEX_NORMAL";
  e[(e.VERTEX_TANGENT = 3)] = "VERTEX_TANGENT";
  e[(e.WORLD_POS = 4)] = "WORLD_POS";
  e[(e.VERTEX_MIRROR = 5)] = "VERTEX_MIRROR";
  e[(e.FACE_SIDE = 6)] = "FACE_SIDE";
  e[(e.UV0 = 7)] = "UV0";
  e[(e.UV1 = 8)] = "UV1";
  e[(e.UV_LIGHTMAP = 9)] = "UV_LIGHTMAP";
  e[(e.PROJ_DEPTH = 10)] = "PROJ_DEPTH";
  e[(e.LINEAR_DEPTH = 11)] = "LINEAR_DEPTH";
  e[(e.FRAGMENT_NORMAL = 12)] = "FRAGMENT_NORMAL";
  e[(e.FRAGMENT_TANGENT = 13)] = "FRAGMENT_TANGENT";
  e[(e.FRAGMENT_BINORMAL = 14)] = "FRAGMENT_BINORMAL";
  e[(e.BASE_COLOR = 15)] = "BASE_COLOR";
  e[(e.DIFFUSE_COLOR = 16)] = "DIFFUSE_COLOR";
  e[(e.SPECULAR_COLOR = 17)] = "SPECULAR_COLOR";
  e[(e.TRANSPARENCY = 18)] = "TRANSPARENCY";
  e[(e.METALLIC = 19)] = "METALLIC";
  e[(e.ROUGHNESS = 20)] = "ROUGHNESS";
  e[(e.SPECULAR_INTENSITY = 21)] = "SPECULAR_INTENSITY";
  e[(e.IOR = 22)] = "IOR";
  e[(e.DIRECT_DIFFUSE = 23)] = "DIRECT_DIFFUSE";
  e[(e.DIRECT_SPECULAR = 24)] = "DIRECT_SPECULAR";
  e[(e.DIRECT_ALL = 25)] = "DIRECT_ALL";
  e[(e.ENV_DIFFUSE = 26)] = "ENV_DIFFUSE";
  e[(e.ENV_SPECULAR = 27)] = "ENV_SPECULAR";
  e[(e.ENV_ALL = 28)] = "ENV_ALL";
  e[(e.EMISSIVE = 29)] = "EMISSIVE";
  e[(e.LIGHT_MAP = 30)] = "LIGHT_MAP";
  e[(e.SHADOW = 31)] = "SHADOW";
  e[(e.AO = 32)] = "AO";
  e[(e.FRESNEL = 33)] = "FRESNEL";
  e[(e.DIRECT_TRANSMIT_DIFFUSE = 34)] = "DIRECT_TRANSMIT_DIFFUSE";
  e[(e.DIRECT_TRANSMIT_SPECULAR = 35)] = "DIRECT_TRANSMIT_SPECULAR";
  e[(e.ENV_TRANSMIT_DIFFUSE = 36)] = "ENV_TRANSMIT_DIFFUSE";
  e[(e.ENV_TRANSMIT_SPECULAR = 37)] = "ENV_TRANSMIT_SPECULAR";
  e[(e.TRANSMIT_ALL = 38)] = "TRANSMIT_ALL";
  e[(e.DIRECT_TRT = 39)] = "DIRECT_TRT";
  e[(e.ENV_TRT = 40)] = "ENV_TRT";
  e[(e.TRT_ALL = 41)] = "TRT_ALL";
  e[(e.FOG = 42)] = "FOG";
})((DebugViewSingleType = DebugViewSingleType || {}));

((e) => {
  e[(e.DIRECT_DIFFUSE = 0)] = "DIRECT_DIFFUSE";
  e[(e.DIRECT_SPECULAR = 1)] = "DIRECT_SPECULAR";
  e[(e.ENV_DIFFUSE = 2)] = "ENV_DIFFUSE";
  e[(e.ENV_SPECULAR = 3)] = "ENV_SPECULAR";
  e[(e.EMISSIVE = 4)] = "EMISSIVE";
  e[(e.LIGHT_MAP = 5)] = "LIGHT_MAP";
  e[(e.SHADOW = 6)] = "SHADOW";
  e[(e.AO = 7)] = "AO";
  e[(e.NORMAL_MAP = 8)] = "NORMAL_MAP";
  e[(e.FOG = 9)] = "FOG";
  e[(e.TONE_MAPPING = 10)] = "TONE_MAPPING";
  e[(e.GAMMA_CORRECTION = 11)] = "GAMMA_CORRECTION";
  e[(e.FRESNEL = 12)] = "FRESNEL";
  e[(e.TRANSMIT_DIFFUSE = 13)] = "TRANSMIT_DIFFUSE";
  e[(e.TRANSMIT_SPECULAR = 14)] = "TRANSMIT_SPECULAR";
  e[(e.TRT = 15)] = "TRT";
  e[(e.TT = 16)] = "TT";
  e[(e.MAX_BIT_COUNT = 17)] = "MAX_BIT_COUNT";
  e[(e.ALL = 10000) /* 1e4 */] = "ALL";
})((DebugViewCompositeType = DebugViewCompositeType || {}));

exports.DebugViewComponent = Vue.extend({
  name: "DebugViewComponent",
  props: {
    children: {
      type: Array,
      default() {
        return [];
      },
    },
    tickShow: { type: Boolean, default: false },
  },
  data() {
    return {
      show: false,
      showTimeId: null,
      showChildren: false,
      disabledAllSingleOps: true,
    };
  },
  watch: {
    show(t) {
      var e;
      var l = this;
      var l_$el = l.$el;
      l_$el.style.display = t ? "block" : " none";

      if (t) {
        if (l.$el.classList.contains("inner") && (e = this.$root)) {
          l_$el.style.height = e.getFitHeight() + "px";
        }
      } else {
        l.$children.forEach((e) => {
          e.show = t;
        });
      }
    },
    tickShow(e) {
      const t = this;
      t.showTimeId = setTimeout(() => {
        t.show = e;
      }, 100);
    },
  },
  methods: {
    mouseEnter() {
      clearTimeout(this.showTimeId);
    },
    nextTitleMouseEnter(e) {
      e.stopPropagation();
      clearTimeout(this.showTimeId);
      this.showChildren = true;
    },
    nextTitleMouseLeave(e) {
      e.stopPropagation();
      this.showChildren = false;
    },
    radioGroupChange(t) {
      var l = this;
      var l_$parent = t.target;
      var t = t.currentTarget;
      if (l_$parent && t) {
        t.value = l_$parent.value;
        let e = t.dataset.label;
        var l_$parent = l.$parent;

        var t =
          (l_$parent &&
            ((l_$parent = l_$parent.$el.querySelector(".shaded")),
            e && !e.startsWith("i18n:") && (e = t.value),
            l.checkBaseShaded()
              ? ((e = "i18n:scene.debug_view.shaded"),
                (l_$parent.checked = true))
              : (l_$parent.checked = false)),
          l.$root);

        if (t) {
          t.changeSelectText(e);
        }
      }
    },
    radioChange(e, t) {
      var l;
      var r;
      var i = this;
      var e = e.target;

      if (
        e &&
        (l = e.getAttribute("type")) &&
        ((e = e.value),
        (r = DebugViewSingleType[e]),
        Editor.Message.send("scene", "debug-view", { type: l, value: r }),
        l === "single" && e === "NONE"
          ? ((i.disabledAllSingleOps = true),
            i.allChecked("composite", "ALL", true))
          : (i.disabledAllSingleOps = false),
        (r = i.$el.querySelector(".rendering-single-group")))
      ) {
        r.setAttribute("data-label", t.label);
      }
    },
    checkboxChange(t) {
      var l = this;
      var t = t.target;
      if (t) {
        var r = t.getAttribute("type");
        if (r) {
          if (r === "composite") {
            var i = t.getAttribute("key");
            if (!i) {
              return;
            }
            var t_value = t.value;

            if (i === "ALL") {
              l.allChecked(r, i, t_value);
            } else {
              i = { key: DebugViewCompositeType[i], value: t_value };

              Editor.Message.send("scene", "debug-view", {
                type: r,
                value: i,
              });

              (t_value = l.$el.querySelector(".checkbox-group")) &&
                ((i = l.checkCompositeAllChecked(t_value)),
                (t_value = t_value.querySelector(".check_all_composite"))) &&
                (t_value.value = i);
            }
          } else {
            t_value = t.value;
            Editor.Message.send("scene", "debug-view", {
              type: r,
              value: t_value,
            });
          }
          let e = "i18n:scene.debug_view.rendering_composite_options";
          i = l.$parent;

          r =
            (i &&
              ((t = i.$el.querySelector(".shaded")),
              l.checkBaseShaded()
                ? ((e = "i18n:scene.debug_view.shaded"), (t.checked = true))
                : (t.checked = false)),
            l.$root);

          if (r) {
            r.changeSelectText(e);
          }
        }
      }
    },
    checkCompositeAllChecked(e) {
      for (const t of e.childNodes) {
        if (
          t &&
          t.tagName === "UI-CHECKBOX" &&
          !t.classList.contains("check_all_composite") &&
          !t.value
        ) {
          return false;
        }
      }
      return true;
    },
    checkBaseShaded() {
      var e = this;
      var t = e.$el.querySelector(".lighting-with-base-color");
      var l = e.$el.querySelector(".csm-layer-coloration");
      var r = e.$el.querySelector(".rendering-single-group");
      var e = e.$el.querySelector(".check_all_composite");
      return t.value && !l.value && r.value === "NONE" && e.value;
    },
    allChecked(e, t, l) {
      t = { key: DebugViewCompositeType[t], value: l };
      Editor.Message.send("scene", "debug-view", { type: e, value: t });
      e = this.$el.querySelector(".checkbox-group");

      if (e) {
        e.childNodes.forEach((e) => {
          if (e && e.tagName === "UI-CHECKBOX") {
            e.value = l;
          }
        });
      }
    },
    renderElement(t, e) {
      const l = this;
      switch (t.el) {
        case "ui-checkbox": {
          return e(
            t.el,
            {
              class: {
                column: true,
                check_all_composite: t.type === "composite" && t.key === "ALL",
                "lighting-with-base-color":
                  t.type === "LIGHTING_WITH_BASE_COLOR",
                "csm-layer-coloration": t.type === "CSM_LAYER_COLORATION",
              },
              attrs: {
                type: t.type,
                value: t.value,
                key: t.key,
                disabled:
                  t.type !== "LIGHTING_WITH_BASE_COLOR" &&
                  !l.disabledAllSingleOps,
              },
              on: { change: l.checkboxChange },
            },
            [e("ui-label", { attrs: { value: t.label } })]
          );
        }
        case "ui-radio": {
          return e(
            t.el,
            {
              class: { column: true, shaded: t.value === "SHADED" },
              attrs: {
                type: t.type,
                value: t.value,
                disabled: t.value === "SHADED",
              },
              on: {
                change: (e) => {
                  l.radioChange(e, t);
                },
              },
            },
            [e("ui-label", { attrs: { value: t.label } })]
          );
        }
        case "ui-label": {
          return e(t.el, {
            class: "column label",
            attrs: { value: t.label },
          });
        }
      }
    },
    renderPanel(e, t) {
      return [
        t(
          "div",
          {
            class: "title next",
            on: {
              mouseenter: this.nextTitleMouseEnter,
              mouseleave: this.nextTitleMouseLeave,
            },
          },
          [
            t(e.el, { attrs: { value: e.label } }),
            t("ui-icon", { attrs: { value: "arrow-right" } }),
          ]
        ),
        t("debug-view-component", {
          props: { children: e.children, tickShow: this.showChildren },
          class: "inner",
        }),
      ];
    },
    renderGroup(e, t) {
      const l = this;
      var r = [];
      r.push(t(e.el, { class: "title", attrs: { value: e.label } }));

      switch (e.group) {
        case "radio": {
          r.push(
            t(
              "ui-radio-group",
              {
                class: {
                  group: true,
                  "radio-group": true,
                  "rendering-single-group":
                    e.group === "radio" && e.value === "NONE",
                },
                attrs: { "default-value": e.value },
                on: {
                  change: (e) => {
                    l.radioGroupChange(e);
                  },
                },
              },
              e.children.map((e) => l.renderElement(e, t))
            )
          );
          break;
        }
        case "checkbox": {
          r.push(
            t(
              "div",
              { class: "group checkbox-group" },
              e.children.map((e) => l.renderElement(e, t))
            )
          );
        }
      }

      return r;
    },
    renderChildren(e, t) {
      if (e.nextPanel) {
        return this.renderPanel(e, t);
      }

      if (e.group) {
        return this.renderGroup(e, t);
      }

      return [this.renderElement(e, t)];
    },
  },
  render(t) {
    const l = this;
    return t(
      "div",
      {
        class: "panel",
        on: {
          mouseenter: l.mouseEnter,
          click: (e) => {
            e.stopPropagation();
          },
        },
      },
      l.children.map((e) => t("div", { class: "list" }, l.renderChildren(e, t)))
    );
  },
});
