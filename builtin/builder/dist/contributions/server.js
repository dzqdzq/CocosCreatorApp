Object.defineProperty(exports, "__esModule", { value: true });
exports.get = undefined;

const { existsSync } = require("fs-extra");

const { join } = require("path");

exports.get = [
  {
    url: "/build/**/*",
    async handle(e, t, r) {
      var s = join(Editor.Project.path, e.url);
      if (!existsSync(s)) {
        return t.status(404).send(e.params[0] + " 资源不存在");
      }
      t.sendFile(s);
    },
  },
];
