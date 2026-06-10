Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultMessageLogFile = undefined;
exports.saveMessageLog = saveMessageLog;
exports.appendMessage = appendMessage;
exports.transMessageItem = transMessageItem;
exports.getLocalTimeStr = getLocalTimeStr;

const { existsSync, outputFile, appendFile } = require("fs-extra");

const { join } = require("path");

async function saveMessageLog(e, t) {
  try {
    var s = t || exports.DefaultMessageLogFile;

    if (!existsSync(s)) {
      await outputFile(
        s,
        "process, type, name, message, source, timestamp, time, args, id, loading"
      );
    }

    if (e) {
      await outputFile(s, e.map((e) => transMessageItem(e)).join("\n"));
    }
  } catch (e) {
    console.warn(e);
  }
}
async function appendMessage(e) {
  try {
    if (e.timestamp) {
      e.localTime = getLocalTimeStr(e.timestamp);
    }

    await appendFile(exports.DefaultMessageLogFile, transMessageItem(e) + "\n");
  } catch (e) {
    console.warn(e);
  }
}
function transMessageItem(e) {
  return Object.values(e)
    .map((e) => JSON.stringify(e))
    .join(", ");
}
function getLocalTimeStr(e) {
  e = new Date(e);
  return (e.toLocaleDateString().replace(/\//g, "-") +
  " " + e.toTimeString().slice(0, 8));
}
exports.DefaultMessageLogFile = join(
  Editor.Project.path,
  "temp",
  "message.log"
);
