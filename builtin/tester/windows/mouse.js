function wait(e) {
  return new Promise((t) => {
    setTimeout(() => {
      t();
    }, e || 200);
  });
}
function point(t, e) {
  const n = document.createElement("div");
  n.style.background = "#fff";
  n.style.opacity = 0.6;
  n.style.position = "absolute";
  n.style.width = "20px";
  n.style.height = "20px";
  n.style.borderRadius = "10px";
  n.style.transition = "all 0.4s";
  n.style.left = t - 10 + "px";
  n.style.top = e - 10 + "px";

  requestAnimationFrame(() => {
    n.style.transform = "scale(0.2)";
  });

  setTimeout(() => {
    n.style.transform = "scale(1)";
    n.style.opacity = 0;
  }, 200);

  setTimeout(() => {
    n.remove();
  }, 400);

  document.body.appendChild(n);
}

exports.click = async (t, e, n, o, i) => {
  var s = (t = t.length !== undefined ? t[0] : t).getBoundingClientRect();
  var l = (s.right - s.left) / 2 + s.x;
  var a = (s.bottom - s.top) / 2 + s.y;

  point(l, a);
  await exports.mouseDown(t);
  t.focus();
  await exports.mouseUp(t);
  var s = t.parentElement ? t.parentElement.getBoundingClientRect() : s;

  var e = new MouseEvent("", {
    ctrlKey: !!e,
    shiftKey: !!n,
    altKey: !!o,
    metaKey: !!o,
    clientX: l,
    clientY: a,
    offsetX: l - s.x,
    offsetY: a - s.y,
    screenX: 0,
    screenY: 0,
    button: i || 0,
    buttons: [1, 2, 4][i || 0],
    composed: true,
    detail: 1,
    isTrusted: true,
  });

  e.initEvent("click", true, true);
  t.dispatchEvent(e);
  await wait(200);
};

exports.mouseDown = async (t, e, n, o, i) => {
  var s = (t = t.length !== undefined ? t[0] : t).getBoundingClientRect();
  var l = (s.right - s.left) / 2 + s.x;
  var a = (s.bottom - s.top) / 2 + s.y;
  var s = t.parentElement ? t.parentElement.getBoundingClientRect() : s;

  var e = new MouseEvent("", {
    ctrlKey: !!e,
    shiftKey: !!n,
    altKey: !!o,
    metaKey: !!o,
    clientX: l,
    clientY: a,
    offsetX: l - s.x,
    offsetY: a - s.y,
    screenX: 0,
    screenY: 0,
    button: i || 0,
    buttons: [1, 4, 2][i || 0],
    composed: true,
    detail: 1,
    isTrusted: true,
  });

  e.initEvent("mousedown", true, true);
  t.dispatchEvent(e);
  await wait(200);
};

exports.mouseUp = async (t, e, n, o, i) => {
  var s = (t = t.length !== undefined ? t[0] : t).getBoundingClientRect();
  var l = (s.right - s.left) / 2 + s.x;
  var a = (s.bottom - s.top) / 2 + s.y;
  var s = t.parentElement ? t.parentElement.getBoundingClientRect() : s;

  var e = new MouseEvent("", {
    ctrlKey: !!e,
    shiftKey: !!n,
    altKey: !!o,
    metaKey: !!o,
    clientX: l,
    clientY: a,
    offsetX: l - s.x,
    offsetY: a - s.y,
    screenX: 0,
    screenY: 0,
    button: i || 0,
    buttons: [1, 2, 4][i || 0],
    composed: true,
    detail: 1,
    isTrusted: true,
  });

  e.initEvent("mouseup", true, true);
  t.dispatchEvent(e);
  await wait(200);
};
