function showError(r) {
  q("#splash").style.display = "none";
  q("#error").style.display = "block";
  q("#error .error-main").innerText += r;
  r = "[preview-error]" + r;
  socket.emit("preview error", r);
}
window.socket = io();
window.q = document.querySelector.bind(document);
window.hasError = false;

window.addEventListener(
  "error",
  (r) => {
    window.hasError = true;
    var e = Array.prototype.toString.call(r, r);
    console.error(r);

    showError(
      e === "[object Event]"
        ? `load ${r.target.src} failed`
        : `${r.message} in ${r.filename}

        `
    );

    return true;
  },
  true
);
