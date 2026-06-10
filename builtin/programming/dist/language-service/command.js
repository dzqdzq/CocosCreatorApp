Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameCommand = undefined;
exports.Command = undefined;
exports.CommandType = undefined;

const { join } = require("path");

const { asserts } = require("../utils/asserts");

const path_2 = require("../utils/path");

const { resolveFileName, removeTSExt } = path_2;

var CommandType;
!((e) => {
  e[(e.rename = 0)] = "rename";
})(CommandType || (exports.CommandType = CommandType = {}));
class Command {}
class RenameCommand extends (exports.Command = Command) {
  oldFilePath;
  newFilePath;
  _newFileDBInfo;
  _oldFileDBInfo;
  _newFileDBURL;
  _oldFileDBURL;
  oldFilePathWithOutExt;
  newFilePathWithOutExt;
  static _createDescription(e, t) {
    return `Rename ${resolveFileName(e)} to ${resolveFileName(t)}.`;
  }
  static _createID(e, t) {
    return this._createDescription(e, t);
  }
  _executed = false;
  id;
  description;
  commandType;
  static create(e, t) {
    return new RenameCommand(e, t);
  }
  constructor(e, t) {
    super();
    this.oldFilePath = e;
    this.newFilePath = t;
    this.oldFilePath = resolveFileName(e);
    this.oldFilePathWithOutExt = removeTSExt(this.oldFilePath);
    this.newFilePath = resolveFileName(t);
    this.newFilePathWithOutExt = removeTSExt(this.newFilePath);
    this.id = RenameCommand._createID(e, t);
    this.description = RenameCommand._createDescription(e, t);
    this.commandType = CommandType.rename;
  }
  applyImportChanges(a, i, s, r) {
    asserts(this._newFileDBInfo);
    asserts(this._newFileDBURL);
    asserts(this._oldFileDBInfo);
    asserts(this._newFileDBInfo);
    var l = removeTSExt(i);
    var e = i === this.newFilePath;
    var h = Editor.Utils.Path.contains(this._newFileDBInfo.target, i);
    var n = e || !h;
    for (let e = r.length - 1; e >= 0; e--) {
      var { span, newText } = r[e];
      let t = newText;
      var m = join(i, "../", t);
      if (n) {
        if (s.substring(span.start, span.start + 5) !== path_2.dbURLRoot || h) {
          let e;
          e = i === this.newFilePath ? this.oldFilePathWithOutExt : l;
          var p = resolveFileName(
            join(e, "../", s.substring(span.start, this.textSpanEnd(span)))
          );

          if (p === this.oldFilePathWithOutExt) {
            t = this._newFileDBURL;
          } else if (Editor.Utils.Path.contains(this.oldFilePath + "/", p)) {
            t = p.replace(this.oldFilePath, this._newFileDBURL);
          } else if (e === this.oldFilePathWithOutExt) {
            p = Editor.Utils.Path.relative(this._oldFileDBInfo.target, p);
            t = this._oldFileDBInfo.dbURL + resolveFileName(p);
          }
        } else if (!newText.startsWith(path_2.dbURLRoot) && a) {
          for (let e = 0; e < a.length; e++) {
            var F = a[e];
            if (Editor.Utils.Path.contains(F.target, m)) {
              var _ = Editor.Utils.Path.relative(F.target, m);
              t = F.dbURL + resolveFileName(_);
              break;
            }
          }
        }
      }
      s =
        "" +
        s.substring(0, span.start) +
        t +
        s.substring(this.textSpanEnd(span));
    }
    return s;
  }
  textSpanEnd(e) {
    return e.start + e.length;
  }
  async execute(t) {
    for (let e = 0; e < t.dbURLInfos.length; e++) {
      var a;
      var i = t.dbURLInfos[e];

      if (Editor.Utils.Path.contains(i.target, this.newFilePath)) {
        this._newFileDBInfo = i;
        a = Editor.Utils.Path.relative(i.target, this.newFilePath);
        this._newFileDBURL = i.dbURL + removeTSExt(resolveFileName(a));
      }

      if (Editor.Utils.Path.contains(i.target, this.oldFilePath)) {
        this._oldFileDBInfo = i;
        a = Editor.Utils.Path.relative(i.target, this.oldFilePath);
        this._oldFileDBURL = i.dbURL + removeTSExt(resolveFileName(a));
      }
    }
    var s = new Set();
    if (!this._executed) {
      var r = t.languageService.getEditsForFileRename(
        this.oldFilePath,
        this.newFilePath,
        {},
        undefined
      );
      for (let e = 0; e < r.length; e++) {
        var l;
        var h = r[e];
        var n = t.host.readFile(h.fileName);

        if (n) {
          n = this.applyImportChanges(
            t.dbURLInfos,
            h.fileName,
            n,
            h.textChanges
          );

          s.add(h.fileName);
          l = t.host.readCache(h.fileName);
          asserts(l);

          t.host.writeCache({
            uuid: l.uuid,
            filePath: h.fileName,
            content: n,
          });
        }
      }
      this._executed = true;
    }
    return s;
  }
}
exports.RenameCommand = RenameCommand;
