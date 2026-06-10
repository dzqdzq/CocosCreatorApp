function onDetailMessagePolling(e, t = 500) {
  const n = setInterval(e, t);
  return () => {
    clearInterval(n);
  };
}
function handleDetailMessage(t, n = 200) {
  try {
    if (!t.length) {
      return "";
    }
    var l = t[t.length - 1];
    if (!l.value) {
      return "";
    }
    let l_value = l.value;
    return (l_value =
      l_value.length > n ? l_value.substring(0, n) + "..." : l_value);
  } catch (e) {
    console.debug(e);
    return "";
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDetailMessagePolling = onDetailMessagePolling;
exports.handleDetailMessage = handleDetailMessage;
