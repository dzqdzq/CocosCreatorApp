Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.name = undefined;
exports.template = undefined;

exports.data = data;

const { readFileSync } = require("fs");

const { join } = require("path");

const { replaceHttpAndLocalPath2UILink, transformText } = require("../utils");

const manager = require("../manager");
const manager_outputList = manager.outputList;
let isOperating = false;
let renderListTimer = null;
let scrollTopcache = 0;
function data() {
  return {
    timer: null,
    cacheListLength: 0,
    showList: [],
    wrapperStyle: { height: 0 },
    isRending: false,
    listTransformY: 0,
    replaceTextTimer: null,
  };
}

exports.template = readFileSync(
  join(__dirname, "../../static", "/template/list.html"),
  "utf8"
);

exports.name = "console-list";

exports.props = {
  fontSize: { type: Number },
  lineHeight: { type: Number },
};

exports.computed = {
  listStyle() {
    var { listTransformY, fontSize, lineHeight } = this;
    return {
      transform: `translateY(${listTransformY}px)`,
      "--font-size": fontSize + "px",
      "--line-height": lineHeight + "px",
    };
  },
};

exports.watch = {
  lineHeight(t) {
    if (t) {
      this.renderList();
    }
  },
};

exports.methods = {
  toggleContent(e) {
    var t = manager_outputList.find((t) => t.translateY === e);

    if (t) {
      t.fold = !t.fold;
      manager.update(true);
    }
  },
  createItem() {
    return {
      content: [],
      rows: 0,
      message: "",
      type: "log",
      title: "",
      texture: "",
      count: 1,
      fold: true,
      show: false,
      stack: [],
      translateY: -1000 /* -1e3 */,
    };
  },
  getHeight() {
    let e = 0;

    manager_outputList.forEach((t) => {
      if (t.fold) {
        e += this.lineHeight;
      } else {
        e += t.rows * this.lineHeight;
      }
    });

    return e;
  },
  getScrollPosition(i, s) {
    let r = 0;
    let o = 0;

    manager_outputList.some((t, e) => {
      if (t.fold) {
        r += s;
      } else {
        r += t.rows * s;
      }

      return r > i && ((o = e - 1), true);
    });

    return Math.max(o, 0);
  },
  renderList(t = false) {
    if (this.isRending) {
      if (renderListTimer) {
        window.clearTimeout(renderListTimer);
        renderListTimer = null;
      }

      renderListTimer = window.setTimeout(() => {
        this.renderList(t);
      }, 200);
    } else {
      this.isRending = true;
      const l = this.getHeight();
      this.wrapperStyle.height = l + "px";
      var e = this.lineHeight;
      var i = this.$el.clientHeight;
      var s = Math.ceil(i / e) + 3;
      this.showList.splice(s);
      var r = this.$el.scrollTop;
      var o = manager_outputList.length - this.cacheListLength;
      var i = l - i - r <= o * e;
      this.cacheListLength = manager_outputList.length;
      for (let t = 0; t < s; t++) {
        var n = this.showList[t];

        if (n) {
          n.show = false;
          n.translateY = -1000;
        } else {
          this.showList.push(this.createItem());
        }
      }

      if (i && !isOperating && !t) {
        requestAnimationFrame(() => {
          this.$el.scrollTop = l - this.$el.clientHeight + 8;
        });
      }

      this.onScroll();
      this.isRending = false;
    }
  },
  onScroll(t) {
    if (!isOperating) {
      isOperating = true;
      var e = this.$el.scrollTop;
      var i = Math.abs(e - scrollTopcache) > 2;

      var t =
        (t &&
          t.target &&
          i &&
          (i = t.target.getRootNode().getSelection()).type === "Range" &&
          i.removeAllRanges(),
        (scrollTopcache = e),
        this.lineHeight);

      const s = this.getScrollPosition(e, t);
      this.listTransformY = manager_outputList[s]?.translateY ?? 0;

      this.showList.forEach((t, e) => {
        var i = manager_outputList[s + e];

        if (i) {
          t.date = i.date;
          t.type = i.type;
          t.rows = i.rows;
          t.title = i.title;
          t.content = i.content;
          t.count = i.count;
          t.fold = i.fold;
          t.translateY = i.translateY;
          t.texture = (s + e) % 2 == 0 ? "dark" : "light";
          t.stack = i.stack;
          t.show = true;
        } else {
          t.translateY = -1000 /* -1e3 */;
          t.show = false;
        }
      });

      isOperating = false;
    }
  },
  showMenuPast(t, e) {
    t.preventDefault();
    let i = "";
    t = document.getSelection();

    if (t?.type === "Range") {
      i = t.toString();
    } else {
      i +=
        e.title +
        ` 
`;

      e.rows > 1 &&
        (e.content.forEach((t) => {
          i +=
            t +
            ` 
`;
        }),
        e.stack?.forEach?.((t) => {
          i +=
            t +
            ` 
`;
        }));
    }

    Editor.Menu.popup({
      menu: [
        {
          label: Editor.I18n.t("console.copy"),
          click() {
            Editor.Clipboard.write("text", i);
          },
        },
      ],
    });
  },
  renderText(t) {
    if (t) {
      t = t.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      t = replaceHttpAndLocalPath2UILink(t);
      t = transformText(t);
    }

    return t;
  },
  onTextClick(t) {
    var e;

    if (
      t.target &&
      (t.target.getAttribute("bubble") === null &&
        this.$el !== t.target &&
        (t.stopPropagation(), t.preventDefault()),
      (e = t.target.getRootNode().getSelection())) &&
      e.baseOffset !== e.focusOffset
    ) {
      t.stopPropagation();
      t.preventDefault();
    }
  },
};
