Object.defineProperty(exports, "__esModule", { value: true });

exports.close = undefined;
exports.beforeClose = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.listeners = undefined;

const showImage = ["cc.ImageAsset", "cc.SpriteFrame", "cc.Texture2D"];
exports.listeners = {};

exports.style = `
:host {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:host > .container { 
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

:host > .container[whole] { 
  max-height: 100%;
}
:host > .container > .header { 
  display: flex;
  flex: 1;
}
:host > .container > .header > .icon {
  width: 20px;
  font-size: 14px;
  cursor: pointer;
}
:host > .container > .header > .image { 
  width: 20px;
  height: 24px;
  cursor: pointer;
}
:host > .container > .header > .icon:hover,
:host > .container > .header > .image:hover {
  opacity: 0.8;
}
:host > .container > .header > .name { 
  flex: 1;
  padding-left: 5px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
:host > .container > .header > .lock { 
  display: none;
  font-size: 12px;
  color: var(--color-focus-contrast-normal);
  margin-left: 4px;
  margin-right: 12px;
  cursor: auto;
}
:host > .container > .header > ui-button { 
  display: none;
  padding: 0 6px; 
  height: 22px;
  margin-left: 6px;
  margin-right: 6px;
}
:host > .container > .header[dirty] > ui-button {
  display: inline-block;
}
:host > .container > .content {
  display: flex;
  padding-top: 5px;
  flex: 1;
  flex-direction: column;
}
:host > .container > .content > section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:host > .container > .content > .content-section {
  flex: 1;
  overflow: auto;
}
:host > .container > .content > section > ui-panel {
  display: flex;
  flex-direction: column;
}
:host > .container > .content > section > ui-panel:only-child {
  flex: 1;
}

:host > .container > .content > .content-footer {
  margin-top: 10px;
}

:host([sub-type="material"]) > .container > .content,
:host([sub-type="gltf-material"]) > .container > .content {
  padding-top: 0;
}

:host([sub-type="material"]) > .container > .content > .content-header,
:host([sub-type="gltf-material"]) > .container > .content > .content-header {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 1;
}

`;

exports.template = `
<ui-section whole class="container">
  <header class="header" slot="header">
      <ui-icon class="icon" color tooltip="i18n:inspector.locate_asset"></ui-icon>
      <ui-image class="image" tooltip="i18n:inspector.locate_asset"></ui-image>
      <span class="name"></span>
      <ui-button class="save tiny green transparent" tooltip="i18n:inspector.asset.save">
          <ui-icon value="check"></ui-icon>
      </ui-button>
      <ui-button class="reset tiny red transparent" tooltip="i18n:inspector.asset.reset">
          <ui-icon value="reset"></ui-icon>
      </ui-button>
      <ui-icon class="lock" value="lock" tooltip="i18n:inspector.asset.prohibitEditInternalAsset"></ui-icon>
  </header>
  <section class="content">
      <section class="content-header"></section>
      <section class="content-section"></section>
      <section class="content-footer"></section>
  </section>
</ui-section>
`;

exports.$ = {
  container: ".container",
  header: ".header",
  content: ".content",
  lock: ".lock",
  icon: ".icon",
  image: ".image",
  name: ".name",
  save: ".save",
  reset: ".reset",
  contentHeader: ".content-header",
  contentSection: ".content-section",
  contentFooter: ".content-footer",
};

