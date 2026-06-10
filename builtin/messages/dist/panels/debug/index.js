Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { join, relative } = require("path");

const { readFileSync } = require("fs-extra");

const record_message_1 = require("../../record-message");

const { saveMessageLog } = record_message_1;

const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
const list = [];

const paths = {
  app: join(Editor.App.path, "builtin"),
  global: join(Editor.App.home, "packages"),
  local: join(Editor.Project.path, "packages"),
};

const vueTemplate = readFileSync(
  join(__dirname, "../../../static", "./debug/index.html"),
  "utf8"
);

const MessagesDebugPanelVM = Vue.extend({
  name: "MessagesDebugPanelVM",
  data() {
    return { list, message: null, record: false, autoSave: false };
  },
  watch: {
    list() {
      const e = this.$refs.slider;

      if (e.clientHeight + e.scrollTop > e.scrollHeight - 10) {
        requestAnimationFrame(() => {
          e.scrollTop = e.scrollHeight - e.clientHeight;
        });
      }
    },
  },
  async mounted() {
    var { hasRecord, autoSave } = await Editor.Message.request(
      "messages",
      "query-message-state"
    );
    this.record = hasRecord;
    this.autoSave = autoSave;
  },
  methods: {
    start() {
      Editor.Message.send("messages", "start-record");
      this.record = true;
    },
    stop() {
      Editor.Message.send("messages", "stop-record");
      this.record = false;
    },
    clear() {
      for (this.message = null; list.length; ) {
        list.shift();
      }
    },
    getURL(e = "") {
      e = e.substr(1, e.length - 2);

      return Editor.Utils.Path.contains(paths.app, e)
        ? "db://packages/" + relative(paths.app, e)
        : Editor.Utils.Path.contains(paths.global, e)
        ? "db://packages/" + relative(paths.global, e)
        : Editor.Utils.Path.contains(paths.local, e)
        ? "db://packages/" + relative(paths.local, e)
        : e;
    },
    async save() {
      var e = await Editor.Dialog.save({
        title: "Saving Message Logs",
        path: Editor.Utils.File.getName(record_message_1.DefaultMessageLogFile),
      });

      if (e.filePath) {
        await saveMessageLog(list, e.filePath);
        console.info(`output message file in {link(${e.filePath})}`);
      }
    },
    async toggleAutoSave(e) {
      e = e.target.value;

      if ((this.autoSave = e)) {
        Editor.Message.send("messages", "start-auto-save");
      } else {
        Editor.Message.send("messages", "stop-auto-save");
      }
    },
  },
  template: vueTemplate,
});

function ready() {
  var e = this;
  Editor.Message.broadcast("messages:stop");
  e.vm?.$destroy();
  e.vm = new MessagesDebugPanelVM();
  e.vm.$mount(e.$.container);
}
function close() {
  Editor.Message.send("messages", "stop-record");
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = readFileSync(join(__dirname, "./index.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };

exports.methods = {
  broadcast(e) {
    list.push(e);

    if (list.length > 300) {
      list.shift();
    }
  },
  request(e) {
    e.loading = true;
    list.push(e);

    if (list.length > 300) {
      list.shift();
    }
  },
  reply(s) {
    var e = list.find((e) => e.id === s.id);

    if (e) {
      e.loading = false;
    }

    list.push(s);

    if (list.length > 300) {
      list.shift();
    }
  },
  send(e) {
    list.push(e);

    if (list.length > 300) {
      list.shift();
    }
  },
};
