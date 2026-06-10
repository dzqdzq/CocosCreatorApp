const join = require("path").join;
const repoLocal = "__editor__";
const webAdapterRepo = join(
  __dirname,
  "../../.temp/runtime-web-adapter-private"
);

exports.repo = () => [
  {
    repo: {
      name: "runtime-web-adapter-private",
      local: repoLocal,
      url: "git@github.com:cocos/runtime-web-adapter-private.git",
      targetType: "commit",
      targetValue: "3ee1021f8d86a5cce0b39b1b41ad7a4a46504ce8",
    },
    path: webAdapterRepo,
    hard: true,
    skip: false,
  },
];

exports.npm = () => [
  {
    message: "初始化 runtime-web-adapter-private 目录",
    path: webAdapterRepo,
    params: ["install", "--no-save", "--ignore-scripts"],
  },
  {
    message: "编译 runtime-web-adapter-private 仓库代码",
    path: webAdapterRepo,
    params: ["run", "build"],
  },
];
