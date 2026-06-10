const codeMap = { Enter: "Enter", Escape: "Escape" };
const keyCodeMap = { Enter: 13, Escape: 27 };
function wait(t) {
  return new Promise((e) => {
    setTimeout(() => {
      e();
    }, t || 200);
  });
}

exports.keydown = async (e, t) => {
  if (e.length !== undefined) {
    e = e[0];
  }

  var t = new KeyboardEvent("", {
    bubbles: true,
    cancelable: true,
    code: codeMap[t] || "Key" + t.toLocaleUpperCase(),
    composed: true,
    eventPhase: 2,
    isTrusted: true,
    key: codeMap[t] || t,
    keyCode: keyCodeMap[t] || t.charCodeAt(0),
    which: keyCodeMap[t] || t.charCodeAt(0),
  });
  t.initEvent("keydown", true, true);
  e.dispatchEvent(t);

  if (e.tagName.startsWith("UI-")) {
    (t = document.createEvent("HTMLEvents")).initEvent("change", true, true);
    e.dispatchEvent(t);
  }

  await wait(20);
};

exports.keypress = async (e, t) => {
  if (e.length !== undefined) {
    e = e[0];
  }

  t = new KeyboardEvent("", {
    bubbles: true,
    cancelable: true,
    code: codeMap[t] || "Key" + t.toLocaleUpperCase(),
    composed: true,
    eventPhase: 2,
    isTrusted: true,
    key: codeMap[t] || t,
    keyCode: keyCodeMap[t] || t.charCodeAt(0),
    which: keyCodeMap[t] || t.charCodeAt(0),
  });
  t.initEvent("keypress", true, true);
  e.dispatchEvent(t);
  await wait(20);
};

exports.keyup = async (e, t) => {
  if (e.length !== undefined) {
    e = e[0];
  }

  var t = new KeyboardEvent("", {
    bubbles: true,
    cancelable: true,
    code: codeMap[t] || "Key" + t.toLocaleUpperCase(),
    composed: true,
    eventPhase: 2,
    isTrusted: true,
    key: codeMap[t] || t,
    keyCode: keyCodeMap[t] || t.charCodeAt(0),
    which: keyCodeMap[t] || t.charCodeAt(0),
  });
  t.initEvent("keyup", true, true);
  e.dispatchEvent(t);

  if (e.tagName.startsWith("UI-")) {
    (t = document.createEvent("HTMLEvents")).initEvent("confirm", true, true);
    e.dispatchEvent(t);
  }

  await wait(20);
};

exports.input = async (t, a) => {
  if (t.length !== undefined) {
    t = t[0];
  }

  for (let e = 0; e < a.length; e++) {
    await exports.keydown(t, a[e]);
    await exports.keypress(t, a[e]);
    t.value += a[e];
    await exports.keyup(t, a[e]);
  }
  await wait(200);
};

exports.enter = async (e) => {
  if (e.length !== undefined) {
    e = e[0];
  }

  exports.keydown(e, "Enter");
  exports.keyup(e, "Enter");
  await wait(200);
};

exports.esc = async (e) => {
  if (e.length !== undefined) {
    e = e[0];
  }

  exports.keydown(e, "Escape");
  exports.keyup(e, "Escape");
  await wait(200);
};
