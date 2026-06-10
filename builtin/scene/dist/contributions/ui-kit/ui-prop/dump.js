Object.defineProperty(exports, "__esModule", { value: true });
exports.listeners = undefined;
exports.template = undefined;
exports.ready = ready;
exports.update = update;
exports.close = close;
const dum_element_base_1 = require("./dum-element-base");

const isDumpElement = (e) =>
  e.__info__ && e.__info__ instanceof dum_element_base_1.DumpElementBase;

exports.template = "";

exports.listeners = {
  change(e) {
    var t = this;

    if (
      isDumpElement(t) &&
      t.__info__.listeners &&
      t.__info__.listeners.change
    ) {
      t.__info__.listeners.change(e, t.$this.dump);
    }

    if (t.$this.dump) {
      t.$this.dispatch("change-dump", { detail: e.detail });
    }

    e.stopPropagation();
    e.preventDefault();
  },
  confirm(e) {
    var t = this;

    if (
      isDumpElement(t) &&
      t.__info__.listeners &&
      t.__info__.listeners.confirm
    ) {
      t.__info__.listeners.confirm(e, t.$this.dump);
    }

    if (t.$this.dump) {
      t.$this.dispatch("confirm-dump");
    }

    e.stopPropagation();
    e.preventDefault();
  },
  cancel(e) {
    var t = this;

    if (
      isDumpElement(t) &&
      t.__info__.listeners &&
      t.__info__.listeners.cancel
    ) {
      t.__info__.listeners.cancel(e, t.$this.dump);
    }

    if (t.$this.dump) {
      t.$this.dispatch("change-dump");
    }

    e.stopPropagation();
    e.preventDefault();
  },
  preview(e) {
    var t;
    var s;

    if (this.$this.dump) {
      ({ method: t, value: s } = e.detail);

      this.$this.dispatch("preview-dump", {
        detail: { method: t, value: s },
      });
    }

    e.stopPropagation();
    e.preventDefault();
  },
  create(e) {
    if (this.$this.dump) {
      this.$this.dispatch("create-dump");
    }

    e.stopPropagation();
    e.preventDefault();
  },
  reset(e) {
    if (this.$this.dump) {
      this.$this.dispatch("reset-dump");
    }

    e.stopPropagation();
    e.preventDefault();
  },
};

const elements = {
  objectOptionalTypes: require("./types/object-optional-types"),
  Array: require("./types/array"),
  Unknown: require("./types/unknown"),
  Null: require("./types/null"),
  Number: require("./types/number"),
  Float: require("./types/number"),
  Integer: require("./types/number"),
  Boolean: require("./types/boolean"),
  String: require("./types/string"),
  Enum: require("./types/enum"),
  BitMask: require("./types/bit-mask"),
  "cc.Object": require("./types/object-class"),
  "cc.Color": require("./types/color"),
  "cc.Size": require("./types/size"),
  "cc.Vec2": require("./types/vec2"),
  "cc.Vec3": require("./types/vec3"),
  "cc.Vec4": require("./types/vec4"),
  "cc.Quat": require("./types/vec4"),
  "cc.Rect": require("./types/rect"),
  "cc.Mat4": require("./types/mat4"),
  "cc.AnimationCurve": require("./types/real-curve"),
  "cc.RealCurve": require("./types/real-curve"),
  "cc.CurveRange": require("./types/curve-range"),
  "cc.GradientRange": require("./types/gradient-range"),
  "cc.Gradient": require("./types/gradient"),
  "cc.SkeletalAnimation.Socket": require("./types/animation-socket"),
  "sp.Skeleton.SpineSocket": require("./types/animation-socket"),
  "dragonBones.ArmatureDisplay.DragonBoneSocket": require("./types/animation-socket"),
  "cc.ClickEvent": require("./types/click-event"),
  "cc.Node": require("./types/node"),
  "cc.Asset": require("./types/asset"),
  "cc.Component": require("./types/component"),
};

const checkValueMatchType = {
  basicStackTypes: ["Array", "Object", "Map", "WeakMap", "Set", "WeakSet"],
  basicTypesLegalCCTypes: {
    Number: ["Number", "Float", "Integer", "BitMask", "Enum"],
    Boolean: ["Boolean", "Enum"],
    String: ["String", "Enum"],
  },
  isLegal(e) {
    var t = this.getBasicType(e.value);
    var s = t === "Null";
    var i = t === "Object";
    var r = this.basicTypesLegalCCTypes[t];
    if (r && !r.includes(e.type)) {
      return false;
    }
    if (e.default !== undefined) {
      var n = this.getBasicType(e.default);
      var a = n === "Null";
      var c = n === "Object";
      if (a && r) {
        return false;
      }
      r = this.basicTypesLegalCCTypes[n];
      if (r && !r.includes(e.type)) {
        return false;
      }
      if (
        (this.basicStackTypes.includes(t) ||
          this.basicStackTypes.includes(n)) &&
        n !== t
      ) {
        return (a && i) || (s && c);
      }
    }
    return true;
  },
  getBasicType(e) {
    e = Object.prototype.toString.call(e).match(/\s([^\]]+)]/);
    return (e && e[1]) || "";
  },
};

function getElementType(e) {
  let e_type = e.type;
  return (e_type =
    e_type === "Unknown" ||
    (e.isArray
      ? ((e_type = "Array"),
        (Array.isArray(e.value) &&
          ((e_type = "Array"),
          e.default === undefined || Array.isArray(e.default))) ||
          (e_type = "Unknown"))
      : !Array.isArray(e.value) && checkValueMatchType.isLegal(e)
      ? e.extends &&
        (e.extends.includes("cc.Node")
          ? (e_type = "cc.Node")
          : e.extends.includes("cc.Asset")
          ? (e_type = "cc.Asset")
          : e.extends.includes("cc.Component") && (e_type = "cc.Component"))
      : (e_type = "Unknown"),
    (e_type = e.optionalTypes ? "objectOptionalTypes" : e_type) in elements)
      ? e_type
      : e.value === null
      ? "Null"
      : "cc.Object");
}
function ready() {}
function update(e) {
  var t = this;
  var s = getElementType(e);

  t.$this.setAttribute("dump", s);

  if (e.readonly) {
    t.$this.setAttribute("readonly", true);
  } else {
    t.$this.removeAttribute("readonly");
  }

  t.$this.dump = e;
  var i = elements[s];

  if (t.$this.getAttribute("html") !== "false") {
    (t.__info__ &&
      t.__info__ instanceof dum_element_base_1.DumpElementBase &&
      t.__info__.type.includes(s)) ||
      ((s = new i.default()).mount(t.$this), s.ready(), (t.__info__ = s));

    t.__info__.update(e);
  }
}
function close() {
  var e = this;

  if (isDumpElement(e) && e.__info__.close) {
    e.__info__.close();
  }
}
