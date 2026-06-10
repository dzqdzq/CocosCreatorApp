Object.defineProperty(exports, "__esModule", { value: true });
let onReportBind = null;
let lastOnline = false;
module.exports = Editor.Panel.define({
  template: '<webview class="view"></webview>',
  style: `
        .view {
            opacity: 0;
            width: 1px;
            height: 1px;
            display: block;
        }
    `,
  $: { iframe: ".view" },
  methods: {
    async postMessage(e) {
      var t = this.$.iframe;

      if (t && t.contentWindow) {
        t.contentWindow.postMessage({ tag: "g4", events: e }, "*");
      }
    },
    async report(e) {
      var t = await Editor.Message.request("metrics", "query-google-v4-data");
      var e = e || t.reportEvents;

      if (e.length > 0) {
        this.postMessage(e);
      }
    },
  },
  async ready() {
    const e = await Editor.Message.request("metrics", "query-google-v4-data");
    const t = this.$.iframe;
    t.src = e.htmlUrl;

    t.addEventListener("dom-ready", async () => {
      this.postMessage([{ name: "init", params: e.firstTimestamp }]).then(
        async () => {
          await this.report(e.reportEvents);
        }
      );
    });

    t.addEventListener("devtools-opened", () => {
      t.closeDevTools();
    });

    lastOnline = window.navigator.onLine;

    window.addEventListener("online", () => {
      if (!lastOnline) {
        lastOnline = window.navigator.onLine;
        t.reload();
      }
    });

    window.addEventListener("offline", () => {
      lastOnline = window.navigator.onLine;
    });

    onReportBind = this.report.bind(this);

    Editor.Message.__protected__.addBroadcastListener(
      "metrics:google-v4-report-change",
      onReportBind
    );
  },
  async close() {
    if (onReportBind) {
      Editor.Message.__protected__.removeBroadcastListener(
        "metrics:google-v4-report-change",
        onReportBind
      );
    }
  },
});
