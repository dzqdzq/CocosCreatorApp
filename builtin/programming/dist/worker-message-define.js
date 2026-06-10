Object.defineProperty(exports, "__esModule", { value: true });
exports.workerMessageNames = undefined;
const methodNames = [];
const pluginPackageJson = require("../package.json");
for (const [a, { methods: b }] of Object.entries(
  pluginPackageJson.contributions.messages
)) {
  methodNames.push(...b);
}
exports.workerMessageNames = [
  ...methodNames.filter((e) => e.startsWith("packer-driver/")),
  "clear-code-cache",
];