const Elements = {
  panel: {
    ready() {
      const t = this;
      let n;

      t.__assetChanged__ = (e) => {
        if (Array.isArray(t.uuidList) && t.uuidList.includes(e)) {
          window.cancelAnimationFrame(n);

          n = window.requestAnimationFrame(async () => {
            await t.reset();
          });
        }
      };

      Editor.Message.addBroadcastListener(
        "asset-db:asset-change",
        t.__assetChanged__
      );
    },
    async update() {
      const t = this;
      let e = [];
      try {
        e = await Promise.all(
          t.uuidList.map((e) =>
            Editor.Message.request("asset-db", "query-asset-info", e)
          )
        );
      } catch (e) {
        console.error(e);
      }
      e = e.filter(Boolean);
      t.asset = e[0];
      t.assetList = [];
      t.uuidList = [];
      t.type = "unknown";

      if (t.asset) {
        const n = t.asset.importer;
        e.forEach((e) => {
          if (e.importer === n && (t.uuidList.length <= 0 || !e.readonly)) {
            t.uuidList.push(e.uuid);
            t.assetList.push(e);
          }
        });
      }

      if (t.asset) {
        t.$.container.style.display = "flex";
        t.type = t.asset.importer;

        t.assetList.some((e) => e.importer !== t.type) && (t.type = "unknown");
      } else {
        t.$.container.style.display = "none";
      }

      t.$this.setAttribute("sub-type", t.type);

      if (t.type === "unknown") {
        t.metaList = [];
        return !(t.metaListOrigin = []);
      }

      try {
        t.metaList = await Promise.all(
          t.uuidList.map((e) =>
            Editor.Message.request("asset-db", "query-asset-meta", e)
          )
        );
      } catch (e) {
        console.error(e);
        t.metaList = [];
      }
      t.metaList = t.metaList.filter(Boolean);

      t.metaListOrigin = t.metaList.map((e) => JSON.stringify(e));
    },
    close() {
      Editor.Message.removeBroadcastListener(
        "asset-db:asset-change",
        this.__assetChanged__
      );
    },
  },
  header: {
    ready() {
      const t = this;

      t.$.save.addEventListener("click", (e) => {
        e.stopPropagation();
        t.save();
      });

      t.$.reset.addEventListener("click", (e) => {
        e.stopPropagation();
        t.reset();
      });

      t.$.icon.addEventListener("click", (e) => {
        e.stopPropagation();

        t.uuidList.forEach((e) => {
          Editor.Message.request("assets", "ui-kit:touch-asset", e);
        });
      });
    },
    update() {
      var e = this;

      if (e.asset) {
        e.$.name.innerHTML =
          e.assetList.length === 1
            ? e.asset.name
            : e.assetList.length + " selections";

        e.$.lock.style.display = e.asset.readonly ? "inline-block" : "none";

        (showImage.includes(e.asset.type)
          ? ((e.$.image.value = e.asset.uuid),
            e.$.header.prepend(e.$.image),
            e.$.icon)
          : ((e.$.icon.value = e.asset.importer),
            e.$.header.prepend(e.$.icon),
            (e.$.image.value = ""),
            e.$.image)
        ).remove();
      }
    },
    async isDirty() {
      var e = this;

      if (await e.isDirty()) {
        e.$.header.setAttribute("dirty", "");
      } else {
        e.$.header.removeAttribute("dirty");
      }
    },
  },
  content: {
    ready() {
      this.contentRenders = {};
    },
    update() {
      const t = this;
      t.contentRenders = {
        header: { list: [], contentRender: t.$.contentHeader },
        section: {
          list: t.renderMap.section.unknown,
          contentRender: t.$.contentSection,
        },
        footer: { list: [], contentRender: t.$.contentFooter },
      };
      for (const e in t.renderMap) {
        if (t.renderMap[e] && t.renderMap[e][t.type]) {
          t.contentRenders[e].list = t.renderMap[e][t.type];
        }
      }
      for (const o in t.contentRenders) {
        var { list, contentRender } = t.contentRenders[o];
        contentRender.__panels__ = Array.from(contentRender.children);
        let e = 0;
        for (e; e < list.length; e++) {
          var a = list[e];

          if (!contentRender.__panels__[e]) {
            contentRender.__panels__[e] = document.createElement("ui-panel");

            contentRender.__panels__[e].addEventListener("change", () => {
              Elements.header.isDirty.call(t);
            });

            contentRender.appendChild(contentRender.__panels__[e]);
          }

          contentRender.__panels__[e].setAttribute("src", a);
        }
        for (e; e < contentRender.__panels__.length; e++) {
          contentRender.removeChild(contentRender.__panels__[e]);
        }
        contentRender.__panels__ = Array.from(contentRender.children);

        Array.prototype.forEach.call(contentRender.__panels__, (e) => {
          e.injectionStyle("ui-prop { margin-top: 5px; }");
          e.update(t.assetList, t.metaList);
        });
      }
    },
  },
};

