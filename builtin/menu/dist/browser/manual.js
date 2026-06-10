Object.defineProperty(exports, "__esModule", { value: true });

const { join } = require("path");

const { existsSync } = require("fs-extra");

const { pathToFileURL } = require("url");

const MANUAL = {
  home: Editor.App.urls.manual,
  "quick-start": Editor.Utils.Url.getDocUrl("getting-started/quick-start.html"),
  "getting-started": Editor.Utils.Url.getDocUrl("getting-started"),
};

const API = {
  home: Editor.App.urls.api,
  services: Editor.Utils.Url.getDocUrl("sdk/cocos-services.html"),
};

function getUrlVer() {
  return Editor.App.version.replace(/\.\d+(?:-.+)?$/, "");
}
module.exports = {
  openManual(e) {
    e = e || "home";
    let r = MANUAL[e];
    r = r.replace("{version}", getUrlVer());
    Editor.Message.send("program", "open-url", r);
  },
  openAPI(e) {
    e = e || "home";
    let r = API[e];
    r = r.replace("{version}", getUrlVer());
    Editor.Message.send("program", "open-url", r);
  },
  openForum() {
    Editor.Message.send("program", "open-url", Editor.App.urls.forum);
  },
  openEngineRepo() {
    Editor.Message.send(
      "program",
      "open-url",
      "https://github.com/cocos-creator/engine"
    );
  },
  openReleaseNotes() {
    Editor.Message.send(
      "program",
      "open-url",
      "https://www.cocos.com/creator-download"
    );
  },
  openSoftwareLicense() {
    var e = join(Editor.App.path, "../License/legal.txt");

    if (existsSync(e)) {
      Editor.Message.send("program", "open-url", pathToFileURL(e).toString());
    } else {
      console.error("software license not exist!");
    }
  },
};
