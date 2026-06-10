Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
const electron_1 = require("electron");
const utils_1 = require("./utils");

const {
  isExpired,
  checkInternetConnection,
  queryInfo,
  handleNetworkStatus,
  openDialog,
  updateCachedFormInfos,
} = utils_1;

async function load() {
  try {
    await initInformationCache();
  } catch (t) {
    console.error(t);
    console.error("Init information cache failed!");
  }
}
async function initInformationCache() {
  var t = await Editor.Profile.getProject("information", "information");
  var o = await Editor.Profile.getConfig("utils", "information.timestamp");
  if (t) {
    if (!o || (await isExpired(o))) {
      o = await exports.methods.queryAllInformation();
      if (Object.keys(o).length) {
        await Editor.Profile.setProject("information", "information", o);
      } else {
        for (const r in t) {
          var i = await exports.methods.queryInformation(r);

          if (i && i.status === "success" && i.data) {
            await Editor.Profile.setProject(
              "information",
              "information." + r,
              i.data
            );
          }
        }
      }
      await Editor.Profile.setConfig(
        "utils",
        "information.timestamp",
        Date.now(),
        "global"
      );
    }
  } else {
    o = await exports.methods.queryAllInformation();
    if (Object.keys(o).length) {
      await Editor.Profile.setProject("information", "information", o);

      await Editor.Profile.setConfig(
        "utils",
        "information.timestamp",
        Date.now(),
        "global"
      );
    } else {
      var e;
      var a = await Editor.Profile.getConfig("utils", "information.features");
      let t = false;
      for (const n in a) {
        if (
          a[n] &&
          (e = await exports.methods.queryInformation(n)) &&
          e.status === "success" &&
          e.data
        ) {
          await Editor.Profile.setProject(
            "information",
            "information." + n,
            e.data
          );

          t = true;
        }
      }

      if (t) {
        await Editor.Profile.setConfig(
          "utils",
          "information.timestamp",
          Date.now(),
          "global"
        );
      }
    }
  }

  if (
    !(await Editor.Profile.getConfig("utils", "network_connected")) &&
    (await checkInternetConnection())
  ) {
    Editor.Profile.setConfig("utils", "network_connected", true, "global");
  }
}
exports.methods = {
  async queryAllInformation() {
    var t = {};
    for (const i in await Editor.Profile.getProject(
      "information",
      "information"
    )) {
      var o = await queryInfo(i);
      t[i] = {
        id: i,
        label: o.result.label || i,
        enable: !!o.result.enable,
        [i]: { complete: !!o.result.complete, form: o.result.form || "" },
      };
    }
    return t;
  },
  async queryInformation(t, o) {
    var i;
    var e;
    return (await Editor.Profile.getConfig("utils", "information.features"))[
      t
    ] !== false &&
      ((e = await checkInternetConnection()),
      (i = await Editor.Profile.getConfig("utils", "network_connected")),
      e || i)
      ? e
        ? (i = await queryInfo(t))
          ? {
              status: "success",
              data: {
                id: (e = i.result.id || t),
                label: i.result.label || t,
                enable: !!i.result.enable,
                [e]: {
                  complete: !!i.result.complete,
                  form: i.result.form || "",
                },
              },
            }
          : { status: "network_exception" }
        : ((e = await Editor.Profile.getProject(
            "information",
            "information." + t
          )),
          !o?.force && e
            ? { status: "cache", data: e }
            : { status: "network_failure", data: e || undefined })
      : null;
  },
  async openInformationDialog(t, o) {
    let i = await Editor.Profile.getProject("information", "information." + t);
    var e = await exports.methods.queryInformation(t, { force: true });
    if (!i) {
      if (!e) {
        return { action: "resolve" };
      }
      if (
        (e.status === "network_failure" || e.status === "network_exception") &&
        (await Editor.Profile.getConfig("utils", "information.features"))[t]
      ) {
        return handleNetworkStatus(e, t);
      }
      if (!e.data) {
        return { action: "resolve" };
      }
      i = e.data;
      await Editor.Profile.setProject("information", "information." + t, i);

      await Editor.Profile.setConfig(
        "utils",
        "information.timestamp",
        Date.now(),
        "global"
      );
    }
    if (!(!i.enable || (i[i.id] && i[i.id].complete))) {
      if (e) {
        if (e.status === "network_failure") {
          await Editor.Profile.removeProject(
            "information",
            `information.${t}.passByNetworkFailure`
          );

          if ((a = await handleNetworkStatus(e, t)).action === "resolve") {
            await Editor.Profile.setProject(
              "information",
              `information.${t}.passByNetworkFailure`,
              true
            );
          }

          return a;
        }
        if (e.status === "network_exception") {
          return await handleNetworkStatus(e, t);
        }
      }
      if (!e || !e.data || !e.data[t]) {
        return { action: "reject" };
      }
      await openDialog(e.data[t].form, o, e.data.id || t);
      var a = await exports.methods.queryInformation(t, { force: true });
      if (a.status === "network_failure" || a.status === "network_exception") {
        return { action: "unusual" };
      }
      o = a.data;
      if (o && o.enable && !o[o.id].complete) {
        return { action: "reject" };
      }
      await updateCachedFormInfos(o);

      await Editor.Profile.setConfig(
        "utils",
        "information.timestamp",
        Date.now(),
        "global"
      );
    }
    return { action: "resolve" };
  },
  async hasDialog(t) {
    var o = await exports.methods.queryInformation(t);
    let i = t;
    return !!(
      (i = o && o.data && o.data.id ? o.data.id : i) &&
      utils_1.dialogMap[i] &&
      utils_1.dialogMap[i].length
    );
  },
  async closeDialog(o) {
    if (o) {
      var i = await exports.methods.queryInformation(o);
      let t = o;

      if (i && i.data && i.data.id) {
        t = i.data.id;
      }

      if (utils_1.dialogMap[t]) {
        o = utils_1.dialogMap[t];
        utils_1.dialogMap[t] = [];

        o.forEach((t) => {
          electron_1.BrowserWindow.fromId(t)?.close();
        });
      }
    }
  },
};
