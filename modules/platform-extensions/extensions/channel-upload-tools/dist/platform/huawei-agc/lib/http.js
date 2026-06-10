const Constant = require("../const");
const request = require("request");
const md5 = require("md5");
const url = require("url");
const release_url = "https://creator-api.cocos.com/";
const agentOptions = {};
const creatorVersion = Editor.App.version;

const parseParameter = async (t) => {
  t.version = creatorVersion;
  return signParam(t, Constant.PLUGIN_ID, Constant.PLUGIN_SECRET);
};

function signParam(e, t, s) {
  e.plugin_id = t;
  t = Object.keys(e).sort();
  const r = {};
  t.forEach((t) => {
    r[t] = e[t];
  });
  let o = "";
  for (const n in r) {
    o += `${n}=${encodeURIComponent(r[n])}&`;
  }
  o += s;
  e.sign = md5(o);
  return e;
}
module.exports = {
  sessionToken: null,
  post(t, e) {
    return new Promise((r, o) => {
      request.post({ url: t, json: true, form: e, agentOptions }, (t, e, s) => {
        if (t || e.statusCode !== 200) {
          o({ status: e.statusCode, msg: t });
        } else {
          r(s);
        }
      });
    });
  },
  async fetchOAuthUrl() {
    var t = {
      session_token: await this.getSessionToken(),
      lang: Editor.I18n.getLanguage() || "en",
    };
    return this.post(
      "https://creator-api.cocos.com/api/hms/get_oauth_url",
      await parseParameter(t)
    );
  },
  async fetchOAuthToken() {
    var t = { session_token: await this.getSessionToken() };
    return this.post(
      "https://creator-api.cocos.com/api/hms/get_tp_info",
      await parseParameter(t)
    );
  },
  async getSessionToken() {
    var t;
    return (
      this.sessionToken ||
      ((t = await this.fetchSessionToken(
        Constant.PLUGIN_ID,
        Constant.PLUGIN_SECRET
      )) && t.data.session_token
        ? ((this.sessionToken = t.data.session_token), this.sessionToken)
        : void console.error("get plugin session token error"))
    );
  },
  async fetchSessionToken(t, e) {
    var s = url.resolve(release_url, "api/session/token");

    var t = await signParam(
      {
        session_code: (await Editor.User.getSessionCode(t)).session_code,
        ip: "127.0.0.1",
        plugin_id: t,
        client_type: 1,
      },
      t,
      e
    );

    try {
      var r = await Editor.Network.post(s, t);
      return JSON.parse(r.toString());
    } catch (t) {
      console.error(t);
    }
  },
  async getOAuthToken() {
    var t = await this.fetchOAuthToken();
    if (t && t.data.tp_access_token) {
      return t.data.tp_access_token;
    }
    console.error("get plugin tp access token url error");
  },
  async getOAuthUrl() {
    var t = await this.fetchOAuthUrl();
    if (t && t.data.oauth_url) {
      return { url: t.data.oauth_url, redirect: t.data.redirect_url };
    }
    console.error("get plugin login url error");
  },
  async needLogin() {
    let t = false;
    var e = await this.fetchOAuthToken();
    return e
      ? (t = e.status === 720 || e.status === 721 || t)
      : (console.error("get plugin login url error"), true);
  },
  async logout() {
    var t = { session_token: await this.getSessionToken() };
    return this.post(
      "https://creator-api.cocos.com/api/hms/unbind_oauth",
      await parseParameter(t)
    );
  },
};
