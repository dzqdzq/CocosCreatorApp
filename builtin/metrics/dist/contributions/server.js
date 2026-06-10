Object.defineProperty(exports, "__esModule", { value: true });
exports.get = undefined;

exports.get = [
  {
    url: "/a032ffca62d9edac706b578840ab182b/index.html",
    async handle(e, t, s) {
      var e = e.headers["x-custom-header"];

      if (e && e === "2c2d5f6b07c59e4a4595501a71e93b7c") {
        e = await Editor.Message.request(
          "metrics",
          "query-google-metrics-v4-html"
        );

        t.end(e);
      } else {
        t.status(403).send("404");
      }
    },
  },
];
