System.register(["./ui.js", "./main.js"], (o, e) => {
  var c;
  var r;

  if (e) {
    e.id;
  }

  o("bootstrap", async (o) => {
    try {
      (async (o) => {
        const t = await (async () => {
          var o = window.location.search.substr(1).split("&");
          var n = await e.import("/socket.io/socket.io.js");
          var n = n.default();

          if (!o.includes("autoReload=false")) {
            n.on("browser:reload", () => {
              window.location.reload();
            });

            n.on("browser:close", () => {
              window.close();
            });

            n.on("browser:disconnect", () => {
              window.location.reload();
            });
          }

          return n;
        })();

        const n = new c.Ui({
          devices: o.devices,
          emit: (o, ...n) => {
            t.emit(o, ...n);
          },
        });

        try {
          var i = await System.import("cc");
          n.bindEngine(i);
          await r.main(n, o);
        } catch (o) {
          console.error(o);
        }
      })(o);
    } catch (o) {
      console.error(o);
    }
  });

  return {
    setters: [
      (o) => {
        c = o;
      },
      (o) => {
        r = o;
      },
    ],
    execute() {},
  };
});
