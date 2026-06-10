Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.style = undefined;
exports.$ = undefined;
exports.ready = ready;
exports.close = close;
require("./inspector-resize-preview");

const {
  start,
  queryType,
  queryRendererMap,
  queryDropConfig,
} = require("./extension");

async function ready() {
  const e = this;
  Object.assign(e, { isLocked: false, history: new History(e) });
  start();

  if (
    e.sceneIsReady ||
    (await Editor.Message.request("scene", "query-is-ready"))
  ) {
    e.sceneReady();
  }

  e.$.lock.addEventListener("click", () => {
    e.setLocked(!e.isLocked, true);
  });
}
function close() {}
require("../../extension");

exports.$ = {
  content: ".content",
  backward: ".backward",
  forward: ".forward",
  lock: ".lock",
};

exports.style = `
:host {
    display: flex;
    flex-direction: column;
}
:host > .header {
    height: 28px;
    line-height: 28px;
    border-bottom: solid 1px var(--color-normal-border);
}
:host > .header > ui-icon {
    margin: 0 4px;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
    color: var(--color-default-contrast-emphasis);
}

:host > .header > .triangle {
    font-size: 16px;
    pointer-events: none;
    color: var(--color-normal-fill-weakest);
    border-radius: calc(var(--size-small-radius) * 1px);
}
:host > .header > .triangle:hover {
    background: var(--color-active-fill-emphasis);
}
:host > .header > .triangle[enable] {
    pointer-events: auto;
    color: var(--color-default-contrast-emphasis);
}
:host > .header > .triangle.backward {
    transform: rotate(90deg);
}
:host > .header > .triangle.forward {
    transform: rotate(-90deg);
}
:host > .header > .lock {
    float: right;
}
:host > .header > .lock:hover {
    color: var(--color-warn-fill);
}
:host > .header > .lock[value="pin"] {
    color: var(--color-warn-fill);
}

:host > ui-prop-split {
    flex: 1;
    overflow: hidden;
}
:host > ui-prop-split > .content {
    height: 100%;
}
`;

exports.template = `
<header class="header">
    <ui-icon class="triangle backward" value="arrow-triangle" tooltip="i18n:inspector.backward_selection"></ui-icon>
    <ui-icon class="triangle forward"  value="arrow-triangle" tooltip="i18n:inspector.forward_selection"></ui-icon>
    <ui-icon class="lock" hidden value="unpin"></ui-icon>
</header>
<ui-prop-split position='38.2' indent='24px' min-limit='60px,85px'>
    <ui-panel class="content"></ui-panel>
</ui-prop-split>
`;

