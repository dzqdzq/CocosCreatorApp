Object.defineProperty(exports, "__esModule", { value: true });
exports.parserJSONObjectMap = undefined;
exports.decode = decode;
const element_1 = require("../../element");
function parse(e) {
  return (
    exports.parserJSONObjectMap[e.type] || exports.parserJSONObjectMap["*"]
  ).decode(e);
}
function decode(e, t, r) {
  if (t && t.tag !== "inspector-root") {
    throw new Error("Not a legitimate root node");
  }
  var n = new element_1.VirtualElement("inspector-root");
  var e = parse(e);
  n.appendChild(e);

  if (t) {
    t.apply(n);
  } else {
    t = n;
  }

  return t;
}
exports.parserJSONObjectMap = {
  "*": {
    generate() {
      return { type: "vbox", children: [] };
    },
    decode(e) {
      var t = new element_1.VirtualElement("unknown");
      t.setAttribute("ui-type", e.type);
      return t;
    },
  },
  prop: {
    generate() {
      return { type: "prop", children: [] };
    },
    decode(e) {
      let t;
      var r;

      if ("bind" in e && e.bind) {
        (t = new element_1.VirtualElement("inspector-prop")).setAttribute(
          "type",
          "dump"
        );

        t.setAttribute("bind", e.bind);

        "properties" in e &&
          e.properties &&
          t.setAttribute("properties", JSON.stringify(e.properties));
      } else {
        t = new element_1.VirtualElement("ui-prop");

        "label" in e &&
          e.label &&
          ((r = new element_1.VirtualElement("ui-label")).setAttribute(
            "slot",
            "label"
          ),
          r.setAttribute("value", e.label),
          t.appendChild(r));

        "children" in e &&
          e.children &&
          e.children
            .map((e) => parse(e))
            ?.forEach((e) => {
              e.setAttribute("slot", "content");
              t.appendChild(e);
            });
      }

      return t;
    },
  },
  button: {
    generate() {
      return { type: "button", label: "" };
    },
    decode(e) {
      var t;
      var r = new element_1.VirtualElement("ui-button");

      if ("label" in e && e.label) {
        (t = new element_1.VirtualElement("ui-label")).setAttribute(
          "value",
          e.label
        );

        r.appendChild(t);
      }

      if ("icon" in e && e.icon) {
        (t = new element_1.VirtualElement("ui-icon")).setAttribute(
          "value",
          e.icon
        );

        r.appendChild(t);
      }

      if ("click" in e && e.click) {
        r.setAttribute("click", e.click);
      }

      return r;
    },
  },
  line: {
    generate() {
      return { type: "line" };
    },
    decode(e) {
      var t = new element_1.VirtualElement("div");
      t.setAttribute("style", "border-top: 1px solid #000;");
      return t;
    },
  },
  space: {
    generate() {
      return { type: "space", size: 1 };
    },
    decode(e) {
      var t = new element_1.VirtualElement("div");
      t.setAttribute("style", `padding: ${e.size}px;`);
      return t;
    },
  },
  vbox: {
    generate() {
      return { type: "vbox", children: [] };
    },
    decode(e) {
      const t = new element_1.VirtualElement("div");
      t.setAttribute("style", "display: flex; flex-direction: column;");

      e.children.forEach((e) => {
        e = parse(e);
        t.appendChild(e);
      });

      return t;
    },
  },
  hbox: {
    generate() {
      return { type: "hbox", children: [] };
    },
    decode(e) {
      const t = new element_1.VirtualElement("div");
      t.setAttribute("style", "display: flex; flex-direction: row;");

      e.children.forEach((e) => {
        e = parse(e);
        t.appendChild(e);
      });

      return t;
    },
  },
  label: {
    generate() {
      return { type: "label", label: "" };
    },
    decode(e) {
      var t = new element_1.VirtualElement("ui-label");
      t.setAttribute("value", e.label || "");
      return t;
    },
  },
};
