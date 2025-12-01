"use strict";
const e = require("electron");
const t = require("events");
const n = require("fire-path");
const i = e.app;
const r = new t();
i.disableDomainBlockingFor3DAPIs();
i.commandLine.appendSwitch("ignore-gpu-blacklist");

module.exports = {
    name: i.getName(),
    version: i.getVersion(),
    path: i.getAppPath(),
    home: n.join(i.getPath("home"), `.${i.getName()}`),
    focused: false,
    extend(e) {
      Object.assign(this, e);
    },
    on(e, t) {
      return r.on.apply(this, [e, t]);
    },
    off(e, t) {
      return r.removeListener.apply(this, [e, t]);
    },
    once(e, t) {
      return r.once.apply(this, [e, t]);
    },
    emit(e, ...t) {
      return r.emit.apply(this, [e, ...t]);
    },
  };
