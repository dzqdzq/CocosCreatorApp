Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const { getNameByDump, setElementReadonly } = require("../utils");

const i18nPrefix = "i18n:";
class ObjectClass extends dum_element_base_1.DumpElementBase {
  type = ["cc.Object"];
  $section = null;
  $type = null;
  $help = null;
  $propList = {};
  $groups = {};
  _listeners = [];
  template = `
        <ui-section expand>
            <div slot="header" style="overflow: hidden;">
                <ui-label name style="white-space: nowrap;"></ui-label>
                <ui-label type style="white-space: nowrap;opacity: 0.55;margin-left: 4px;flex:auto;font-weight:normal;"></ui-label>
                <ui-link style="display: none" tooltip="i18n:scene.menu.help_url">
                    <ui-icon value="help"><ui-icon>
                </ui-link>
            </div>
        </ui-section>`;
  style = ":host { margin-left: 0; }";
  parseAndSetData(s, r) {
    Object.keys(s).forEach((e) => {
      var t = s[e];

      if (r.value[e] && t.type === r.value[e].type) {
        r.value[e] = JSON.parse(JSON.stringify(t));
      }
    });

    return true;
  }
  queryParentCacheExpend(e, t) {
    var s = "cache-expand";
    let r = e;

    while (r) {
      if (r.hasAttribute(s)) {
        return r.getAttribute(s) || "";
      }
      r = r.parentElement;
    }

    return t;
  }
  toggleGroup() {
    for (const e in this.$groups) {
      if (this.$groups[e].dump.style === "section") {
        this.$groups[e]
          .querySelectorAll(".ui-prop-group-content")
          .forEach((e) => {
            if (
              Array.from(e.querySelectorAll(":scope > ui-prop")).some(
                (e) => getComputedStyle(e).display !== "none"
              )
            ) {
              e.removeAttribute("hidden");
            } else {
              e.setAttribute("hidden", "");
            }
          });
      }

      if (this.$groups[e].dump.style === "tab") {
        if (
          Array.from(
            this.$groups[e].querySelectorAll(".tab-content > ui-prop")
          ).some((e) => getComputedStyle(e).display !== "none")
        ) {
          this.$groups[e].removeAttribute("hidden");
        } else {
          this.$groups[e].setAttribute("hidden", "");
        }
      }
    }
  }
  createGroup(e) {
    var t = document.createElement("div");
    t.setAttribute("class", "ui-prop-group");
    t.dump = e;
    t.names = {};
    t.displayOrder = e.displayOrder;
    return t;
  }
  createTabGroup(e) {
    const s = document.createElement("div");
    function t(e) {
      const t = Object.keys(s.tabs)[e];
      s.childNodes.forEach((e) => {
        if (e.classList.contains("tab-content")) {
          if (e.getAttribute("name") === t) {
            e.style.display = "block";
          } else {
            e.style.display = "none";
          }
        }
      });
    }
    s.setAttribute("class", "tab-group");
    s.dump = e;
    s.tabs = {};
    s.displayOrder = e.displayOrder;
    s.$header = document.createElement("ui-tab");
    s.$header.setAttribute("class", "tab-header");
    s.appendChild(s.$header);

    s.$header.addEventListener("change", (e) => {
      t(e.target.value);
    });

    setTimeout(() => {
      t(0);
    });

    return s;
  }
  getName(e) {
    return getNameByDump(e);
  }
  appendToGroup(t, s) {
    if (!t.names[s]) {
      var r = document.createElement("ui-section");

      r.setAttribute("class", "ui-prop-group-content");
      r.setAttribute("expand", "");
      var i = this.queryParentCacheExpend(t, "ui-prop-group-content");

      var i =
        (r.setAttribute("cache-expand", i + "-" + s),
        document.createElement("ui-label"));

      i.setAttribute("slot", "header");
      let e = s;

      e = e.startsWith(i18nPrefix)
        ? this.getName({ displayName: s })
        : this.getName({ name: s });

      i.setAttribute("value", e);
      r.appendChild(i);
      t.appendChild(r);
      t.names[s] = r;
    }
  }
  appendToTabGroup(t, s) {
    if (!t.tabs[s]) {
      var r = document.createElement("div");

      var r =
        ((t.tabs[s] = r).setAttribute("class", "tab-content"),
        r.setAttribute("name", s),
        t.appendChild(r),
        document.createElement("ui-label"));

      let e = s;

      e = e.startsWith(i18nPrefix)
        ? this.getName({ displayName: s })
        : this.getName({ name: s });

      r.setAttribute("value", e);
      var i = document.createElement("ui-button");
      i.setAttribute("name", s);
      i.appendChild(r);
      t.$header.appendChild(i);
    }
  }
  appendChildByDisplayOrder(e, t) {
    const s = t.displayOrder || 0;
    var r = Array.from(e.children).find((e) =>
      e.dump && e.displayOrder > s ? e : null
    );

    if (r) {
      r.before(t);
    } else {
      e.appendChild(t);
    }
  }
  mounted(e) {
    this.$section = e.querySelector("ui-section");
    this.$label = e.querySelector("ui-label[name]");
    this.$type = e.querySelector("ui-label[type]");
    this.$help = e.querySelector("ui-link");
  }
  ready() {
    super.ready();

    if (this.$help) {
      this.$help.addEventListener("click", (e) => e.stopPropagation());
    }
  }
  update(a) {
    super.update(a);

    if (this.$parentElement && this.$section) {
      if (this.$type) {
        this.$type.value = ": " + a.type;
      }

      this.$parentElement.setAttribute("no-label", "");
      var e;
      var t = a.path || a.name + ":" + a.type;
      var s = this.queryParentCacheExpend(this.$parentElement, "root");

      var s =
        (this.$section.setAttribute("cache-expand", s + "-" + t),
        this.$parentElement.hasAttribute("ui-section-config") &&
          this.$section.setAttribute("class", "config"),
        a.help &&
          this.$help &&
          ((this.$help.value = a.help),
          (this.$help.style.display = "flex"),
          a.editor?.help) &&
          (this.$help.helpData = a.editor),
        Object.keys(this.$propList));

      const l = [];
      Object.keys(a.value).forEach((t, s) => {
        var r;
        var i;
        var p = a.value[t];
        if (p.visible && this.$section) {
          l.push(t);
          let e = this.$propList[t];

          if (e) {
            if (!e.isConnected || !e.parentElement) {
              if (p.group && a.groups) {
                ({ id: r = "default", name: i } = p.group);
                this.appendChildByDisplayOrder(this.$groups[r].names[i], e);
              } else {
                this.appendChildByDisplayOrder(this.$section, e);
              }
            }
          } else {
            (e = document.createElement("ui-prop")).setAttribute(
              "type",
              "dump"
            );

            this.$propList[t] = e;
            r = p.group?.displayOrder ?? p.displayOrder;
            e.displayOrder = r === undefined ? s : Number(r);

            p.group && a.groups
              ? (({ id: i = "default", name: t } = p.group),
                !this.$groups[i] &&
                  a.groups[i] &&
                  (a.groups[i].style === "tab"
                    ? (this.$groups[i] = this.createTabGroup(a.groups[i]))
                    : a.groups[i].style === "section" &&
                      (this.$groups[i] = this.createGroup(a.groups[i]))),
                this.$groups[i] &&
                  (this.$groups[i].isConnected ||
                    this.appendChildByDisplayOrder(
                      this.$section,
                      this.$groups[i]
                    ),
                  a.groups[i].style === "tab"
                    ? this.appendToTabGroup(this.$groups[i], t)
                    : a.groups[i].style === "section" &&
                      this.appendToGroup(this.$groups[i], t)),
                a.groups[i].style === "tab"
                  ? this.appendChildByDisplayOrder(this.$groups[i].tabs[t], e)
                  : a.groups[i].style === "section" &&
                    this.appendChildByDisplayOrder(this.$groups[i].names[t], e))
              : this.appendChildByDisplayOrder(this.$section, e);
          }

          e.render(p);
          setElementReadonly(p, e);
        }
      });
      for (const r of s) {
        if (!l.includes(r)) {
          if ((e = this.$propList[r]) && e.parentElement) {
            e.parentElement.removeChild(e);
          }
        }
      }
      this.toggleGroup();
    }
  }
  close() {
    for (const e in this.$groups) {
      this.$groups[e].remove();
    }
    this.$groups = {};

    Object.keys(this.$propList).forEach((e) => this.$propList[e].remove());

    this.$propList = {};
  }
}
exports.default = ObjectClass;
