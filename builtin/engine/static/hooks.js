exports.register = async (e) => {
  var r;
  var i = Editor.App.version.replace(/\./g, "");
  var t = e.contributions.profile.editor;
  for (r in t) {
    var o = r.replace(/{{VERSION}}/, i);

    if (o !== r) {
      t[o] = t[r];
      delete t[r];
    }
  }
  var n;
  var p = e.contributions.preferences.properties;
  for (n in p) {
    var s = n.replace(/{{VERSION}}/, i);

    if (s !== n) {
      p[s] = p[n];
      delete p[n];
    }
  }
};
