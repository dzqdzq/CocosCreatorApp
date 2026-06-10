Object.defineProperty(exports, "__esModule", { value: true });
const WebSocketServer = require("websocket").server;
const { serialize, deserialize } = require("v8");
const http = require("http");
const PROFILER = false;

const profilerStringify = PROFILER
  ? (e) => {
      var r = Date.now();
      var e = serialize(e);
      var t = Date.now();

      if (1 < t - r) {
        console.log("JSON.stringify time out", t - r, e);
        console.trace();
      }

      return e;
    }
  : (e) => serialize(e);

const profilerParse = PROFILER
  ? (e) => {
      var r = Date.now();
      var e = deserialize(e);
      var t = Date.now();

      if (1 < t - r) {
        console.log("JSON.parse time out", t - r, e.type);
      }

      return e;
    }
  : (e) => deserialize(e);

class EditorServer {
  constructor() {
    this.resolveMap = {};
    this.callbackMap = {};
  }
  getPort() {
    return this.server.address().port;
  }
  startServer(e) {
    const o = this;

    this.server = http.createServer((e, r) => {
      console.log(new Date() + " Received request for " + e.url);
      r.writeHead(404);
      r.end();
    });

    this.server.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        console.error("Nativize IPC Serer error : EADDRINUSE", o.getPort());
      }
    });

    this.server.listen(e, () => {
      console.log(new Date() + " Server is listening on port " + o.getPort());
    });

    this.wsServer = new WebSocketServer({
      httpServer: this.server,
      closeTimeout: 1800000 /* 18e5 */,
      keepaliveGracePeriod: 1800000 /* 18e5 */,
      autoAcceptConnections: false,
      maxReceivedFrameSize: 20480000 /* 2048e4 */,
      maxReceivedMessageSize: 20480000 /* 2048e4 */,
    });

    this.wsServer.on("request", (e) => {
      const t = e.accept("editor-native", e.origin);
      console.log(new Date() + " Connection accepted.");

      t.on("message", (e) => {
        var r;

        if (e.type !== "utf8") {
          PROFILER && console.log("EditorReceiceTime", Date.now());
          e = profilerParse(e.binaryData);

          (r = o.resolveMap[e.id])
            ? (PROFILER &&
                console.log(
                  "requestResponseTime",
                  e.id,
                  Date.now() - r[2],
                  r[3]
                ),
              r[0](e),
              (o.resolveMap[e.id] = null))
            : e.ipc
            ? o.retransmitIPC(e)
            : console.log("receive nativize msg");
        }
      });

      t.on("close", (e, r) => {
        console.log("native ipc close", e, r);

        if (o.callbackMap.close) {
          o.callbackMap.close(t);
        }

        o.connection = null;
      });

      o.connection = t;

      if (o.callbackMap.connect) {
        o.callbackMap.connect(t);
      }
    });
  }
  send(e) {
    if (this.connection) {
      this.connection.sendBytes(profilerStringify(e));
    } else {
      console.error("nativize not connect");
    }
  }
  request(t) {
    return this.connection
      ? new Promise((e, r) => {
          this.resolveMap[t.id] = [e, r];
          this.connection.sendBytes(profilerStringify(t));
        })
      : Promise.reject("send fail!not connect");
  }
  on(e, r) {
    this.callbackMap[e] = r;
  }
  async retransmitIPC(e) {
    var e_method = e.method;

    if (Editor.Message[e_method]) {
      if (e_method === "broadcast") {
        await Editor.Message[e_method](e.msg, ...e.data);
      } else {
        e_method = await Editor.Message[e_method](e.plugin, e.msg, ...e.data);
        e = { id: e.id, ipc: 1, type: e.type, data: e_method };
        this.send(e);
      }
    } else {
      console.error("retransmitIPC failed:wrong method");
    }
  }
}
module.exports = EditorServer;
