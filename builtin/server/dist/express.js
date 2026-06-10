var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPort = getPort;
exports.queryHTTPSEnabled = queryHTTPSEnabled;
exports.setPort = setPort;
exports.startup = startup;
exports.stop = stop;

const { existsSync, readFile } = require("fs-extra");

const { createServer } = require("http");

const { createServer: createServer_2 } = require("https");

const express_1 = __importDefault(require("express"));

const { hostname } = require("os");

const { start, disconnect } = require("./socket");

const plugin_1 = require("./plugin");
const compression = require("compression");
const app = (0, express_1.default)();
app.use(compression());
const ports = { http: 7456, https: 7567 };
const server = { http: null, https: null };
function getPort() {
  return ports.http;
}
function queryHTTPSEnabled() {
  return server.https;
}
function setPort(e) {
  ports.http = e;
}
async function startup() {
  server.http = createServer(app);
  ports.http =
    (await Editor.Profile.getConfig("server", "server_port")) || 7456;
  var e;
  var t = await Editor.Profile.getConfig("server", "https");

  if (t.enable) {
    e = { key: undefined, cert: undefined, ca: undefined };

    existsSync(t.key) && (e.key = await readFile(t.key));

    existsSync(t.cert) && (e.cert = await readFile(t.cert));

    existsSync(t.ca) && (e.ca = await readFile(t.ca));

    server.https = createServer_2(e, app);
    ports.https =
      (await Editor.Profile.getConfig("server", "https.port")) || 7567;
  }

  try {
    ports.http = await Editor.Network.getFreePort(ports.http);
    ports.https = await Editor.Network.getFreePort(ports.https);

    await new Promise((e, t) => {
      const r = {
        error() {
          server.http?.removeListener("listening", r.listener);
          server.https?.removeListener("listening", r.listener);
          t(`Port ${ports.http} is occupied`);
        },
        listener() {
          server.http?.removeListener("error", r.error);
          server.https?.removeListener("error", r.error);
          e();
        },
      };
      server.http?.once("error", r.error);
      server.http?.once("listening", r.listener);
      server.http?.listen(ports.http);
      server.https?.once("error", r.error);
      server.https?.once("listening", r.listener);
      server.https?.listen(ports.https);
    });
  } catch (e) {
    console.warn("Server: " + e);
  }
  start(server.https || server.http);
  Editor.Message.broadcast("preview:port-change", ports.http);
}
async function stop() {
  if (server) {
    server.http?.close(() => {
      disconnect();
    });

    server.https?.close(() => {
      disconnect();
    });

    server.http = null;
    server.https = null;
  }
}

app.all("*", (e, t, r) => {
  if (server.https && e.protocol === "http") {
    t.redirect(`https://${e.host}:` + ports.https + e.url);
  } else {
    t.header("Access-Control-Allow-Origin", "*");
    t.header("Access-Control-Allow-Headers", "Content-Type");
    t.header("Access-Control-Allow-Methods", "*");
    r();
  }
});

app.all("/__test__connect__", (e, t, r) => {
  t.send({});
});

app.get("/__server__/handshake", async (e, t) => {
  var r = await Editor.User.getData();
  t.send({ host: hostname(), name: r.nickname });
});

app.get("*", async (o, p, e) => {
  for (let e = plugin_1.fileArray.length - 1; e >= 0; e--) {
    const a = plugin_1.fileArray[e];
    var t = o.path.match(a.regexp);
    if (t) {
      o.params = t.filter((e, t) => t !== 0).map((e) => decodeURIComponent(e));
      let s = false;

      await new Promise((t) => {
        const p_end = p.end;

        p.end = () => {
          s = false;
          p.end = p_end;
          t();
          p_end.call(p);
        };

        a.handle(o, p, (e) => {
          if (e) {
            console.error(e);
          }

          s = true;
          p.end = p_end;
          t();
        });
      });

      if (!s) {
        return;
      }
    }
  }
  for (let e = plugin_1.getArray.length - 1; e >= 0; e--) {
    var r = plugin_1.getArray[e];
    var s = o.path.match(r.regexp);
    if (s) {
      o.params = s.filter((e, t) => t !== 0).map((e) => decodeURIComponent(e));
      let t = false;

      await r.handle(o, p, (e) => {
        if (e) {
          console.error(e);
        }

        t = true;
      });

      if (!t) {
        return;
      }
    }
  }
  e();
});

app.post("*", async (t, r, e) => {
  for (let e = plugin_1.postArray.length - 1; e >= 0; e--) {
    var s = plugin_1.postArray[e];
    var o = t.path.match(s.regexp);
    if (o) {
      t.params = o.filter((e, t) => t !== 0).map((e) => decodeURIComponent(e));
      let e = false;

      await s.handle(t, r, () => {
        e = true;
      });

      if (!e) {
        return;
      }
    }
  }
  e();
});

app.get("*", (e, t) => {
  t.status(404);
  t.send("404 - Not Found");
});

app.use((e, t, r, s) => {
  console.error(e);
  r.status(500);
  r.send("500 - Web Server Error");
});
