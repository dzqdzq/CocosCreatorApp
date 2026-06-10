function globToRegExp(e, a) {
  if (typeof e != "string") {
    throw new TypeError("Expected a string");
  }
  var r = String(e);
  let s = "";
  var t = !!a && !!a.extended;
  var c = !!a && !!a.globstar;
  let o = false;
  var g;
  var e = a && typeof a.flags == "string" ? a.flags : "";
  for (let a = 0, e = r.length; a < e; a++) {
    switch ((g = r[a])) {
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|": {
        s += "\\" + g;
        break;
      }
      case "?": {
        if (t) {
          s += ".";
          break;
        }
      }
      case "[":
      case "]": {
        if (t) {
          s += g;
        }

        break;
      }
      case "{": {
        if (t) {
          o = true;
          s += "(";
          break;
        }
      }
      case "}": {
        if (t) {
          o = false;
          s += ")";
          break;
        }
      }
      case ",": {
        if (o) {
          s += "|";
        } else {
          s += "\\" + g;
        }

        break;
      }
      case "*":
        {
          var i = r[a - 1];
          let e = 1;

          while (r[a + 1] === "*") {
            e++;
            a++;
          }

          var f = r[a + 1];

          if (c) {
            if (
              e > 1 &&
              (i === "/" || i === undefined) &&
              (f === "/" || f === undefined)
            ) {
              s += "((?:[^/]*(?:/|$))*)";
              a++;
            } else {
              s += "([^/]*)";
            }
          } else {
            s += "(.*?)";
          }
        }
        break;
      default: {
        s += g;
      }
    }
  }

  if (!e || !~e.indexOf("g")) {
    s = "^" + s + "$";
  }

  return new RegExp(s, e);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.globToRegExp = globToRegExp;
