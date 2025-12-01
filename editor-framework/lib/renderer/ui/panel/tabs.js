"use strict";
const e = require("../../../share/js-utils");
const t = require("../behaviors/droppable");
const i = require("../utils/dock-utils");
const s = require("../utils/dom-utils");
const a = require("../utils/focus-mgr");
class n extends window.HTMLElement {
  static get tagName() {
    return "ui-dock-tabs";
  }
  constructor() {
    super();
    let e = this.attachShadow({ mode: "open" });
    e.innerHTML = '\n      <div class="border">\n        <div class="tabs">\n          <slot select="ui-dock-tab"></slot>\n        </div>\n\n        <div id="popup" class="icon">\n          <i class="icon-popup"></i>\n        </div>\n        <div id="menu" class="icon">\n          <i class="icon-menu"></i>\n        </div>\n        <div id="insertLine" class="insert"></div>\n      </div>\n    ';

    e.insertBefore(
      s.createStyleElement("theme://elements/tabs.css"),
      e.firstChild
    );

    this.activeTab = null;
    this._focused = false;

    this.$ = {
        popup: this.shadowRoot.querySelector("#popup"),
        menu: this.shadowRoot.querySelector("#menu"),
        insertLine: this.shadowRoot.querySelector("#insertLine"),
      };

    this.addEventListener(
      "drop-area-enter",
      this._onDropAreaEnter.bind(this)
    );

    this.addEventListener(
      "drop-area-leave",
      this._onDropAreaLeave.bind(this)
    );

    this.addEventListener(
      "drop-area-accept",
      this._onDropAreaAccept.bind(this)
    );

    this.addEventListener("drop-area-move", this._onDropAreaMove.bind(this));

    this.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    this.addEventListener("click", this._onClick.bind(this));
    this.addEventListener("tab-click", this._onTabClick.bind(this));
    this.$.popup.addEventListener("click", this._onPopup.bind(this));
    this.$.menu.addEventListener("click", this._onMenuPopup.bind(this));
    this.droppable = "tab";
    this.multi = false;
    this._initDroppable(this);

    if (this.children.length > 0) {
      this.select(this.children[0]);
    }
  }
  _setFocused(e) {
    this._focused = e;
    for (let t = 0; t < this.children.length; ++t) {
      this.children[t].focused = e;
    }
  }
  findTab(e) {
    for (let t = 0; t < this.children.length; ++t) {
      let i = this.children[t];
      if (i.frameEL === e) {
        return i;
      }
    }
    return null;
  }
  insertTab(e, t) {
    return e === t
      ? e
      : (t ? this.insertBefore(e, t) : this.appendChild(e),
        (e.focused = this._focused),
        e);
  }
  addTab(e) {
    let t = document.createElement("ui-dock-tab");
    t.name = e;
    this.appendChild(t);
    t.focused = this._focused;
    return t;
  }
  removeTab(e) {
    let t = null;

    if ("number" == typeof e) {
      if (e < this.children.length) {
        t = this.children[e];
      }
    } else {
      if (i.isTab(e)) {
        t = e;
      }
    }

    if (
      (null !== t)
    ) {
      if (this.activeTab === t) {
        this.activeTab = null;
        let e = t.nextElementSibling;

        if (!e) {
          e = t.previousElementSibling;
        }

        if (e) {
          this.select(e);
        }
      }
      t.focused = false;
      this.removeChild(t);
    }
  }
  select(e) {
    let t = null;

    if ("number" == typeof e) {
      if (e < this.children.length) {
        t = this.children[e];
      }
    } else {
      if (i.isTab(e)) {
        t = e;
      }
    }

    if (
      (null !== t)
    ) {
      if (t !== this.activeTab) {
        let e = this.activeTab;

        if (null !== this.activeTab) {
          this.activeTab.classList.remove("active");
        }

        this.activeTab = t;
        this.activeTab.classList.add("active");
        this.$.popup.classList.toggle("hide", !t.frameEL.popable);

        s.fire(this, "tab-changed", {
          bubbles: true,
          detail: { oldTab: e, newTab: t },
        });
      }
      a._setFocusPanelFrame(t.frameEL);
    }
  }
  outOfDate(e) {
    let t = null;

    if ("number" == typeof e) {
      if (e < this.children.length) {
        t = this.children[e];
      }
    } else {
      if (i.isTab(e)) {
        t = e;
      }
    }

    if (null !== t) {
      t.outOfDate = true;
    }
  }
  _onClick(e) {
    e.stopPropagation();
    a._setFocusPanelFrame(this.activeTab.frameEL);
  }
  _onTabClick(e) {
    e.stopPropagation();
    this.select(e.target);
  }
  _onDropAreaEnter(e) {
    e.stopPropagation();
  }
  _onDropAreaLeave(e) {
    e.stopPropagation();
    i.dragleaveTab(this);
    this.$.insertLine.style.display = "";
  }
  _onDropAreaAccept(e) {
    e.stopPropagation();
    this.$.insertLine.style.display = "";
    i.dropTab(this, this._curInsertTab);
  }
  _onDropAreaMove(e) {
    e.stopPropagation();
    i.dragoverTab(this);
    let t = e.detail.dataTransfer;
    let s = e.detail.target;
    t.dropEffect = "move";
    this._curInsertTab = null;
    let a = this.$.insertLine.style;
    a.display = "block";
    if (i.isTab(s)) {
      a.left = s.offsetLeft + "px";
      this._curInsertTab = s;
    } else {
      let e = this.lastElementChild;
      a.left = e.offsetLeft + e.offsetWidth + "px";
    }
  }
  _onPopup(e) {
    e.stopPropagation();
    if ((this.activeTab)) {
      let e = this.activeTab.frameEL.id;
      Editor.Panel.popup(e);
    }
  }
  _onMenuPopup(e) {
    e.stopPropagation();
    let t = this.$.menu.getBoundingClientRect();
    let i = "";
    let s = true;

    if (this.activeTab) {
      i = this.activeTab.frameEL.id;
      s = this.activeTab.frameEL.popable;
    }

    Editor.Menu.popup(
      [
        {
          label: Editor.T("PANEL_MENU.maximize"),
          dev: true,
          message: "editor:panel-maximize",
          params: [i],
        },
        {
          label: Editor.T("PANEL_MENU.pop_out"),
          command: "Editor.Panel.popup",
          params: [i],
          enabled: s,
        },
        {
          label: Editor.T("PANEL_MENU.close"),
          command: "Editor.Panel.close",
          params: [i],
          enabled: s,
        },
        { label: Editor.T("PANEL_MENU.add_tab"), dev: true, submenu: [] },
      ],
      t.left + 5,
      t.bottom + 5
    );
  }
}
e.addon(n.prototype, t);
module.exports = n;
