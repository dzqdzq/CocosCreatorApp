Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;
const remote_1 = require("@electron/remote");

const { readFileSync, existsSync, readdir, outputJSON } = require("fs-extra");

const { join, basename } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const utils_1 = require("../../share/utils");

let panel = null;
let vm = null;

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/template/build-bundle.html"),
  "utf8"
);

const BuilderBundleVM = Vue.extend({
  name: "BuilderBundleVM",
  data() {
    return {
      taskInfo: {
        buildTaskIds: [],
        dest: "project://build/build-bundle",
        progress: 0,
        message: "waiting",
        id: "buildBundle",
        state: "none",
      },
      taskMap: [],
      buildTaskFree: true,
      currentBundle: null,
      logFile: "",
      openType: "openFile",
      bundles: [],
      isBuildWorkerReady: false,
    };
  },
  computed: {
    bundleBuildPlatformTips() {
      return this.currentBundle
        ? Editor.I18n.t("builder.asset_bundle.bundleBuildPlatformTips", {
            bundleUrl: basename(this.currentBundle.root),
          })
        : "";
    },
    maskInfo() {
      return this.isBuildWorkerReady
        ? this.bundles.length
          ? ""
          : "i18n:builder.asset_bundle.emptyBundle"
        : "i18n:builder.tips.waiting_for_worker_ready";
    },
  },
  async mounted() {
    this.isBuildWorkerReady = await Editor.Message.request(
      "builder",
      "query-worker-ready"
    );

    this.init();
  },
  methods: {
    async init() {
      await this.refreshTaskList();
      await this.initBundleInfo();

      this.openType = await Editor.Profile.getConfig("builder", "log.openType");
    },
    async refreshTaskList() {
      var { free, list } = await Editor.Message.request(
        "builder",
        "query-tasks-info",
        { type: "build" }
      );
      this.taskMap = list;
      this.buildTaskFree = free;

      if (this.taskMap.length) {
        this.taskInfo.buildTaskIds = [this.taskMap[0].id];
      }
    },
    async initBundleInfo() {
      var e = await Editor.Message.request(
        "asset-db",
        "query-assets",
        { isBundle: true },
        ["meta"]
      );

      if (e.length) {
        this.bundles = e.map((e) => ({
          root: e.url,
          name: e.meta.userData.bundleName || basename(e.url),
          output: true,
        }));

        this.updateCurrentBundle(this.currentBundle || this.bundles[0]);
      }
    },
    onSelectBundle(e) {
      const t = e.target.value;
      this.updateCurrentBundle(this.bundles.find((e) => e.root === t));
    },
    updateCurrentBundle(e) {
      if (e) {
        const e_root = e.root;

        if (!this.bundles.find((e) => e.root === e_root)) {
          e = this.bundles[0];
        }
      } else {
        e = this.bundles[0];
      }
      this.currentBundle = e;
      this.findLastedLog();
    },
    async findLastedLog() {
      var e;

      if (
        existsSync(LogDestDir) &&
        (e = (await readdir(LogDestDir)).filter((e) =>
          e.startsWith("build-bundle-")
        )).length
      ) {
        e.sort(
          (e, t) =>
            (0, utils_1.transTimeToNumber)(t) -
            (0, utils_1.transTimeToNumber)(e)
        );

        this.logFile = join(LogDestDir, e[0]);
      }
    },
    onToggleTask(e, t) {
      if (e) {
        this.taskInfo.buildTaskIds = [...this.taskInfo.buildTaskIds, t];
      } else {
        this.taskInfo.buildTaskIds.splice(
          this.taskInfo.buildTaskIds.findIndex((e) => e === t),
          1
        );
      }
    },
    updateTasks(e) {
      this.taskInfo.progress = e.progress;
      this.taskInfo.state = e.state;
      this.taskInfo.message = e.message;
    },
    async openLog() {
      var e = Editor.UI.__protected__.File.resolveToRaw(this.logFile);

      if (this.openType === "openFileDir") {
        remote_1.shell.showItemInFolder(e);
      } else if (
        !(await Editor.Message.request(
          "program",
          "open-program",
          "scriptEditor",
          { _args: [e] }
        ))
      ) {
        remote_1.shell.openPath(e);
      }
    },
    async openBuildPanel(e, t) {
      Editor.Message.send("builder", "open", "", e, t);
    },
    generateBundleBuildOptions() {
      return {
        buildTaskIds: this.taskInfo.buildTaskIds,
        dest: this.taskInfo.dest,
        id: this.taskInfo.id,
        bundleConfigs: [this.currentBundle],
        taskName: "build bundle " + this.currentBundle.root,
      };
    },
    async onBuild() {
      var e;

      if (
        this.currentBundle &&
        ((e = (0, utils_1.getTaskLogDest)("build-bundle-", Date.now())),
        (this.logFile = e),
        1 !==
          (e = await Editor.Message.request("builder", "add-bundle-task", {
            ...this.generateBundleBuildOptions(),
            logDest: e,
          })))
      ) {
        e === 0
          ? (this.taskInfo.message =
              "i18n:builder.asset_bundle.buildBundleBusy")
          : e === 2 &&
            (this.taskInfo.message =
              "i18n:builder.asset_bundle.buildBundleParams");

        this.taskInfo.state = "failed";
      }
    },
    async onButtonClick() {
      if (
        this.taskInfo.state === "processing" ||
        this.taskInfo.state === "waiting"
      ) {
        await Editor.Message.request("builder", "break-task", this.taskInfo.id);
      }

      this.taskInfo.state = "none";
    },
  },
  template: vueTemplate,
});

