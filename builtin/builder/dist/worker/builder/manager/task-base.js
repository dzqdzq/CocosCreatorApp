var __importDefault =
  (this && this.__importDefault) ||
  ((r) => (r && r.__esModule ? r : { default: r }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTaskBase = undefined;
const events_1 = __importDefault(require("events"));
class BuildTaskBase extends events_1.default {
  breakReason;
  name;
  progress = 0;
  error;
  hookWeight = 0.4;
  id;
  constructor(r, e) {
    super();
    this.name = e;
    this.id = r;
  }
  break(r) {
    this.breakReason = r;
    this.error = new Error("task is break by reason: " + r + "!");
  }
  onError(r, e = true) {
    this.error = r;

    if (e) {
      throw r;
    }
  }
  updateProcess(r, e = 0, t = "debug") {
    if (e) {
      this.progress = Editor.Utils.Math.clamp01(this.progress + e);
    }

    this.emit("update", r, this.progress);
    console[t](`${r}, progress: ${(100 * this.progress).toFixed(0)}%`);
  }
  async runPluginTask(t, r) {
    if (
      Object.keys(this.hookMap).length &&
      !this.error &&
      !this.options?.preview
    ) {
      var s = this.hookWeight / Object.keys(this.hookMap).length;
      for (let r = 0; r < this.hooksInfo.pkgNameOrder.length; r++) {
        if (this.error) {
          return void this.onError(this.error);
        }
        var o = this.hooksInfo.pkgNameOrder[r];
        var i = this.hooksInfo.infos[o];
        let e;
        try {
          var a;
          var h = `// ---- build task ${o}：${t} ----`;
          Editor.Metrics.trackTimeStart(h);

          if ((e = Editor.Module.__protected__.requireFile(i.path))[t]) {
            this.updateProcess(o + `:(${t}) start...`);
            console.debug(h);
            await this.handleHook(e[t], i.internal);
            a = await Editor.Metrics.trackTimeEnd(h, { output: true });
            this.updateProcess(o + `:(${t}) in ${a} ms ✓`, s);
          }
        } catch (r) {
          o = Editor.I18n.t("builder.error.run_hooks_failed", {
            pkgName: o,
            funcName: t,
          });
          this.updateProcess(o, s, "error");
          this.updateProcess(String(r), s);

          if ((e && e.throwError) || i.internal) {
            this.onError(r);
          }
        }
      }
    }
  }
}
exports.BuildTaskBase = BuildTaskBase;
