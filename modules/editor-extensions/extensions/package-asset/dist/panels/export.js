Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync, createWriteStream } = require("fs");

const { join } = require("path");

const remote_1 = require("@electron/remote");
const utlis_1 = require("../common/utlis");

const { isPath, initTemplate } = utlis_1;

const JSZip = require("../../lib/jszip.min");

const { I18n, Message } =
  ((exports.style = readFileSync(
    join(__dirname, "../../css/index.css"),
    "utf8"
  )),
  Editor);

exports.listeners = {
  resize() {
    this.$.tree.render(true);
  },
};

exports.template = `
    <header>
        <h1>
            <ui-label value="i18n:package-asset.export.title"></ui-label>
        </h1>
        <ui-progress></ui-progress>
        <ui-label class="info"></ui-label>
    </header>
    
    <section>
        <ui-tree></ui-tree>
        <ui-loading class="loading"></ui-loading>
        <ui-label class="mask" value="i18n:package-asset.export.tips"></ui-label>
    </section>
    
    <footer>
        <ui-checkbox class="btn_sellect_all">
            <ui-label value="i18n:package-asset.common.select_all"></ui-label>
        </ui-checkbox>
        <ui-checkbox class="btn_depend">
            <ui-label value="i18n:package-asset.export.btn_depend"></ui-label>
        </ui-checkbox>
        <ui-button class="export">
            <ui-label value="i18n:package-asset.export.button"></ui-label>
        </ui-button>
    </footer>    
`;

exports.$ = {
  tree: "ui-tree",
  select: ".select",
  progress: "ui-progress",
  btnExport: ".export",
  btnDepend: ".btn_depend",
  loading: ".loading",
  info: ".info",
  mask: ".mask",
  btn_sellect_all: ".btn_sellect_all",
};

let _state = 0;

exports.methods = {
  onRefresh(e) {},
  setState(e, t = 0, s = "") {
    switch ((_state = e)) {
      case utlis_1.STATE.WAIT: {
        this.$.progress.value = 0;

        this.$.info.setAttribute(
          "value",
          I18n.t("package-asset.export.message.wait")
        );

        break;
      }
      case utlis_1.STATE.IDLE: {
        this.$.progress.value = 0;

        this.$.info.setAttribute(
          "value",
          I18n.t("package-asset.export.message.idle", { total: this.total })
        );

        break;
      }
      case utlis_1.STATE.LOADING: {
        this.$.info.setAttribute(
          "value",
          Editor.I18n.t("package-asset.export.message.loading", {
            name: s,
            current: t.toString(),
            total: this.total,
          })
        );

        this.$.progress.value = (t / this.total) * 100;
        break;
      }
      case utlis_1.STATE.COMPLETED: {
        this.$.info.setAttribute(
          "value",
          I18n.t("package-asset.export.message.complete")
        );
      }
    }
  },
  async scanAssets(e) {
    this.uuids = Editor.Selection.getSelected("asset");

    if (this.uuids.length === 0) {
      this.uuids = [e.uuid];
    }

    this.setState(utlis_1.STATE.WAIT);
    e = await Message.request("scene", "execute-scene-script", {
      name: "package-asset",
      method: "getExportAssets",
      args: [{ uuids: this.uuids, includeDepend: this.$.btnDepend.value }],
    });
    this.$.loading.style.display = "none";
    this.$.tree.tree = e;
    this.updateTotal();

    if (this.total === 0) {
      this.$.mask.style.visibility = "visible";
    }
  },
  updateTotal() {
    this.list = [];
    this.$.btn_sellect_all.value = true;
    const t = (e) => {
      e.forEach((e) => {
        if (e.detail.checked) {
          if (e.detail.legal) {
            this.list.push(e.detail.asset);
            t(e.children);
          }
        } else {
          this.$.btn_sellect_all.value = false;
        }
      });
    };
    t(this.$.tree.tree);
    this.total = this.list.length;
    this.setState(utlis_1.STATE.IDLE);

    if (this.total > 0) {
      this.$.btnExport.removeAttribute("disabled");
    } else {
      this.$.btnExport.setAttribute("disabled", "");
    }
  },
  async exportAssets() {
    var e = this.$.tree.tree;
    if (e.length !== 0) {
      const t =
        (
          await Editor.Dialog.save({
            path:
              (await Editor.Profile.getConfig(
                "package-asset",
                "export-path"
              )) || Editor.Project.path,
            title: I18n.t("package-asset.export.title"),
            filters: [{ name: "Package", extensions: ["zip"] }],
          })
        ).filePath || "";
      if (isPath(t, true)) {
        await Editor.Profile.setConfig("package-asset", "export-path", t);
        const r = new JSZip();
        let a = 0;
        const i = (e, t) => {
          var e_detail = e.detail;
          var e_detail_asset = e_detail.asset;

          if (e_detail.checked && e_detail.legal) {
            a++;
            this.setState(utlis_1.STATE.LOADING, a, e_detail_asset.name);
            e_detail =
              e_detail_asset.isDirectory ||
              e_detail_asset.importer === "database";
            t = t || r;

            e_detail
              ? ((e_detail = t.folder(e_detail_asset.name)),
                t.file(
                  e_detail_asset.name + ".meta",
                  readFileSync(e_detail_asset.file + ".meta")
                ),
                l(e.children, e_detail))
              : (t.file(e_detail_asset.name, readFileSync(e_detail_asset.file)),
                t.file(
                  e_detail_asset.name + ".meta",
                  readFileSync(e_detail_asset.file + ".meta")
                ));
          }
        };
        function l(e, t) {
          for (const s of e) {
            i(s, t);
          }
        }
        l(e, null);

        r.generateNodeStream({ type: "nodebuffer" })
          .pipe(createWriteStream(t))
          .on("finish", () => {
            remote_1.shell.showItemInFolder(t);

            setTimeout(() => {
              Editor.Panel.close("package-asset.export");
            }, 500);
          });
      }
    }
  },
};

exports.ready = function (e) {
  initTemplate(this);

  Message.__protected__.addBroadcastListener("i18n:change", () => {
    this.setState(_state);
  });

  this.$.btnExport.addEventListener("confirm", () => {
    this.exportAssets();
  });

  this.$.btn_sellect_all.value = true;

  this.$.btn_sellect_all.addEventListener("confirm", async () => {
    const t = (e) => {
      e.forEach((e) => {
        e.detail.checked = this.$.btn_sellect_all.value;
        t(e.children);
      });
    };
    t(this.$.tree.tree);
    this.updateTotal();
    this.$.tree.render(true);
  });

  this.$.btnDepend.value = true;

  this.$.btnDepend.addEventListener("confirm", async () => {
    this.$.loading.style.display = "";

    this.$.tree.tree = await Message.request("scene", "execute-scene-script", {
      name: "package-asset",
      method: "getExportAssets",
      args: [{ uuids: this.uuids, includeDepend: this.$.btnDepend.value }],
    });

    this.$.loading.style.display = "none";
    this.updateTotal();
    this.$.tree.render(true);
  });

  this.scanAssets(e);
};

exports.beforeClose = utlis_1.beforeClose;
exports.close = utlis_1.close;