const LogDestDir = join(Editor.Project.tmpDir, "builder", "log");
function ready(e) {
  panel = this;

  if (e) {
    e.output = true;
  }

  vm?.$destroy();
  vm = new BuilderBundleVM();
  vm.currentBundle = e;
  vm.$mount(panel.$.container);
}
async function updateVmAssetInfo(e, t) {
  if (vm && t.importer === "directory") {
    await vm.initBundleInfo();
  }
}
async function beforeClose() {
  return (
    !vm ||
    !vm.taskInfo ||
    vm.taskInfo.state !== "processing" ||
    ((
      await Editor.Dialog.info(
        Editor.I18n.t("builder.asset_bundle.bundleBuildCloseTip"),
        {
          buttons: [
            Editor.I18n.t("builder.confirm"),
            Editor.I18n.t("builder.cancelBuild"),
          ],
          cancel: 0,
          default: 0,
        }
      )
    ).response === 1 &&
      (Editor.Message.send("builder", "break-task", vm.taskInfo.id), true))
  );
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/build-bundle.css"),
  "utf8"
);

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };

exports.methods = {
  async "bundle-task:changed"(e, t, s) {
    if (vm && e && e === vm.taskInfo.id) {
      await vm.updateTasks(t, s);
    }
  },
  async "builder:task-add"(e, t) {
    if (t.type === "build" && vm) {
      await vm.refreshTaskList();
    }
  },
  async "builder:task-delete"(e, t) {
    if (vm) {
      await vm.refreshTaskList();
    }
  },
  async "builder:task-changed"(e, t) {
    if (vm) {
      await vm.refreshTaskList();
    }
  },
  "asset-db:asset-delete": updateVmAssetInfo,
  "asset-db:asset-add": updateVmAssetInfo,
  "asset-db:asset-change": updateVmAssetInfo,
  async onBuildWorkerReady() {
    if (vm) {
      vm.isBuildWorkerReady = true;
      await vm.init();
    }
  },
  onBuildWorkerClosed() {
    if (vm) {
      vm.isBuildWorkerReady = false;
      console.debug("onBuildWorkerClosed");
    }
  },
  changeBuildBundle(t) {
    if (vm && t) {
      vm.updateCurrentBundle(vm.bundles.find((e) => e.root === t.root));
    }
  },
  async exportBundleBuildConfig() {
    var e;

    if (
      vm &&
      (e = await Editor.Dialog.save({
        path: join(
          Editor.Project.path,
          "build-config",
          `bundle-build-config-${basename(vm.currentBundle.root)}.json`
        ),
      })).filePath
    ) {
      await outputJSON(e.filePath, vm.generateBundleBuildOptions(), {
        spaces: 4,
      });
      console.log(`Build config has export in {link(${e.filePath})}`);
    }
  },
};