exports.methods = {
  noticeReloadInspector() {
    this.type = "";
    this.update();
  },
  selected() {
    if (!this.isLocked) {
      this.update();
    }
  },
  unselected() {
    if (!this.isLocked) {
      this.update();
    }
  },
  async update() {
    var e = this;
    if (!e.__update_lock__) {
      e.__update_lock__ = true;

      await new Promise((e) => {
        setTimeout(e, 100);
      });

      var t = Editor.Selection.getLastSelectedType();
      var r = Editor.Selection.getSelected(t);
      if (t !== e.type || JSON.stringify(r) !== JSON.stringify(e.uuids)) {
        try {
          if (false !== (await e.$.content.canClose())) {
            e.type = t;
            e.uuids = r;

            e.type || e.uuids.length !== 0
              ? (e.$.lock.removeAttribute("hidden"),
                e.$.content.setAttribute("src", queryType(e.type) || ""),
                e.$.content.setAttribute("type", e.type),
                e.$.content.setAttribute("sub-type", ""),
                e.$.content.update(
                  e.uuids,
                  queryRendererMap(e.type),
                  queryDropConfig(e.type),
                  queryType(),
                  queryRendererMap()
                ),
                e.history.record())
              : (e.$.lock.setAttribute("hidden", ""),
                e.$.content.setAttribute("src", ""));
          }
        } catch (e) {
          console.error(e);
        }
      }
      e.__update_lock__ = false;
    }
  },
  sceneClose() {
    var e = this;

    if (!e.isLocked || e.type === "node") {
      e.uuids = [];
      e.$.content.setAttribute("src", "");
    }
  },
  sceneReady() {
    var e = this;
    e.sceneIsReady = true;

    if (!e.isLocked || e.type === "node") {
      e.setLocked(false, true);
    }
  },
  setLocked(e, t = false) {
    var r = this;
    var e = ((r.isLocked = e), r.isLocked ? "pin" : "unpin");

    var e =
      (r.$.lock.setAttribute("value", e),
      r.isLocked ? "i18n:inspector.unpin" : "i18n:inspector.pin");

    r.$.lock.setAttribute("tooltip", e);

    if (!r.isLocked && t) {
      r.update();
    }
  },
  isFocused() {
    try {
      return this.$.content.getRootNode().host.hasAttribute("focused");
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  undo() {
    var e = this;

    if (!e.__update_lock__) {
      if (e.isFocused()) {
        e.$.content.callMethod("undo");
      }
    }
  },
  redo() {
    var e = this;

    if (!e.__update_lock__) {
      if (e.isFocused()) {
        e.$.content.callMethod("redo");
      }
    }
  },
};

class History {
  constructor(e) {
    this.allow = ["node", "asset"];
    this.current = { type: "", uuids: [] };
    this.forwards = [];
    this.backwards = [];
    this.panel = null;

    (this.panel = e).$.forward.addEventListener("click", () => {
      this.forward();
      this.updateState();
    });

    e.$.backward.addEventListener("click", () => {
      this.backward();
      this.updateState();
    });
  }
  record() {
    var { panel, allow, forwards, backwards, current } = this;
    var { type, uuids } = panel;

    if (uuids.length !== 0 && allow.includes(type)) {
      allow = JSON.stringify(uuids);

      (current &&
        type === current.type &&
        allow === JSON.stringify(current.uuids)) ||
        (backwards.unshift(current),
        (forwards.length = 0),
        (this.current = { type: type, uuids: uuids }),
        backwards.length > 30 && backwards.pop(),
        this.updateState());
    }
  }
  forward() {
    var { forwards, backwards, current } = this;
    var backwards = (backwards.unshift(current), forwards.shift());

    if (backwards) {
      this.current = backwards;
      this.reselect("forward");
    }

    this.updateState();
  }
  backward() {
    var { forwards, backwards, current } = this;
    var forwards = (forwards.unshift(current), backwards.shift());

    if (forwards) {
      this.current = forwards;
      this.reselect("backward");
    }

    this.updateState();
  }
  async reselect(e) {
    var t = this.current.type;
    if (t) {
      if (t === "node") {
        const o = [];
        for (const s of this.current.uuids) {
          var r = await Editor.Message.request("scene", "query-node", s);

          if (r && (r.isScene || (r.parent && r.parent.value.uuid))) {
            o.push(s);
          }
        }
        if (o.length === 0) {
          return void this[e]();
        }
        this.current.uuids = o;
      }
      const o = this.current.uuids;
      Editor.Selection.clear(t);
      Editor.Selection.select(t, o);
    } else {
      Editor.Selection.clear("node");
      Editor.Selection.clear("asset");
    }
  }
  rebase() {
    var { forwards, backwards } = this;
    forwards.length = 0;
    backwards.length = 0;
  }
  updateState() {
    var { forwards, backwards, panel } = this;

    if (forwards.length) {
      panel.$.forward.setAttribute("enable", "");
    } else {
      panel.$.forward.removeAttribute("enable");
    }

    if (backwards.length) {
      panel.$.backward.setAttribute("enable", "");
    } else {
      panel.$.backward.removeAttribute("enable");
    }
  }
}