async function update(e, t) {
  this.uuidList = e || [];
  this.renderMap = t;
  for (const s in Elements) {
    var n = Elements[s];

    if (n.update) {
      await n.update.call(this);
    }
  }
}
function ready() {
  for (const t in Elements) {
    var e = Elements[t];

    if (e.ready) {
      e.ready.call(this);
    }
  }
}
async function beforeClose() {
  var e;
  var t = this;
  if (t.isDialoging) {
    return false;
  }
  for (const a in t.contentRenders) {
    var n = t.contentRenders[a].contentRender;
    if (Array.isArray(n.__panels__)) {
      for (let e = 0; e < n.__panels__.length; e++) {
        if (!(await n.__panels__[e].canClose())) {
          return false;
        }
      }
    }
  }
  if (!(await t.isDirty())) {
    return true;
  }
  let s = 2;

  if (await Editor.Profile.getConfig("inspector", "asset.auto_save")) {
    s = 1;
  } else {
    t.isDialoging = true;

    e = Editor.I18n.t("inspector.check_is_saved.assetMessage").replace(
      "${assetName}",
      t.asset.name
    );

    e = await Editor.Dialog.warn(e, {
      buttons: [
        Editor.I18n.t("inspector.check_is_saved.abort"),
        Editor.I18n.t("inspector.check_is_saved.save"),
        "Cancel",
      ],
      default: 1,
      cancel: 2,
    });

    s = e.response;
    t.isDialoging = false;
  }

  return s === 0
    ? (t.$.header.removeAttribute("dirty"), true)
    : s === 1 && (await t.save(), true);
}
async function close() {
  for (const t in Elements) {
    var e = Elements[t];

    if (e.close) {
      e.close.call(this);
    }
  }
}

exports.methods = {
  async isDirty() {
    const n = this;
    let t = false;
    if (
      !n.metaList ||
      !(t = n.metaList.some(
        (e, t) => n.metaListOrigin[t] !== JSON.stringify(e)
      ))
    ) {
      for (const e in n.contentRenders) {
        var s = n.contentRenders[e].contentRender;
        if (Array.isArray(s.__panels__)) {
          for (let e = 0; e < s.__panels__.length; e++) {
            if ((t = await s.__panels__[e].callMethod("isDirty"))) {
              return t;
            }
          }
        }
      }
    }
    return t;
  },
  async save() {
    const s = this;
    var t = [];
    for (const e in s.contentRenders) {
      var n = s.contentRenders[e].contentRender;
      if (Array.isArray(n.__panels__)) {
        for (let e = 0; e < n.__panels__.length; e++) {
          t.push(n.__panels__[e].callMethod("canApply"));
        }
      }
    }
    if (!(await Promise.all(t)).some((e) => e === false)) {
      let t = true;
      for (const i in s.contentRenders) {
        var a = s.contentRenders[i].contentRender;
        if (Array.isArray(a.__panels__)) {
          for (let e = 0; e < a.__panels__.length; e++) {
            var o = await a.__panels__[e].callMethod("apply");
            if (o === false) {
              return;
            }

            if (o == 1) {
              t = false;
            }
          }
        }
      }
      s.$.header.removeAttribute("dirty");

      if (t !== false) {
        s.uuidList.forEach((e, t) => {
          var n = JSON.stringify(s.metaList[t]);

          if (n !== s.metaListOrigin[t]) {
            s.metaListOrigin[t] = n;
            Editor.Message.request("asset-db", "save-asset-meta", e, n);
          }
        });
      }
    }
  },
  async reset() {
    var e = this;
    e.$.header.removeAttribute("dirty");
    for (const n in e.contentRenders) {
      var t = e.contentRenders[n].contentRender;
      for (let e = 0; e < t.__panels__.length; e++) {
        await t.__panels__[e].callMethod("reset");
      }
    }
    e.$this.update(e.uuidList, e.renderMap);
  },
};

exports.update = update;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;
