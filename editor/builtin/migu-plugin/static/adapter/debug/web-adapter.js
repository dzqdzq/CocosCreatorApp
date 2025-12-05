(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

!function () {
  function e(e) {
    this.message = e;
  }

  var t = "undefined" != typeof exports ? exports : "undefined" != typeof self ? self : $.global,
      r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  e.prototype = new Error(), e.prototype.name = "InvalidCharacterError", t.btoa || (t.btoa = function (t) {
    for (var o, n, a = String(t), i = 0, f = r, c = ""; a.charAt(0 | i) || (f = "=", i % 1); c += f.charAt(63 & o >> 8 - i % 1 * 8)) {
      if (n = a.charCodeAt(i += .75), n > 255) throw new e("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      o = o << 8 | n;
    }

    return c;
  }), t.atob || (t.atob = function (t) {
    var o = String(t).replace(/[=]+$/, "");
    if (o.length % 4 == 1) throw new e("'atob' failed: The string to be decoded is not correctly encoded.");

    for (var n, a, i = 0, f = 0, c = ""; a = o.charAt(f++); ~a && (n = i % 4 ? 64 * n + a : a, i++ % 4) ? c += String.fromCharCode(255 & n >> (-2 * i & 6)) : 0) {
      a = r.indexOf(a);
    }

    return c;
  });
}();

},{}],2:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

!function (n) {
  "use strict";

  function t(n, t) {
    var r = (65535 & n) + (65535 & t);
    return (n >> 16) + (t >> 16) + (r >> 16) << 16 | 65535 & r;
  }

  function r(n, t) {
    return n << t | n >>> 32 - t;
  }

  function e(n, e, o, u, c, f) {
    return t(r(t(t(e, n), t(u, f)), c), o);
  }

  function o(n, t, r, o, u, c, f) {
    return e(t & r | ~t & o, n, t, u, c, f);
  }

  function u(n, t, r, o, u, c, f) {
    return e(t & o | r & ~o, n, t, u, c, f);
  }

  function c(n, t, r, o, u, c, f) {
    return e(t ^ r ^ o, n, t, u, c, f);
  }

  function f(n, t, r, o, u, c, f) {
    return e(r ^ (t | ~o), n, t, u, c, f);
  }

  function i(n, r) {
    n[r >> 5] |= 128 << r % 32, n[14 + (r + 64 >>> 9 << 4)] = r;
    var e,
        i,
        a,
        d,
        h,
        l = 1732584193,
        g = -271733879,
        v = -1732584194,
        m = 271733878;

    for (e = 0; e < n.length; e += 16) {
      i = l, a = g, d = v, h = m, g = f(g = f(g = f(g = f(g = c(g = c(g = c(g = c(g = u(g = u(g = u(g = u(g = o(g = o(g = o(g = o(g, v = o(v, m = o(m, l = o(l, g, v, m, n[e], 7, -680876936), g, v, n[e + 1], 12, -389564586), l, g, n[e + 2], 17, 606105819), m, l, n[e + 3], 22, -1044525330), v = o(v, m = o(m, l = o(l, g, v, m, n[e + 4], 7, -176418897), g, v, n[e + 5], 12, 1200080426), l, g, n[e + 6], 17, -1473231341), m, l, n[e + 7], 22, -45705983), v = o(v, m = o(m, l = o(l, g, v, m, n[e + 8], 7, 1770035416), g, v, n[e + 9], 12, -1958414417), l, g, n[e + 10], 17, -42063), m, l, n[e + 11], 22, -1990404162), v = o(v, m = o(m, l = o(l, g, v, m, n[e + 12], 7, 1804603682), g, v, n[e + 13], 12, -40341101), l, g, n[e + 14], 17, -1502002290), m, l, n[e + 15], 22, 1236535329), v = u(v, m = u(m, l = u(l, g, v, m, n[e + 1], 5, -165796510), g, v, n[e + 6], 9, -1069501632), l, g, n[e + 11], 14, 643717713), m, l, n[e], 20, -373897302), v = u(v, m = u(m, l = u(l, g, v, m, n[e + 5], 5, -701558691), g, v, n[e + 10], 9, 38016083), l, g, n[e + 15], 14, -660478335), m, l, n[e + 4], 20, -405537848), v = u(v, m = u(m, l = u(l, g, v, m, n[e + 9], 5, 568446438), g, v, n[e + 14], 9, -1019803690), l, g, n[e + 3], 14, -187363961), m, l, n[e + 8], 20, 1163531501), v = u(v, m = u(m, l = u(l, g, v, m, n[e + 13], 5, -1444681467), g, v, n[e + 2], 9, -51403784), l, g, n[e + 7], 14, 1735328473), m, l, n[e + 12], 20, -1926607734), v = c(v, m = c(m, l = c(l, g, v, m, n[e + 5], 4, -378558), g, v, n[e + 8], 11, -2022574463), l, g, n[e + 11], 16, 1839030562), m, l, n[e + 14], 23, -35309556), v = c(v, m = c(m, l = c(l, g, v, m, n[e + 1], 4, -1530992060), g, v, n[e + 4], 11, 1272893353), l, g, n[e + 7], 16, -155497632), m, l, n[e + 10], 23, -1094730640), v = c(v, m = c(m, l = c(l, g, v, m, n[e + 13], 4, 681279174), g, v, n[e], 11, -358537222), l, g, n[e + 3], 16, -722521979), m, l, n[e + 6], 23, 76029189), v = c(v, m = c(m, l = c(l, g, v, m, n[e + 9], 4, -640364487), g, v, n[e + 12], 11, -421815835), l, g, n[e + 15], 16, 530742520), m, l, n[e + 2], 23, -995338651), v = f(v, m = f(m, l = f(l, g, v, m, n[e], 6, -198630844), g, v, n[e + 7], 10, 1126891415), l, g, n[e + 14], 15, -1416354905), m, l, n[e + 5], 21, -57434055), v = f(v, m = f(m, l = f(l, g, v, m, n[e + 12], 6, 1700485571), g, v, n[e + 3], 10, -1894986606), l, g, n[e + 10], 15, -1051523), m, l, n[e + 1], 21, -2054922799), v = f(v, m = f(m, l = f(l, g, v, m, n[e + 8], 6, 1873313359), g, v, n[e + 15], 10, -30611744), l, g, n[e + 6], 15, -1560198380), m, l, n[e + 13], 21, 1309151649), v = f(v, m = f(m, l = f(l, g, v, m, n[e + 4], 6, -145523070), g, v, n[e + 11], 10, -1120210379), l, g, n[e + 2], 15, 718787259), m, l, n[e + 9], 21, -343485551), l = t(l, i), g = t(g, a), v = t(v, d), m = t(m, h);
    }

    return [l, g, v, m];
  }

  function a(n) {
    var t,
        r = "",
        e = 32 * n.length;

    for (t = 0; t < e; t += 8) {
      r += String.fromCharCode(n[t >> 5] >>> t % 32 & 255);
    }

    return r;
  }

  function d(n) {
    var t,
        r = [];

    for (r[(n.length >> 2) - 1] = void 0, t = 0; t < r.length; t += 1) {
      r[t] = 0;
    }

    var e = 8 * n.length;

    for (t = 0; t < e; t += 8) {
      r[t >> 5] |= (255 & n.charCodeAt(t / 8)) << t % 32;
    }

    return r;
  }

  function h(n) {
    return a(i(d(n), 8 * n.length));
  }

  function l(n, t) {
    var r,
        e,
        o = d(n),
        u = [],
        c = [];

    for (u[15] = c[15] = void 0, o.length > 16 && (o = i(o, 8 * n.length)), r = 0; r < 16; r += 1) {
      u[r] = 909522486 ^ o[r], c[r] = 1549556828 ^ o[r];
    }

    return e = i(u.concat(d(t)), 512 + 8 * t.length), a(i(c.concat(e), 640));
  }

  function g(n) {
    var t,
        r,
        e = "";

    for (r = 0; r < n.length; r += 1) {
      t = n.charCodeAt(r), e += "0123456789abcdef".charAt(t >>> 4 & 15) + "0123456789abcdef".charAt(15 & t);
    }

    return e;
  }

  function v(n) {
    return unescape(encodeURIComponent(n));
  }

  function m(n) {
    return h(v(n));
  }

  function p(n) {
    return g(m(n));
  }

  function s(n, t) {
    return l(v(n), v(t));
  }

  function C(n, t) {
    return g(s(n, t));
  }

  function A(n, t, r) {
    return t ? r ? s(t, n) : C(t, n) : r ? m(n) : p(n);
  }

  "function" == typeof define && define.amd ? define(function () {
    return A;
  }) : "object" == (typeof module === "undefined" ? "undefined" : _typeof(module)) && module.exports ? module.exports = A : n.md5 = A;
}(void 0);

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  arraybufferToString: function arraybufferToString(arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var str = [];
    str.length = byteArray.length;
    var currentStrIndex = 0;
    var currenStrCode = 0;
    var firstByteCode = 0;
    var arrayLength = byteArray.length;

    for (var index = 0; index < arrayLength; index++) {
      firstByteCode = byteArray[index];

      if (firstByteCode > 251 && firstByteCode < 254 && index + 5 < arrayLength) {
        currenStrCode = (firstByteCode - 252) * 1073741824 + (byteArray[++index] - 128 << 24) + (byteArray[++index] - 128 << 18) + (byteArray[++index] - 128 << 12) + (byteArray[++index] - 128 << 6) + byteArray[++index] - 128;
      } else if (firstByteCode > 247 && firstByteCode < 252 && index + 4 < arrayLength) {
        currenStrCode = (firstByteCode - 248 << 24) + (byteArray[++index] - 128 << 18) + (byteArray[++index] - 128 << 12) + (byteArray[++index] - 128 << 6) + byteArray[++index] - 128;
      } else if (firstByteCode > 239 && firstByteCode < 248 && index + 3 < arrayLength) {
        currenStrCode = (firstByteCode - 240 << 18) + (byteArray[++index] - 128 << 12) + (byteArray[++index] - 128 << 6) + byteArray[++index] - 128;
      } else if (firstByteCode > 223 && firstByteCode < 240 && index + 2 < arrayLength) {
        currenStrCode = (firstByteCode - 224 << 12) + (byteArray[++index] - 128 << 6) + byteArray[++index] - 128;
      } else if (firstByteCode > 191 && firstByteCode < 224 && index + 1 < arrayLength) {
        currenStrCode = (firstByteCode - 192 << 6) + byteArray[++index] - 128;
      } else {
        currenStrCode = firstByteCode;
      }

      str[currentStrIndex++] = String.fromCharCode(currenStrCode);
    }

    str.length = currentStrIndex;
    return str.join('');
  },
  stringToArraybuffer: function stringToArraybuffer(string) {
    var length = string.length;
    var byteArray = new Array(6 * length);
    var actualLength = 0;

    for (var index = 0; index < length; index++) {
      var code = string.charCodeAt(index);

      if (code < 0x80) {
        byteArray[actualLength++] = code;
      } else if (code < 0x800) {
        byteArray[actualLength++] = 192 + (code >>> 6);
        byteArray[actualLength++] = 128 + (code & 63);
      } else if (code < 0x10000) {
        byteArray[actualLength++] = 224 + (code >>> 12);
        byteArray[actualLength++] = 128 + (code >>> 6 & 63);
        byteArray[actualLength++] = 128 + (code & 63);
      } else if (code < 0x200000) {
        byteArray[actualLength++] = 240 + (code >>> 18);
        byteArray[actualLength++] = 128 + (code >>> 12 & 63);
        byteArray[actualLength++] = 128 + (code >>> 6 & 63);
        byteArray[actualLength++] = 128 + (code & 63);
      } else if (code < 0x4000000) {
        byteArray[actualLength++] = 248 + (code >>> 24);
        byteArray[actualLength++] = 128 + (code >>> 18 & 63);
        byteArray[actualLength++] = 128 + (code >>> 12 & 63);
        byteArray[actualLength++] = 128 + (code >>> 6 & 63);
        byteArray[actualLength++] = 128 + (code & 63);
      } else if (code < 0x4000000) {
        byteArray[actualLength++] = 252 + (code >>> 30);
        byteArray[actualLength++] = 128 + (code >>> 24 & 63);
        byteArray[actualLength++] = 128 + (code >>> 18 & 63);
        byteArray[actualLength++] = 128 + (code >>> 12 & 63);
        byteArray[actualLength++] = 128 + (code >>> 6 & 63);
        byteArray[actualLength++] = 128 + (code & 63);
      }
    }

    byteArray.length = actualLength;
    return new Uint8Array(byteArray).buffer;
  }
};
exports["default"] = _default;

},{}],4:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLAudioElement2 = _interopRequireDefault(require("./HTMLAudioElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var Audio = function (_HTMLAudioElement) {
  _inherits(Audio, _HTMLAudioElement);

  var _super = _createSuper(Audio);

  function Audio(url) {
    _classCallCheck(this, Audio);

    return _super.call(this, url);
  }

  return Audio;
}(_HTMLAudioElement2["default"]);

exports["default"] = Audio;

},{"./HTMLAudioElement":15}],5:[function(require,module,exports){
(function (global){(function (){
"use strict";

var _util = _interopRequireDefault(require("../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (global) {
  (function (factory) {
    if (typeof define === "function" && define.amd) {
      define(["exports"], factory);
    } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof exports.nodeName !== "string") {
      factory(exports);
    } else {
      factory(global);
    }
  })(function (exports) {
    "use strict";

    exports.URL = global.URL || global.webkitURL;

    if (global.Blob && global.URL) {
      try {
        new Blob();
        return;
      } catch (e) {}
    }

    var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder || function () {
      var get_class = function get_class(object) {
        return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
      },
          FakeBlobBuilder = function BlobBuilder() {
        this.data = [];
        this._arrayBuffer = new ArrayBuffer();
      },
          FakeBlob = function Blob(data, type, encoding) {
        this.data = data;
        this.size = data.length;
        this.type = type;
        this.encoding = encoding;
        this._arrayBuffer = new ArrayBuffer();
      },
          FBB_proto = FakeBlobBuilder.prototype,
          FB_proto = FakeBlob.prototype,
          FileReaderSync = global.FileReaderSync,
          FileException = function FileException(type) {
        this.code = this[this.name = type];
      },
          file_ex_codes = ("NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR " + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR").split(" "),
          file_ex_code = file_ex_codes.length,
          real_URL = global.URL || global.webkitURL || exports,
          real_create_object_URL = real_URL.createObjectURL,
          real_revoke_object_URL = real_URL.revokeObjectURL,
          URL = real_URL,
          btoa = global.btoa,
          atob = global.atob,
          ArrayBuffer = global.ArrayBuffer,
          Uint8Array = global.Uint8Array,
          origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/;

      FakeBlob.fake = FB_proto.fake = true;

      while (file_ex_code--) {
        FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
      }

      if (!real_URL.createObjectURL) {
        URL = exports.URL = function (uri) {
          var uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a"),
              uri_origin;
          uri_info.href = uri;

          if (!("origin" in uri_info)) {
            if (uri_info.protocol.toLowerCase() === "data:") {
              uri_info.origin = null;
            } else {
              uri_origin = uri.match(origin);
              uri_info.origin = uri_origin && uri_origin[1];
            }
          }

          return uri_info;
        };
      }

      URL.createObjectURL = function (blob) {
        var type = blob.type,
            data_URI_header;

        if (type === null) {
          type = "application/octet-stream";
        }

        if (blob instanceof FakeBlob) {
          data_URI_header = "data:" + type;

          if (blob.encoding === "base64") {
            return data_URI_header + ";base64," + blob.data;
          } else if (blob.encoding === "URI") {
            return data_URI_header + "," + decodeURIComponent(blob.data);
          }

          if (btoa) {
            return data_URI_header + ";base64," + btoa(blob.data);
          } else {
            return data_URI_header + "," + encodeURIComponent(blob.data);
          }
        } else if (real_create_object_URL) {
          return real_create_object_URL.call(real_URL, blob);
        }
      };

      URL.revokeObjectURL = function (object_URL) {
        if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
          real_revoke_object_URL.call(real_URL, object_URL);
        }
      };

      FBB_proto.append = function (data) {
        var bb = this.data;

        if (data instanceof ArrayBuffer) {
          var str = "",
              buf = new Uint8Array(data),
              i = 0,
              buf_len = buf.length;

          for (; i < buf_len; i++) {
            str += String.fromCharCode(buf[i]);
          }

          bb.push(str);
          this._arrayBuffer = data.slice(0);
        } else if (get_class(data) === "Blob" || get_class(data) === "File") {
          if (FileReaderSync) {
            var fr = new FileReaderSync();
            bb.push(fr.readAsBinaryString(data));
            this._arrayBuffer = data.arrayBuffer();
          } else {
            throw new FileException("NOT_READABLE_ERR");
          }
        } else if (data instanceof FakeBlob) {
          if (data.encoding === "base64" && atob) {
            bb.push(atob(data.data));
          } else if (data.encoding === "URI") {
            bb.push(decodeURIComponent(data.data));
          } else if (data.encoding === "raw") {
            bb.push(data.data);
          }

          this._arrayBuffer = data._arrayBuffer.slice(0);
        } else {
          if (typeof data !== "string") {
            data += "";
          }

          bb.push(unescape(encodeURIComponent(data)));
          this._arrayBuffer = _util["default"].stringToArraybuffer();
        }
      };

      FBB_proto.getBlob = function (type) {
        if (!arguments.length) {
          type = null;
        }

        var blob = new FakeBlob(this.data.join(""), type, "raw");
        blob._arrayBuffer = this._arrayBuffer;
        return blob;
      };

      FBB_proto.toString = function () {
        return "[object BlobBuilder]";
      };

      FB_proto.slice = function (start, end, type) {
        var args = arguments.length;

        if (args < 3) {
          type = null;
        }

        var blob = new FakeBlob(this.data.slice(start, args > 1 ? end : this.data.length), type, this.encoding);
        var arrayBuffer = this._arrayBuffer;

        if (arrayBuffer instanceof ArrayBuffer) {
          blob._arrayBuffer = this._arrayBuffer.slice(start, end);
        }

        return blob;
      };

      FB_proto.toString = function () {
        return "[object Blob]";
      };

      FB_proto.close = function () {
        this.size = 0;
        delete this.data;
      };

      FB_proto.arrayBuffer = function () {
        return this._arrayBuffer.slice(0);
      };

      return FakeBlobBuilder;
    }();

    exports.Blob = function (blobParts, options) {
      var type = options ? options.type || "" : "";
      var builder = new BlobBuilder();

      if (blobParts) {
        for (var i = 0, len = blobParts.length; i < len; i++) {
          if (Uint8Array && blobParts[i] instanceof Uint8Array) {
            builder.append(blobParts[i].buffer);
          } else {
            builder.append(blobParts[i]);
          }
        }
      }

      var blob = builder.getBlob(type);

      if (!blob.slice && blob.webkitSlice) {
        blob.slice = blob.webkitSlice;
      }

      return blob;
    };

    var getPrototypeOf = Object.getPrototypeOf || function (object) {
      return object.__proto__;
    };

    exports.Blob.prototype = getPrototypeOf(new exports.Blob());
  });
})(typeof self !== "undefined" && self || typeof window !== "undefined" && window || typeof global !== "undefined" && global || (void 0).content || void 0);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util":3}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DOMTokenList = function () {
  function DOMTokenList() {
    _classCallCheck(this, DOMTokenList);

    this.length = 0;
  }

  _createClass(DOMTokenList, [{
    key: "add",
    value: function add() {
      console.warn("DOMTokenList add isn't implemented!");
    }
  }, {
    key: "contains",
    value: function contains() {
      console.warn("DOMTokenList contains isn't implemented!");
    }
  }, {
    key: "entries",
    value: function entries() {
      console.warn("DOMTokenList entries isn't implemented!");
    }
  }, {
    key: "forEach",
    value: function forEach() {
      console.warn("DOMTokenList forEach isn't implemented!");
    }
  }, {
    key: "item",
    value: function item() {
      console.warn("DOMTokenList item isn't implemented!");
    }
  }, {
    key: "keys",
    value: function keys() {
      console.warn("DOMTokenList keys isn't implemented!");
    }
  }, {
    key: "remove",
    value: function remove() {
      console.warn("DOMTokenList remove isn't implemented!");
    }
  }, {
    key: "replace",
    value: function replace() {
      console.warn("DOMTokenList replace isn't implemented!");
    }
  }, {
    key: "supports",
    value: function supports() {
      console.warn("DOMTokenList supports isn't implemented!");
    }
  }, {
    key: "toggle",
    value: function toggle() {}
  }, {
    key: "value",
    value: function value() {
      console.warn("DOMTokenList value isn't implemented!");
    }
  }, {
    key: "values",
    value: function values() {
      console.warn("DOMTokenList values isn't implemented!");
    }
  }]);

  return DOMTokenList;
}();

exports["default"] = DOMTokenList;

},{}],7:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Event2 = _interopRequireDefault(require("./Event"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var DeviceMotionEvent = function (_Event) {
  _inherits(DeviceMotionEvent, _Event);

  var _super = _createSuper(DeviceMotionEvent);

  function DeviceMotionEvent(initArgs) {
    var _this;

    _classCallCheck(this, DeviceMotionEvent);

    _this = _super.call(this, 'devicemotion');

    if (initArgs) {
      _this._acceleration = initArgs.acceleration ? initArgs.acceleration : {
        x: 0,
        y: 0,
        z: 0
      };
      _this._accelerationIncludingGravity = initArgs.accelerationIncludingGravity ? initArgs.accelerationIncludingGravity : {
        x: 0,
        y: 0,
        z: 0
      };
      _this._rotationRate = initArgs.rotationRate ? initArgs.rotationRate : {
        alpha: 0,
        beta: 0,
        gamma: 0
      };
      _this._interval = initArgs.interval;
    } else {
      _this._acceleration = {
        x: 0,
        y: 0,
        z: 0
      };
      _this._accelerationIncludingGravity = {
        x: 0,
        y: 0,
        z: 0
      };
      _this._rotationRate = {
        alpha: 0,
        beta: 0,
        gamma: 0
      };
      _this._interval = 0;
    }

    return _this;
  }

  _createClass(DeviceMotionEvent, [{
    key: "acceleration",
    get: function get() {
      return this._acceleration;
    }
  }, {
    key: "accelerationIncludingGravity",
    get: function get() {
      return this._accelerationIncludingGravity;
    }
  }, {
    key: "rotationRate",
    get: function get() {
      return this._rotationRate;
    }
  }, {
    key: "interval",
    get: function get() {
      return this._interval;
    }
  }]);

  return DeviceMotionEvent;
}(_Event2["default"]);

exports["default"] = DeviceMotionEvent;

},{"./Event":10}],8:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Audio = _interopRequireDefault(require("./Audio"));

var _FontFaceSet = _interopRequireDefault(require("./FontFaceSet"));

var _Node2 = _interopRequireDefault(require("./Node"));

var _NodeList = _interopRequireDefault(require("./NodeList"));

var _HTMLAnchorElement = _interopRequireDefault(require("./HTMLAnchorElement"));

var _HTMLElement = _interopRequireDefault(require("./HTMLElement"));

var _HTMLHtmlElement = _interopRequireDefault(require("./HTMLHtmlElement"));

var _HTMLBodyElement = _interopRequireDefault(require("./HTMLBodyElement"));

var _HTMLHeadElement = _interopRequireDefault(require("./HTMLHeadElement"));

var _HTMLCanvasElement = _interopRequireDefault(require("./HTMLCanvasElement"));

var _HTMLVideoElement = _interopRequireDefault(require("./HTMLVideoElement"));

var _HTMLScriptElement = _interopRequireDefault(require("./HTMLScriptElement"));

var _HTMLStyleElement = _interopRequireDefault(require("./HTMLStyleElement"));

var _HTMLInputElement = _interopRequireDefault(require("./HTMLInputElement"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _html = new _HTMLHtmlElement["default"]();

var Document = function (_Node) {
  _inherits(Document, _Node);

  var _super = _createSuper(Document);

  _createClass(Document, [{
    key: "characterSet",
    get: function get() {
      return "UTF-8";
    }
  }, {
    key: "scripts",
    get: function get() {
      return _WeakMap["default"].get(this).scripts.slice(0);
    }
  }]);

  function Document() {
    var _this;

    _classCallCheck(this, Document);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "head", new _HTMLHeadElement["default"](_html));

    _defineProperty(_assertThisInitialized(_this), "body", new _HTMLBodyElement["default"](_html));

    _defineProperty(_assertThisInitialized(_this), "fonts", new _FontFaceSet["default"]());

    _defineProperty(_assertThisInitialized(_this), "cookie", "");

    _defineProperty(_assertThisInitialized(_this), "documentElement", _html);

    _defineProperty(_assertThisInitialized(_this), "readyState", "complete");

    _defineProperty(_assertThisInitialized(_this), "visibilityState", "visible");

    _defineProperty(_assertThisInitialized(_this), "hidden", false);

    _defineProperty(_assertThisInitialized(_this), "style", {});

    _defineProperty(_assertThisInitialized(_this), "location", window.location);

    _defineProperty(_assertThisInitialized(_this), "ontouchstart", null);

    _defineProperty(_assertThisInitialized(_this), "ontouchmove", null);

    _defineProperty(_assertThisInitialized(_this), "ontouchend", null);

    _html.appendChild(_this.head);

    _html.appendChild(_this.body);

    _WeakMap["default"].get(_assertThisInitialized(_this)).scripts = [];
    return _this;
  }

  _createClass(Document, [{
    key: "createElement",
    value: function createElement(tagName) {
      if (typeof tagName !== "string") {
        return null;
      }

      tagName = tagName.toUpperCase();

      if (tagName === 'CANVAS') {
        return new _HTMLCanvasElement["default"]();
      } else if (tagName === 'IMG') {
        return new Image();
      } else if (tagName === 'VIDEO') {
        return new _HTMLVideoElement["default"]();
      } else if (tagName === 'SCRIPT') {
        return new _HTMLScriptElement["default"]();
      } else if (tagName === "INPUT") {
        return new _HTMLInputElement["default"]();
      } else if (tagName === "AUDIO") {
        return new _Audio["default"]();
      } else if (tagName === "STYLE") {
        return new _HTMLStyleElement["default"]();
      } else if (tagName === "A") {
        return new _HTMLAnchorElement["default"]();
      }

      return new _HTMLElement["default"](tagName);
    }
  }, {
    key: "createElementNS",
    value: function createElementNS(namespaceURI, qualifiedName, options) {
      return this.createElement(qualifiedName);
    }
  }, {
    key: "createEvent",
    value: function createEvent(type) {
      if (window[type]) {
        return new window[type]();
      }

      return null;
    }
  }, {
    key: "createTextNode",
    value: function createTextNode() {
      console.warn("document.createTextNode() is not support!");
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent() {
      if (_html.dispatchEvent.apply(_html, arguments)) {
        return _get(_getPrototypeOf(Document.prototype), "dispatchEvent", this).apply(this, arguments);
      }

      return false;
    }
  }, {
    key: "appendChild",
    value: function appendChild(node) {
      var nodeName = node.nodeName;

      if (nodeName === "SCRIPT") {
        _WeakMap["default"].get(this).scripts.push(node);
      }

      return _get(_getPrototypeOf(Document.prototype), "appendChild", this).call(this, node);
    }
  }, {
    key: "removeChild",
    value: function removeChild(node) {
      var nodeName = node.nodeName;

      if (nodeName === "SCRIPT") {
        var scripts = _WeakMap["default"].get(this).scripts;

        for (var index = 0, length = scripts.length; index < length; ++index) {
          if (node === scripts[index]) {
            scripts.slice(index, 1);
            break;
          }
        }
      }

      return _get(_getPrototypeOf(Document.prototype), "removeChild", this).call(this, node);
    }
  }, {
    key: "getElementById",
    value: function getElementById(id) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'getElementById' on 'Document': 1 argument required, but only 0 present.";
      }

      var rootElement = this.documentElement;
      var elementArr = [].concat(rootElement.childNodes);
      var element;

      if (id === "canvas" || id === "glcanvas") {
        while (element = elementArr.pop()) {
          if (element.id === "canvas" || element.id === "glcanvas") {
            return element;
          }

          elementArr = elementArr.concat(element.childNodes);
        }
      } else {
        while (element = elementArr.pop()) {
          if (element.id === id) {
            return element;
          }

          elementArr = elementArr.concat(element.childNodes);
        }
      }

      return null;
    }
  }, {
    key: "getElementsByClassName",
    value: function getElementsByClassName(names) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'getElementsByClassName' on 'Document': 1 argument required, but only 0 present.";
      }

      if (typeof names !== "string" && names instanceof String) {
        return new _NodeList["default"]();
      }

      return this.documentElement.getElementsByClassName(names);
    }
  }, {
    key: "getElementsByTagName",
    value: function getElementsByTagName(tagName) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'getElementsByTagName' on 'Document': 1 argument required, but only 0 present.";
      }

      tagName = tagName.toUpperCase();
      var rootElement = this.documentElement;
      var result = new _NodeList["default"]();

      switch (tagName) {
        case "HEAD":
          {
            result.push(document.head);
            break;
          }

        case "BODY":
          {
            result.push(document.body);
            break;
          }

        default:
          {
            result = result.concat(rootElement.getElementsByTagName(tagName));
          }
      }

      return result;
    }
  }, {
    key: "getElementsByName",
    value: function getElementsByName(name) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'getElementsByName' on 'Document': 1 argument required, but only 0 present.";
      }

      var elementArr = [].concat(this.childNodes);
      var result = new _NodeList["default"]();
      var element;

      while (element = elementArr.pop()) {
        if (element.name === name) {
          result.push(element);
        }

        elementArr = elementArr.concat(element.childNodes);
      }

      return result;
    }
  }, {
    key: "querySelector",
    value: function querySelector(selectors) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'querySelectorAll' on 'Document': 1 argument required, but only 0 present.";
      }

      var nodeList = new _NodeList["default"]();

      switch (selectors) {
        case null:
        case undefined:
        case NaN:
        case true:
        case false:
        case "":
          return null;
      }

      if (typeof selectors !== "string" && selectors instanceof String) {
        throw "Uncaught DOMException: Failed to execute 'querySelectorAll' on 'Document': '" + selectors + "' is not a valid selector.";
      }

      var reg = /^[A-Za-z]+$/;
      var result = selectors.match(reg);

      if (result) {
        return this.getElementsByTagName(selectors);
      }

      reg = /^\.[A-Za-z$_][A-Za-z$_0-9\- ]*$/;
      result = selectors.match(reg);

      if (result) {
        var selectorArr = selectors.split(" ");
        var selector = selectorArr.shift();
        nodeList = this.getElementsByClassName(selector.substr(1));
        var length = selectorArr.length;

        if (length) {
          selectors = selectorArr.join(" ");
          length = nodeList.length;

          for (var index = 0; index < length; index++) {
            var subNodeList = nodeList[index].querySelector(selectors);

            if (subNodeList.length) {
              return subNodeList[0];
            }
          }
        }

        return nodeList[0];
      }

      reg = /^#[A-Za-z$_][A-Za-z$_0-9\-]*$/;
      result = selectors.match(reg);

      if (result) {
        var element = this.getElementById(selectors.substr(1));

        if (element) {
          nodeList.push(element);
        }
      }

      if (selectors === "*") {
        return this.getElementsByTagName(selectors);
      }

      return nodeList[0];
    }
  }, {
    key: "querySelectorAll",
    value: function querySelectorAll(selectors) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'querySelectorAll' on 'Document': 1 argument required, but only 0 present.";
      }

      var nodeList = new _NodeList["default"]();

      switch (selectors) {
        case null:
        case undefined:
        case NaN:
        case true:
        case false:
        case "":
          return nodeList;
      }

      if (typeof selectors !== "string" && selectors instanceof String) {
        throw "Uncaught DOMException: Failed to execute 'querySelectorAll' on 'Document': '" + selectors + "' is not a valid selector.";
      }

      var reg = /^[A-Za-z]+$/;
      var result = selectors.match(reg);

      if (result) {
        return this.getElementsByTagName(selectors);
      }

      reg = /^\.[A-Za-z$_][A-Za-z$_0-9\-]*$/;
      result = selectors.match(reg);

      if (result) {
        return this.getElementsByClassName(selectors.substr(1));
      }

      reg = /^#[A-Za-z$_][A-Za-z$_0-9\-]*$/;
      result = selectors.match(reg);

      if (result) {
        var element = this.getElementById(selectors.substr(1));

        if (element) {
          nodeList.push(element);
        }
      }

      if (selectors === "*") {
        return this.getElementsByTagName(selectors);
      }

      return nodeList;
    }
  }]);

  return Document;
}(_Node2["default"]);

exports["default"] = Document;

},{"./Audio":4,"./FontFaceSet":13,"./HTMLAnchorElement":14,"./HTMLBodyElement":16,"./HTMLCanvasElement":17,"./HTMLElement":18,"./HTMLHeadElement":19,"./HTMLHtmlElement":20,"./HTMLInputElement":22,"./HTMLScriptElement":24,"./HTMLStyleElement":25,"./HTMLVideoElement":26,"./Node":32,"./NodeList":33,"./util/WeakMap":56}],9:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Node2 = _interopRequireDefault(require("./Node"));

var _NodeList = _interopRequireDefault(require("./NodeList"));

var _DOMTokenList = _interopRequireDefault(require("./DOMTokenList"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Element = function (_Node) {
  _inherits(Element, _Node);

  var _super = _createSuper(Element);

  function Element(tagName) {
    var _this;

    _classCallCheck(this, Element);

    _this = _super.call(this, tagName);

    _defineProperty(_assertThisInitialized(_this), "className", '');

    _defineProperty(_assertThisInitialized(_this), "children", []);

    _defineProperty(_assertThisInitialized(_this), "classList", new _DOMTokenList["default"]());

    _defineProperty(_assertThisInitialized(_this), "value", 1);

    _defineProperty(_assertThisInitialized(_this), "content", "");

    _defineProperty(_assertThisInitialized(_this), "scrollLeft", 0);

    _defineProperty(_assertThisInitialized(_this), "scrollTop", 0);

    _defineProperty(_assertThisInitialized(_this), "clientLeft", 0);

    _defineProperty(_assertThisInitialized(_this), "clientTop", 0);

    return _this;
  }

  _createClass(Element, [{
    key: "getBoundingClientRect",
    value: function getBoundingClientRect() {
      return {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        top: 0,
        left: 0,
        bottom: window.innerHeight,
        right: window.innerWidth
      };
    }
  }, {
    key: "getElementsByTagName",
    value: function getElementsByTagName(tagName) {
      tagName = tagName.toUpperCase();
      var result = new _NodeList["default"]();
      var childNodes = this.childNodes;
      var length = childNodes.length;

      for (var index = 0; index < length; index++) {
        var element = childNodes[index];

        if (element.tagName === tagName || tagName === "*") {
          result.push(element);
        }

        result = result.concat(element);
      }

      return result;
    }
  }, {
    key: "getElementsByClassName",
    value: function getElementsByClassName(names) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'getElementsByClassName' on 'Document': 1 argument required, but only 0 present.";
      }

      var result = new _NodeList["default"]();

      if (typeof names !== "string" && names instanceof String) {
        return result;
      }

      var elementArr = [].concat(this.childNodes);
      var element;

      while (element = elementArr.pop()) {
        var classStr = element["class"];

        if (classStr) {
          var classArr = classStr.split(" ");
          var length = classArr.length;

          for (var index = 0; index < length; index++) {
            if (classArr[index] === names) {
              result.push(element);
              break;
            }
          }
        }

        elementArr = elementArr.concat(element.childNodes);
      }

      return result;
    }
  }, {
    key: "querySelector",
    value: function querySelector(selectors) {
      if (!arguments.length) {
        throw "Uncaught TypeError: Failed to execute 'querySelectorAll' on 'Document': 1 argument required, but only 0 present.";
      }

      var nodeList = new _NodeList["default"]();

      switch (selectors) {
        case null:
        case undefined:
        case NaN:
        case true:
        case false:
        case "":
          return null;
      }

      if (typeof selectors !== "string" && selectors instanceof String) {
        throw "Uncaught DOMException: Failed to execute 'querySelectorAll' on 'Document': '" + selectors + "' is not a valid selector.";
      }

      var reg = /^[A-Za-z]+$/;
      var result = selectors.match(reg);

      if (result) {
        return this.getElementsByTagName(selectors);
      }

      reg = /^.[A-Za-z$_][A-Za-z$_0-9\- ]*$/;
      result = selectors.match(reg);

      if (result) {
        var selectorArr = selectors.split(" ");
        var selector = selectorArr.shift();
        nodeList = this.getElementsByClassName(selector.substr(1));
        var length = selectorArr.length;

        if (length) {
          selectors = selectorArr.join(" ");
          length = nodeList.length;

          for (var index = 0; index < length; index++) {
            var subNodeList = nodeList[index].querySelector(selectors);

            if (subNodeList.length) {
              return subNodeList[0];
            }
          }
        }

        return nodeList[0];
      }

      reg = /^#[A-Za-z$_][A-Za-z$_0-9\-]*$/;
      result = selectors.match(reg);

      if (result) {
        var element = this.getElementById(selectors.substr(1));

        if (element) {
          nodeList.push(element);
        }
      }

      if (selectors === "*") {
        return this.getElementsByTagName(selectors);
      }

      return nodeList[0];
    }
  }, {
    key: "add",
    value: function add() {}
  }, {
    key: "requestFullscreen",
    value: function requestFullscreen() {}
  }, {
    key: "removeAttribute",
    value: function removeAttribute(attrName) {
      if (attrName === "style") {
        for (var styleName in this["style"]) {
          this["style"][styleName] = "";
        }
      } else {
        this[attrName] = "";
      }
    }
  }, {
    key: "setAttribute",
    value: function setAttribute(name, value) {
      if (name === "style") {
        if (typeof value == "undefined" || value == null || value == "") {
          for (var styleName in this["style"]) {
            this["style"][styleName] = "";
          }
        } else {
          value = value.replace(/\s*/g, "");
          var valueArray = value.split(";");

          for (var index in valueArray) {
            if (valueArray[index] != "") {
              var valueTemp = valueArray[index].split(":");
              this["style"][valueTemp[0]] = valueTemp[1];
            }
          }
        }
      } else {
        this[name] = value;
      }
    }
  }, {
    key: "getAttribute",
    value: function getAttribute(name) {
      var attributeValue = null;

      if (name == "style") {
        attributeValue = JSON.stringify(this["style"]);
      } else {
        attributeValue = this[name];
      }

      return attributeValue;
    }
  }, {
    key: "setAttributeNS",
    value: function setAttributeNS(ns, name, value) {
      this.setAttribute(name, value);
    }
  }, {
    key: "focus",
    value: function focus() {}
  }, {
    key: "blur",
    value: function blur() {}
  }, {
    key: "lastChild",
    get: function get() {
      var lastChild = this.childNodes[this.childNodes.length - 1];
      return lastChild ? lastChild : this.innerHTML ? new HTMLElement() : undefined;
    }
  }, {
    key: "firstChild",
    get: function get() {
      var child = this.childNodes[0];
      return child ? child : this.innerHTML ? new HTMLElement() : undefined;
    }
  }, {
    key: "firstElementChild",
    get: function get() {
      var child = this.childNodes[0];
      return child ? child : this.innerHTML ? new HTMLElement() : undefined;
    }
  }, {
    key: "clientHeight",
    get: function get() {
      var style = this.style || {};
      return parseInt(style.fontSize || "0");
    }
  }, {
    key: "tagName",
    get: function get() {
      return this.nodeName;
    }
  }]);

  return Element;
}(_Node2["default"]);

exports["default"] = Element;

},{"./DOMTokenList":6,"./Node":32,"./NodeList":33}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Event = function () {
  function Event(type, eventInit) {
    _classCallCheck(this, Event);

    this._type = type;
    this._target = null;
    this._eventPhase = 2;
    this._currentTarget = null;
    this._canceled = false;
    this._stopped = false;
    this._passiveListener = null;
    this._timeStamp = Date.now();
  }

  _createClass(Event, [{
    key: "composedPath",
    value: function composedPath() {
      var currentTarget = this._currentTarget;

      if (currentTarget === null) {
        return [];
      }

      return [currentTarget];
    }
  }, {
    key: "stopPropagation",
    value: function stopPropagation() {}
  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this._stopped = true;
    }
  }, {
    key: "preventDefault",
    value: function preventDefault() {
      if (this._passiveListener !== null) {
        console.warn("Event#preventDefault() was called from a passive listener:", this._passiveListener);
        return;
      }

      if (!this.cancelable) {
        return;
      }

      this._canceled = true;
    }
  }, {
    key: "type",
    get: function get() {
      return this._type;
    }
  }, {
    key: "target",
    get: function get() {
      return this._target;
    }
  }, {
    key: "currentTarget",
    get: function get() {
      return this._currentTarget;
    }
  }, {
    key: "isTrusted",
    get: function get() {
      return false;
    }
  }, {
    key: "timeStamp",
    get: function get() {
      return this._timeStamp;
    },
    set: function set(value) {
      if (this.type.indexOf("touch")) {
        this._timeStamp = value;
      }
    }
  }, {
    key: "eventPhase",
    get: function get() {
      return this._eventPhase;
    }
  }, {
    key: "bubbles",
    get: function get() {
      return false;
    }
  }, {
    key: "cancelable",
    get: function get() {
      return true;
    }
  }, {
    key: "defaultPrevented",
    get: function get() {
      return this._canceled;
    }
  }, {
    key: "composed",
    get: function get() {
      return false;
    }
  }]);

  return Event;
}();

exports["default"] = Event;
Event.NONE = 0;
Event.CAPTURING_PHASE = 1;
Event.AT_TARGET = 2;
Event.BUBBLING_PHASE = 3;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _TouchEvent = _interopRequireDefault(require("./TouchEvent"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

var _DeviceMotionEvent = _interopRequireDefault(require("./DeviceMotionEvent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _listenerStat = {};

var _onTouchStart = function _onTouchStart(e) {
  var event = new _TouchEvent["default"]("touchstart");
  window.dispatchEvent(Object.assign(event, e));
};

var _onTouchMove = function _onTouchMove(e) {
  var event = new _TouchEvent["default"]("touchmove");
  window.dispatchEvent(Object.assign(event, e));
};

var _onTouchCancel = function _onTouchCancel(e) {
  var event = new _TouchEvent["default"]("touchcancel");
  window.dispatchEvent(Object.assign(event, e));
};

var _onTouchEnd = function _onTouchEnd(e) {
  var event = new _TouchEvent["default"]("touchend");
  window.dispatchEvent(Object.assign(event, e));
};

var _systemInfo = ral.getSystemInfoSync();

var _isAndroid = _systemInfo.platform.toLowerCase() === "android";

var _alpha = 0.8;
var _gravity = [0, 0, 0];

var _onAccelerometerChange = function _onAccelerometerChange(e) {
  if (_isAndroid) {
    e.x *= -10;
    e.y *= -10;
    e.z *= -10;
  } else {
    e.x *= 10;
    e.y *= 10;
    e.z *= 10;
  }

  _gravity[0] = _alpha * _gravity[0] + (1 - _alpha) * e.x;
  _gravity[1] = _alpha * _gravity[1] + (1 - _alpha) * e.y;
  _gravity[2] = _alpha * _gravity[2] + (1 - _alpha) * e.z;
  var event = new _DeviceMotionEvent["default"]({
    acceleration: {
      x: e.x - _gravity[0],
      y: e.y - _gravity[1],
      z: e.z - _gravity[2]
    },
    accelerationIncludingGravity: {
      x: e.x,
      y: e.y,
      z: e.z
    }
  });
  window.dispatchEvent(event);
};

var EventTarget = function () {
  function EventTarget() {
    _classCallCheck(this, EventTarget);

    _WeakMap["default"].set(this, {});
  }

  _createClass(EventTarget, [{
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var privateThis = _WeakMap["default"].get(this);

      if (!privateThis) {
        _WeakMap["default"].set(this, privateThis = {});
      }

      var events = _WeakMap["default"].get(privateThis);

      if (!events) {
        _WeakMap["default"].set(privateThis, events = {});
      }

      if (!events[type]) {
        events[type] = [];
      }

      var listenerArray = events[type];
      var length = listenerArray.length;

      for (var index = 0; index < length; ++index) {
        if (listenerArray[index] === listener) {
          return;
        }
      }

      listenerArray.push(listener);

      if (_listenerStat[type]) {
        ++_listenerStat[type];
      } else {
        _listenerStat[type] = 1;

        switch (type) {
          case "touchstart":
            {
              ral.onTouchStart(_onTouchStart);
              break;
            }

          case "touchmove":
            {
              ral.onTouchMove(_onTouchMove);
              break;
            }

          case "touchcancel":
            {
              ral.onTouchCancel(_onTouchCancel);
              break;
            }

          case "touchend":
            {
              ral.onTouchEnd(_onTouchEnd);
              break;
            }

          case "devicemotion":
            {
              ral.onAccelerometerChange(_onAccelerometerChange);
              ral.startAccelerometer();
              break;
            }
        }
      }

      if (options.capture) {}

      if (options.once) {}

      if (options.passive) {}
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, listener) {
      var privateThis = _WeakMap["default"].get(this);

      var events;

      if (privateThis) {
        events = _WeakMap["default"].get(privateThis);
      }

      if (events) {
        var listeners = events[type];

        if (listeners && listeners.length > 0) {
          for (var i = listeners.length; i--; i > 0) {
            if (listeners[i] === listener) {
              listeners.splice(i, 1);

              if (--_listenerStat[type] === 0) {
                switch (type) {
                  case "touchstart":
                    {
                      ral.offTouchStart(_onTouchStart);
                      break;
                    }

                  case "touchmove":
                    {
                      ral.offTouchMove(_onTouchMove);
                      break;
                    }

                  case "touchcancel":
                    {
                      ral.offTouchCancel(_onTouchCancel);
                      break;
                    }

                  case "touchend":
                    {
                      ral.offTouchEnd(_onTouchEnd);
                      break;
                    }

                  case "devicemotion":
                    {
                      ral.offAccelerometerChange(_onAccelerometerChange);
                      ral.stopAccelerometer();
                      break;
                    }
                }
              }

              break;
            }
          }
        }
      }
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent() {
      var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      event._target = event._currentTarget = this;

      if (event instanceof _TouchEvent["default"]) {
        var toucheArray = event.touches;
        var length = toucheArray.length;

        for (var index = 0; index < length; ++index) {
          toucheArray[index].target = this;
        }

        toucheArray = event.changedTouches;
        length = toucheArray.length;

        for (var _index = 0; _index < length; ++_index) {
          toucheArray[_index].target = this;
        }
      }

      var callback = this["on" + event.type];

      if (typeof callback === "function") {
        callback.call(this, event);
      }

      var privateThis = _WeakMap["default"].get(this);

      var events;

      if (privateThis) {
        events = _WeakMap["default"].get(privateThis);
      }

      if (events) {
        var listeners = events[event.type];

        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            listeners[i].call(this, event);
          }
        }
      }

      event._target = event._currentTarget = null;
      return true;
    }
  }]);

  return EventTarget;
}();

exports["default"] = EventTarget;

},{"./DeviceMotionEvent":7,"./TouchEvent":36,"./util/WeakMap":56}],12:[function(require,module,exports){
"use strict";

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var FontFace = function () {
  function FontFace(family, source, descriptors) {
    _classCallCheck(this, FontFace);

    this.family = family;
    this.source = source;
    this.descriptors = descriptors;
    var self = this;
    var _selfPrivate = {
      status: "unloaded",
      _status: "unloaded",
      load: function load() {
        this.status = "loading";
        var source;

        if (self.source.match(/url\(\s*'\s*(.*?)\s*'\s*\)/)) {
          source = self.source;
        } else {
          source = "url('" + self.source + "')";
        }

        var family = ral.loadFont(self.family, source);

        if (family) {
          this._status = "loaded";
        } else {
          this._status = "error";
        }

        setTimeout(function () {
          var status = _selfPrivate.status = _selfPrivate._status;

          if (status === "loaded") {
            _selfPrivate.loadResolve();
          } else {
            _selfPrivate.loadReject();
          }
        });
      }
    };

    _WeakMap["default"].set(this, _selfPrivate);

    _selfPrivate.loaded = new Promise(function (resolve, reject) {
      _selfPrivate.loadResolve = resolve;
      _selfPrivate.loadReject = reject;
    });
  }

  _createClass(FontFace, [{
    key: "load",
    value: function load() {
      _WeakMap["default"].get(this).load();

      return _WeakMap["default"].get(this).loaded;
    }
  }, {
    key: "status",
    get: function get() {
      return _WeakMap["default"].get(this).status;
    }
  }, {
    key: "loaded",
    get: function get() {
      return _WeakMap["default"].get(this).loaded;
    }
  }]);

  return FontFace;
}();

module.exports = FontFace;

},{"./util/WeakMap":56}],13:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("./EventTarget"));

var _Event = _interopRequireDefault(require("./Event"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var FontFaceSet = function (_EventTarget) {
  _inherits(FontFaceSet, _EventTarget);

  var _super = _createSuper(FontFaceSet);

  function FontFaceSet() {
    var _this;

    _classCallCheck(this, FontFaceSet);

    _this = _super.call(this);

    var self = _assertThisInitialized(_this);

    _WeakMap["default"].get(_assertThisInitialized(_this)).status = "loaded";
    _WeakMap["default"].get(_assertThisInitialized(_this)).ready = new Promise(function (resolve, reject) {
      _WeakMap["default"].get(self).readyResolve = resolve;
      _WeakMap["default"].get(self).readyReject = reject;
    });
    _WeakMap["default"].get(_assertThisInitialized(_this)).fontFaceSet = [];
    return _this;
  }

  _createClass(FontFaceSet, [{
    key: "add",
    value: function add(fontFace) {
      _WeakMap["default"].get(this).fontFaceSet.push(fontFace);
    }
  }, {
    key: "check",
    value: function check() {
      console.warn("FontFaceSet.check() not implements");
    }
  }, {
    key: "clear",
    value: function clear() {
      console.warn("FontFaceSet.clear() not implements");
    }
  }, {
    key: "delete",
    value: function _delete() {
      console.warn("FontFaceSet.delete() not implements");
    }
  }, {
    key: "load",
    value: function load() {
      var self = this;
      _WeakMap["default"].get(this).status = "loading";
      this.dispatchEvent(new _Event["default"]('loading'));
      return new Promise(function (resolve, reject) {
        var fontFaceSet = _WeakMap["default"].get(self).fontFaceSet;

        if (fontFaceSet) {
          for (var index in fontFaceSet) {
            var fontFace = fontFaceSet[index];

            var status = _WeakMap["default"].get(fontFace).status;

            if (status === "unloaded" || status === "error") {
              fontFace.load();

              if (_WeakMap["default"].get(fontFace)._status !== "loaded") {
                break;
              }
            }
          }

          _WeakMap["default"].get(self).status = "loaded";

          _WeakMap["default"].get(self).readyResolve([].concat(_WeakMap["default"].get(self).fontFaceSet));

          resolve([].concat(_WeakMap["default"].get(self).fontFaceSet));
          self.dispatchEvent(new _Event["default"]('loadingdone'));
          return;
        }

        _WeakMap["default"].get(self).status = "loaded";

        _WeakMap["default"].get(self).readyReject();

        reject();
        self.dispatchEvent(new _Event["default"]('loadingerror'));
      });
    }
  }, {
    key: "status",
    get: function get() {
      return _WeakMap["default"].get(this).status;
    }
  }, {
    key: "ready",
    get: function get() {
      return _WeakMap["default"].get(this).ready;
    }
  }]);

  return FontFaceSet;
}(_EventTarget2["default"]);

exports["default"] = FontFaceSet;

},{"./Event":10,"./EventTarget":11,"./util/WeakMap":56}],14:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLAnchorElement = function (_HTMLElement) {
  _inherits(HTMLAnchorElement, _HTMLElement);

  var _super = _createSuper(HTMLAnchorElement);

  function HTMLAnchorElement() {
    var _this;

    _classCallCheck(this, HTMLAnchorElement);

    _this = _super.call(this, "A");
    _WeakMap["default"].get(_assertThisInitialized(_this)).protocol = ":";
    return _this;
  }

  _createClass(HTMLAnchorElement, [{
    key: "protocol",
    get: function get() {
      return _WeakMap["default"].get(this).protocol;
    }
  }]);

  return HTMLAnchorElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLAnchorElement;

},{"./HTMLElement":18,"./util/WeakMap":56}],15:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLMediaElement2 = _interopRequireDefault(require("./HTMLMediaElement"));

var _Event = _interopRequireDefault(require("./Event"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function set(target, property, value, receiver) { if (typeof Reflect !== "undefined" && Reflect.set) { set = Reflect.set; } else { set = function set(target, property, value, receiver) { var base = _superPropBase(target, property); var desc; if (base) { desc = Object.getOwnPropertyDescriptor(base, property); if (desc.set) { desc.set.call(receiver, value); return true; } else if (!desc.writable) { return false; } } desc = Object.getOwnPropertyDescriptor(receiver, property); if (desc) { if (!desc.writable) { return false; } desc.value = value; Object.defineProperty(receiver, property, desc); } else { _defineProperty(receiver, property, value); } return true; }; } return set(target, property, value, receiver); }

function _set(target, property, value, receiver, isStrict) { var s = set(target, property, value, receiver || target); if (!s && isStrict) { throw new Error('failed to set property'); } return value; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLAudioElement = function (_HTMLMediaElement) {
  _inherits(HTMLAudioElement, _HTMLMediaElement);

  var _super = _createSuper(HTMLAudioElement);

  function HTMLAudioElement(url) {
    var _this;

    _classCallCheck(this, HTMLAudioElement);

    _this = _super.call(this, url, 'AUDIO');
    var innerAudioContext = ral.createInnerAudioContext();
    innerAudioContext.onCanplay(function () {
      _WeakMap["default"].get(this).duration = innerAudioContext.duration;
      this.dispatchEvent(new _Event["default"]("canplay"));
      this.dispatchEvent(new _Event["default"]("canplaythrough"));
      this.dispatchEvent(new _Event["default"]("durationchange"));
      this.dispatchEvent(new _Event["default"]("loadedmetadata"));
      this.dispatchEvent(new _Event["default"]("loadeddata"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onPlay(function () {
      this.dispatchEvent(new _Event["default"]("play"));
      this.dispatchEvent(new _Event["default"]("playing"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onPause(function () {
      this.dispatchEvent(new _Event["default"]("pause"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onEnded(function () {
      this.dispatchEvent(new _Event["default"]("ended"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onError(function () {
      _WeakMap["default"].get(this).duration = NaN;
      this.dispatchEvent(new _Event["default"]("error"));
      this.dispatchEvent(new _Event["default"]("emptied"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onWaiting(function () {
      this.dispatchEvent(new _Event["default"]("waiting"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onSeeked(function () {
      this.dispatchEvent(new _Event["default"]("seeked"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onSeeking(function () {
      this.dispatchEvent(new _Event["default"]("seeking"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.onTimeUpdate(function () {
      this.dispatchEvent(new _Event["default"]("timeupdate"));
    }.bind(_assertThisInitialized(_this)));
    innerAudioContext.src = url;
    _WeakMap["default"].get(_assertThisInitialized(_this)).innerAudioContext = innerAudioContext;
    _WeakMap["default"].get(_assertThisInitialized(_this)).duration = NaN;
    return _this;
  }

  _createClass(HTMLAudioElement, [{
    key: "canPlayType",
    value: function canPlayType() {
      var mediaType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      if (typeof mediaType !== 'string') {
        return '';
      }

      if (mediaType.indexOf('audio/mpeg') > -1 || mediaType.indexOf('audio/mp4')) {
        return 'probably';
      }

      return '';
    }
  }, {
    key: "load",
    value: function load() {
      this.dispatchEvent(new _Event["default"]("loadstart"));
      _WeakMap["default"].get(this).innerAudioContext.src = _get(_getPrototypeOf(HTMLAudioElement.prototype), "src", this);
    }
  }, {
    key: "pause",
    value: function pause() {
      _WeakMap["default"].get(this).innerAudioContext.pause();
    }
  }, {
    key: "play",
    value: function play() {
      _WeakMap["default"].get(this).innerAudioContext.play();

      this.dispatchEvent(new _Event["default"]("progress"));
    }
  }, {
    key: "currentTime",
    get: function get() {
      return _WeakMap["default"].get(this).innerAudioContext.currentTime;
    },
    set: function set(value) {
      _WeakMap["default"].get(this).innerAudioContext.seek(value);
    }
  }, {
    key: "loop",
    get: function get() {
      return _get(_getPrototypeOf(HTMLAudioElement.prototype), "loop", this);
    },
    set: function set(value) {
      _set(_getPrototypeOf(HTMLAudioElement.prototype), "loop", value, this, true);

      _WeakMap["default"].get(this).innerAudioContext.loop = value;
    }
  }, {
    key: "volume",
    get: function get() {
      return _get(_getPrototypeOf(HTMLAudioElement.prototype), "volume", this);
    },
    set: function set(value) {
      _set(_getPrototypeOf(HTMLAudioElement.prototype), "volume", value, this, true);

      _WeakMap["default"].get(this).innerAudioContext.volume = value;
      this.dispatchEvent(new _Event["default"]("volumechange"));
    }
  }, {
    key: "src",
    get: function get() {
      return _get(_getPrototypeOf(HTMLAudioElement.prototype), "src", this);
    },
    set: function set(value) {
      _set(_getPrototypeOf(HTMLAudioElement.prototype), "src", value, this, true);

      this.dispatchEvent(new _Event["default"]("loadstart"));
      _WeakMap["default"].get(this).innerAudioContext.src = value;
    }
  }]);

  return HTMLAudioElement;
}(_HTMLMediaElement2["default"]);

exports["default"] = HTMLAudioElement;

},{"./Event":10,"./HTMLMediaElement":23,"./util/WeakMap":56}],16:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var HTMLBodyElement = function (_HTMLElement) {
  _inherits(HTMLBodyElement, _HTMLElement);

  var _super = _createSuper(HTMLBodyElement);

  function HTMLBodyElement(parentNode) {
    var _this;

    _classCallCheck(this, HTMLBodyElement);

    _this = _super.call(this, "BODY");

    _defineProperty(_assertThisInitialized(_this), "parentNode", null);

    _this.parentNode = parentNode;
    return _this;
  }

  return HTMLBodyElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLBodyElement;

},{"./HTMLElement.js":18}],17:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

var _ImageData = _interopRequireDefault(require("./ImageData"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

if (ral.getFeatureProperty("HTMLCanvasElement", "spec") === "vivo_platform_support") {
  var HTMLCanvasElement = window.HTMLCanvasElement;
  module.exports = HTMLCanvasElement;
} else {
  var CANVAS_DEFAULT_WIDTH = 300;
  var CANVAS_DEFAULT_HEIGHT = 150;
  window.ral = window.ral || {};
  var _createCanvas = ral.createCanvas;

  var _HTMLCanvasElement = function (_HTMLElement) {
    _inherits(_HTMLCanvasElement, _HTMLElement);

    var _super = _createSuper(_HTMLCanvasElement);

    function _HTMLCanvasElement(width, height) {
      var _this;

      _classCallCheck(this, _HTMLCanvasElement);

      _this = _super.call(this, 'CANVAS');
      _this.id = 'glcanvas';
      _this.type = 'canvas';
      _this.top = 0;
      _this.left = 0;

      if (typeof ral.getFeatureProperty("ral.createCanvas", "spec") === "undefined") {
        var canvas = _createCanvas();

        canvas.__proto__.__proto__ = _HTMLCanvasElement.prototype;
        Object.keys(_assertThisInitialized(_this)).forEach(function (key) {
          canvas[key] = this[key];
        }.bind(_assertThisInitialized(_this)));
        canvas.width = width >= 0 ? Math.ceil(width) : CANVAS_DEFAULT_WIDTH;
        canvas.height = height >= 0 ? Math.ceil(height) : CANVAS_DEFAULT_HEIGHT;
        canvas._targetID = _this._targetID;
        canvas._listenerCount = _this._listenerCount;
        canvas._listeners = _this._listeners;
        return _possibleConstructorReturn(_this, canvas);
      } else {
        _this._width = width ? Math.ceil(width) : CANVAS_DEFAULT_WIDTH;
        _this._height = height ? Math.ceil(height) : CANVAS_DEFAULT_HEIGHT;
        _this._context2D = null;
        _this._dataInner = null;
        _this._alignment = _this._width % 2 === 0 ? 8 : 4;
      }

      return _this;
    }

    _createClass(_HTMLCanvasElement, [{
      key: "getContext",
      value: function getContext(name, opts) {
        var self = this;

        if (name === 'webgl' || name === 'experimental-webgl') {
          return window.__gl;
        } else if (name === '2d') {
          if (!this._context2D) {
            this._context2D = new CanvasRenderingContext2D(this.width, this.height);
            this._context2D._innerCanvas = this;
          }

          return this._context2D;
        }

        return null;
      }
    }, {
      key: "_data",
      get: function get() {
        if (this._context2D === null) {
          return null;
        }

        if (!this._dataInner) {
          var data = this._context2D._getData();

          this._dataInner = new _ImageData["default"](data, this.width, this.height);
        }

        return this._dataInner;
      }
    }, {
      key: "clientWidth",
      get: function get() {
        return this.width;
      }
    }, {
      key: "clientHeight",
      get: function get() {
        return this.height;
      }
    }, {
      key: "width",
      set: function set(width) {
        width = parseInt(width);

        if (isNaN(width)) {
          width = CANVAS_DEFAULT_WIDTH;
        } else if (width < 0) {
          width = CANVAS_DEFAULT_WIDTH;
        }

        this._width = width;
        this._alignment = this._width % 2 === 0 ? 8 : 4;

        if (this._context2D) {
          this._context2D._width = width;
        }

        this._dataInner = null;
      },
      get: function get() {
        return this._width;
      }
    }, {
      key: "height",
      set: function set(height) {
        height = parseInt(height);

        if (isNaN(height)) {
          height = CANVAS_DEFAULT_HEIGHT;
        } else if (height < 0) {
          height = CANVAS_DEFAULT_HEIGHT;
        }

        this._height = height;

        if (this._context2D) {
          this._context2D._height = height;
        }

        this._dataInner = null;
      },
      get: function get() {
        return this._height;
      }
    }]);

    return _HTMLCanvasElement;
  }(_HTMLElement2["default"]);

  module.exports = _HTMLCanvasElement;
}

},{"./HTMLElement":18,"./ImageData":28}],18:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Element2 = _interopRequireDefault(require("./Element"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var HTMLElement = function (_Element) {
  _inherits(HTMLElement, _Element);

  var _super = _createSuper(HTMLElement);

  function HTMLElement(tagName) {
    var _this;

    _classCallCheck(this, HTMLElement);

    _this = _super.call(this, tagName);

    _defineProperty(_assertThisInitialized(_this), "className", '');

    _defineProperty(_assertThisInitialized(_this), "childern", []);

    _defineProperty(_assertThisInitialized(_this), "style", {
      width: "".concat(window.innerWidth, "px"),
      height: "".concat(window.innerHeight, "px")
    });

    _defineProperty(_assertThisInitialized(_this), "insertBefore", function () {});

    _defineProperty(_assertThisInitialized(_this), "innerHTML", '');

    return _this;
  }

  _createClass(HTMLElement, [{
    key: "setAttribute",
    value: function setAttribute(name, value) {
      this[name] = value;
    }
  }, {
    key: "getAttribute",
    value: function getAttribute(name) {
      return this[name];
    }
  }, {
    key: "clientWidth",
    get: function get() {
      var ret = parseInt(this.style.fontSize, 10) * this.innerHTML.length;
      return Number.isNaN(ret) ? 0 : ret;
    }
  }, {
    key: "clientHeight",
    get: function get() {
      var ret = parseInt(this.style.fontSize, 10);
      return Number.isNaN(ret) ? 0 : ret;
    }
  }]);

  return HTMLElement;
}(_Element2["default"]);

exports["default"] = HTMLElement;

},{"./Element":9}],19:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var HTMLHeadElement = function (_HTMLElement) {
  _inherits(HTMLHeadElement, _HTMLElement);

  var _super = _createSuper(HTMLHeadElement);

  function HTMLHeadElement(parentNode) {
    var _this;

    _classCallCheck(this, HTMLHeadElement);

    _this = _super.call(this, "HEAD");

    _defineProperty(_assertThisInitialized(_this), "parentNode", null);

    _this.parentNode = parentNode;
    return _this;
  }

  return HTMLHeadElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLHeadElement;

},{"./HTMLElement.js":18}],20:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLHtmlElement = function (_HTMLElement) {
  _inherits(HTMLHtmlElement, _HTMLElement);

  var _super = _createSuper(HTMLHtmlElement);

  function HTMLHtmlElement() {
    _classCallCheck(this, HTMLHtmlElement);

    return _super.call(this, "HTML");
  }

  _createClass(HTMLHtmlElement, [{
    key: "version",
    get: function get() {
      return "";
    }
  }]);

  return HTMLHtmlElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLHtmlElement;

},{"./HTMLElement":18}],21:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

var _Event = _interopRequireDefault(require("./Event"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

if (ral.getFeatureProperty("HTMLImageElement", "spec") === "vivo_platform_support") {
  var HTMLImageElement = window.HTMLImageElement;
  module.exports = HTMLImageElement;
} else {
  window.ral = window.ral || {};
  var _creteImage = ral.createImage;

  var _image;

  var _setter;

  var _getter;

  if (typeof ral.getFeatureProperty("ral.createImage", "spec") === "undefined") {
    _image = _creteImage();

    var _descriptor = Object.getOwnPropertyDescriptor(_image.__proto__, "src");

    _setter = _descriptor.set;
    _getter = _descriptor.get;
  }

  var _HTMLImageElement = function (_HTMLElement) {
    _inherits(_HTMLImageElement, _HTMLElement);

    var _super = _createSuper(_HTMLImageElement);

    function _HTMLImageElement(width, height, isCalledFromImage) {
      var _this;

      _classCallCheck(this, _HTMLImageElement);

      if (!isCalledFromImage) {
        throw new TypeError("Illegal constructor, use 'new Image(w, h); instead!'");
      }

      _this = _super.call(this, 'IMG');
      _this.complete = false;
      _this.crossOrigin = null;
      _this.naturalWidth = 0;
      _this.naturalHeight = 0;
      _this.width = width || 0;
      _this.height = height || 0;

      if (typeof ral.getFeatureProperty("ral.createImage", "spec") === "undefined") {
        var image = _creteImage();

        Object.keys(_assertThisInitialized(_this)).forEach(function (key) {
          image[key] = this[key];
        }.bind(_assertThisInitialized(_this)));

        image._onload = function () {
          this.complete = true;
          this.naturalWidth = this.width;
          this.naturalHeight = this.height;
          this.dispatchEvent(new _Event["default"]("load"));
        }.bind(image);

        image._onerror = function () {
          this.dispatchEvent(new _Event["default"]("error"));
        }.bind(image);

        Object.defineProperty(image, "src", {
          configurable: true,
          enumerable: true,
          get: function get() {
            return _getter.call(this);
          },
          set: function set(value) {
            this.complete = false;
            return _setter.call(this, value);
          }
        });
        return _possibleConstructorReturn(_this, image);
      }

      return _this;
    }

    _createClass(_HTMLImageElement, [{
      key: "getBoundingClientRect",
      value: function getBoundingClientRect() {
        return new DOMRect(0, 0, this.width, this.height);
      }
    }, {
      key: "src",
      set: function set(src) {
        var _this2 = this;

        this._src = src;

        if (src === "") {
          this.width = 0;
          this.height = 0;
          this._data = null;
          this._imageMeta = null;
          this.complete = true;
          this._glFormat = this._glInternalFormat = 0x1908;
          this.crossOrigin = null;
          return;
        }

        ral.loadImageData(src, function (info) {
          if (!info) {
            var _event = new _Event["default"]('error');

            _this2.dispatchEvent(_event);

            return;
          }

          _this2._imageMeta = info;
          _this2.width = _this2.naturalWidth = info.width;
          _this2.height = _this2.naturalHeight = info.height;
          _this2._data = info.data;
          _this2._glFormat = info.glFormat;
          _this2._glInternalFormat = info.glInternalFormat;
          _this2._glType = info.glType;
          _this2._numberOfMipmaps = info.numberOfMipmaps;
          _this2._compressed = info.compressed;
          _this2._bpp = info.bpp;
          _this2._premultiplyAlpha = info.premultiplyAlpha;
          _this2._alignment = 1;

          if ((_this2._numberOfMipmaps == 0 || _this2._numberOfMipmaps == 1) && !_this2._compressed) {
            var bytesPerRow = _this2.width * _this2._bpp / 8;
            if (bytesPerRow % 8 == 0) _this2._alignment = 8;else if (bytesPerRow % 4 == 0) _this2._alignment = 4;else if (bytesPerRow % 2 == 0) _this2._alignment = 2;
          }

          _this2.complete = true;
          var event = new _Event["default"]('load');

          _this2.dispatchEvent(event);
        });
      },
      get: function get() {
        return this._src;
      }
    }, {
      key: "clientWidth",
      get: function get() {
        return this.width;
      }
    }, {
      key: "clientHeight",
      get: function get() {
        return this.height;
      }
    }]);

    return _HTMLImageElement;
  }(_HTMLElement2["default"]);

  module.exports = _HTMLImageElement;
}

},{"./Event":10,"./HTMLElement":18}],22:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

window.ral = window.ral || {};

var HTMLInputElement = function (_HTMLElement) {
  _inherits(HTMLInputElement, _HTMLElement);

  var _super = _createSuper(HTMLInputElement);

  function HTMLInputElement() {
    var _this;

    _classCallCheck(this, HTMLInputElement);

    _this = _super.call(this, "INPUT");

    _defineProperty(_assertThisInitialized(_this), "defaultValue", null);

    _defineProperty(_assertThisInitialized(_this), "value", null);

    return _this;
  }

  _createClass(HTMLInputElement, [{
    key: "focus",
    value: function focus() {
      _get(_getPrototypeOf(HTMLInputElement.prototype), "focus", this).call(this);

      var that = this;

      var onKeyboardInput = function onKeyboardInput(res) {
        var str = res ? res.value : "";
        that.value = str;
      };

      var onKeyboardConfirm = function onKeyboardConfirm(res) {
        var str = res ? res.value : "";
        that.value = str;
        ral.offKeyboardConfirm(onKeyboardConfirm);
        ral.offKeyboardInput(onKeyboardInput);
        ral.hideKeyboard({});
      };

      ral.offKeyboardInput(onKeyboardInput);
      ral.offKeyboardConfirm(onKeyboardConfirm);
      ral.showKeyboard({
        defaultValue: this.defaultValue,
        fail: function fail(res) {
          console.error(res);
        }
      });
      ral.onKeyboardInput(onKeyboardInput);
      ral.onKeyboardConfirm(onKeyboardConfirm);
    }
  }, {
    key: "blur",
    value: function blur() {
      _get(_getPrototypeOf(HTMLInputElement.prototype), "blur", this).call(this);

      ral.hideKeyboard({});
    }
  }]);

  return HTMLInputElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLInputElement;

},{"./HTMLElement":18}],23:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

var _MediaError = _interopRequireDefault(require("./MediaError"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var HTMLMediaElement = function (_HTMLElement) {
  _inherits(HTMLMediaElement, _HTMLElement);

  var _super = _createSuper(HTMLMediaElement);

  _createClass(HTMLMediaElement, null, [{
    key: "NETWORK_EMPTY",
    get: function get() {
      return 0;
    }
  }, {
    key: "NETWORK_IDLE",
    get: function get() {
      return 1;
    }
  }, {
    key: "NETWORK_LOADING",
    get: function get() {
      return 2;
    }
  }, {
    key: "NETWORK_NO_SOURCE",
    get: function get() {
      return 3;
    }
  }, {
    key: "HAVE_NOTHING",
    get: function get() {
      return 0;
    }
  }, {
    key: "HAVE_METADATA",
    get: function get() {
      return 1;
    }
  }, {
    key: "HAVE_CURRENT_DATA",
    get: function get() {
      return 2;
    }
  }, {
    key: "HAVE_FUTURE_DATA",
    get: function get() {
      return 3;
    }
  }, {
    key: "HAVE_ENOUGH_DATA",
    get: function get() {
      return 4;
    }
  }]);

  function HTMLMediaElement(url, type) {
    var _this;

    _classCallCheck(this, HTMLMediaElement);

    _this = _super.call(this, type);

    _defineProperty(_assertThisInitialized(_this), "audioTracks", undefined);

    _defineProperty(_assertThisInitialized(_this), "autoplay", false);

    _defineProperty(_assertThisInitialized(_this), "controller", null);

    _defineProperty(_assertThisInitialized(_this), "controls", false);

    _defineProperty(_assertThisInitialized(_this), "crossOrigin", null);

    _defineProperty(_assertThisInitialized(_this), "defaultMuted", false);

    _defineProperty(_assertThisInitialized(_this), "defaultPlaybackRate", 1.0);

    _defineProperty(_assertThisInitialized(_this), "mediaGroup", undefined);

    _defineProperty(_assertThisInitialized(_this), "mediaKeys", null);

    _defineProperty(_assertThisInitialized(_this), "mozAudioChannelType", undefined);

    _defineProperty(_assertThisInitialized(_this), "muted", false);

    _defineProperty(_assertThisInitialized(_this), "networkState", HTMLMediaElement.NETWORK_EMPTY);

    _defineProperty(_assertThisInitialized(_this), "playbackRate", 1);

    _defineProperty(_assertThisInitialized(_this), "preload", "auto");

    _defineProperty(_assertThisInitialized(_this), "loop", false);

    Object.assign(_WeakMap["default"].get(_assertThisInitialized(_this)), {
      buffered: undefined,
      currentSrc: url || "",
      duration: 0,
      ended: false,
      error: null,
      initialTime: 0,
      paused: true,
      readyState: HTMLMediaElement.HAVE_NOTHING,
      volume: 1.0,
      currentTime: 0
    });

    _this.addEventListener("ended", function () {
      _WeakMap["default"].get(this).ended = true;
    });

    _this.addEventListener("play", function () {
      _WeakMap["default"].get(this).ended = false;
      _WeakMap["default"].get(this).error = null;
      _WeakMap["default"].get(this).paused = false;
    });

    _this.addEventListener("error", function () {
      _WeakMap["default"].get(this).error = true;
      _WeakMap["default"].get(this).ended = true;
      _WeakMap["default"].get(this).paused = false;
    });

    return _this;
  }

  _createClass(HTMLMediaElement, [{
    key: "canPlayType",
    value: function canPlayType(mediaType) {
      return 'maybe';
    }
  }, {
    key: "captureStream",
    value: function captureStream() {}
  }, {
    key: "fastSeek",
    value: function fastSeek() {}
  }, {
    key: "load",
    value: function load() {}
  }, {
    key: "pause",
    value: function pause() {}
  }, {
    key: "play",
    value: function play() {}
  }, {
    key: "currentTime",
    get: function get() {
      return _WeakMap["default"].get(this).currentTime;
    },
    set: function set(value) {
      _WeakMap["default"].get(this).currentTime = value;
    }
  }, {
    key: "src",
    get: function get() {
      return _WeakMap["default"].get(this).currentSrc;
    },
    set: function set(value) {
      _WeakMap["default"].get(this).currentSrc = value;
    }
  }, {
    key: "buffered",
    get: function get() {
      return _WeakMap["default"].get(this).buffered;
    }
  }, {
    key: "currentSrc",
    get: function get() {
      return _WeakMap["default"].get(this).currentSrc;
    }
  }, {
    key: "duration",
    get: function get() {
      return _WeakMap["default"].get(this).duration;
    }
  }, {
    key: "ended",
    get: function get() {
      return _WeakMap["default"].get(this).ended;
    }
  }, {
    key: "error",
    get: function get() {
      return _WeakMap["default"].get(this).error;
    }
  }, {
    key: "initialTime",
    get: function get() {
      return _WeakMap["default"].get(this).initialTime;
    }
  }, {
    key: "paused",
    get: function get() {
      return _WeakMap["default"].get(this).paused;
    }
  }, {
    key: "volume",
    get: function get() {
      return _WeakMap["default"].get(this).volume;
    },
    set: function set(value) {
      _WeakMap["default"].get(this).volume = value;
    }
  }]);

  return HTMLMediaElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLMediaElement;

},{"./HTMLElement":18,"./MediaError":30,"./util/WeakMap":56}],24:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

var _Event = _interopRequireDefault(require("./Event"));

var _FileCache = _interopRequireDefault(require("./util/FileCache"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _BASE64_NAME = "data:application/javascript;base64,";
var _URI_NAME = "data:application/javascript,";

var _getPathFromBase64String = function _getPathFromBase64String(src) {
  if (src === null || src === undefined) {
    return src;
  }

  if (src.startsWith(_BASE64_NAME)) {
    var content = src.substring(_BASE64_NAME.length);
    var source = window.atob(content);
    var len = source.length;

    if (len > 0) {
      return _getDiskPathFromArrayBuffer(source, len);
    } else {
      return src;
    }
  } else if (src.startsWith(_URI_NAME)) {
    var _content = src.substring(_URI_NAME.length);

    var _source = decodeURIComponent(_content);

    var _len = _source.length;

    if (_len > 0) {
      return _getDiskPathFromArrayBuffer(_source, _len);
    } else {
      return src;
    }
  } else {
    return src;
  }
};

function _getDiskPathFromArrayBuffer(source, len) {
  var arrayBuffer = new ArrayBuffer(len);
  var uint8Array = new Uint8Array(arrayBuffer);

  for (var i = 0; i < len; i++) {
    uint8Array[i] = source.charCodeAt(i);
  }

  return _FileCache["default"].getCache(arrayBuffer);
}

var HTMLScriptElement = function (_HTMLElement) {
  _inherits(HTMLScriptElement, _HTMLElement);

  var _super = _createSuper(HTMLScriptElement);

  function HTMLScriptElement() {
    var _this;

    _classCallCheck(this, HTMLScriptElement);

    _this = _super.call(this, 'SCRIPT');

    _defineProperty(_assertThisInitialized(_this), "noModule", false);

    var self = _assertThisInitialized(_this);

    var onAppend = function onAppend() {
      self.removeEventListener("append", onAppend);

      var src = _getPathFromBase64String(self.src);

      require(src);

      self.dispatchEvent(new _Event["default"]('load'));
    };

    _this.addEventListener("append", onAppend);

    return _this;
  }

  return HTMLScriptElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLScriptElement;
Object.defineProperty(HTMLScriptElement.prototype, "noModule", {
  get: function get() {
    throw new TypeError(message, "Illegal invocation");
  },
  set: function set(value) {
    throw new TypeError(message, "Illegal invocation");
  }
});

},{"./Event":10,"./HTMLElement":18,"./util/FileCache":55}],25:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _FontFace = _interopRequireDefault(require("./FontFace"));

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLStyleElement = function (_HTMLElement) {
  _inherits(HTMLStyleElement, _HTMLElement);

  var _super = _createSuper(HTMLStyleElement);

  function HTMLStyleElement() {
    var _this;

    _classCallCheck(this, HTMLStyleElement);

    _this = _super.call(this, "STYLE");

    var self = _assertThisInitialized(_this);

    var onAppend = function onAppend() {
      self.removeEventListener("append", onAppend);
      var textContent = self.textContent || self.innerHTML || "";
      var fontFaceStr = "";
      var start = 0;
      var length = textContent.length;
      var flag = 0;

      for (var index = 0; index < length; ++index) {
        if (start > 0) {
          if (textContent[index] === "{") {
            flag++;
          } else if (textContent[index] === "}") {
            flag--;

            if (flag === 0) {
              fontFaceStr = textContent.substring(start, index + 1);
              break;
            } else if (flag < 0) {
              break;
            }
          }
        } else {
          if (textContent[index] === "@" && textContent.substr(index, "@font-face".length) === "@font-face") {
            index += 9;
            start = index + 1;
          }
        }
      }

      if (fontFaceStr) {
        var fontFamily;
        var _length = fontFaceStr.length;

        var _start = fontFaceStr.indexOf("font-family");

        if (_start === -1) {
          return;
        }

        _start += "font-family".length + 1;
        var end = _start;

        for (; end < _length; ++end) {
          if (fontFaceStr[end] === ";") {
            fontFamily = fontFaceStr.substring(_start, end).trim();
            break;
          } else if (fontFaceStr[end] === ":") {
            _start = end + 1;
          }
        }

        if (!fontFamily) {
          return;
        }

        end = fontFaceStr.indexOf("url(");
        _start = 0;
        var source;

        for (; end < _length; ++end) {
          if (fontFaceStr[end] === "'" || fontFaceStr[end] === '"') {
            if (_start > 0) {
              source = fontFaceStr.substring(_start, end).trim();
              break;
            }

            _start = end + 1;
          }
        }

        if (source) {
          var fontFace = new _FontFace["default"](fontFamily, source);
          fontFace.load();
          document.fonts.add(fontFace);
        }
      }
    };

    _this.addEventListener("append", onAppend);

    return _this;
  }

  return HTMLStyleElement;
}(_HTMLElement2["default"]);

exports["default"] = HTMLStyleElement;

},{"./FontFace":12,"./HTMLElement":18}],26:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLMediaElement2 = _interopRequireDefault(require("./HTMLMediaElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLVideoElement = function (_HTMLMediaElement) {
  _inherits(HTMLVideoElement, _HTMLMediaElement);

  var _super = _createSuper(HTMLVideoElement);

  function HTMLVideoElement() {
    _classCallCheck(this, HTMLVideoElement);

    return _super.call(this, 'VIDEO');
  }

  _createClass(HTMLVideoElement, [{
    key: "canPlayType",
    value: function canPlayType(type) {
      return type === 'video/mp4';
    }
  }]);

  return HTMLVideoElement;
}(_HTMLMediaElement2["default"]);

exports["default"] = HTMLVideoElement;

},{"./HTMLMediaElement":23}],27:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _HTMLImageElement2 = _interopRequireDefault(require("./HTMLImageElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

if (ral.getFeatureProperty("Image", "spec") === "vivo_platform_support") {
  var Image = window.Image;
  module.exports = Image;
} else {
  var _Image = window.Image;

  var _Image2 = function (_HTMLImageElement) {
    _inherits(_Image2, _HTMLImageElement);

    var _super = _createSuper(_Image2);

    function _Image2(width, height) {
      _classCallCheck(this, _Image2);

      return _super.call(this, width, height, true);
    }

    return _Image2;
  }(_HTMLImageElement2["default"]);

  var _creteImage = ral.createImage;

  if (_creteImage) {
    _Image.prototype.__proto__ = _Image2.prototype;
  }

  module.exports = _Image2;
}

},{"./HTMLImageElement":21}],28:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ImageData = function () {
  function ImageData(array, width, height) {
    _classCallCheck(this, ImageData);

    if (typeof array === 'number' && typeof width == 'number') {
      height = width;
      width = array;
      array = null;
    }

    if (array === null) {
      this._data = new Uint8ClampedArray(width * height * 4);
    } else {
      this._data = array;
    }

    this._width = width;
    this._height = height;
  }

  _createClass(ImageData, [{
    key: "data",
    get: function get() {
      return this._data;
    }
  }, {
    key: "width",
    get: function get() {
      return this._width;
    }
  }, {
    key: "height",
    get: function get() {
      return this._height;
    }
  }]);

  return ImageData;
}();

module.exports = ImageData;

},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Location = function () {
  function Location() {
    _classCallCheck(this, Location);

    _defineProperty(this, "ancestorOrigins", "");

    _defineProperty(this, "hash", "");

    _defineProperty(this, "host", "");

    _defineProperty(this, "hostname", "");

    _defineProperty(this, "href", "");

    _defineProperty(this, "origin", "");

    _defineProperty(this, "password", "");

    _defineProperty(this, "pathname", "");

    _defineProperty(this, "port", "");

    _defineProperty(this, "protocol", "");

    _defineProperty(this, "search", "");

    _defineProperty(this, "username", "");
  }

  _createClass(Location, [{
    key: "assign",
    value: function assign() {}
  }, {
    key: "reload",
    value: function reload() {}
  }, {
    key: "replace",
    value: function replace() {}
  }, {
    key: "toString",
    value: function toString() {
      return "";
    }
  }]);

  return Location;
}();

exports["default"] = Location;

},{}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var MEDIA_ERR_ABORTED = 1;
var MEDIA_ERR_NETWORK = 2;
var MEDIA_ERR_DECODE = 3;
var MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

var MediaError = function () {
  function MediaError() {
    _classCallCheck(this, MediaError);
  }

  _createClass(MediaError, [{
    key: "code",
    get: function get() {
      return MEDIA_ERR_ABORTED;
    }
  }, {
    key: "message",
    get: function get() {
      return "";
    }
  }]);

  return MediaError;
}();

exports["default"] = MediaError;
module.exports = MediaError;

},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Navigator = function Navigator(platform, language) {
  _classCallCheck(this, Navigator);

  _defineProperty(this, "platform", "");

  _defineProperty(this, "language", "");

  _defineProperty(this, "appVersion", '5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1');

  _defineProperty(this, "userAgent", 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Mobile/14E8301 NetType/WIFI Language/zh_CN');

  _defineProperty(this, "onLine", true);

  _defineProperty(this, "maxTouchPoints", 10);

  _defineProperty(this, "geolocation", {
    getCurrentPosition: function getCurrentPosition() {},
    watchPosition: function watchPosition() {},
    clearWatch: function clearWatch() {}
  });

  this.platform = platform;
  this.language = language;
};

exports["default"] = Navigator;

},{}],32:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("./EventTarget"));

var _Event = _interopRequireDefault(require("./Event"));

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Node = function (_EventTarget) {
  _inherits(Node, _EventTarget);

  var _super = _createSuper(Node);

  function Node(nodeName) {
    var _this;

    _classCallCheck(this, Node);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "childNodes", []);

    _defineProperty(_assertThisInitialized(_this), "parentNode", null);

    _defineProperty(_assertThisInitialized(_this), "_nodeName", "");

    _this._nodeName = nodeName;
    return _this;
  }

  _createClass(Node, [{
    key: "appendChild",
    value: function appendChild(node) {
      this.childNodes && this.childNodes.push(node);
      node.parentNode = this;
      var nodeName = node.nodeName;

      if (nodeName === "SCRIPT" || nodeName === "STYLE") {
        node.dispatchEvent(new _Event["default"]("append"));
      }

      return node;
    }
  }, {
    key: "cloneNode",
    value: function cloneNode() {
      var copyNode = Object.create(this);
      Object.assign(copyNode, this);
      copyNode.parentNode = null;

      var privateThis = _WeakMap["default"].get(this);

      _WeakMap["default"].set(copyNode, privateThis ? Object.create(privateThis) : {});

      return copyNode;
    }
  }, {
    key: "removeChild",
    value: function removeChild(node) {
      var index = this.childNodes && this.childNodes.findIndex(function (child) {
        return child === node;
      });

      if (index > -1) {
        var _node = this.childNodes && this.childNodes.splice(index, 1)[0];

        _node.parentNode = null;
        return _node;
      }

      return null;
    }
  }, {
    key: "contains",
    value: function contains(node) {
      return this.childNodes && this.childNodes.indexOf(node) > -1;
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent() {
      var result = true;
      var length = this.childNodes ? this.childNodes.length : 0;

      for (var index = length - 1; result && index >= 0; --index) {
        var _this$childNodes$inde;

        result = (_this$childNodes$inde = this.childNodes[index]).dispatchEvent.apply(_this$childNodes$inde, arguments);
      }

      if (result) {
        return _get(_getPrototypeOf(Node.prototype), "dispatchEvent", this).apply(this, arguments);
      }

      return false;
    }
  }, {
    key: "nodeName",
    get: function get() {
      return this._nodeName;
    }
  }]);

  return Node;
}(_EventTarget2["default"]);

exports["default"] = Node;

},{"./Event":10,"./EventTarget":11,"./util/WeakMap":56}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _WeakMap = _interopRequireDefault(require("./util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var NodeList = function () {
  function NodeList() {
    _classCallCheck(this, NodeList);

    _WeakMap["default"].set(this, {
      array: []
    });

    return new Proxy(this, {
      get: function get(target, key) {
        if (_typeof(key) === "symbol") {
          return function () {
            return "";
          };
        }

        if (/^[0-9]*$/.test(key)) {
          return _WeakMap["default"].get(target).array[key];
        }

        var result = target[key];

        if (typeof result === "function") {
          result = result.bind(target);
        }

        return result;
      }
    });
  }

  _createClass(NodeList, [{
    key: "push",
    value: function push(element) {
      _WeakMap["default"].get(this).array.push(element);
    }
  }, {
    key: "item",
    value: function item(index) {
      return _WeakMap["default"].get(this).array[index];
    }
  }, {
    key: "concat",
    value: function concat() {
      var array = _WeakMap["default"].get(this).array;

      return array.concat.apply(array, arguments);
    }
  }, {
    key: "length",
    get: function get() {
      return _WeakMap["default"].get(this).array.length;
    }
  }]);

  return NodeList;
}();

exports["default"] = NodeList;

},{"./util/WeakMap":56}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ScreenOrientation = _interopRequireDefault(require("./ScreenOrientation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Screen = function () {
  function Screen() {
    _classCallCheck(this, Screen);

    _defineProperty(this, "availTop", 0);

    _defineProperty(this, "availLeft", 0);

    _defineProperty(this, "availHeight", window.innerHeight);

    _defineProperty(this, "availWidth", window.innerWidth);

    _defineProperty(this, "colorDepth", 8);

    _defineProperty(this, "pixelDepth", 0);

    _defineProperty(this, "left", 0);

    _defineProperty(this, "top", 0);

    _defineProperty(this, "width", window.innerWidth);

    _defineProperty(this, "height", window.innerHeight);

    _defineProperty(this, "orientation", new _ScreenOrientation["default"]());
  }

  _createClass(Screen, [{
    key: "onorientationchange",
    value: function onorientationchange() {}
  }]);

  return Screen;
}();

exports["default"] = Screen;

},{"./ScreenOrientation":35}],35:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("./EventTarget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ScreenOrientation = function (_EventTarget) {
  _inherits(ScreenOrientation, _EventTarget);

  var _super = _createSuper(ScreenOrientation);

  function ScreenOrientation() {
    var _this;

    _classCallCheck(this, ScreenOrientation);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "_type", "portrait-primary");

    _defineProperty(_assertThisInitialized(_this), "_angle", 0);

    _defineProperty(_assertThisInitialized(_this), "_isLocked", false);

    return _this;
  }

  _createClass(ScreenOrientation, [{
    key: "onchange",
    value: function onchange(event) {}
  }, {
    key: "lock",
    value: function lock(orientation) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2._isLocked) {
          reject(new Error("Screen orientation is already locked"));
          return;
        }

        _this2._isLocked = true;
        resolve();
      });
    }
  }, {
    key: "unlock",
    value: function unlock() {
      this._isLocked = false;
    }
  }, {
    key: "type",
    get: function get() {
      return this._type;
    }
  }, {
    key: "angle",
    get: function get() {
      return this._angle;
    }
  }]);

  return ScreenOrientation;
}(_EventTarget2["default"]);

exports["default"] = ScreenOrientation;

},{"./EventTarget":11}],36:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Event2 = _interopRequireDefault(require("./Event"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var TouchEvent = function (_Event) {
  _inherits(TouchEvent, _Event);

  var _super = _createSuper(TouchEvent);

  function TouchEvent(type) {
    var _this;

    _classCallCheck(this, TouchEvent);

    _this = _super.call(this, type);
    _this.touches = [];
    _this.targetTouches = [];
    _this.changedTouches = [];
    return _this;
  }

  return TouchEvent;
}(_Event2["default"]);

exports["default"] = TouchEvent;

},{"./Event":10}],37:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Event = _interopRequireDefault(require("./Event"));

var _FileCache = _interopRequireDefault(require("./util/FileCache"));

var _XMLHttpRequestEventTarget = _interopRequireDefault(require("./XMLHttpRequestEventTarget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var fsm = ral.getFileSystemManager();
var _XMLHttpRequest = window.XMLHttpRequest;
window.ral = window.ral || {};

var XMLHttpRequest = function (_XMLHttpRequestEventT) {
  _inherits(XMLHttpRequest, _XMLHttpRequestEventT);

  var _super = _createSuper(XMLHttpRequest);

  function XMLHttpRequest() {
    var _this;

    _classCallCheck(this, XMLHttpRequest);

    _this = _super.call(this, new _XMLHttpRequest());

    _defineProperty(_assertThisInitialized(_this), "_isLocal", false);

    _defineProperty(_assertThisInitialized(_this), "_readyState", 0);

    _defineProperty(_assertThisInitialized(_this), "_response", void 0);

    _defineProperty(_assertThisInitialized(_this), "_responseText", void 0);

    _defineProperty(_assertThisInitialized(_this), "_responseURL", void 0);

    _defineProperty(_assertThisInitialized(_this), "_responseXML", void 0);

    _defineProperty(_assertThisInitialized(_this), "_status", void 0);

    _defineProperty(_assertThisInitialized(_this), "_statusText", void 0);

    _defineProperty(_assertThisInitialized(_this), "_responseType", void 0);

    var xhr = _this._xhr;

    xhr.onreadystatechange = function (e) {
      var event = new _Event["default"]("readystatechange");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    return _this;
  }

  _createClass(XMLHttpRequest, [{
    key: "abort",
    value: function abort() {
      this._xhr.abort();
    }
  }, {
    key: "getAllResponseHeaders",
    value: function getAllResponseHeaders() {
      return this._xhr.getAllResponseHeaders();
    }
  }, {
    key: "getResponseHeader",
    value: function getResponseHeader(name) {
      return this._xhr.getResponseHeader(name);
    }
  }, {
    key: "open",
    value: function open(method, url, async, user, password) {
      if (typeof url === "string") {
        var _url = url.toLocaleString();

        if (_url.startsWith("http://") || _url.startsWith("https://")) {
          var _this$_xhr;

          this._isLocal = false;
          return (_this$_xhr = this._xhr).open.apply(_this$_xhr, arguments);
        }
      }

      this._isLocal = true;
      this._url = url;

      if (this._readyState != 1) {
        this._readyState = 1;
        this.dispatchEvent(new _Event["default"]("readystatechange"));
      }
    }
  }, {
    key: "overrideMimeType",
    value: function overrideMimeType() {
      var _this$_xhr2;

      return (_this$_xhr2 = this._xhr).overrideMimeType.apply(_this$_xhr2, arguments);
    }
  }, {
    key: "send",
    value: function send() {
      if (this.readyState !== 1) {
        throw "Uncaught DOMException: Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.";
      }

      if (this._isLocal) {
        var self = this;
        var isBinary = this._xhr.responseType === "arraybuffer";
        this._readyState = 2;
        this.dispatchEvent(new _Event["default"]("readystatechange"));
        fsm.readFile({
          filePath: this._url,
          encoding: isBinary ? "binary" : "utf8",
          success: function success(res) {
            self._status = 200;
            self._response = self._responseText = res.data;

            if (isBinary) {
              _FileCache["default"].setCache(self._url, res.data);
            }

            var eventProgressStart = new _Event["default"]("progress");
            eventProgressStart.loaded = 0;
            eventProgressStart.total = isBinary ? res.data.byteLength : res.data.length;
            var eventProgressEnd = new _Event["default"]("progress");
            eventProgressEnd.loaded = eventProgressStart.total;
            eventProgressEnd.total = eventProgressStart.total;
            self.dispatchEvent(new _Event["default"]("loadstart"));
            self.dispatchEvent(eventProgressStart);
            self.dispatchEvent(eventProgressEnd);
            self.dispatchEvent(new _Event["default"]("load"));
          },
          fail: function (res) {
            if (res.errCode === 1) {
              self._status = 404;
              self.dispatchEvent(new _Event["default"]("loadstart"));
              self.dispatchEvent(new _Event["default"]("load"));
            } else {
              this.dispatchEvent(new _Event["default"]("error"));
            }
          }.bind(this),
          complete: function () {
            this._readyState = 4;
            this.dispatchEvent(new _Event["default"]("readystatechange"));
            this.dispatchEvent(new _Event["default"]("loadend"));
          }.bind(this)
        });
      } else {
        var _this$_xhr3;

        (_this$_xhr3 = this._xhr).send.apply(_this$_xhr3, arguments);
      }
    }
  }, {
    key: "setRequestHeader",
    value: function setRequestHeader() {
      var _this$_xhr4;

      (_this$_xhr4 = this._xhr).setRequestHeader.apply(_this$_xhr4, arguments);
    }
  }, {
    key: "readyState",
    get: function get() {
      if (this._isLocal) {
        return this._readyState;
      } else {
        return this._xhr.readyState;
      }
    }
  }, {
    key: "response",
    get: function get() {
      var response = this._isLocal ? this._response : this._xhr.response;
      var result = this._responseType === "blob" ? new Blob([response]) : response;
      return result;
    }
  }, {
    key: "responseText",
    get: function get() {
      if (this._isLocal) {
        return this._responseText;
      } else {
        return this._xhr.responseText;
      }
    }
  }, {
    key: "responseType",
    get: function get() {
      return this._responseType;
    },
    set: function set(value) {
      this._responseType = this._xhr.responseType = value;

      if (value === "blob") {
        this._xhr.responseType = "arraybuffer";
      }
    }
  }, {
    key: "responseURL",
    get: function get() {
      if (this._isLocal) {
        return this._responseURL;
      } else {
        return this._xhr.responseURL;
      }
    }
  }, {
    key: "responseXML",
    get: function get() {
      if (this._isLocal) {
        return this._responseXML;
      } else {
        return this._xhr.responseXML;
      }
    }
  }, {
    key: "status",
    get: function get() {
      if (this._isLocal) {
        return this._status;
      } else {
        return this._xhr.status;
      }
    }
  }, {
    key: "statusText",
    get: function get() {
      if (this._isLocal) {
        return this._statusText;
      } else {
        return this._xhr.statusText;
      }
    }
  }, {
    key: "timeout",
    get: function get() {
      return this._xhr.timeout;
    },
    set: function set(value) {
      this._xhr.timeout = value;
    }
  }, {
    key: "upload",
    get: function get() {
      return this._xhr.upload;
    }
  }, {
    key: "withCredentials",
    set: function set(value) {
      this._xhr.withCredentials = value;
    },
    get: function get() {
      return this._xhr.withCredentials;
    }
  }]);

  return XMLHttpRequest;
}(_XMLHttpRequestEventTarget["default"]);

exports["default"] = XMLHttpRequest;

},{"./Event":10,"./XMLHttpRequestEventTarget":38,"./util/FileCache":55}],38:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("./EventTarget"));

var _Event = _interopRequireDefault(require("./Event"));

var _FileCache = _interopRequireDefault(require("./util/FileCache"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var XMLHttpRequestEventTarget = function (_EventTarget) {
  _inherits(XMLHttpRequestEventTarget, _EventTarget);

  var _super = _createSuper(XMLHttpRequestEventTarget);

  function XMLHttpRequestEventTarget(xhr) {
    var _this;

    _classCallCheck(this, XMLHttpRequestEventTarget);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "_xhr", void 0);

    _this._xhr = xhr;

    xhr.onabort = function (e) {
      var event = new _Event["default"]("abort");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    xhr.onerror = function (e) {
      var event = new _Event["default"]("error");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    xhr.onload = function (e) {
      if (this.response instanceof ArrayBuffer) {
        _FileCache["default"].setItem(this.response, this._url);
      }

      var event = new _Event["default"]("load");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    xhr.onloadstart = function (e) {
      var event = new _Event["default"]("loadstart");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    xhr.onprogress = function (e) {
      var event = new _Event["default"]("progress");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    xhr.ontimeout = function (e) {
      var event = new _Event["default"]("timeout");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    xhr.onloadend = function (e) {
      var event = new _Event["default"]("loadend");
      this.dispatchEvent(Object.assign(event, e));
    }.bind(_assertThisInitialized(_this));

    return _this;
  }

  return XMLHttpRequestEventTarget;
}(_EventTarget2["default"]);

exports["default"] = XMLHttpRequestEventTarget;

},{"./Event":10,"./EventTarget":11,"./util/FileCache":55}],39:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var AnalyserNode = function (_AudioNode) {
  _inherits(AnalyserNode, _AudioNode);

  var _super = _createSuper(AnalyserNode);

  function AnalyserNode(context, options) {
    var _this;

    _classCallCheck(this, AnalyserNode);

    _this = _super.call(this, context);
    _this._fftSize;
    _this.frequencyBinCount;
    _this.minDecibels;
    _this.maxDecibels;
    _this.smoothingTimeConstant;
    return _this;
  }

  _createClass(AnalyserNode, [{
    key: "getFloatFrequencyData",
    value: function getFloatFrequencyData(array) {}
  }, {
    key: "getByteFrequencyData",
    value: function getByteFrequencyData(dataArray) {
      return new Uint8Array(dataArray.length);
    }
  }, {
    key: "getFloatTimeDomainData",
    value: function getFloatTimeDomainData(dataArray) {}
  }, {
    key: "getByteTimeDomainData",
    value: function getByteTimeDomainData(dataArray) {}
  }, {
    key: "fftSize",
    set: function set(value) {
      this._fftSize = value;
      this.frequencyBinCount = value / 2;
    },
    get: function get() {
      return this._fftSize;
    }
  }]);

  return AnalyserNode;
}(_AudioNode2["default"]);

var _default = AnalyserNode;
exports["default"] = _default;

},{"./AudioNode":45}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _FileCache = _interopRequireDefault(require("../util/FileCache"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AudioBuffer = function () {
  function AudioBuffer(context, buffer, callback) {
    _classCallCheck(this, AudioBuffer);

    this.context = context;
    this.url = "";
    this._sampleRate = 48000;
    this._length = 386681;
    this._duration = 0;
    this._numberOfChannels = 48000;

    _FileCache["default"].getPath(buffer, function (url) {
      if (!url) {
        return;
      }

      this.url = url;
      var innerAudioContext = ral.createInnerAudioContext();
      innerAudioContext.src = url;
      innerAudioContext.onCanplay(function () {
        this.audioBuffer._duration = this.innerAudioContext.duration;
        this.innerAudioContext.destroy();
        callback(this.audioBuffer);
      }.bind({
        audioBuffer: this,
        innerAudioContext: innerAudioContext
      }));
    }.bind(this));
  }

  _createClass(AudioBuffer, [{
    key: "sampleRate",
    get: function get() {
      return this._sampleRate;
    }
  }, {
    key: "length",
    get: function get() {
      return this._length;
    }
  }, {
    key: "duration",
    get: function get() {
      return this._duration;
    }
  }, {
    key: "numberOfChannels",
    get: function get() {
      return this._numberOfChannels;
    }
  }]);

  return AudioBuffer;
}();

var _default = AudioBuffer;
exports["default"] = _default;

},{"../util/FileCache":55}],41:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

var _AudioParam = _interopRequireDefault(require("./AudioParam"));

var _WeakMap = _interopRequireDefault(require("../util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var _destroy = function _destroy() {
  var innerAudioContext = _WeakMap["default"].get(this.sourceNode).innerAudioContext;

  if (innerAudioContext !== null) {
    innerAudioContext.destroy();

    var audioBufferSourceNodeArray = _WeakMap["default"].get(this.audioContext).audioBufferSourceNodeArray;

    var length = audioBufferSourceNodeArray.length;

    for (var i = 0; i < length; ++i) {
      if (_WeakMap["default"].get(audioBufferSourceNodeArray[i]).innerAudioContext == innerAudioContext) {
        audioBufferSourceNodeArray.splice(i, 1);
        break;
      }
    }

    _WeakMap["default"].get(this.sourceNode).innerAudioContext = null;
  }
};

var AudioBufferSourceNode = function (_AudioNode) {
  _inherits(AudioBufferSourceNode, _AudioNode);

  var _super = _createSuper(AudioBufferSourceNode);

  function AudioBufferSourceNode(context, options) {
    var _this;

    _classCallCheck(this, AudioBufferSourceNode);

    _this = _super.call(this, context);
    _this.buffer = null;
    _this.detune = new _AudioParam["default"]({
      value: 0
    });
    _this._loop = false;
    _this.loopStart = 0;
    _this.loopEnd = 0;
    _this._playbackRate = new _AudioParam["default"]({
      value: 1.0
    });
    var innerAudioContext = ral.createInnerAudioContext();
    _WeakMap["default"].get(_assertThisInitialized(_this)).innerAudioContext = innerAudioContext;
    innerAudioContext.onEnded(_destroy.bind({
      sourceNode: _assertThisInitialized(_this),
      audioContext: context
    }));
    innerAudioContext.onStop(_destroy.bind({
      sourceNode: _assertThisInitialized(_this),
      audioContext: context
    }));
    return _this;
  }

  _createClass(AudioBufferSourceNode, [{
    key: "start",
    value: function start(when, offset, duration) {
      if (this.buffer) {
        var innerAudioContext = _WeakMap["default"].get(this).innerAudioContext;

        if (innerAudioContext === null) {
          return;
        }

        if (!offset || typeof offset !== 'number' || offset <= 0) {
          innerAudioContext.startTime = 0;
        } else {
          innerAudioContext.startTime = offset;
        }

        innerAudioContext.src = this.buffer.url;

        if (!when || typeof when !== 'number' || when <= 0) {
          innerAudioContext.play();
        } else {
          setTimeout(function () {
            var audioContext = _WeakMap["default"].get(this).innerAudioContext;

            if (audioContext !== null) {
              audioContext.play();
            }
          }.bind(this), when * 1000);
        }
      }
    }
  }, {
    key: "stop",
    value: function stop(when) {
      var innerAudioContext = _WeakMap["default"].get(this).innerAudioContext;

      if (innerAudioContext === null) {
        return;
      }

      if (!when || typeof when !== 'number' || when <= 0) {
        innerAudioContext.stop();
      } else {
        setTimeout(function () {
          var audioContext = _WeakMap["default"].get(this).innerAudioContext;

          if (audioContext !== null) {
            audioContext.stop();
          }
        }.bind(this), when * 1000);
      }
    }
  }, {
    key: "onended",
    value: function onended() {}
  }, {
    key: "playbackRate",
    set: function set(value) {
      console.warn("playbackRate nonsupport");
      this._playbackRate = value;
    },
    get: function get() {
      return this._playbackRate;
    }
  }, {
    key: "loop",
    set: function set(value) {
      var innerAudioContext = _WeakMap["default"].get(this).innerAudioContext;

      if (innerAudioContext === null) {
        return;
      }

      this._loop = value;
      innerAudioContext.loop = value;
    },
    get: function get() {
      return this._loop;
    }
  }]);

  return AudioBufferSourceNode;
}(_AudioNode2["default"]);

var _default = AudioBufferSourceNode;
exports["default"] = _default;

},{"../util/WeakMap":56,"./AudioNode":45,"./AudioParam":46}],42:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _BaseAudioContext2 = _interopRequireDefault(require("./BaseAudioContext"));

var _MediaElementAudioSourceNode = _interopRequireDefault(require("./MediaElementAudioSourceNode"));

var _WeakMap = _interopRequireDefault(require("../util/WeakMap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var AudioContext = function (_BaseAudioContext) {
  _inherits(AudioContext, _BaseAudioContext);

  var _super = _createSuper(AudioContext);

  function AudioContext(options) {
    var _this;

    _classCallCheck(this, AudioContext);

    _this = _super.call(this);
    _this.baseLatency;
    _this.outputLatency;
    return _this;
  }

  _createClass(AudioContext, [{
    key: "close",
    value: function close() {
      var audioBufferSourceNodeArray = _WeakMap["default"].get(this).audioBufferSourceNodeArray;

      audioBufferSourceNodeArray.forEach(function (element) {
        _WeakMap["default"].get(element).innerAudioContext.destroy();

        _WeakMap["default"].get(element).innerAudioContext = null;
      });
      array.length = 0;
    }
  }, {
    key: "createMediaElementSource",
    value: function createMediaElementSource(myMediaElement) {
      return new _MediaElementAudioSourceNode["default"](this, {
        mediaElement: myMediaElement
      });
    }
  }, {
    key: "createMediaStreamSource",
    value: function createMediaStreamSource() {}
  }, {
    key: "createMediaStreamDestination",
    value: function createMediaStreamDestination() {}
  }, {
    key: "createMediaStreamTrackSource",
    value: function createMediaStreamTrackSource() {}
  }, {
    key: "getOutputTimestamp",
    value: function getOutputTimestamp() {}
  }, {
    key: "resume",
    value: function resume() {}
  }, {
    key: "suspend",
    value: function suspend() {}
  }]);

  return AudioContext;
}(_BaseAudioContext2["default"]);

var _default = AudioContext;
exports["default"] = _default;

},{"../util/WeakMap":56,"./BaseAudioContext":48,"./MediaElementAudioSourceNode":51}],43:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var AudioDestinationNode = function (_AudioNode) {
  _inherits(AudioDestinationNode, _AudioNode);

  var _super = _createSuper(AudioDestinationNode);

  function AudioDestinationNode(context) {
    var _this;

    _classCallCheck(this, AudioDestinationNode);

    _this = _super.call(this, context);
    _this.maxChannelCount = 2;
    return _this;
  }

  return AudioDestinationNode;
}(_AudioNode2["default"]);

var _default = AudioDestinationNode;
exports["default"] = _default;

},{"./AudioNode":45}],44:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

var _AudioParam = _interopRequireDefault(require("./AudioParam"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var AudioListener = function (_AudioNode) {
  _inherits(AudioListener, _AudioNode);

  var _super = _createSuper(AudioListener);

  function AudioListener(context) {
    var _this;

    _classCallCheck(this, AudioListener);

    _this = _super.call(this, context);
    _this.positionX = new _AudioParam["default"]({
      value: 0
    });
    _this.positionY = new _AudioParam["default"]({
      value: 0
    });
    _this.positionZ = new _AudioParam["default"]({
      value: 0
    });
    _this.forwardX = new _AudioParam["default"]({
      value: 0
    });
    _this.forwardY = new _AudioParam["default"]({
      value: 0
    });
    _this.forwardZ = new _AudioParam["default"]({
      value: -1
    });
    _this.upX = new _AudioParam["default"]({
      value: 0
    });
    _this.upY = new _AudioParam["default"]({
      value: 1
    });
    _this.upZ = new _AudioParam["default"]({
      value: 0
    });
    return _this;
  }

  _createClass(AudioListener, [{
    key: "setOrientation",
    value: function setOrientation(x, y, z) {}
  }, {
    key: "setPosition",
    value: function setPosition(x, y, z) {
      x = x || 0;
      y = y || 0;
      z = z || 0;
      this.positionX.value = x;
      this.positionY.value = y;
      this.positionZ.value = z;
    }
  }]);

  return AudioListener;
}(_AudioNode2["default"]);

var _default = AudioListener;
exports["default"] = _default;

},{"./AudioNode":45,"./AudioParam":46}],45:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("../EventTarget"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var AudioNode = function (_EventTarget) {
  _inherits(AudioNode, _EventTarget);

  var _super = _createSuper(AudioNode);

  function AudioNode(context) {
    var _this;

    _classCallCheck(this, AudioNode);

    _this = _super.call(this);
    _this._context = context;
    _this.numberOfInputs = 1;
    _this.numberOfOutputs = 1;
    _this.channelCount = 2;
    _this.channelCountMode = "explicit";
    _this.channelInterpretation = "speakers";
    return _this;
  }

  _createClass(AudioNode, [{
    key: "connect",
    value: function connect(destination, outputIndex, inputIndex) {}
  }, {
    key: "disconnect",
    value: function disconnect() {}
  }, {
    key: "isNumber",
    value: function isNumber(obj) {
      return typeof obj === 'number' || obj instanceof Number;
    }
  }, {
    key: "context",
    get: function get() {
      return this._context;
    }
  }]);

  return AudioNode;
}(_EventTarget2["default"]);

var _default = AudioNode;
exports["default"] = _default;

},{"../EventTarget":11}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var AudioParam = function () {
  function AudioParam() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AudioParam);

    this.automationRate = options.automationRate || "a-rate";
    this._defaultValue = options.defaultValue || 1;
    this._maxValue = options.maxValue || Number.MAX_VALUE;
    this._minValue = options.minValue || -Number.MAX_VALUE;
    this.value = options.value || 1;
  }

  _createClass(AudioParam, [{
    key: "setValueAtTime",
    value: function setValueAtTime(value, startTime) {
      this.value = value;
    }
  }, {
    key: "linearRampToValueAtTime",
    value: function linearRampToValueAtTime(value, endTime) {
      if (endTime < 0) {
        return;
      }

      var k = value / endTime;
      var self = this;

      var func = function func(dt) {
        dt = dt / 1000;

        if (dt > endTime) {
          dt = endTime;
        }

        if (dt < 0) {
          dt = 0;
        }

        endTime -= dt;
        self.value += dt * k;

        if (endTime > 0) {
          requestAnimationFrame(func);
        }
      };

      requestAnimationFrame(func);
    }
  }, {
    key: "exponentialRampToValueAtTime",
    value: function exponentialRampToValueAtTime() {}
  }, {
    key: "setTargetAtTime",
    value: function setTargetAtTime(target, startTime, timeConstant) {
      this.value = target;
    }
  }, {
    key: "setValueCurveAtTime",
    value: function setValueCurveAtTime() {}
  }, {
    key: "cancelScheduledValues",
    value: function cancelScheduledValues() {}
  }, {
    key: "cancelAndHoldAtTime",
    value: function cancelAndHoldAtTime() {}
  }, {
    key: "defaultValue",
    get: function get() {
      return this._defaultValue;
    }
  }, {
    key: "maxValue",
    get: function get() {
      return this._maxValue;
    }
  }, {
    key: "minValue",
    get: function get() {
      return this._minValue;
    }
  }, {
    key: "value",
    set: function set(value) {
      value = Math.min(this._maxValue, value);
      this._value = Math.max(this._minValue, value);
    },
    get: function get() {
      return this._value;
    }
  }]);

  return AudioParam;
}();

var _default = AudioParam;
exports["default"] = _default;

},{}],47:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var AudioScheduledSourceNode = function (_AudioNode) {
  _inherits(AudioScheduledSourceNode, _AudioNode);

  var _super = _createSuper(AudioScheduledSourceNode);

  function AudioScheduledSourceNode(context) {
    _classCallCheck(this, AudioScheduledSourceNode);

    return _super.call(this, context);
  }

  _createClass(AudioScheduledSourceNode, [{
    key: "onended",
    value: function onended(event) {}
  }, {
    key: "start",
    value: function start(when, offset, duration) {}
  }, {
    key: "stop",
    value: function stop(when) {}
  }]);

  return AudioScheduledSourceNode;
}(_AudioNode2["default"]);

var _default = AudioScheduledSourceNode;
exports["default"] = _default;

},{"./AudioNode":45}],48:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("../EventTarget"));

var _AudioListener = _interopRequireDefault(require("./AudioListener"));

var _PeriodicWave = _interopRequireDefault(require("./PeriodicWave"));

var _AudioBuffer = _interopRequireDefault(require("./AudioBuffer"));

var _WeakMap = _interopRequireDefault(require("../util/WeakMap"));

var _DynamicsCompressorNode = _interopRequireDefault(require("./DynamicsCompressorNode"));

var _AudioBufferSourceNode = _interopRequireDefault(require("./AudioBufferSourceNode"));

var _AudioDestinationNode = _interopRequireDefault(require("./AudioDestinationNode"));

var _OscillatorNode = _interopRequireDefault(require("./OscillatorNode"));

var _AnalyserNode = _interopRequireDefault(require("./AnalyserNode"));

var _PannerNode = _interopRequireDefault(require("./PannerNode"));

var _GainNode = _interopRequireDefault(require("./GainNode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var BaseAudioContext = function (_EventTarget) {
  _inherits(BaseAudioContext, _EventTarget);

  var _super = _createSuper(BaseAudioContext);

  function BaseAudioContext() {
    var _this;

    _classCallCheck(this, BaseAudioContext);

    _this = _super.call(this);
    _this.audioWorklet;
    _this.currentTime = 0;
    _this.destination = new _AudioDestinationNode["default"](_assertThisInitialized(_this));
    _this.listener = new _AudioListener["default"](_assertThisInitialized(_this));
    _this.sampleRate;
    _this.state = "running";
    _WeakMap["default"].get(_assertThisInitialized(_this)).audioBufferSourceNodeArray = [];
    return _this;
  }

  _createClass(BaseAudioContext, [{
    key: "createAnalyser",
    value: function createAnalyser() {
      return new _AnalyserNode["default"](this);
    }
  }, {
    key: "createBiquadFilter",
    value: function createBiquadFilter() {}
  }, {
    key: "createBuffer",
    value: function createBuffer() {}
  }, {
    key: "createBufferSource",
    value: function createBufferSource() {
      var sourceNode = new _AudioBufferSourceNode["default"](this);

      _WeakMap["default"].get(this).audioBufferSourceNodeArray.push(sourceNode);

      return sourceNode;
    }
  }, {
    key: "createConstantSource",
    value: function createConstantSource() {}
  }, {
    key: "createChannelMerger",
    value: function createChannelMerger() {}
  }, {
    key: "createChannelSplitter",
    value: function createChannelSplitter() {}
  }, {
    key: "createConvolver",
    value: function createConvolver() {}
  }, {
    key: "createDelay",
    value: function createDelay() {}
  }, {
    key: "createDynamicsCompressor",
    value: function createDynamicsCompressor() {
      return new _DynamicsCompressorNode["default"](this);
    }
  }, {
    key: "createGain",
    value: function createGain() {
      return new _GainNode["default"](this);
    }
  }, {
    key: "createIIRFilter",
    value: function createIIRFilter() {}
  }, {
    key: "createOscillator",
    value: function createOscillator() {
      return new _OscillatorNode["default"](this);
    }
  }, {
    key: "createPanner",
    value: function createPanner() {
      return new _PannerNode["default"](this);
    }
  }, {
    key: "createPeriodicWave",
    value: function createPeriodicWave() {
      return new _PeriodicWave["default"](this);
    }
  }, {
    key: "createScriptProcessor",
    value: function createScriptProcessor() {}
  }, {
    key: "createStereoPanner",
    value: function createStereoPanner() {}
  }, {
    key: "createWaveShaper",
    value: function createWaveShaper() {}
  }, {
    key: "decodeAudioData",
    value: function decodeAudioData(audioData, callFunc) {
      new _AudioBuffer["default"](this, audioData, callFunc);
    }
  }, {
    key: "onstatechange",
    value: function onstatechange() {}
  }]);

  return BaseAudioContext;
}(_EventTarget2["default"]);

var _default = BaseAudioContext;
exports["default"] = _default;

},{"../EventTarget":11,"../util/WeakMap":56,"./AnalyserNode":39,"./AudioBuffer":40,"./AudioBufferSourceNode":41,"./AudioDestinationNode":43,"./AudioListener":44,"./DynamicsCompressorNode":49,"./GainNode":50,"./OscillatorNode":52,"./PannerNode":53,"./PeriodicWave":54}],49:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

var _AudioParam = _interopRequireDefault(require("./AudioParam"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var DynamicsCompressorNode = function (_AudioNode) {
  _inherits(DynamicsCompressorNode, _AudioNode);

  var _super = _createSuper(DynamicsCompressorNode);

  function DynamicsCompressorNode(context) {
    var _this;

    _classCallCheck(this, DynamicsCompressorNode);

    _this = _super.call(this, context);
    _this._threshold = new _AudioParam["default"]({
      value: -24,
      defaultValue: -24,
      maxValue: 0,
      minValue: -100
    });
    _this._knee = new _AudioParam["default"]({
      value: 30,
      defaultValue: 30,
      maxValue: 40,
      minValue: 0
    });
    _this._ratio = new _AudioParam["default"]({
      value: 12,
      defaultValue: 12,
      maxValue: 20,
      minValue: 1
    });
    _this._reduction = new _AudioParam["default"]({
      value: 0,
      defaultValue: 0,
      maxValue: 0,
      minValue: -20
    });
    _this._attack = new _AudioParam["default"]({
      value: 0.003,
      defaultValue: 0.003,
      maxValue: 1,
      minValue: 0
    });
    _this._release = new _AudioParam["default"]({
      value: 0.25,
      defaultValue: 0.25,
      maxValue: 1,
      minValue: 0
    });
    return _this;
  }

  _createClass(DynamicsCompressorNode, [{
    key: "threshold",
    get: function get() {
      return this._threshold;
    }
  }, {
    key: "keen",
    get: function get() {
      return this._keen;
    }
  }, {
    key: "ratio",
    get: function get() {
      return this._ratio;
    }
  }, {
    key: "reduction",
    get: function get() {
      return this._reduction;
    }
  }, {
    key: "attack",
    get: function get() {
      return this._attack;
    }
  }, {
    key: "release",
    get: function get() {
      return this._release;
    }
  }]);

  return DynamicsCompressorNode;
}(_AudioNode2["default"]);

var _default = DynamicsCompressorNode;
exports["default"] = _default;

},{"./AudioNode":45,"./AudioParam":46}],50:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

var _AudioParam = _interopRequireDefault(require("./AudioParam"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var GainNode = function (_AudioNode) {
  _inherits(GainNode, _AudioNode);

  var _super = _createSuper(GainNode);

  function GainNode(context, options) {
    var _this;

    _classCallCheck(this, GainNode);

    _this = _super.call(this, context);
    _this._gain = options && options.gain || new _AudioParam["default"]();
    return _this;
  }

  _createClass(GainNode, [{
    key: "gain",
    get: function get() {
      return this._gain;
    }
  }]);

  return GainNode;
}(_AudioNode2["default"]);

var _default = GainNode;
exports["default"] = _default;

},{"./AudioNode":45,"./AudioParam":46}],51:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var MediaElementAudioSourceNode = function (_AudioNode) {
  _inherits(MediaElementAudioSourceNode, _AudioNode);

  var _super = _createSuper(MediaElementAudioSourceNode);

  function MediaElementAudioSourceNode(context, options) {
    var _this;

    _classCallCheck(this, MediaElementAudioSourceNode);

    _this = _super.call(this, context);
    _this._options = options;
    return _this;
  }

  _createClass(MediaElementAudioSourceNode, [{
    key: "mediaElement",
    get: function get() {
      return this._options ? this._options.mediaElement : null;
    }
  }]);

  return MediaElementAudioSourceNode;
}(_AudioNode2["default"]);

var _default = MediaElementAudioSourceNode;
exports["default"] = _default;

},{"./AudioNode":45}],52:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioScheduledSourceNode = _interopRequireDefault(require("./AudioScheduledSourceNode"));

var _AudioParam = _interopRequireDefault(require("./AudioParam"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var types = {
  "sine": 0,
  "square": 0,
  "sawtooth": 0,
  "triangle": 0,
  "custom": 0
};

var OscillatorNode = function (_AudioScheduledSource) {
  _inherits(OscillatorNode, _AudioScheduledSource);

  var _super = _createSuper(OscillatorNode);

  function OscillatorNode(context, options) {
    var _this;

    _classCallCheck(this, OscillatorNode);

    _this = _super.call(this);
    options = options || {};
    _this.frequency = new _AudioParam["default"]({
      value: _this.isNumber(options.frequency) ? options.frequency : 440
    });
    _this.detune = new _AudioParam["default"]({
      value: _this.isNumber(options.detune) ? options.detune : 0
    });
    _this.type = options.type in types ? options.type : "sine";
    return _this;
  }

  _createClass(OscillatorNode, [{
    key: "setPeriodicWave",
    value: function setPeriodicWave(wave) {}
  }, {
    key: "start",
    value: function start(when) {}
  }, {
    key: "stop",
    value: function stop(wen) {}
  }]);

  return OscillatorNode;
}(_AudioScheduledSourceNode["default"]);

var _default = OscillatorNode;
exports["default"] = _default;

},{"./AudioParam":46,"./AudioScheduledSourceNode":47}],53:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AudioNode2 = _interopRequireDefault(require("./AudioNode"));

var _AudioParam = _interopRequireDefault(require("./AudioParam"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var PannerNode = function (_AudioNode) {
  _inherits(PannerNode, _AudioNode);

  var _super = _createSuper(PannerNode);

  function PannerNode(context, options) {
    var _this;

    _classCallCheck(this, PannerNode);

    _this = _super.call(this, context);
    _this.coneInnerAngle = 360;
    _this.coneOuterAngle = 360;
    _this.coneOuterGain = 0;
    _this.distanceModel = "inverse";
    _this.maxDistance = 10000;
    _this.orientationX = new _AudioParam["default"]({
      value: 1
    });
    _this.orientationY = new _AudioParam["default"]({
      value: 0
    });
    _this.orientationZ = new _AudioParam["default"]({
      value: 0
    });
    _this.panningModel = "equalpower";
    _this.positionX = new _AudioParam["default"]({
      value: 0
    });
    _this.positionY = new _AudioParam["default"]({
      value: 0
    });
    _this.positionZ = new _AudioParam["default"]({
      value: 0
    });
    _this.refDistance = 1;
    _this.rolloffFactor = 1;
    return _this;
  }

  _createClass(PannerNode, [{
    key: "setPosition",
    value: function setPosition(x, y, z) {
      this.positionX = x;
      this.positionY = y;
      this.positionZ = z;
    }
  }, {
    key: "setOrientation",
    value: function setOrientation(x, y, z) {
      this.orientationX = x;
      this.orientationY = y;
      this.orientationZ = z;
    }
  }, {
    key: "setVelocity",
    value: function setVelocity() {}
  }]);

  return PannerNode;
}(_AudioNode2["default"]);

var _default = PannerNode;
exports["default"] = _default;

},{"./AudioNode":45,"./AudioParam":46}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PeriodicWave = function PeriodicWave(context, options) {
  _classCallCheck(this, PeriodicWave);
};

var _default = PeriodicWave;
exports["default"] = _default;

},{}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var md5 = require("../../lib/md5.min");

var fileMgr = ral.getFileSystemManager();
var cacheDir = ral.env.USER_DATA_PATH + "/fileCache/";

var FileCache = function () {
  function FileCache() {
    _classCallCheck(this, FileCache);

    this._caches = {};
  }

  _createClass(FileCache, [{
    key: "getCache",
    value: function getCache(data) {
      var key = FileCache._genDataKey(data);

      if (key in this._caches) {
        return this._caches[key];
      } else {
        return "";
      }
    }
  }, {
    key: "setCache",
    value: function setCache(path, data) {
      var key = FileCache._genDataKey(data);

      this._caches[key] = path;
    }
  }, {
    key: "setItem",
    value: function setItem(data, path, key, callBack) {
      key = key || FileCache._genDataKey(data);
      var caches = this._caches;

      if (key in caches) {
        callBack && callBack(caches[key]);
        return;
      }

      if (!path) {
        path = cacheDir + key;
        fileMgr.writeFile({
          filePath: path,
          data: data,
          encoding: "binary",
          success: function success() {
            caches[key] = path;
            callBack && callBack(path);
          },
          fail: function fail() {
            callBack && callBack();
            throw path + "writeFile fail!";
          }
        });
      }
    }
  }, {
    key: "getPath",
    value: function getPath(data, callBack) {
      var key = FileCache._genDataKey(data);

      var caches = this._caches;

      if (key in caches) {
        callBack(caches[key]);
      } else {
        this.setItem(data, undefined, key, callBack);
      }
    }
  }], [{
    key: "_genDataKey",
    value: function _genDataKey(data) {
      var view = new DataView(data);
      var length = view.byteLength / 4;
      var count = 10;
      var space = length / count;
      var key = "length:" + length;
      key += "first:" + view.getInt32(0);
      key += "last:" + view.getInt32(length - 1);

      while (count--) {
        key += count + ":" + view.getInt32(Math.floor(space * count));
      }

      return md5(key);
    }
  }]);

  return FileCache;
}();

try {
  fileMgr.accessSync(cacheDir);
  fileMgr.rmdirSync(cacheDir, true);
} catch (e) {}

fileMgr.mkdirSync(cacheDir, true);

var _default = new FileCache();

exports["default"] = _default;

},{"../../lib/md5.min":2}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _default = new WeakMap();

exports["default"] = _default;

},{}],57:[function(require,module,exports){
"use strict";

var _Audio = _interopRequireDefault(require("./Audio"));

var _AudioContext = _interopRequireDefault(require("./audioContext/AudioContext"));

var _DeviceMotionEvent = _interopRequireDefault(require("./DeviceMotionEvent"));

var _Document = _interopRequireDefault(require("./Document"));

var _Event = _interopRequireDefault(require("./Event"));

var _FontFace = _interopRequireDefault(require("./FontFace"));

var _FontFaceSet = _interopRequireDefault(require("./FontFaceSet"));

var _EventTarget = _interopRequireDefault(require("./EventTarget"));

var _HTMLElement = _interopRequireDefault(require("./HTMLElement"));

var _HTMLAudioElement = _interopRequireDefault(require("./HTMLAudioElement"));

var _HTMLCanvasElement = _interopRequireDefault(require("./HTMLCanvasElement"));

var _HTMLImageElement = _interopRequireDefault(require("./HTMLImageElement"));

var _HTMLVideoElement = _interopRequireDefault(require("./HTMLVideoElement"));

var _Image = _interopRequireDefault(require("./Image"));

var _Location = _interopRequireDefault(require("./Location"));

var _Navigator = _interopRequireDefault(require("./Navigator"));

var _Screen = _interopRequireDefault(require("./Screen"));

var _TouchEvent = _interopRequireDefault(require("./TouchEvent"));

var _XMLHttpRequest = _interopRequireDefault(require("./XMLHttpRequest"));

var _HTMLScriptElement = _interopRequireDefault(require("./HTMLScriptElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

window.ral = window.ral || {};

var _systemInfo = window.ral.getSystemInfoSync();

window.clientTop = 0;
window.clientLeft = 0;
window.devicePixelRatio = _systemInfo.pixelRatio;
window.document = new _Document["default"]();
window.frameElement = null;
window.fullScreen = true;
window.innerHeight = _systemInfo.windowHeight;
window.innerWidth = _systemInfo.windowWidth;
window.length = 0;
window.location = new _Location["default"]();
window.name = "runtime";
window.navigator = new _Navigator["default"](_systemInfo.platform, _systemInfo.language);
window.outerHeight = _systemInfo.windowHeight;
window.outerWidth = _systemInfo.windowWidth;
window.pageXOffset = 0;
window.pageYOffset = 0;
window.parent = window;
window.screen = new _Screen["default"]();
window.screenLeft = 0;
window.screenTop = 0;
window.screenX = 0;
window.screenY = 0;
window.scrollX = 0;
window.scrollY = 0;
window.self = window;
window.top = window;
window.window = window;
window.alert = window.console.error;

var _require = require('../lib/base64.min.js'),
    btoa = _require.btoa,
    atob = _require.atob;

window.atob = atob;
window.btoa = btoa;

window.close = function () {
  console.warn("window.close() is deprecated!");
};

window.print = window.console.log;
window.addEventListener = _EventTarget["default"].prototype.addEventListener.bind(window);
window.removeEventListener = _EventTarget["default"].prototype.removeEventListener.bind(window);
var _dispatchEvent = _EventTarget["default"].prototype.dispatchEvent;

window.dispatchEvent = function (event) {
  if (window.document.dispatchEvent(event)) {
    return _dispatchEvent.apply(this || window, arguments);
  }

  return false;
};

window.getComputedStyle = function () {
  return {
    position: 'absolute',
    left: '0px',
    top: '0px',
    height: '0px',
    paddingLeft: 0,
    getPropertyValue: function getPropertyValue(key) {
      return this[key];
    }
  };
};

ral.onWindowResize && ral.onWindowResize(function (width, height) {
  window.innerWidth = width;
  window.innerHeight = height;
  window.outerWidth = window.innerWidth;
  window.outerHeight = window.innerHeight;
  window.screen.availWidth = window.innerWidth;
  window.screen.availHeight = window.innerHeight;
  window.screen.width = window.innerWidth;
  window.screen.height = window.innerHeight;
  var event = new _Event["default"]("resize");
  window.dispatchEvent(event);
});
ral.onDeviceOrientationChange && ral.onDeviceOrientationChange(function (res) {
  if (res.value === "portrait") {
    window.orientation = 0;
  } else if (res.value === "landscape") {
    window.orientation = 90;
  } else if (res.value === "landscapeReverse") {
    window.orientation = -90;
  } else if (res.value === "portraitReverse") {
    window.orientation = 180;
  }
});

window.stop = function () {
  console.warn("window.stop() not implemented");
};

window.Audio = _Audio["default"];
window.AudioContext = _AudioContext["default"];
window.DeviceMotionEvent = _DeviceMotionEvent["default"];
window.Event = _Event["default"];
window.FontFace = _FontFace["default"];
window.FontFaceSet = _FontFaceSet["default"];
window.HTMLElement = _HTMLElement["default"];
window.HTMLAudioElement = _HTMLAudioElement["default"];
window.HTMLCanvasElement = _HTMLCanvasElement["default"];
window.HTMLImageElement = _HTMLImageElement["default"];
window.HTMLVideoElement = _HTMLVideoElement["default"];
window.Image = _Image["default"];
window.TouchEvent = _TouchEvent["default"];
window.XMLHttpRequest = _XMLHttpRequest["default"];
window.HTMLScriptElement = _HTMLScriptElement["default"];

if (!window.Blob || !window.URL) {
  var _require2 = require('./Blob.js'),
      Blob = _require2.Blob,
      URL = _require2.URL;

  window.Blob = Blob;
  window.URL = URL;
}

if (!window.DOMParser) {
  window.DOMParser = require('./xmldom/dom-parser.js').DOMParser;
}

},{"../lib/base64.min.js":1,"./Audio":4,"./Blob.js":5,"./DeviceMotionEvent":7,"./Document":8,"./Event":10,"./EventTarget":11,"./FontFace":12,"./FontFaceSet":13,"./HTMLAudioElement":15,"./HTMLCanvasElement":17,"./HTMLElement":18,"./HTMLImageElement":21,"./HTMLScriptElement":24,"./HTMLVideoElement":26,"./Image":27,"./Location":29,"./Navigator":31,"./Screen":34,"./TouchEvent":36,"./XMLHttpRequest":37,"./audioContext/AudioContext":42,"./xmldom/dom-parser.js":58}],58:[function(require,module,exports){
"use strict";

function DOMParser(options) {
  this.options = options || {
    locator: {}
  };
}

DOMParser.prototype.parseFromString = function (source, mimeType) {
  var options = this.options;
  var sax = new XMLReader();
  var domBuilder = options.domBuilder || new DOMHandler();
  var errorHandler = options.errorHandler;
  var locator = options.locator;
  var defaultNSMap = options.xmlns || {};
  var isHTML = /\/x?html?$/.test(mimeType);
  var entityMap = isHTML ? htmlEntity.entityMap : {
    'lt': '<',
    'gt': '>',
    'amp': '&',
    'quot': '"',
    'apos': "'"
  };

  if (locator) {
    domBuilder.setDocumentLocator(locator);
  }

  sax.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
  sax.domBuilder = options.domBuilder || domBuilder;

  if (isHTML) {
    defaultNSMap[''] = 'http://www.w3.org/1999/xhtml';
  }

  defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';

  if (source) {
    sax.parse(source, defaultNSMap, entityMap);
  } else {
    sax.errorHandler.error("invalid doc source");
  }

  return domBuilder.doc;
};

function buildErrorHandler(errorImpl, domBuilder, locator) {
  if (!errorImpl) {
    if (domBuilder instanceof DOMHandler) {
      return domBuilder;
    }

    errorImpl = domBuilder;
  }

  var errorHandler = {};
  var isCallback = errorImpl instanceof Function;
  locator = locator || {};

  function build(key) {
    var fn = errorImpl[key];

    if (!fn && isCallback) {
      fn = errorImpl.length == 2 ? function (msg) {
        errorImpl(key, msg);
      } : errorImpl;
    }

    errorHandler[key] = fn && function (msg) {
      fn('[xmldom ' + key + ']\t' + msg + _locator(locator));
    } || function () {};
  }

  build('warning');
  build('error');
  build('fatalError');
  return errorHandler;
}

function DOMHandler() {
  this.cdata = false;
}

function position(locator, node) {
  node.lineNumber = locator.lineNumber;
  node.columnNumber = locator.columnNumber;
}

DOMHandler.prototype = {
  startDocument: function startDocument() {
    this.doc = new DOMImplementation().createDocument(null, null, null);

    if (this.locator) {
      this.doc.documentURI = this.locator.systemId;
    }
  },
  startElement: function startElement(namespaceURI, localName, qName, attrs) {
    var doc = this.doc;
    var el = doc.createElementNS(namespaceURI, qName || localName);
    var len = attrs.length;
    appendElement(this, el);
    this.currentElement = el;
    this.locator && position(this.locator, el);

    for (var i = 0; i < len; i++) {
      var namespaceURI = attrs.getURI(i);
      var value = attrs.getValue(i);
      var qName = attrs.getQName(i);
      var attr = doc.createAttributeNS(namespaceURI, qName);
      this.locator && position(attrs.getLocator(i), attr);
      attr.value = attr.nodeValue = value;
      el.setAttributeNode(attr);
    }
  },
  endElement: function endElement(namespaceURI, localName, qName) {
    var current = this.currentElement;
    var tagName = current.tagName;
    this.currentElement = current.parentNode;
  },
  startPrefixMapping: function startPrefixMapping(prefix, uri) {},
  endPrefixMapping: function endPrefixMapping(prefix) {},
  processingInstruction: function processingInstruction(target, data) {
    var ins = this.doc.createProcessingInstruction(target, data);
    this.locator && position(this.locator, ins);
    appendElement(this, ins);
  },
  ignorableWhitespace: function ignorableWhitespace(ch, start, length) {},
  characters: function characters(chars, start, length) {
    chars = _toString.apply(this, arguments);

    if (chars) {
      if (this.cdata) {
        var charNode = this.doc.createCDATASection(chars);
      } else {
        var charNode = this.doc.createTextNode(chars);
      }

      if (this.currentElement) {
        this.currentElement.appendChild(charNode);
      } else if (/^\s*$/.test(chars)) {
        this.doc.appendChild(charNode);
      }

      this.locator && position(this.locator, charNode);
    }
  },
  skippedEntity: function skippedEntity(name) {},
  endDocument: function endDocument() {
    this.doc.normalize();
  },
  setDocumentLocator: function setDocumentLocator(locator) {
    if (this.locator = locator) {
      locator.lineNumber = 0;
    }
  },
  comment: function comment(chars, start, length) {
    chars = _toString.apply(this, arguments);
    var comm = this.doc.createComment(chars);
    this.locator && position(this.locator, comm);
    appendElement(this, comm);
  },
  startCDATA: function startCDATA() {
    this.cdata = true;
  },
  endCDATA: function endCDATA() {
    this.cdata = false;
  },
  startDTD: function startDTD(name, publicId, systemId) {
    var impl = this.doc.implementation;

    if (impl && impl.createDocumentType) {
      var dt = impl.createDocumentType(name, publicId, systemId);
      this.locator && position(this.locator, dt);
      appendElement(this, dt);
    }
  },
  warning: function warning(error) {
    console.warn('[xmldom warning]\t' + error, _locator(this.locator));
  },
  error: function error(_error) {
    console.error('[xmldom error]\t' + _error, _locator(this.locator));
  },
  fatalError: function fatalError(error) {
    console.error('[xmldom fatalError]\t' + error, _locator(this.locator));
    throw error;
  }
};

function _locator(l) {
  if (l) {
    return '\n@' + (l.systemId || '') + '#[line:' + l.lineNumber + ',col:' + l.columnNumber + ']';
  }
}

function _toString(chars, start, length) {
  if (typeof chars == 'string') {
    return chars.substr(start, length);
  } else {
    if (chars.length >= start + length || start) {
      return new java.lang.String(chars, start, length) + '';
    }

    return chars;
  }
}

"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function (key) {
  DOMHandler.prototype[key] = function () {
    return null;
  };
});

function appendElement(hander, node) {
  if (!hander.currentElement) {
    hander.doc.appendChild(node);
  } else {
    hander.currentElement.appendChild(node);
  }
}

var htmlEntity = require('./entities');

var XMLReader = require('./sax').XMLReader;

var DOMImplementation = exports.DOMImplementation = require('./dom').DOMImplementation;

exports.XMLSerializer = require('./dom').XMLSerializer;
exports.DOMParser = DOMParser;

},{"./dom":59,"./entities":60,"./sax":61}],59:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function copy(src, dest) {
  for (var p in src) {
    dest[p] = src[p];
  }
}

function _extends(Class, Super) {
  var pt = Class.prototype;

  if (!(pt instanceof Super)) {
    var t = function t() {};

    ;
    t.prototype = Super.prototype;
    t = new t();
    copy(pt, t);
    Class.prototype = pt = t;
  }

  if (pt.constructor != Class) {
    if (typeof Class != 'function') {
      console.error("unknow Class:" + Class);
    }

    pt.constructor = Class;
  }
}

var htmlns = 'http://www.w3.org/1999/xhtml';
var NodeType = {};
var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
var TEXT_NODE = NodeType.TEXT_NODE = 3;
var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
var ExceptionCode = {};
var ExceptionMessage = {};
var INDEX_SIZE_ERR = ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
var DOMSTRING_SIZE_ERR = ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
var WRONG_DOCUMENT_ERR = ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
var INVALID_CHARACTER_ERR = ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
var NO_DATA_ALLOWED_ERR = ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
var NOT_SUPPORTED_ERR = ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
var INVALID_STATE_ERR = ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
var SYNTAX_ERR = ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
var INVALID_MODIFICATION_ERR = ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
var NAMESPACE_ERR = ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
var INVALID_ACCESS_ERR = ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);

function DOMException(code, message) {
  if (message instanceof Error) {
    var error = message;
  } else {
    error = this;
    Error.call(this, ExceptionMessage[code]);
    this.message = ExceptionMessage[code];
    if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
  }

  error.code = code;
  if (message) this.message = this.message + ": " + message;
  return error;
}

;
DOMException.prototype = Error.prototype;
copy(ExceptionCode, DOMException);

function NodeList() {}

;
NodeList.prototype = {
  length: 0,
  item: function item(index) {
    return this[index] || null;
  },
  toString: function toString(isHTML, nodeFilter) {
    for (var buf = [], i = 0; i < this.length; i++) {
      serializeToString(this[i], buf, isHTML, nodeFilter);
    }

    return buf.join('');
  }
};

function LiveNodeList(node, refresh) {
  this._node = node;
  this._refresh = refresh;

  _updateLiveList(this);
}

function _updateLiveList(list) {
  var inc = list._node._inc || list._node.ownerDocument._inc;

  if (list._inc != inc) {
    var ls = list._refresh(list._node);

    __set__(list, 'length', ls.length);

    copy(ls, list);
    list._inc = inc;
  }
}

LiveNodeList.prototype.item = function (i) {
  _updateLiveList(this);

  return this[i];
};

_extends(LiveNodeList, NodeList);

function NamedNodeMap() {}

;

function _findNodeIndex(list, node) {
  var i = list.length;

  while (i--) {
    if (list[i] === node) {
      return i;
    }
  }
}

function _addNamedNode(el, list, newAttr, oldAttr) {
  if (oldAttr) {
    list[_findNodeIndex(list, oldAttr)] = newAttr;
  } else {
    list[list.length++] = newAttr;
  }

  if (el) {
    newAttr.ownerElement = el;
    var doc = el.ownerDocument;

    if (doc) {
      oldAttr && _onRemoveAttribute(doc, el, oldAttr);

      _onAddAttribute(doc, el, newAttr);
    }
  }
}

function _removeNamedNode(el, list, attr) {
  var i = _findNodeIndex(list, attr);

  if (i >= 0) {
    var lastIndex = list.length - 1;

    while (i < lastIndex) {
      list[i] = list[++i];
    }

    list.length = lastIndex;

    if (el) {
      var doc = el.ownerDocument;

      if (doc) {
        _onRemoveAttribute(doc, el, attr);

        attr.ownerElement = null;
      }
    }
  } else {
    throw DOMException(NOT_FOUND_ERR, new Error(el.tagName + '@' + attr));
  }
}

NamedNodeMap.prototype = {
  length: 0,
  item: NodeList.prototype.item,
  getNamedItem: function getNamedItem(key) {
    var i = this.length;

    while (i--) {
      var attr = this[i];

      if (attr.nodeName == key) {
        return attr;
      }
    }
  },
  setNamedItem: function setNamedItem(attr) {
    var el = attr.ownerElement;

    if (el && el != this._ownerElement) {
      throw new DOMException(INUSE_ATTRIBUTE_ERR);
    }

    var oldAttr = this.getNamedItem(attr.nodeName);

    _addNamedNode(this._ownerElement, this, attr, oldAttr);

    return oldAttr;
  },
  setNamedItemNS: function setNamedItemNS(attr) {
    var el = attr.ownerElement,
        oldAttr;

    if (el && el != this._ownerElement) {
      throw new DOMException(INUSE_ATTRIBUTE_ERR);
    }

    oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);

    _addNamedNode(this._ownerElement, this, attr, oldAttr);

    return oldAttr;
  },
  removeNamedItem: function removeNamedItem(key) {
    var attr = this.getNamedItem(key);

    _removeNamedNode(this._ownerElement, this, attr);

    return attr;
  },
  removeNamedItemNS: function removeNamedItemNS(namespaceURI, localName) {
    var attr = this.getNamedItemNS(namespaceURI, localName);

    _removeNamedNode(this._ownerElement, this, attr);

    return attr;
  },
  getNamedItemNS: function getNamedItemNS(namespaceURI, localName) {
    var i = this.length;

    while (i--) {
      var node = this[i];

      if (node.localName == localName && node.namespaceURI == namespaceURI) {
        return node;
      }
    }

    return null;
  }
};

function DOMImplementation(features) {
  this._features = {};

  if (features) {
    for (var feature in features) {
      this._features = features[feature];
    }
  }
}

;
DOMImplementation.prototype = {
  hasFeature: function hasFeature(feature, version) {
    var versions = this._features[feature.toLowerCase()];

    if (versions && (!version || version in versions)) {
      return true;
    } else {
      return false;
    }
  },
  createDocument: function createDocument(namespaceURI, qualifiedName, doctype) {
    var doc = new Document();
    doc.implementation = this;
    doc.childNodes = new NodeList();
    doc.doctype = doctype;

    if (doctype) {
      doc.appendChild(doctype);
    }

    if (qualifiedName) {
      var root = doc.createElementNS(namespaceURI, qualifiedName);
      doc.appendChild(root);
    }

    return doc;
  },
  createDocumentType: function createDocumentType(qualifiedName, publicId, systemId) {
    var node = new DocumentType();
    node.name = qualifiedName;
    node.nodeName = qualifiedName;
    node.publicId = publicId;
    node.systemId = systemId;
    return node;
  }
};

function Node() {}

;
Node.prototype = {
  firstChild: null,
  lastChild: null,
  previousSibling: null,
  nextSibling: null,
  attributes: null,
  parentNode: null,
  childNodes: null,
  ownerDocument: null,
  nodeValue: null,
  namespaceURI: null,
  prefix: null,
  localName: null,
  insertBefore: function insertBefore(newChild, refChild) {
    return _insertBefore(this, newChild, refChild);
  },
  replaceChild: function replaceChild(newChild, oldChild) {
    this.insertBefore(newChild, oldChild);

    if (oldChild) {
      this.removeChild(oldChild);
    }
  },
  removeChild: function removeChild(oldChild) {
    return _removeChild(this, oldChild);
  },
  appendChild: function appendChild(newChild) {
    return this.insertBefore(newChild, null);
  },
  hasChildNodes: function hasChildNodes() {
    return this.firstChild != null;
  },
  cloneNode: function cloneNode(deep) {
    return _cloneNode(this.ownerDocument || this, this, deep);
  },
  normalize: function normalize() {
    var child = this.firstChild;

    while (child) {
      var next = child.nextSibling;

      if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
        this.removeChild(next);
        child.appendData(next.data);
      } else {
        child.normalize();
        child = next;
      }
    }
  },
  isSupported: function isSupported(feature, version) {
    return this.ownerDocument.implementation.hasFeature(feature, version);
  },
  hasAttributes: function hasAttributes() {
    return this.attributes.length > 0;
  },
  lookupPrefix: function lookupPrefix(namespaceURI) {
    var el = this;

    while (el) {
      var map = el._nsMap;

      if (map) {
        for (var n in map) {
          if (map[n] == namespaceURI) {
            return n;
          }
        }
      }

      el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
    }

    return null;
  },
  lookupNamespaceURI: function lookupNamespaceURI(prefix) {
    var el = this;

    while (el) {
      var map = el._nsMap;

      if (map) {
        if (prefix in map) {
          return map[prefix];
        }
      }

      el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
    }

    return null;
  },
  isDefaultNamespace: function isDefaultNamespace(namespaceURI) {
    var prefix = this.lookupPrefix(namespaceURI);
    return prefix == null;
  }
};

function _xmlEncoder(c) {
  return c == '<' && '&lt;' || c == '>' && '&gt;' || c == '&' && '&amp;' || c == '"' && '&quot;' || '&#' + c.charCodeAt() + ';';
}

copy(NodeType, Node);
copy(NodeType, Node.prototype);

function _visitNode(node, callback) {
  if (callback(node)) {
    return true;
  }

  if (node = node.firstChild) {
    do {
      if (_visitNode(node, callback)) {
        return true;
      }
    } while (node = node.nextSibling);
  }
}

function Document() {}

function _onAddAttribute(doc, el, newAttr) {
  doc && doc._inc++;
  var ns = newAttr.namespaceURI;

  if (ns == 'http://www.w3.org/2000/xmlns/') {
    el._nsMap[newAttr.prefix ? newAttr.localName : ''] = newAttr.value;
  }
}

function _onRemoveAttribute(doc, el, newAttr, remove) {
  doc && doc._inc++;
  var ns = newAttr.namespaceURI;

  if (ns == 'http://www.w3.org/2000/xmlns/') {
    delete el._nsMap[newAttr.prefix ? newAttr.localName : ''];
  }
}

function _onUpdateChild(doc, el, newChild) {
  if (doc && doc._inc) {
    doc._inc++;
    var cs = el.childNodes;

    if (newChild) {
      cs[cs.length++] = newChild;
    } else {
      var child = el.firstChild;
      var i = 0;

      while (child) {
        cs[i++] = child;
        child = child.nextSibling;
      }

      cs.length = i;
    }
  }
}

function _removeChild(parentNode, child) {
  var previous = child.previousSibling;
  var next = child.nextSibling;

  if (previous) {
    previous.nextSibling = next;
  } else {
    parentNode.firstChild = next;
  }

  if (next) {
    next.previousSibling = previous;
  } else {
    parentNode.lastChild = previous;
  }

  _onUpdateChild(parentNode.ownerDocument, parentNode);

  return child;
}

function _insertBefore(parentNode, newChild, nextChild) {
  var cp = newChild.parentNode;

  if (cp) {
    cp.removeChild(newChild);
  }

  if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
    var newFirst = newChild.firstChild;

    if (newFirst == null) {
      return newChild;
    }

    var newLast = newChild.lastChild;
  } else {
    newFirst = newLast = newChild;
  }

  var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;
  newFirst.previousSibling = pre;
  newLast.nextSibling = nextChild;

  if (pre) {
    pre.nextSibling = newFirst;
  } else {
    parentNode.firstChild = newFirst;
  }

  if (nextChild == null) {
    parentNode.lastChild = newLast;
  } else {
    nextChild.previousSibling = newLast;
  }

  do {
    newFirst.parentNode = parentNode;
  } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));

  _onUpdateChild(parentNode.ownerDocument || parentNode, parentNode);

  if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
    newChild.firstChild = newChild.lastChild = null;
  }

  return newChild;
}

function _appendSingleChild(parentNode, newChild) {
  var cp = newChild.parentNode;

  if (cp) {
    var pre = parentNode.lastChild;
    cp.removeChild(newChild);
    var pre = parentNode.lastChild;
  }

  var pre = parentNode.lastChild;
  newChild.parentNode = parentNode;
  newChild.previousSibling = pre;
  newChild.nextSibling = null;

  if (pre) {
    pre.nextSibling = newChild;
  } else {
    parentNode.firstChild = newChild;
  }

  parentNode.lastChild = newChild;

  _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);

  return newChild;
}

Document.prototype = {
  nodeName: '#document',
  nodeType: DOCUMENT_NODE,
  doctype: null,
  documentElement: null,
  _inc: 1,
  insertBefore: function insertBefore(newChild, refChild) {
    if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
      var child = newChild.firstChild;

      while (child) {
        var next = child.nextSibling;
        this.insertBefore(child, refChild);
        child = next;
      }

      return newChild;
    }

    if (this.documentElement == null && newChild.nodeType == ELEMENT_NODE) {
      this.documentElement = newChild;
    }

    return _insertBefore(this, newChild, refChild), newChild.ownerDocument = this, newChild;
  },
  removeChild: function removeChild(oldChild) {
    if (this.documentElement == oldChild) {
      this.documentElement = null;
    }

    return _removeChild(this, oldChild);
  },
  importNode: function importNode(importedNode, deep) {
    return _importNode(this, importedNode, deep);
  },
  getElementById: function getElementById(id) {
    var rtv = null;

    _visitNode(this.documentElement, function (node) {
      if (node.nodeType == ELEMENT_NODE) {
        if (node.getAttribute('id') == id) {
          rtv = node;
          return true;
        }
      }
    });

    return rtv;
  },
  createElement: function createElement(tagName) {
    var node = new Element();
    node.ownerDocument = this;
    node.nodeName = tagName;
    node.tagName = tagName;
    node.childNodes = new NodeList();
    var attrs = node.attributes = new NamedNodeMap();
    attrs._ownerElement = node;
    return node;
  },
  createDocumentFragment: function createDocumentFragment() {
    var node = new DocumentFragment();
    node.ownerDocument = this;
    node.childNodes = new NodeList();
    return node;
  },
  createTextNode: function createTextNode(data) {
    var node = new Text();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createComment: function createComment(data) {
    var node = new Comment();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createCDATASection: function createCDATASection(data) {
    var node = new CDATASection();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createProcessingInstruction: function createProcessingInstruction(target, data) {
    var node = new ProcessingInstruction();
    node.ownerDocument = this;
    node.tagName = node.target = target;
    node.nodeValue = node.data = data;
    return node;
  },
  createAttribute: function createAttribute(name) {
    var node = new Attr();
    node.ownerDocument = this;
    node.name = name;
    node.nodeName = name;
    node.localName = name;
    node.specified = true;
    return node;
  },
  createEntityReference: function createEntityReference(name) {
    var node = new EntityReference();
    node.ownerDocument = this;
    node.nodeName = name;
    return node;
  },
  createElementNS: function createElementNS(namespaceURI, qualifiedName) {
    var node = new Element();
    var pl = qualifiedName.split(':');
    var attrs = node.attributes = new NamedNodeMap();
    node.childNodes = new NodeList();
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.tagName = qualifiedName;
    node.namespaceURI = namespaceURI;

    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      node.localName = qualifiedName;
    }

    attrs._ownerElement = node;
    return node;
  },
  createAttributeNS: function createAttributeNS(namespaceURI, qualifiedName) {
    var node = new Attr();
    var pl = qualifiedName.split(':');
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.name = qualifiedName;
    node.namespaceURI = namespaceURI;
    node.specified = true;

    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      node.localName = qualifiedName;
    }

    return node;
  }
};

_extends(Document, Node);

function Element() {
  this._nsMap = {};
}

;
Element.prototype = {
  nodeType: ELEMENT_NODE,
  hasAttribute: function hasAttribute(name) {
    return this.getAttributeNode(name) != null;
  },
  getAttribute: function getAttribute(name) {
    var attr = this.getAttributeNode(name);
    return attr && attr.value || '';
  },
  getAttributeNode: function getAttributeNode(name) {
    return this.attributes.getNamedItem(name);
  },
  setAttribute: function setAttribute(name, value) {
    var attr = this.ownerDocument.createAttribute(name);
    attr.value = attr.nodeValue = "" + value;
    this.setAttributeNode(attr);
  },
  removeAttribute: function removeAttribute(name) {
    var attr = this.getAttributeNode(name);
    attr && this.removeAttributeNode(attr);
  },
  appendChild: function appendChild(newChild) {
    if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
      return this.insertBefore(newChild, null);
    } else {
      return _appendSingleChild(this, newChild);
    }
  },
  setAttributeNode: function setAttributeNode(newAttr) {
    return this.attributes.setNamedItem(newAttr);
  },
  setAttributeNodeNS: function setAttributeNodeNS(newAttr) {
    return this.attributes.setNamedItemNS(newAttr);
  },
  removeAttributeNode: function removeAttributeNode(oldAttr) {
    return this.attributes.removeNamedItem(oldAttr.nodeName);
  },
  removeAttributeNS: function removeAttributeNS(namespaceURI, localName) {
    var old = this.getAttributeNodeNS(namespaceURI, localName);
    old && this.removeAttributeNode(old);
  },
  hasAttributeNS: function hasAttributeNS(namespaceURI, localName) {
    return this.getAttributeNodeNS(namespaceURI, localName) != null;
  },
  getAttributeNS: function getAttributeNS(namespaceURI, localName) {
    var attr = this.getAttributeNodeNS(namespaceURI, localName);
    return attr && attr.value || '';
  },
  setAttributeNS: function setAttributeNS(namespaceURI, qualifiedName, value) {
    var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
    attr.value = attr.nodeValue = "" + value;
    this.setAttributeNode(attr);
  },
  getAttributeNodeNS: function getAttributeNodeNS(namespaceURI, localName) {
    return this.attributes.getNamedItemNS(namespaceURI, localName);
  },
  getElementsByTagName: function getElementsByTagName(tagName) {
    return new LiveNodeList(this, function (base) {
      var ls = [];

      _visitNode(base, function (node) {
        if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)) {
          ls.push(node);
        }
      });

      return ls;
    });
  },
  getElementsByTagNameNS: function getElementsByTagNameNS(namespaceURI, localName) {
    return new LiveNodeList(this, function (base) {
      var ls = [];

      _visitNode(base, function (node) {
        if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)) {
          ls.push(node);
        }
      });

      return ls;
    });
  }
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;

_extends(Element, Node);

function Attr() {}

;
Attr.prototype.nodeType = ATTRIBUTE_NODE;

_extends(Attr, Node);

function CharacterData() {}

;
CharacterData.prototype = {
  data: '',
  substringData: function substringData(offset, count) {
    return this.data.substring(offset, offset + count);
  },
  appendData: function appendData(text) {
    text = this.data + text;
    this.nodeValue = this.data = text;
    this.length = text.length;
  },
  insertData: function insertData(offset, text) {
    this.replaceData(offset, 0, text);
  },
  appendChild: function appendChild(newChild) {
    throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
  },
  deleteData: function deleteData(offset, count) {
    this.replaceData(offset, count, "");
  },
  replaceData: function replaceData(offset, count, text) {
    var start = this.data.substring(0, offset);
    var end = this.data.substring(offset + count);
    text = start + text + end;
    this.nodeValue = this.data = text;
    this.length = text.length;
  }
};

_extends(CharacterData, Node);

function Text() {}

;
Text.prototype = {
  nodeName: "#text",
  nodeType: TEXT_NODE,
  splitText: function splitText(offset) {
    var text = this.data;
    var newText = text.substring(offset);
    text = text.substring(0, offset);
    this.data = this.nodeValue = text;
    this.length = text.length;
    var newNode = this.ownerDocument.createTextNode(newText);

    if (this.parentNode) {
      this.parentNode.insertBefore(newNode, this.nextSibling);
    }

    return newNode;
  }
};

_extends(Text, CharacterData);

function Comment() {}

;
Comment.prototype = {
  nodeName: "#comment",
  nodeType: COMMENT_NODE
};

_extends(Comment, CharacterData);

function CDATASection() {}

;
CDATASection.prototype = {
  nodeName: "#cdata-section",
  nodeType: CDATA_SECTION_NODE
};

_extends(CDATASection, CharacterData);

function DocumentType() {}

;
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;

_extends(DocumentType, Node);

function Notation() {}

;
Notation.prototype.nodeType = NOTATION_NODE;

_extends(Notation, Node);

function Entity() {}

;
Entity.prototype.nodeType = ENTITY_NODE;

_extends(Entity, Node);

function EntityReference() {}

;
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;

_extends(EntityReference, Node);

function DocumentFragment() {}

;
DocumentFragment.prototype.nodeName = "#document-fragment";
DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;

_extends(DocumentFragment, Node);

function ProcessingInstruction() {}

ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;

_extends(ProcessingInstruction, Node);

function XMLSerializer() {}

XMLSerializer.prototype.serializeToString = function (node, isHtml, nodeFilter) {
  return nodeSerializeToString.call(node, isHtml, nodeFilter);
};

Node.prototype.toString = nodeSerializeToString;

function nodeSerializeToString(isHtml, nodeFilter) {
  var buf = [];
  var refNode = this.nodeType == 9 && this.documentElement || this;
  var prefix = refNode.prefix;
  var uri = refNode.namespaceURI;

  if (uri && prefix == null) {
    var prefix = refNode.lookupPrefix(uri);

    if (prefix == null) {
      var visibleNamespaces = [{
        namespace: uri,
        prefix: null
      }];
    }
  }

  serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces);
  return buf.join('');
}

function needNamespaceDefine(node, isHTML, visibleNamespaces) {
  var prefix = node.prefix || '';
  var uri = node.namespaceURI;

  if (!prefix && !uri) {
    return false;
  }

  if (prefix === "xml" && uri === "http://www.w3.org/XML/1998/namespace" || uri == 'http://www.w3.org/2000/xmlns/') {
    return false;
  }

  var i = visibleNamespaces.length;

  while (i--) {
    var ns = visibleNamespaces[i];

    if (ns.prefix == prefix) {
      return ns.namespace != uri;
    }
  }

  return true;
}

function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces) {
  if (nodeFilter) {
    node = nodeFilter(node);

    if (node) {
      if (typeof node == 'string') {
        buf.push(node);
        return;
      }
    } else {
      return;
    }
  }

  switch (node.nodeType) {
    case ELEMENT_NODE:
      if (!visibleNamespaces) visibleNamespaces = [];
      var startVisibleNamespaces = visibleNamespaces.length;
      var attrs = node.attributes;
      var len = attrs.length;
      var child = node.firstChild;
      var nodeName = node.tagName;
      isHTML = htmlns === node.namespaceURI || isHTML;
      buf.push('<', nodeName);

      for (var i = 0; i < len; i++) {
        var attr = attrs.item(i);

        if (attr.prefix == 'xmlns') {
          visibleNamespaces.push({
            prefix: attr.localName,
            namespace: attr.value
          });
        } else if (attr.nodeName == 'xmlns') {
          visibleNamespaces.push({
            prefix: '',
            namespace: attr.value
          });
        }
      }

      for (var i = 0; i < len; i++) {
        var attr = attrs.item(i);

        if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
          var prefix = attr.prefix || '';
          var uri = attr.namespaceURI;
          var ns = prefix ? ' xmlns:' + prefix : " xmlns";
          buf.push(ns, '="', uri, '"');
          visibleNamespaces.push({
            prefix: prefix,
            namespace: uri
          });
        }

        serializeToString(attr, buf, isHTML, nodeFilter, visibleNamespaces);
      }

      if (needNamespaceDefine(node, isHTML, visibleNamespaces)) {
        var prefix = node.prefix || '';
        var uri = node.namespaceURI;
        var ns = prefix ? ' xmlns:' + prefix : " xmlns";
        buf.push(ns, '="', uri, '"');
        visibleNamespaces.push({
          prefix: prefix,
          namespace: uri
        });
      }

      if (child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
        buf.push('>');

        if (isHTML && /^script$/i.test(nodeName)) {
          while (child) {
            if (child.data) {
              buf.push(child.data);
            } else {
              serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces);
            }

            child = child.nextSibling;
          }
        } else {
          while (child) {
            serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces);
            child = child.nextSibling;
          }
        }

        buf.push('</', nodeName, '>');
      } else {
        buf.push('/>');
      }

      return;

    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      var child = node.firstChild;

      while (child) {
        serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces);
        child = child.nextSibling;
      }

      return;

    case ATTRIBUTE_NODE:
      return buf.push(' ', node.name, '="', node.value.replace(/[<&"]/g, _xmlEncoder), '"');

    case TEXT_NODE:
      return buf.push(node.data.replace(/[<&]/g, _xmlEncoder));

    case CDATA_SECTION_NODE:
      return buf.push('<![CDATA[', node.data, ']]>');

    case COMMENT_NODE:
      return buf.push("<!--", node.data, "-->");

    case DOCUMENT_TYPE_NODE:
      var pubid = node.publicId;
      var sysid = node.systemId;
      buf.push('<!DOCTYPE ', node.name);

      if (pubid) {
        buf.push(' PUBLIC "', pubid);

        if (sysid && sysid != '.') {
          buf.push('" "', sysid);
        }

        buf.push('">');
      } else if (sysid && sysid != '.') {
        buf.push(' SYSTEM "', sysid, '">');
      } else {
        var sub = node.internalSubset;

        if (sub) {
          buf.push(" [", sub, "]");
        }

        buf.push(">");
      }

      return;

    case PROCESSING_INSTRUCTION_NODE:
      return buf.push("<?", node.target, " ", node.data, "?>");

    case ENTITY_REFERENCE_NODE:
      return buf.push('&', node.nodeName, ';');

    default:
      buf.push('??', node.nodeName);
  }
}

function _importNode(doc, node, deep) {
  var node2;

  switch (node.nodeType) {
    case ELEMENT_NODE:
      node2 = node.cloneNode(false);
      node2.ownerDocument = doc;

    case DOCUMENT_FRAGMENT_NODE:
      break;

    case ATTRIBUTE_NODE:
      deep = true;
      break;
  }

  if (!node2) {
    node2 = node.cloneNode(false);
  }

  node2.ownerDocument = doc;
  node2.parentNode = null;

  if (deep) {
    var child = node.firstChild;

    while (child) {
      node2.appendChild(_importNode(doc, child, deep));
      child = child.nextSibling;
    }
  }

  return node2;
}

function _cloneNode(doc, node, deep) {
  var node2 = new node.constructor();

  for (var n in node) {
    var v = node[n];

    if (_typeof(v) != 'object') {
      if (v != node2[n]) {
        node2[n] = v;
      }
    }
  }

  if (node.childNodes) {
    node2.childNodes = new NodeList();
  }

  node2.ownerDocument = doc;

  switch (node2.nodeType) {
    case ELEMENT_NODE:
      var attrs = node.attributes;
      var attrs2 = node2.attributes = new NamedNodeMap();
      var len = attrs.length;
      attrs2._ownerElement = node2;

      for (var i = 0; i < len; i++) {
        node2.setAttributeNode(_cloneNode(doc, attrs.item(i), true));
      }

      break;
      ;

    case ATTRIBUTE_NODE:
      deep = true;
  }

  if (deep) {
    var child = node.firstChild;

    while (child) {
      node2.appendChild(_cloneNode(doc, child, deep));
      child = child.nextSibling;
    }
  }

  return node2;
}

function __set__(object, key, value) {
  object[key] = value;
}

try {
  if (Object.defineProperty) {
    var getTextContent = function getTextContent(node) {
      switch (node.nodeType) {
        case ELEMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          var buf = [];
          node = node.firstChild;

          while (node) {
            if (node.nodeType !== 7 && node.nodeType !== 8) {
              buf.push(getTextContent(node));
            }

            node = node.nextSibling;
          }

          return buf.join('');

        default:
          return node.nodeValue;
      }
    };

    Object.defineProperty(LiveNodeList.prototype, 'length', {
      get: function get() {
        _updateLiveList(this);

        return this.$$length;
      }
    });
    Object.defineProperty(Node.prototype, 'textContent', {
      get: function get() {
        return getTextContent(this);
      },
      set: function set(data) {
        switch (this.nodeType) {
          case ELEMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE:
            while (this.firstChild) {
              this.removeChild(this.firstChild);
            }

            if (data || String(data)) {
              this.appendChild(this.ownerDocument.createTextNode(data));
            }

            break;

          default:
            this.data = data;
            this.value = data;
            this.nodeValue = data;
        }
      }
    });

    __set__ = function __set__(object, key, value) {
      object['$$' + key] = value;
    };
  }
} catch (e) {}

exports.DOMImplementation = DOMImplementation;
exports.XMLSerializer = XMLSerializer;

},{}],60:[function(require,module,exports){
"use strict";

exports.entityMap = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  Agrave: "À",
  Aacute: "Á",
  Acirc: "Â",
  Atilde: "Ã",
  Auml: "Ä",
  Aring: "Å",
  AElig: "Æ",
  Ccedil: "Ç",
  Egrave: "È",
  Eacute: "É",
  Ecirc: "Ê",
  Euml: "Ë",
  Igrave: "Ì",
  Iacute: "Í",
  Icirc: "Î",
  Iuml: "Ï",
  ETH: "Ð",
  Ntilde: "Ñ",
  Ograve: "Ò",
  Oacute: "Ó",
  Ocirc: "Ô",
  Otilde: "Õ",
  Ouml: "Ö",
  Oslash: "Ø",
  Ugrave: "Ù",
  Uacute: "Ú",
  Ucirc: "Û",
  Uuml: "Ü",
  Yacute: "Ý",
  THORN: "Þ",
  szlig: "ß",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  aelig: "æ",
  ccedil: "ç",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  eth: "ð",
  ntilde: "ñ",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  oslash: "ø",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  thorn: "þ",
  yuml: "ÿ",
  nbsp: " ",
  iexcl: "¡",
  cent: "¢",
  pound: "£",
  curren: "¤",
  yen: "¥",
  brvbar: "¦",
  sect: "§",
  uml: "¨",
  copy: "©",
  ordf: "ª",
  laquo: "«",
  not: "¬",
  shy: "­­",
  reg: "®",
  macr: "¯",
  deg: "°",
  plusmn: "±",
  sup2: "²",
  sup3: "³",
  acute: "´",
  micro: "µ",
  para: "¶",
  middot: "·",
  cedil: "¸",
  sup1: "¹",
  ordm: "º",
  raquo: "»",
  frac14: "¼",
  frac12: "½",
  frac34: "¾",
  iquest: "¿",
  times: "×",
  divide: "÷",
  forall: "∀",
  part: "∂",
  exist: "∃",
  empty: "∅",
  nabla: "∇",
  isin: "∈",
  notin: "∉",
  ni: "∋",
  prod: "∏",
  sum: "∑",
  minus: "−",
  lowast: "∗",
  radic: "√",
  prop: "∝",
  infin: "∞",
  ang: "∠",
  and: "∧",
  or: "∨",
  cap: "∩",
  cup: "∪",
  'int': "∫",
  there4: "∴",
  sim: "∼",
  cong: "≅",
  asymp: "≈",
  ne: "≠",
  equiv: "≡",
  le: "≤",
  ge: "≥",
  sub: "⊂",
  sup: "⊃",
  nsub: "⊄",
  sube: "⊆",
  supe: "⊇",
  oplus: "⊕",
  otimes: "⊗",
  perp: "⊥",
  sdot: "⋅",
  Alpha: "Α",
  Beta: "Β",
  Gamma: "Γ",
  Delta: "Δ",
  Epsilon: "Ε",
  Zeta: "Ζ",
  Eta: "Η",
  Theta: "Θ",
  Iota: "Ι",
  Kappa: "Κ",
  Lambda: "Λ",
  Mu: "Μ",
  Nu: "Ν",
  Xi: "Ξ",
  Omicron: "Ο",
  Pi: "Π",
  Rho: "Ρ",
  Sigma: "Σ",
  Tau: "Τ",
  Upsilon: "Υ",
  Phi: "Φ",
  Chi: "Χ",
  Psi: "Ψ",
  Omega: "Ω",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigmaf: "ς",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  thetasym: "ϑ",
  upsih: "ϒ",
  piv: "ϖ",
  OElig: "Œ",
  oelig: "œ",
  Scaron: "Š",
  scaron: "š",
  Yuml: "Ÿ",
  fnof: "ƒ",
  circ: "ˆ",
  tilde: "˜",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  zwnj: "‌",
  zwj: "‍",
  lrm: "‎",
  rlm: "‏",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  dagger: "†",
  Dagger: "‡",
  bull: "•",
  hellip: "…",
  permil: "‰",
  prime: "′",
  Prime: "″",
  lsaquo: "‹",
  rsaquo: "›",
  oline: "‾",
  euro: "€",
  trade: "™",
  larr: "←",
  uarr: "↑",
  rarr: "→",
  darr: "↓",
  harr: "↔",
  crarr: "↵",
  lceil: "⌈",
  rceil: "⌉",
  lfloor: "⌊",
  rfloor: "⌋",
  loz: "◊",
  spades: "♠",
  clubs: "♣",
  hearts: "♥",
  diams: "♦"
};

},{}],61:[function(require,module,exports){
"use strict";

var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
var tagNamePattern = new RegExp('^' + nameStartChar.source + nameChar.source + '*(?:\:' + nameStartChar.source + nameChar.source + '*)?$');
var S_TAG = 0;
var S_ATTR = 1;
var S_ATTR_SPACE = 2;
var S_EQ = 3;
var S_ATTR_NOQUOT_VALUE = 4;
var S_ATTR_END = 5;
var S_TAG_SPACE = 6;
var S_TAG_CLOSE = 7;

function XMLReader() {}

XMLReader.prototype = {
  parse: function parse(source, defaultNSMap, entityMap) {
    var domBuilder = this.domBuilder;
    domBuilder.startDocument();

    _copy(defaultNSMap, defaultNSMap = {});

    _parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);

    domBuilder.endDocument();
  }
};

function _parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
  function fixedFromCharCode(code) {
    if (code > 0xffff) {
      code -= 0x10000;
      var surrogate1 = 0xd800 + (code >> 10),
          surrogate2 = 0xdc00 + (code & 0x3ff);
      return String.fromCharCode(surrogate1, surrogate2);
    } else {
      return String.fromCharCode(code);
    }
  }

  function entityReplacer(a) {
    var k = a.slice(1, -1);

    if (k in entityMap) {
      return entityMap[k];
    } else if (k.charAt(0) === '#') {
      return fixedFromCharCode(parseInt(k.substr(1).replace('x', '0x')));
    } else {
      errorHandler.error('entity not found:' + a);
      return a;
    }
  }

  function appendText(end) {
    if (end > start) {
      var xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
      locator && position(start);
      domBuilder.characters(xt, 0, end - start);
      start = end;
    }
  }

  function position(p, m) {
    while (p >= lineEnd && (m = linePattern.exec(source))) {
      lineStart = m.index;
      lineEnd = lineStart + m[0].length;
      locator.lineNumber++;
    }

    locator.columnNumber = p - lineStart + 1;
  }

  var lineStart = 0;
  var lineEnd = 0;
  var linePattern = /.*(?:\r\n?|\n)|.*$/g;
  var locator = domBuilder.locator;
  var parseStack = [{
    currentNSMap: defaultNSMapCopy
  }];
  var closeMap = {};
  var start = 0;

  while (true) {
    try {
      var tagStart = source.indexOf('<', start);

      if (tagStart < 0) {
        if (!source.substr(start).match(/^\s*$/)) {
          var doc = domBuilder.doc;
          var text = doc.createTextNode(source.substr(start));
          doc.appendChild(text);
          domBuilder.currentElement = text;
        }

        return;
      }

      if (tagStart > start) {
        appendText(tagStart);
      }

      switch (source.charAt(tagStart + 1)) {
        case '/':
          var end = source.indexOf('>', tagStart + 3);
          var tagName = source.substring(tagStart + 2, end);
          var config = parseStack.pop();

          if (end < 0) {
            tagName = source.substring(tagStart + 2).replace(/[\s<].*/, '');
            errorHandler.error("end tag name: " + tagName + ' is not complete:' + config.tagName);
            end = tagStart + 1 + tagName.length;
          } else if (tagName.match(/\s</)) {
            tagName = tagName.replace(/[\s<].*/, '');
            errorHandler.error("end tag name: " + tagName + ' maybe not complete');
            end = tagStart + 1 + tagName.length;
          }

          var localNSMap = config.localNSMap;
          var endMatch = config.tagName == tagName;
          var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();

          if (endIgnoreCaseMach) {
            domBuilder.endElement(config.uri, config.localName, tagName);

            if (localNSMap) {
              for (var prefix in localNSMap) {
                domBuilder.endPrefixMapping(prefix);
              }
            }

            if (!endMatch) {
              errorHandler.fatalError("end tag name: " + tagName + ' is not match the current start tagName:' + config.tagName);
            }
          } else {
            parseStack.push(config);
          }

          end++;
          break;

        case '?':
          locator && position(tagStart);
          end = parseInstruction(source, tagStart, domBuilder);
          break;

        case '!':
          locator && position(tagStart);
          end = parseDCC(source, tagStart, domBuilder, errorHandler);
          break;

        default:
          locator && position(tagStart);
          var el = new ElementAttributes();
          var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
          var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
          var len = el.length;

          if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
            el.closed = true;

            if (!entityMap.nbsp) {
              errorHandler.warning('unclosed xml attribute');
            }
          }

          if (locator && len) {
            var locator2 = copyLocator(locator, {});

            for (var i = 0; i < len; i++) {
              var a = el[i];
              position(a.offset);
              a.locator = copyLocator(locator, {});
            }

            domBuilder.locator = locator2;

            if (appendElement(el, domBuilder, currentNSMap)) {
              parseStack.push(el);
            }

            domBuilder.locator = locator;
          } else {
            if (appendElement(el, domBuilder, currentNSMap)) {
              parseStack.push(el);
            }
          }

          if (el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed) {
            end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
          } else {
            end++;
          }

      }
    } catch (e) {
      errorHandler.error('element parse error: ' + e);
      end = -1;
    }

    if (end > start) {
      start = end;
    } else {
      appendText(Math.max(tagStart, start) + 1);
    }
  }
}

function copyLocator(f, t) {
  t.lineNumber = f.lineNumber;
  t.columnNumber = f.columnNumber;
  return t;
}

function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
  var attrName;
  var value;
  var p = ++start;
  var s = S_TAG;

  while (true) {
    var c = source.charAt(p);

    switch (c) {
      case '=':
        if (s === S_ATTR) {
          attrName = source.slice(start, p);
          s = S_EQ;
        } else if (s === S_ATTR_SPACE) {
          s = S_EQ;
        } else {
          throw new Error('attribute equal must after attrName');
        }

        break;

      case '\'':
      case '"':
        if (s === S_EQ || s === S_ATTR) {
            if (s === S_ATTR) {
              errorHandler.warning('attribute value must after "="');
              attrName = source.slice(start, p);
            }

            start = p + 1;
            p = source.indexOf(c, start);

            if (p > 0) {
              value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
              el.add(attrName, value, start - 1);
              s = S_ATTR_END;
            } else {
              throw new Error('attribute value no end \'' + c + '\' match');
            }
          } else if (s == S_ATTR_NOQUOT_VALUE) {
          value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
          el.add(attrName, value, start);
          errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ')!!');
          start = p + 1;
          s = S_ATTR_END;
        } else {
          throw new Error('attribute value must after "="');
        }

        break;

      case '/':
        switch (s) {
          case S_TAG:
            el.setTagName(source.slice(start, p));

          case S_ATTR_END:
          case S_TAG_SPACE:
          case S_TAG_CLOSE:
            s = S_TAG_CLOSE;
            el.closed = true;

          case S_ATTR_NOQUOT_VALUE:
          case S_ATTR:
          case S_ATTR_SPACE:
            break;

          default:
            throw new Error("attribute invalid close char('/')");
        }

        break;

      case '':
        errorHandler.error('unexpected end of input');

        if (s == S_TAG) {
          el.setTagName(source.slice(start, p));
        }

        return p;

      case '>':
        switch (s) {
          case S_TAG:
            el.setTagName(source.slice(start, p));

          case S_ATTR_END:
          case S_TAG_SPACE:
          case S_TAG_CLOSE:
            break;

          case S_ATTR_NOQUOT_VALUE:
          case S_ATTR:
            value = source.slice(start, p);

            if (value.slice(-1) === '/') {
              el.closed = true;
              value = value.slice(0, -1);
            }

          case S_ATTR_SPACE:
            if (s === S_ATTR_SPACE) {
              value = attrName;
            }

            if (s == S_ATTR_NOQUOT_VALUE) {
              errorHandler.warning('attribute "' + value + '" missed quot(")!!');
              el.add(attrName, value.replace(/&#?\w+;/g, entityReplacer), start);
            } else {
              if (currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !value.match(/^(?:disabled|checked|selected)$/i)) {
                errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
              }

              el.add(value, value, start);
            }

            break;

          case S_EQ:
            throw new Error('attribute value missed!!');
        }

        return p;

      case "\x80":
        c = ' ';

      default:
        if (c <= ' ') {
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p));
              s = S_TAG_SPACE;
              break;

            case S_ATTR:
              attrName = source.slice(start, p);
              s = S_ATTR_SPACE;
              break;

            case S_ATTR_NOQUOT_VALUE:
              var value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
              errorHandler.warning('attribute "' + value + '" missed quot(")!!');
              el.add(attrName, value, start);

            case S_ATTR_END:
              s = S_TAG_SPACE;
              break;
          }
        } else {
          switch (s) {
            case S_ATTR_SPACE:
              var tagName = el.tagName;

              if (currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
                errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
              }

              el.add(attrName, attrName, start);
              start = p;
              s = S_ATTR;
              break;

            case S_ATTR_END:
              errorHandler.warning('attribute space is required"' + attrName + '"!!');

            case S_TAG_SPACE:
              s = S_ATTR;
              start = p;
              break;

            case S_EQ:
              s = S_ATTR_NOQUOT_VALUE;
              start = p;
              break;

            case S_TAG_CLOSE:
              throw new Error("elements closed character '/' and '>' must be connected to");
          }
        }

    }

    p++;
  }
}

function appendElement(el, domBuilder, currentNSMap) {
  var tagName = el.tagName;
  var localNSMap = null;
  var i = el.length;

  while (i--) {
    var a = el[i];
    var qName = a.qName;
    var value = a.value;
    var nsp = qName.indexOf(':');

    if (nsp > 0) {
      var prefix = a.prefix = qName.slice(0, nsp);
      var localName = qName.slice(nsp + 1);
      var nsPrefix = prefix === 'xmlns' && localName;
    } else {
      localName = qName;
      prefix = null;
      nsPrefix = qName === 'xmlns' && '';
    }

    a.localName = localName;

    if (nsPrefix !== false) {
      if (localNSMap == null) {
        localNSMap = {};

        _copy(currentNSMap, currentNSMap = {});
      }

      currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
      a.uri = 'http://www.w3.org/2000/xmlns/';
      domBuilder.startPrefixMapping(nsPrefix, value);
    }
  }

  var i = el.length;

  while (i--) {
    a = el[i];
    var prefix = a.prefix;

    if (prefix) {
      if (prefix === 'xml') {
        a.uri = 'http://www.w3.org/XML/1998/namespace';
      }

      if (prefix !== 'xmlns') {
        a.uri = currentNSMap[prefix || ''];
      }
    }
  }

  var nsp = tagName.indexOf(':');

  if (nsp > 0) {
    prefix = el.prefix = tagName.slice(0, nsp);
    localName = el.localName = tagName.slice(nsp + 1);
  } else {
    prefix = null;
    localName = el.localName = tagName;
  }

  var ns = el.uri = currentNSMap[prefix || ''];
  domBuilder.startElement(ns, localName, tagName, el);

  if (el.closed) {
    domBuilder.endElement(ns, localName, tagName);

    if (localNSMap) {
      for (prefix in localNSMap) {
        domBuilder.endPrefixMapping(prefix);
      }
    }
  } else {
    el.currentNSMap = currentNSMap;
    el.localNSMap = localNSMap;
    return true;
  }
}

function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
  if (/^(?:script|textarea)$/i.test(tagName)) {
    var elEndStart = source.indexOf('</' + tagName + '>', elStartEnd);
    var text = source.substring(elStartEnd + 1, elEndStart);

    if (/[&<]/.test(text)) {
      if (/^script$/i.test(tagName)) {
        domBuilder.characters(text, 0, text.length);
        return elEndStart;
      }

      text = text.replace(/&#?\w+;/g, entityReplacer);
      domBuilder.characters(text, 0, text.length);
      return elEndStart;
    }
  }

  return elStartEnd + 1;
}

function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
  var pos = closeMap[tagName];

  if (pos == null) {
    pos = source.lastIndexOf('</' + tagName + '>');

    if (pos < elStartEnd) {
      pos = source.lastIndexOf('</' + tagName);
    }

    closeMap[tagName] = pos;
  }

  return pos < elStartEnd;
}

function _copy(source, target) {
  for (var n in source) {
    target[n] = source[n];
  }
}

function parseDCC(source, start, domBuilder, errorHandler) {
  var next = source.charAt(start + 2);

  switch (next) {
    case '-':
      if (source.charAt(start + 3) === '-') {
        var end = source.indexOf('-->', start + 4);

        if (end > start) {
          domBuilder.comment(source, start + 4, end - start - 4);
          return end + 3;
        } else {
          errorHandler.error("Unclosed comment");
          return -1;
        }
      } else {
        return -1;
      }

    default:
      if (source.substr(start + 3, 6) == 'CDATA[') {
        var end = source.indexOf(']]>', start + 9);
        domBuilder.startCDATA();
        domBuilder.characters(source, start + 9, end - start - 9);
        domBuilder.endCDATA();
        return end + 3;
      }

      var matchs = split(source, start);
      var len = matchs.length;

      if (len > 1 && /!doctype/i.test(matchs[0][0])) {
        var name = matchs[1][0];
        var pubid = len > 3 && /^public$/i.test(matchs[2][0]) && matchs[3][0];
        var sysid = len > 4 && matchs[4][0];
        var lastMatch = matchs[len - 1];
        domBuilder.startDTD(name, pubid && pubid.replace(/^(['"])(.*?)\1$/, '$2'), sysid && sysid.replace(/^(['"])(.*?)\1$/, '$2'));
        domBuilder.endDTD();
        return lastMatch.index + lastMatch[0].length;
      }

  }

  return -1;
}

function parseInstruction(source, start, domBuilder) {
  var end = source.indexOf('?>', start);

  if (end) {
    var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);

    if (match) {
      var len = match[0].length;
      domBuilder.processingInstruction(match[1], match[2]);
      return end + 2;
    } else {
      return -1;
    }
  }

  return -1;
}

function ElementAttributes(source) {}

ElementAttributes.prototype = {
  setTagName: function setTagName(tagName) {
    if (!tagNamePattern.test(tagName)) {
      throw new Error('invalid tagName:' + tagName);
    }

    this.tagName = tagName;
  },
  add: function add(qName, value, offset) {
    if (!tagNamePattern.test(qName)) {
      throw new Error('invalid attribute:' + qName);
    }

    this[this.length++] = {
      qName: qName,
      value: value,
      offset: offset
    };
  },
  length: 0,
  getLocalName: function getLocalName(i) {
    return this[i].localName;
  },
  getLocator: function getLocator(i) {
    return this[i].locator;
  },
  getQName: function getQName(i) {
    return this[i].qName;
  },
  getURI: function getURI(i) {
    return this[i].uri;
  },
  getValue: function getValue(i) {
    return this[i].value;
  }
};

function split(source, start) {
  var match;
  var buf = [];
  var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
  reg.lastIndex = start;
  reg.exec(source);

  while (match = reg.exec(source)) {
    buf.push(match);
    if (match[1]) return buf;
  }
}

exports.XMLReader = XMLReader;

},{}]},{},[57]);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ3ZWItYWRhcHRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpKHsxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG4hZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBlKGUpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBlO1xuICB9XG5cbiAgdmFyIHQgPSBcInVuZGVmaW5lZFwiICE9IHR5cGVvZiBleHBvcnRzID8gZXhwb3J0cyA6IFwidW5kZWZpbmVkXCIgIT0gdHlwZW9mIHNlbGYgPyBzZWxmIDogJC5nbG9iYWwsXG4gICAgICByID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiO1xuICBlLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpLCBlLnByb3RvdHlwZS5uYW1lID0gXCJJbnZhbGlkQ2hhcmFjdGVyRXJyb3JcIiwgdC5idG9hIHx8ICh0LmJ0b2EgPSBmdW5jdGlvbiAodCkge1xuICAgIGZvciAodmFyIG8sIG4sIGEgPSBTdHJpbmcodCksIGkgPSAwLCBmID0gciwgYyA9IFwiXCI7IGEuY2hhckF0KDAgfCBpKSB8fCAoZiA9IFwiPVwiLCBpICUgMSk7IGMgKz0gZi5jaGFyQXQoNjMgJiBvID4+IDggLSBpICUgMSAqIDgpKSB7XG4gICAgICBpZiAobiA9IGEuY2hhckNvZGVBdChpICs9IC43NSksIG4gPiAyNTUpIHRocm93IG5ldyBlKFwiJ2J0b2EnIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBlbmNvZGVkIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3V0c2lkZSBvZiB0aGUgTGF0aW4xIHJhbmdlLlwiKTtcbiAgICAgIG8gPSBvIDw8IDggfCBuO1xuICAgIH1cblxuICAgIHJldHVybiBjO1xuICB9KSwgdC5hdG9iIHx8ICh0LmF0b2IgPSBmdW5jdGlvbiAodCkge1xuICAgIHZhciBvID0gU3RyaW5nKHQpLnJlcGxhY2UoL1s9XSskLywgXCJcIik7XG4gICAgaWYgKG8ubGVuZ3RoICUgNCA9PSAxKSB0aHJvdyBuZXcgZShcIidhdG9iJyBmYWlsZWQ6IFRoZSBzdHJpbmcgdG8gYmUgZGVjb2RlZCBpcyBub3QgY29ycmVjdGx5IGVuY29kZWQuXCIpO1xuXG4gICAgZm9yICh2YXIgbiwgYSwgaSA9IDAsIGYgPSAwLCBjID0gXCJcIjsgYSA9IG8uY2hhckF0KGYrKyk7IH5hICYmIChuID0gaSAlIDQgPyA2NCAqIG4gKyBhIDogYSwgaSsrICUgNCkgPyBjICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjU1ICYgbiA+PiAoLTIgKiBpICYgNikpIDogMCkge1xuICAgICAgYSA9IHIuaW5kZXhPZihhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYztcbiAgfSk7XG59KCk7XG5cbn0se31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuIWZ1bmN0aW9uIChuKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIGZ1bmN0aW9uIHQobiwgdCkge1xuICAgIHZhciByID0gKDY1NTM1ICYgbikgKyAoNjU1MzUgJiB0KTtcbiAgICByZXR1cm4gKG4gPj4gMTYpICsgKHQgPj4gMTYpICsgKHIgPj4gMTYpIDw8IDE2IHwgNjU1MzUgJiByO1xuICB9XG5cbiAgZnVuY3Rpb24gcihuLCB0KSB7XG4gICAgcmV0dXJuIG4gPDwgdCB8IG4gPj4+IDMyIC0gdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGUobiwgZSwgbywgdSwgYywgZikge1xuICAgIHJldHVybiB0KHIodCh0KGUsIG4pLCB0KHUsIGYpKSwgYyksIG8pO1xuICB9XG5cbiAgZnVuY3Rpb24gbyhuLCB0LCByLCBvLCB1LCBjLCBmKSB7XG4gICAgcmV0dXJuIGUodCAmIHIgfCB+dCAmIG8sIG4sIHQsIHUsIGMsIGYpO1xuICB9XG5cbiAgZnVuY3Rpb24gdShuLCB0LCByLCBvLCB1LCBjLCBmKSB7XG4gICAgcmV0dXJuIGUodCAmIG8gfCByICYgfm8sIG4sIHQsIHUsIGMsIGYpO1xuICB9XG5cbiAgZnVuY3Rpb24gYyhuLCB0LCByLCBvLCB1LCBjLCBmKSB7XG4gICAgcmV0dXJuIGUodCBeIHIgXiBvLCBuLCB0LCB1LCBjLCBmKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGYobiwgdCwgciwgbywgdSwgYywgZikge1xuICAgIHJldHVybiBlKHIgXiAodCB8IH5vKSwgbiwgdCwgdSwgYywgZik7XG4gIH1cblxuICBmdW5jdGlvbiBpKG4sIHIpIHtcbiAgICBuW3IgPj4gNV0gfD0gMTI4IDw8IHIgJSAzMiwgblsxNCArIChyICsgNjQgPj4+IDkgPDwgNCldID0gcjtcbiAgICB2YXIgZSxcbiAgICAgICAgaSxcbiAgICAgICAgYSxcbiAgICAgICAgZCxcbiAgICAgICAgaCxcbiAgICAgICAgbCA9IDE3MzI1ODQxOTMsXG4gICAgICAgIGcgPSAtMjcxNzMzODc5LFxuICAgICAgICB2ID0gLTE3MzI1ODQxOTQsXG4gICAgICAgIG0gPSAyNzE3MzM4Nzg7XG5cbiAgICBmb3IgKGUgPSAwOyBlIDwgbi5sZW5ndGg7IGUgKz0gMTYpIHtcbiAgICAgIGkgPSBsLCBhID0gZywgZCA9IHYsIGggPSBtLCBnID0gZihnID0gZihnID0gZihnID0gZihnID0gYyhnID0gYyhnID0gYyhnID0gYyhnID0gdShnID0gdShnID0gdShnID0gdShnID0gbyhnID0gbyhnID0gbyhnID0gbyhnLCB2ID0gbyh2LCBtID0gbyhtLCBsID0gbyhsLCBnLCB2LCBtLCBuW2VdLCA3LCAtNjgwODc2OTM2KSwgZywgdiwgbltlICsgMV0sIDEyLCAtMzg5NTY0NTg2KSwgbCwgZywgbltlICsgMl0sIDE3LCA2MDYxMDU4MTkpLCBtLCBsLCBuW2UgKyAzXSwgMjIsIC0xMDQ0NTI1MzMwKSwgdiA9IG8odiwgbSA9IG8obSwgbCA9IG8obCwgZywgdiwgbSwgbltlICsgNF0sIDcsIC0xNzY0MTg4OTcpLCBnLCB2LCBuW2UgKyA1XSwgMTIsIDEyMDAwODA0MjYpLCBsLCBnLCBuW2UgKyA2XSwgMTcsIC0xNDczMjMxMzQxKSwgbSwgbCwgbltlICsgN10sIDIyLCAtNDU3MDU5ODMpLCB2ID0gbyh2LCBtID0gbyhtLCBsID0gbyhsLCBnLCB2LCBtLCBuW2UgKyA4XSwgNywgMTc3MDAzNTQxNiksIGcsIHYsIG5bZSArIDldLCAxMiwgLTE5NTg0MTQ0MTcpLCBsLCBnLCBuW2UgKyAxMF0sIDE3LCAtNDIwNjMpLCBtLCBsLCBuW2UgKyAxMV0sIDIyLCAtMTk5MDQwNDE2MiksIHYgPSBvKHYsIG0gPSBvKG0sIGwgPSBvKGwsIGcsIHYsIG0sIG5bZSArIDEyXSwgNywgMTgwNDYwMzY4MiksIGcsIHYsIG5bZSArIDEzXSwgMTIsIC00MDM0MTEwMSksIGwsIGcsIG5bZSArIDE0XSwgMTcsIC0xNTAyMDAyMjkwKSwgbSwgbCwgbltlICsgMTVdLCAyMiwgMTIzNjUzNTMyOSksIHYgPSB1KHYsIG0gPSB1KG0sIGwgPSB1KGwsIGcsIHYsIG0sIG5bZSArIDFdLCA1LCAtMTY1Nzk2NTEwKSwgZywgdiwgbltlICsgNl0sIDksIC0xMDY5NTAxNjMyKSwgbCwgZywgbltlICsgMTFdLCAxNCwgNjQzNzE3NzEzKSwgbSwgbCwgbltlXSwgMjAsIC0zNzM4OTczMDIpLCB2ID0gdSh2LCBtID0gdShtLCBsID0gdShsLCBnLCB2LCBtLCBuW2UgKyA1XSwgNSwgLTcwMTU1ODY5MSksIGcsIHYsIG5bZSArIDEwXSwgOSwgMzgwMTYwODMpLCBsLCBnLCBuW2UgKyAxNV0sIDE0LCAtNjYwNDc4MzM1KSwgbSwgbCwgbltlICsgNF0sIDIwLCAtNDA1NTM3ODQ4KSwgdiA9IHUodiwgbSA9IHUobSwgbCA9IHUobCwgZywgdiwgbSwgbltlICsgOV0sIDUsIDU2ODQ0NjQzOCksIGcsIHYsIG5bZSArIDE0XSwgOSwgLTEwMTk4MDM2OTApLCBsLCBnLCBuW2UgKyAzXSwgMTQsIC0xODczNjM5NjEpLCBtLCBsLCBuW2UgKyA4XSwgMjAsIDExNjM1MzE1MDEpLCB2ID0gdSh2LCBtID0gdShtLCBsID0gdShsLCBnLCB2LCBtLCBuW2UgKyAxM10sIDUsIC0xNDQ0NjgxNDY3KSwgZywgdiwgbltlICsgMl0sIDksIC01MTQwMzc4NCksIGwsIGcsIG5bZSArIDddLCAxNCwgMTczNTMyODQ3MyksIG0sIGwsIG5bZSArIDEyXSwgMjAsIC0xOTI2NjA3NzM0KSwgdiA9IGModiwgbSA9IGMobSwgbCA9IGMobCwgZywgdiwgbSwgbltlICsgNV0sIDQsIC0zNzg1NTgpLCBnLCB2LCBuW2UgKyA4XSwgMTEsIC0yMDIyNTc0NDYzKSwgbCwgZywgbltlICsgMTFdLCAxNiwgMTgzOTAzMDU2MiksIG0sIGwsIG5bZSArIDE0XSwgMjMsIC0zNTMwOTU1NiksIHYgPSBjKHYsIG0gPSBjKG0sIGwgPSBjKGwsIGcsIHYsIG0sIG5bZSArIDFdLCA0LCAtMTUzMDk5MjA2MCksIGcsIHYsIG5bZSArIDRdLCAxMSwgMTI3Mjg5MzM1MyksIGwsIGcsIG5bZSArIDddLCAxNiwgLTE1NTQ5NzYzMiksIG0sIGwsIG5bZSArIDEwXSwgMjMsIC0xMDk0NzMwNjQwKSwgdiA9IGModiwgbSA9IGMobSwgbCA9IGMobCwgZywgdiwgbSwgbltlICsgMTNdLCA0LCA2ODEyNzkxNzQpLCBnLCB2LCBuW2VdLCAxMSwgLTM1ODUzNzIyMiksIGwsIGcsIG5bZSArIDNdLCAxNiwgLTcyMjUyMTk3OSksIG0sIGwsIG5bZSArIDZdLCAyMywgNzYwMjkxODkpLCB2ID0gYyh2LCBtID0gYyhtLCBsID0gYyhsLCBnLCB2LCBtLCBuW2UgKyA5XSwgNCwgLTY0MDM2NDQ4NyksIGcsIHYsIG5bZSArIDEyXSwgMTEsIC00MjE4MTU4MzUpLCBsLCBnLCBuW2UgKyAxNV0sIDE2LCA1MzA3NDI1MjApLCBtLCBsLCBuW2UgKyAyXSwgMjMsIC05OTUzMzg2NTEpLCB2ID0gZih2LCBtID0gZihtLCBsID0gZihsLCBnLCB2LCBtLCBuW2VdLCA2LCAtMTk4NjMwODQ0KSwgZywgdiwgbltlICsgN10sIDEwLCAxMTI2ODkxNDE1KSwgbCwgZywgbltlICsgMTRdLCAxNSwgLTE0MTYzNTQ5MDUpLCBtLCBsLCBuW2UgKyA1XSwgMjEsIC01NzQzNDA1NSksIHYgPSBmKHYsIG0gPSBmKG0sIGwgPSBmKGwsIGcsIHYsIG0sIG5bZSArIDEyXSwgNiwgMTcwMDQ4NTU3MSksIGcsIHYsIG5bZSArIDNdLCAxMCwgLTE4OTQ5ODY2MDYpLCBsLCBnLCBuW2UgKyAxMF0sIDE1LCAtMTA1MTUyMyksIG0sIGwsIG5bZSArIDFdLCAyMSwgLTIwNTQ5MjI3OTkpLCB2ID0gZih2LCBtID0gZihtLCBsID0gZihsLCBnLCB2LCBtLCBuW2UgKyA4XSwgNiwgMTg3MzMxMzM1OSksIGcsIHYsIG5bZSArIDE1XSwgMTAsIC0zMDYxMTc0NCksIGwsIGcsIG5bZSArIDZdLCAxNSwgLTE1NjAxOTgzODApLCBtLCBsLCBuW2UgKyAxM10sIDIxLCAxMzA5MTUxNjQ5KSwgdiA9IGYodiwgbSA9IGYobSwgbCA9IGYobCwgZywgdiwgbSwgbltlICsgNF0sIDYsIC0xNDU1MjMwNzApLCBnLCB2LCBuW2UgKyAxMV0sIDEwLCAtMTEyMDIxMDM3OSksIGwsIGcsIG5bZSArIDJdLCAxNSwgNzE4Nzg3MjU5KSwgbSwgbCwgbltlICsgOV0sIDIxLCAtMzQzNDg1NTUxKSwgbCA9IHQobCwgaSksIGcgPSB0KGcsIGEpLCB2ID0gdCh2LCBkKSwgbSA9IHQobSwgaCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFtsLCBnLCB2LCBtXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGEobikge1xuICAgIHZhciB0LFxuICAgICAgICByID0gXCJcIixcbiAgICAgICAgZSA9IDMyICogbi5sZW5ndGg7XG5cbiAgICBmb3IgKHQgPSAwOyB0IDwgZTsgdCArPSA4KSB7XG4gICAgICByICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoblt0ID4+IDVdID4+PiB0ICUgMzIgJiAyNTUpO1xuICAgIH1cblxuICAgIHJldHVybiByO1xuICB9XG5cbiAgZnVuY3Rpb24gZChuKSB7XG4gICAgdmFyIHQsXG4gICAgICAgIHIgPSBbXTtcblxuICAgIGZvciAoclsobi5sZW5ndGggPj4gMikgLSAxXSA9IHZvaWQgMCwgdCA9IDA7IHQgPCByLmxlbmd0aDsgdCArPSAxKSB7XG4gICAgICByW3RdID0gMDtcbiAgICB9XG5cbiAgICB2YXIgZSA9IDggKiBuLmxlbmd0aDtcblxuICAgIGZvciAodCA9IDA7IHQgPCBlOyB0ICs9IDgpIHtcbiAgICAgIHJbdCA+PiA1XSB8PSAoMjU1ICYgbi5jaGFyQ29kZUF0KHQgLyA4KSkgPDwgdCAlIDMyO1xuICAgIH1cblxuICAgIHJldHVybiByO1xuICB9XG5cbiAgZnVuY3Rpb24gaChuKSB7XG4gICAgcmV0dXJuIGEoaShkKG4pLCA4ICogbi5sZW5ndGgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGwobiwgdCkge1xuICAgIHZhciByLFxuICAgICAgICBlLFxuICAgICAgICBvID0gZChuKSxcbiAgICAgICAgdSA9IFtdLFxuICAgICAgICBjID0gW107XG5cbiAgICBmb3IgKHVbMTVdID0gY1sxNV0gPSB2b2lkIDAsIG8ubGVuZ3RoID4gMTYgJiYgKG8gPSBpKG8sIDggKiBuLmxlbmd0aCkpLCByID0gMDsgciA8IDE2OyByICs9IDEpIHtcbiAgICAgIHVbcl0gPSA5MDk1MjI0ODYgXiBvW3JdLCBjW3JdID0gMTU0OTU1NjgyOCBeIG9bcl07XG4gICAgfVxuXG4gICAgcmV0dXJuIGUgPSBpKHUuY29uY2F0KGQodCkpLCA1MTIgKyA4ICogdC5sZW5ndGgpLCBhKGkoYy5jb25jYXQoZSksIDY0MCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZyhuKSB7XG4gICAgdmFyIHQsXG4gICAgICAgIHIsXG4gICAgICAgIGUgPSBcIlwiO1xuXG4gICAgZm9yIChyID0gMDsgciA8IG4ubGVuZ3RoOyByICs9IDEpIHtcbiAgICAgIHQgPSBuLmNoYXJDb2RlQXQociksIGUgKz0gXCIwMTIzNDU2Nzg5YWJjZGVmXCIuY2hhckF0KHQgPj4+IDQgJiAxNSkgKyBcIjAxMjM0NTY3ODlhYmNkZWZcIi5jaGFyQXQoMTUgJiB0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHYobikge1xuICAgIHJldHVybiB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQobikpO1xuICB9XG5cbiAgZnVuY3Rpb24gbShuKSB7XG4gICAgcmV0dXJuIGgodihuKSk7XG4gIH1cblxuICBmdW5jdGlvbiBwKG4pIHtcbiAgICByZXR1cm4gZyhtKG4pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHMobiwgdCkge1xuICAgIHJldHVybiBsKHYobiksIHYodCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gQyhuLCB0KSB7XG4gICAgcmV0dXJuIGcocyhuLCB0KSk7XG4gIH1cblxuICBmdW5jdGlvbiBBKG4sIHQsIHIpIHtcbiAgICByZXR1cm4gdCA/IHIgPyBzKHQsIG4pIDogQyh0LCBuKSA6IHIgPyBtKG4pIDogcChuKTtcbiAgfVxuXG4gIFwiZnVuY3Rpb25cIiA9PSB0eXBlb2YgZGVmaW5lICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBBO1xuICB9KSA6IFwib2JqZWN0XCIgPT0gKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSAmJiBtb2R1bGUuZXhwb3J0cyA/IG1vZHVsZS5leHBvcnRzID0gQSA6IG4ubWQ1ID0gQTtcbn0odm9pZCAwKTtcblxufSx7fV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xudmFyIF9kZWZhdWx0ID0ge1xuICBhcnJheWJ1ZmZlclRvU3RyaW5nOiBmdW5jdGlvbiBhcnJheWJ1ZmZlclRvU3RyaW5nKGFycmF5QnVmZmVyKSB7XG4gICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICB2YXIgc3RyID0gW107XG4gICAgc3RyLmxlbmd0aCA9IGJ5dGVBcnJheS5sZW5ndGg7XG4gICAgdmFyIGN1cnJlbnRTdHJJbmRleCA9IDA7XG4gICAgdmFyIGN1cnJlblN0ckNvZGUgPSAwO1xuICAgIHZhciBmaXJzdEJ5dGVDb2RlID0gMDtcbiAgICB2YXIgYXJyYXlMZW5ndGggPSBieXRlQXJyYXkubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGFycmF5TGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBmaXJzdEJ5dGVDb2RlID0gYnl0ZUFycmF5W2luZGV4XTtcblxuICAgICAgaWYgKGZpcnN0Qnl0ZUNvZGUgPiAyNTEgJiYgZmlyc3RCeXRlQ29kZSA8IDI1NCAmJiBpbmRleCArIDUgPCBhcnJheUxlbmd0aCkge1xuICAgICAgICBjdXJyZW5TdHJDb2RlID0gKGZpcnN0Qnl0ZUNvZGUgLSAyNTIpICogMTA3Mzc0MTgyNCArIChieXRlQXJyYXlbKytpbmRleF0gLSAxMjggPDwgMjQpICsgKGJ5dGVBcnJheVsrK2luZGV4XSAtIDEyOCA8PCAxOCkgKyAoYnl0ZUFycmF5WysraW5kZXhdIC0gMTI4IDw8IDEyKSArIChieXRlQXJyYXlbKytpbmRleF0gLSAxMjggPDwgNikgKyBieXRlQXJyYXlbKytpbmRleF0gLSAxMjg7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0Qnl0ZUNvZGUgPiAyNDcgJiYgZmlyc3RCeXRlQ29kZSA8IDI1MiAmJiBpbmRleCArIDQgPCBhcnJheUxlbmd0aCkge1xuICAgICAgICBjdXJyZW5TdHJDb2RlID0gKGZpcnN0Qnl0ZUNvZGUgLSAyNDggPDwgMjQpICsgKGJ5dGVBcnJheVsrK2luZGV4XSAtIDEyOCA8PCAxOCkgKyAoYnl0ZUFycmF5WysraW5kZXhdIC0gMTI4IDw8IDEyKSArIChieXRlQXJyYXlbKytpbmRleF0gLSAxMjggPDwgNikgKyBieXRlQXJyYXlbKytpbmRleF0gLSAxMjg7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0Qnl0ZUNvZGUgPiAyMzkgJiYgZmlyc3RCeXRlQ29kZSA8IDI0OCAmJiBpbmRleCArIDMgPCBhcnJheUxlbmd0aCkge1xuICAgICAgICBjdXJyZW5TdHJDb2RlID0gKGZpcnN0Qnl0ZUNvZGUgLSAyNDAgPDwgMTgpICsgKGJ5dGVBcnJheVsrK2luZGV4XSAtIDEyOCA8PCAxMikgKyAoYnl0ZUFycmF5WysraW5kZXhdIC0gMTI4IDw8IDYpICsgYnl0ZUFycmF5WysraW5kZXhdIC0gMTI4O1xuICAgICAgfSBlbHNlIGlmIChmaXJzdEJ5dGVDb2RlID4gMjIzICYmIGZpcnN0Qnl0ZUNvZGUgPCAyNDAgJiYgaW5kZXggKyAyIDwgYXJyYXlMZW5ndGgpIHtcbiAgICAgICAgY3VycmVuU3RyQ29kZSA9IChmaXJzdEJ5dGVDb2RlIC0gMjI0IDw8IDEyKSArIChieXRlQXJyYXlbKytpbmRleF0gLSAxMjggPDwgNikgKyBieXRlQXJyYXlbKytpbmRleF0gLSAxMjg7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0Qnl0ZUNvZGUgPiAxOTEgJiYgZmlyc3RCeXRlQ29kZSA8IDIyNCAmJiBpbmRleCArIDEgPCBhcnJheUxlbmd0aCkge1xuICAgICAgICBjdXJyZW5TdHJDb2RlID0gKGZpcnN0Qnl0ZUNvZGUgLSAxOTIgPDwgNikgKyBieXRlQXJyYXlbKytpbmRleF0gLSAxMjg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW5TdHJDb2RlID0gZmlyc3RCeXRlQ29kZTtcbiAgICAgIH1cblxuICAgICAgc3RyW2N1cnJlbnRTdHJJbmRleCsrXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY3VycmVuU3RyQ29kZSk7XG4gICAgfVxuXG4gICAgc3RyLmxlbmd0aCA9IGN1cnJlbnRTdHJJbmRleDtcbiAgICByZXR1cm4gc3RyLmpvaW4oJycpO1xuICB9LFxuICBzdHJpbmdUb0FycmF5YnVmZmVyOiBmdW5jdGlvbiBzdHJpbmdUb0FycmF5YnVmZmVyKHN0cmluZykge1xuICAgIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICAgIHZhciBieXRlQXJyYXkgPSBuZXcgQXJyYXkoNiAqIGxlbmd0aCk7XG4gICAgdmFyIGFjdHVhbExlbmd0aCA9IDA7XG5cbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY29kZSA9IHN0cmluZy5jaGFyQ29kZUF0KGluZGV4KTtcblxuICAgICAgaWYgKGNvZGUgPCAweDgwKSB7XG4gICAgICAgIGJ5dGVBcnJheVthY3R1YWxMZW5ndGgrK10gPSBjb2RlO1xuICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHg4MDApIHtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDE5MiArIChjb2RlID4+PiA2KTtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDEyOCArIChjb2RlICYgNjMpO1xuICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHgxMDAwMCkge1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMjI0ICsgKGNvZGUgPj4+IDEyKTtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDEyOCArIChjb2RlID4+PiA2ICYgNjMpO1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMTI4ICsgKGNvZGUgJiA2Myk7XG4gICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweDIwMDAwMCkge1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMjQwICsgKGNvZGUgPj4+IDE4KTtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDEyOCArIChjb2RlID4+PiAxMiAmIDYzKTtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDEyOCArIChjb2RlID4+PiA2ICYgNjMpO1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMTI4ICsgKGNvZGUgJiA2Myk7XG4gICAgICB9IGVsc2UgaWYgKGNvZGUgPCAweDQwMDAwMDApIHtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDI0OCArIChjb2RlID4+PiAyNCk7XG4gICAgICAgIGJ5dGVBcnJheVthY3R1YWxMZW5ndGgrK10gPSAxMjggKyAoY29kZSA+Pj4gMTggJiA2Myk7XG4gICAgICAgIGJ5dGVBcnJheVthY3R1YWxMZW5ndGgrK10gPSAxMjggKyAoY29kZSA+Pj4gMTIgJiA2Myk7XG4gICAgICAgIGJ5dGVBcnJheVthY3R1YWxMZW5ndGgrK10gPSAxMjggKyAoY29kZSA+Pj4gNiAmIDYzKTtcbiAgICAgICAgYnl0ZUFycmF5W2FjdHVhbExlbmd0aCsrXSA9IDEyOCArIChjb2RlICYgNjMpO1xuICAgICAgfSBlbHNlIGlmIChjb2RlIDwgMHg0MDAwMDAwKSB7XG4gICAgICAgIGJ5dGVBcnJheVthY3R1YWxMZW5ndGgrK10gPSAyNTIgKyAoY29kZSA+Pj4gMzApO1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMTI4ICsgKGNvZGUgPj4+IDI0ICYgNjMpO1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMTI4ICsgKGNvZGUgPj4+IDE4ICYgNjMpO1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMTI4ICsgKGNvZGUgPj4+IDEyICYgNjMpO1xuICAgICAgICBieXRlQXJyYXlbYWN0dWFsTGVuZ3RoKytdID0gMTI4ICsgKGNvZGUgPj4+IDYgJiA2Myk7XG4gICAgICAgIGJ5dGVBcnJheVthY3R1YWxMZW5ndGgrK10gPSAxMjggKyAoY29kZSAmIDYzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBieXRlQXJyYXkubGVuZ3RoID0gYWN0dWFsTGVuZ3RoO1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShieXRlQXJyYXkpLmJ1ZmZlcjtcbiAgfVxufTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se31dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxBdWRpb0VsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MQXVkaW9FbGVtZW50XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgQXVkaW8gPSBmdW5jdGlvbiAoX0hUTUxBdWRpb0VsZW1lbnQpIHtcbiAgX2luaGVyaXRzKEF1ZGlvLCBfSFRNTEF1ZGlvRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihBdWRpbyk7XG5cbiAgZnVuY3Rpb24gQXVkaW8odXJsKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEF1ZGlvKTtcblxuICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCB1cmwpO1xuICB9XG5cbiAgcmV0dXJuIEF1ZGlvO1xufShfSFRNTEF1ZGlvRWxlbWVudDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBBdWRpbztcblxufSx7XCIuL0hUTUxBdWRpb0VsZW1lbnRcIjoxNX1dLDU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpeyhmdW5jdGlvbiAoKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgX3V0aWwgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuLi91dGlsXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICBkZWZpbmUoW1wiZXhwb3J0c1wiXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICgodHlwZW9mIGV4cG9ydHMgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihleHBvcnRzKSkgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIGV4cG9ydHMubm9kZU5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGZhY3RvcnkoZXhwb3J0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZhY3RvcnkoZ2xvYmFsKTtcbiAgICB9XG4gIH0pKGZ1bmN0aW9uIChleHBvcnRzKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBleHBvcnRzLlVSTCA9IGdsb2JhbC5VUkwgfHwgZ2xvYmFsLndlYmtpdFVSTDtcblxuICAgIGlmIChnbG9iYWwuQmxvYiAmJiBnbG9iYWwuVVJMKSB7XG4gICAgICB0cnkge1xuICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIHZhciBCbG9iQnVpbGRlciA9IGdsb2JhbC5CbG9iQnVpbGRlciB8fCBnbG9iYWwuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgZ2xvYmFsLk1vekJsb2JCdWlsZGVyIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBnZXRfY2xhc3MgPSBmdW5jdGlvbiBnZXRfY2xhc3Mob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KS5tYXRjaCgvXlxcW29iamVjdFxccyguKilcXF0kLylbMV07XG4gICAgICB9LFxuICAgICAgICAgIEZha2VCbG9iQnVpbGRlciA9IGZ1bmN0aW9uIEJsb2JCdWlsZGVyKCkge1xuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgdGhpcy5fYXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoKTtcbiAgICAgIH0sXG4gICAgICAgICAgRmFrZUJsb2IgPSBmdW5jdGlvbiBCbG9iKGRhdGEsIHR5cGUsIGVuY29kaW5nKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICAgIHRoaXMuc2l6ZSA9IGRhdGEubGVuZ3RoO1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLmVuY29kaW5nID0gZW5jb2Rpbmc7XG4gICAgICAgIHRoaXMuX2FycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKCk7XG4gICAgICB9LFxuICAgICAgICAgIEZCQl9wcm90byA9IEZha2VCbG9iQnVpbGRlci5wcm90b3R5cGUsXG4gICAgICAgICAgRkJfcHJvdG8gPSBGYWtlQmxvYi5wcm90b3R5cGUsXG4gICAgICAgICAgRmlsZVJlYWRlclN5bmMgPSBnbG9iYWwuRmlsZVJlYWRlclN5bmMsXG4gICAgICAgICAgRmlsZUV4Y2VwdGlvbiA9IGZ1bmN0aW9uIEZpbGVFeGNlcHRpb24odHlwZSkge1xuICAgICAgICB0aGlzLmNvZGUgPSB0aGlzW3RoaXMubmFtZSA9IHR5cGVdO1xuICAgICAgfSxcbiAgICAgICAgICBmaWxlX2V4X2NvZGVzID0gKFwiTk9UX0ZPVU5EX0VSUiBTRUNVUklUWV9FUlIgQUJPUlRfRVJSIE5PVF9SRUFEQUJMRV9FUlIgRU5DT0RJTkdfRVJSIFwiICsgXCJOT19NT0RJRklDQVRJT05fQUxMT1dFRF9FUlIgSU5WQUxJRF9TVEFURV9FUlIgU1lOVEFYX0VSUlwiKS5zcGxpdChcIiBcIiksXG4gICAgICAgICAgZmlsZV9leF9jb2RlID0gZmlsZV9leF9jb2Rlcy5sZW5ndGgsXG4gICAgICAgICAgcmVhbF9VUkwgPSBnbG9iYWwuVVJMIHx8IGdsb2JhbC53ZWJraXRVUkwgfHwgZXhwb3J0cyxcbiAgICAgICAgICByZWFsX2NyZWF0ZV9vYmplY3RfVVJMID0gcmVhbF9VUkwuY3JlYXRlT2JqZWN0VVJMLFxuICAgICAgICAgIHJlYWxfcmV2b2tlX29iamVjdF9VUkwgPSByZWFsX1VSTC5yZXZva2VPYmplY3RVUkwsXG4gICAgICAgICAgVVJMID0gcmVhbF9VUkwsXG4gICAgICAgICAgYnRvYSA9IGdsb2JhbC5idG9hLFxuICAgICAgICAgIGF0b2IgPSBnbG9iYWwuYXRvYixcbiAgICAgICAgICBBcnJheUJ1ZmZlciA9IGdsb2JhbC5BcnJheUJ1ZmZlcixcbiAgICAgICAgICBVaW50OEFycmF5ID0gZ2xvYmFsLlVpbnQ4QXJyYXksXG4gICAgICAgICAgb3JpZ2luID0gL15bXFx3LV0rOlxcLypcXFs/W1xcd1xcLjotXStcXF0/KD86OlswLTldKyk/LztcblxuICAgICAgRmFrZUJsb2IuZmFrZSA9IEZCX3Byb3RvLmZha2UgPSB0cnVlO1xuXG4gICAgICB3aGlsZSAoZmlsZV9leF9jb2RlLS0pIHtcbiAgICAgICAgRmlsZUV4Y2VwdGlvbi5wcm90b3R5cGVbZmlsZV9leF9jb2Rlc1tmaWxlX2V4X2NvZGVdXSA9IGZpbGVfZXhfY29kZSArIDE7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVhbF9VUkwuY3JlYXRlT2JqZWN0VVJMKSB7XG4gICAgICAgIFVSTCA9IGV4cG9ydHMuVVJMID0gZnVuY3Rpb24gKHVyaSkge1xuICAgICAgICAgIHZhciB1cmlfaW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpLFxuICAgICAgICAgICAgICB1cmlfb3JpZ2luO1xuICAgICAgICAgIHVyaV9pbmZvLmhyZWYgPSB1cmk7XG5cbiAgICAgICAgICBpZiAoIShcIm9yaWdpblwiIGluIHVyaV9pbmZvKSkge1xuICAgICAgICAgICAgaWYgKHVyaV9pbmZvLnByb3RvY29sLnRvTG93ZXJDYXNlKCkgPT09IFwiZGF0YTpcIikge1xuICAgICAgICAgICAgICB1cmlfaW5mby5vcmlnaW4gPSBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdXJpX29yaWdpbiA9IHVyaS5tYXRjaChvcmlnaW4pO1xuICAgICAgICAgICAgICB1cmlfaW5mby5vcmlnaW4gPSB1cmlfb3JpZ2luICYmIHVyaV9vcmlnaW5bMV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHVyaV9pbmZvO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24gKGJsb2IpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBibG9iLnR5cGUsXG4gICAgICAgICAgICBkYXRhX1VSSV9oZWFkZXI7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICB0eXBlID0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChibG9iIGluc3RhbmNlb2YgRmFrZUJsb2IpIHtcbiAgICAgICAgICBkYXRhX1VSSV9oZWFkZXIgPSBcImRhdGE6XCIgKyB0eXBlO1xuXG4gICAgICAgICAgaWYgKGJsb2IuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIjtiYXNlNjQsXCIgKyBibG9iLmRhdGE7XG4gICAgICAgICAgfSBlbHNlIGlmIChibG9iLmVuY29kaW5nID09PSBcIlVSSVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCIsXCIgKyBkZWNvZGVVUklDb21wb25lbnQoYmxvYi5kYXRhKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYnRvYSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiO2Jhc2U2NCxcIiArIGJ0b2EoYmxvYi5kYXRhKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiLFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGJsb2IuZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlYWxfY3JlYXRlX29iamVjdF9VUkwpIHtcbiAgICAgICAgICByZXR1cm4gcmVhbF9jcmVhdGVfb2JqZWN0X1VSTC5jYWxsKHJlYWxfVVJMLCBibG9iKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgVVJMLnJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uIChvYmplY3RfVVJMKSB7XG4gICAgICAgIGlmIChvYmplY3RfVVJMLnN1YnN0cmluZygwLCA1KSAhPT0gXCJkYXRhOlwiICYmIHJlYWxfcmV2b2tlX29iamVjdF9VUkwpIHtcbiAgICAgICAgICByZWFsX3Jldm9rZV9vYmplY3RfVVJMLmNhbGwocmVhbF9VUkwsIG9iamVjdF9VUkwpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBGQkJfcHJvdG8uYXBwZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIGJiID0gdGhpcy5kYXRhO1xuXG4gICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICB2YXIgc3RyID0gXCJcIixcbiAgICAgICAgICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSksXG4gICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICBidWZfbGVuID0gYnVmLmxlbmd0aDtcblxuICAgICAgICAgIGZvciAoOyBpIDwgYnVmX2xlbjsgaSsrKSB7XG4gICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJiLnB1c2goc3RyKTtcbiAgICAgICAgICB0aGlzLl9hcnJheUJ1ZmZlciA9IGRhdGEuc2xpY2UoMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZ2V0X2NsYXNzKGRhdGEpID09PSBcIkJsb2JcIiB8fCBnZXRfY2xhc3MoZGF0YSkgPT09IFwiRmlsZVwiKSB7XG4gICAgICAgICAgaWYgKEZpbGVSZWFkZXJTeW5jKSB7XG4gICAgICAgICAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlclN5bmMoKTtcbiAgICAgICAgICAgIGJiLnB1c2goZnIucmVhZEFzQmluYXJ5U3RyaW5nKGRhdGEpKTtcbiAgICAgICAgICAgIHRoaXMuX2FycmF5QnVmZmVyID0gZGF0YS5hcnJheUJ1ZmZlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRmlsZUV4Y2VwdGlvbihcIk5PVF9SRUFEQUJMRV9FUlJcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBGYWtlQmxvYikge1xuICAgICAgICAgIGlmIChkYXRhLmVuY29kaW5nID09PSBcImJhc2U2NFwiICYmIGF0b2IpIHtcbiAgICAgICAgICAgIGJiLnB1c2goYXRvYihkYXRhLmRhdGEpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuZW5jb2RpbmcgPT09IFwiVVJJXCIpIHtcbiAgICAgICAgICAgIGJiLnB1c2goZGVjb2RlVVJJQ29tcG9uZW50KGRhdGEuZGF0YSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5lbmNvZGluZyA9PT0gXCJyYXdcIikge1xuICAgICAgICAgICAgYmIucHVzaChkYXRhLmRhdGEpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX2FycmF5QnVmZmVyID0gZGF0YS5fYXJyYXlCdWZmZXIuc2xpY2UoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkYXRhICs9IFwiXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYmIucHVzaCh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoZGF0YSkpKTtcbiAgICAgICAgICB0aGlzLl9hcnJheUJ1ZmZlciA9IF91dGlsW1wiZGVmYXVsdFwiXS5zdHJpbmdUb0FycmF5YnVmZmVyKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIEZCQl9wcm90by5nZXRCbG9iID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgdHlwZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmxvYiA9IG5ldyBGYWtlQmxvYih0aGlzLmRhdGEuam9pbihcIlwiKSwgdHlwZSwgXCJyYXdcIik7XG4gICAgICAgIGJsb2IuX2FycmF5QnVmZmVyID0gdGhpcy5fYXJyYXlCdWZmZXI7XG4gICAgICAgIHJldHVybiBibG9iO1xuICAgICAgfTtcblxuICAgICAgRkJCX3Byb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJbb2JqZWN0IEJsb2JCdWlsZGVyXVwiO1xuICAgICAgfTtcblxuICAgICAgRkJfcHJvdG8uc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgdHlwZSkge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGFyZ3MgPCAzKSB7XG4gICAgICAgICAgdHlwZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmxvYiA9IG5ldyBGYWtlQmxvYih0aGlzLmRhdGEuc2xpY2Uoc3RhcnQsIGFyZ3MgPiAxID8gZW5kIDogdGhpcy5kYXRhLmxlbmd0aCksIHR5cGUsIHRoaXMuZW5jb2RpbmcpO1xuICAgICAgICB2YXIgYXJyYXlCdWZmZXIgPSB0aGlzLl9hcnJheUJ1ZmZlcjtcblxuICAgICAgICBpZiAoYXJyYXlCdWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgIGJsb2IuX2FycmF5QnVmZmVyID0gdGhpcy5fYXJyYXlCdWZmZXIuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmxvYjtcbiAgICAgIH07XG5cbiAgICAgIEZCX3Byb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJbb2JqZWN0IEJsb2JdXCI7XG4gICAgICB9O1xuXG4gICAgICBGQl9wcm90by5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zaXplID0gMDtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YTtcbiAgICAgIH07XG5cbiAgICAgIEZCX3Byb3RvLmFycmF5QnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXJyYXlCdWZmZXIuc2xpY2UoMCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gRmFrZUJsb2JCdWlsZGVyO1xuICAgIH0oKTtcblxuICAgIGV4cG9ydHMuQmxvYiA9IGZ1bmN0aW9uIChibG9iUGFydHMsIG9wdGlvbnMpIHtcbiAgICAgIHZhciB0eXBlID0gb3B0aW9ucyA/IG9wdGlvbnMudHlwZSB8fCBcIlwiIDogXCJcIjtcbiAgICAgIHZhciBidWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cbiAgICAgIGlmIChibG9iUGFydHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJsb2JQYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGlmIChVaW50OEFycmF5ICYmIGJsb2JQYXJ0c1tpXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgIGJ1aWxkZXIuYXBwZW5kKGJsb2JQYXJ0c1tpXS5idWZmZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBidWlsZGVyLmFwcGVuZChibG9iUGFydHNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgYmxvYiA9IGJ1aWxkZXIuZ2V0QmxvYih0eXBlKTtcblxuICAgICAgaWYgKCFibG9iLnNsaWNlICYmIGJsb2Iud2Via2l0U2xpY2UpIHtcbiAgICAgICAgYmxvYi5zbGljZSA9IGJsb2Iud2Via2l0U2xpY2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBibG9iO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgcmV0dXJuIG9iamVjdC5fX3Byb3RvX187XG4gICAgfTtcblxuICAgIGV4cG9ydHMuQmxvYi5wcm90b3R5cGUgPSBnZXRQcm90b3R5cGVPZihuZXcgZXhwb3J0cy5CbG9iKCkpO1xuICB9KTtcbn0pKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGYgfHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cgfHwgdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBnbG9iYWwgfHwgKHZvaWQgMCkuY29udGVudCB8fCB2b2lkIDApO1xuXG59KS5jYWxsKHRoaXMpfSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG59LHtcIi4uL3V0aWxcIjozfV0sNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbnZhciBET01Ub2tlbkxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIERPTVRva2VuTGlzdCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRE9NVG9rZW5MaXN0KTtcblxuICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhET01Ub2tlbkxpc3QsIFt7XG4gICAga2V5OiBcImFkZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhZGQoKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJET01Ub2tlbkxpc3QgYWRkIGlzbid0IGltcGxlbWVudGVkIVwiKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY29udGFpbnNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY29udGFpbnMoKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJET01Ub2tlbkxpc3QgY29udGFpbnMgaXNuJ3QgaW1wbGVtZW50ZWQhXCIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJlbnRyaWVzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGVudHJpZXMoKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJET01Ub2tlbkxpc3QgZW50cmllcyBpc24ndCBpbXBsZW1lbnRlZCFcIik7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImZvckVhY2hcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZm9yRWFjaCgpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIkRPTVRva2VuTGlzdCBmb3JFYWNoIGlzbid0IGltcGxlbWVudGVkIVwiKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaXRlbVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpdGVtKCkge1xuICAgICAgY29uc29sZS53YXJuKFwiRE9NVG9rZW5MaXN0IGl0ZW0gaXNuJ3QgaW1wbGVtZW50ZWQhXCIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJrZXlzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGtleXMoKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJET01Ub2tlbkxpc3Qga2V5cyBpc24ndCBpbXBsZW1lbnRlZCFcIik7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJET01Ub2tlbkxpc3QgcmVtb3ZlIGlzbid0IGltcGxlbWVudGVkIVwiKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVwbGFjZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXBsYWNlKCkge1xuICAgICAgY29uc29sZS53YXJuKFwiRE9NVG9rZW5MaXN0IHJlcGxhY2UgaXNuJ3QgaW1wbGVtZW50ZWQhXCIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzdXBwb3J0c1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdXBwb3J0cygpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIkRPTVRva2VuTGlzdCBzdXBwb3J0cyBpc24ndCBpbXBsZW1lbnRlZCFcIik7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRvZ2dsZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b2dnbGUoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInZhbHVlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgICAgY29uc29sZS53YXJuKFwiRE9NVG9rZW5MaXN0IHZhbHVlIGlzbid0IGltcGxlbWVudGVkIVwiKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidmFsdWVzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHZhbHVlcygpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIkRPTVRva2VuTGlzdCB2YWx1ZXMgaXNuJ3QgaW1wbGVtZW50ZWQhXCIpO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBET01Ub2tlbkxpc3Q7XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gRE9NVG9rZW5MaXN0O1xuXG59LHt9XSw3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9FdmVudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBEZXZpY2VNb3Rpb25FdmVudCA9IGZ1bmN0aW9uIChfRXZlbnQpIHtcbiAgX2luaGVyaXRzKERldmljZU1vdGlvbkV2ZW50LCBfRXZlbnQpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoRGV2aWNlTW90aW9uRXZlbnQpO1xuXG4gIGZ1bmN0aW9uIERldmljZU1vdGlvbkV2ZW50KGluaXRBcmdzKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIERldmljZU1vdGlvbkV2ZW50KTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgJ2RldmljZW1vdGlvbicpO1xuXG4gICAgaWYgKGluaXRBcmdzKSB7XG4gICAgICBfdGhpcy5fYWNjZWxlcmF0aW9uID0gaW5pdEFyZ3MuYWNjZWxlcmF0aW9uID8gaW5pdEFyZ3MuYWNjZWxlcmF0aW9uIDoge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwLFxuICAgICAgICB6OiAwXG4gICAgICB9O1xuICAgICAgX3RoaXMuX2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgPSBpbml0QXJncy5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5ID8gaW5pdEFyZ3MuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eSA6IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMCxcbiAgICAgICAgejogMFxuICAgICAgfTtcbiAgICAgIF90aGlzLl9yb3RhdGlvblJhdGUgPSBpbml0QXJncy5yb3RhdGlvblJhdGUgPyBpbml0QXJncy5yb3RhdGlvblJhdGUgOiB7XG4gICAgICAgIGFscGhhOiAwLFxuICAgICAgICBiZXRhOiAwLFxuICAgICAgICBnYW1tYTogMFxuICAgICAgfTtcbiAgICAgIF90aGlzLl9pbnRlcnZhbCA9IGluaXRBcmdzLmludGVydmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICBfdGhpcy5fYWNjZWxlcmF0aW9uID0ge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwLFxuICAgICAgICB6OiAwXG4gICAgICB9O1xuICAgICAgX3RoaXMuX2FjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHo6IDBcbiAgICAgIH07XG4gICAgICBfdGhpcy5fcm90YXRpb25SYXRlID0ge1xuICAgICAgICBhbHBoYTogMCxcbiAgICAgICAgYmV0YTogMCxcbiAgICAgICAgZ2FtbWE6IDBcbiAgICAgIH07XG4gICAgICBfdGhpcy5faW50ZXJ2YWwgPSAwO1xuICAgIH1cblxuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhEZXZpY2VNb3Rpb25FdmVudCwgW3tcbiAgICBrZXk6IFwiYWNjZWxlcmF0aW9uXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYWNjZWxlcmF0aW9uO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicm90YXRpb25SYXRlXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcm90YXRpb25SYXRlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJpbnRlcnZhbFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ludGVydmFsO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBEZXZpY2VNb3Rpb25FdmVudDtcbn0oX0V2ZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IERldmljZU1vdGlvbkV2ZW50O1xuXG59LHtcIi4vRXZlbnRcIjoxMH1dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0F1ZGlvID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdWRpb1wiKSk7XG5cbnZhciBfRm9udEZhY2VTZXQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0ZvbnRGYWNlU2V0XCIpKTtcblxudmFyIF9Ob2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vTm9kZVwiKSk7XG5cbnZhciBfTm9kZUxpc3QgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL05vZGVMaXN0XCIpKTtcblxudmFyIF9IVE1MQW5jaG9yRWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEFuY2hvckVsZW1lbnRcIikpO1xuXG52YXIgX0hUTUxFbGVtZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MRWxlbWVudFwiKSk7XG5cbnZhciBfSFRNTEh0bWxFbGVtZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MSHRtbEVsZW1lbnRcIikpO1xuXG52YXIgX0hUTUxCb2R5RWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEJvZHlFbGVtZW50XCIpKTtcblxudmFyIF9IVE1MSGVhZEVsZW1lbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0hUTUxIZWFkRWxlbWVudFwiKSk7XG5cbnZhciBfSFRNTENhbnZhc0VsZW1lbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0hUTUxDYW52YXNFbGVtZW50XCIpKTtcblxudmFyIF9IVE1MVmlkZW9FbGVtZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MVmlkZW9FbGVtZW50XCIpKTtcblxudmFyIF9IVE1MU2NyaXB0RWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTFNjcmlwdEVsZW1lbnRcIikpO1xuXG52YXIgX0hUTUxTdHlsZUVsZW1lbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0hUTUxTdHlsZUVsZW1lbnRcIikpO1xuXG52YXIgX0hUTUxJbnB1dEVsZW1lbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0hUTUxJbnB1dEVsZW1lbnRcIikpO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V0aWwvV2Vha01hcFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyKSB7IGlmICh0eXBlb2YgUmVmbGVjdCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBSZWZsZWN0LmdldCkgeyBfZ2V0ID0gUmVmbGVjdC5nZXQ7IH0gZWxzZSB7IF9nZXQgPSBmdW5jdGlvbiBfZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyKSB7IHZhciBiYXNlID0gX3N1cGVyUHJvcEJhc2UodGFyZ2V0LCBwcm9wZXJ0eSk7IGlmICghYmFzZSkgcmV0dXJuOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoYmFzZSwgcHJvcGVydHkpOyBpZiAoZGVzYy5nZXQpIHsgcmV0dXJuIGRlc2MuZ2V0LmNhbGwocmVjZWl2ZXIpOyB9IHJldHVybiBkZXNjLnZhbHVlOyB9OyB9IHJldHVybiBfZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyIHx8IHRhcmdldCk7IH1cblxuZnVuY3Rpb24gX3N1cGVyUHJvcEJhc2Uob2JqZWN0LCBwcm9wZXJ0eSkgeyB3aGlsZSAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkgeyBvYmplY3QgPSBfZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgYnJlYWs7IH0gcmV0dXJuIG9iamVjdDsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgX2h0bWwgPSBuZXcgX0hUTUxIdG1sRWxlbWVudFtcImRlZmF1bHRcIl0oKTtcblxudmFyIERvY3VtZW50ID0gZnVuY3Rpb24gKF9Ob2RlKSB7XG4gIF9pbmhlcml0cyhEb2N1bWVudCwgX05vZGUpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoRG9jdW1lbnQpO1xuXG4gIF9jcmVhdGVDbGFzcyhEb2N1bWVudCwgW3tcbiAgICBrZXk6IFwiY2hhcmFjdGVyU2V0XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gXCJVVEYtOFwiO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzY3JpcHRzXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5zY3JpcHRzLnNsaWNlKDApO1xuICAgIH1cbiAgfV0pO1xuXG4gIGZ1bmN0aW9uIERvY3VtZW50KCkge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBEb2N1bWVudCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImhlYWRcIiwgbmV3IF9IVE1MSGVhZEVsZW1lbnRbXCJkZWZhdWx0XCJdKF9odG1sKSk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiYm9keVwiLCBuZXcgX0hUTUxCb2R5RWxlbWVudFtcImRlZmF1bHRcIl0oX2h0bWwpKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJmb250c1wiLCBuZXcgX0ZvbnRGYWNlU2V0W1wiZGVmYXVsdFwiXSgpKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJjb29raWVcIiwgXCJcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiZG9jdW1lbnRFbGVtZW50XCIsIF9odG1sKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJyZWFkeVN0YXRlXCIsIFwiY29tcGxldGVcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwidmlzaWJpbGl0eVN0YXRlXCIsIFwidmlzaWJsZVwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJoaWRkZW5cIiwgZmFsc2UpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInN0eWxlXCIsIHt9KTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJsb2NhdGlvblwiLCB3aW5kb3cubG9jYXRpb24pO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcIm9udG91Y2hzdGFydFwiLCBudWxsKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJvbnRvdWNobW92ZVwiLCBudWxsKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJvbnRvdWNoZW5kXCIsIG51bGwpO1xuXG4gICAgX2h0bWwuYXBwZW5kQ2hpbGQoX3RoaXMuaGVhZCk7XG5cbiAgICBfaHRtbC5hcHBlbmRDaGlsZChfdGhpcy5ib2R5KTtcblxuICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpLnNjcmlwdHMgPSBbXTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRG9jdW1lbnQsIFt7XG4gICAga2V5OiBcImNyZWF0ZUVsZW1lbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWdOYW1lKSB7XG4gICAgICBpZiAodHlwZW9mIHRhZ05hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAgIGlmICh0YWdOYW1lID09PSAnQ0FOVkFTJykge1xuICAgICAgICByZXR1cm4gbmV3IF9IVE1MQ2FudmFzRWxlbWVudFtcImRlZmF1bHRcIl0oKTtcbiAgICAgIH0gZWxzZSBpZiAodGFnTmFtZSA9PT0gJ0lNRycpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbWFnZSgpO1xuICAgICAgfSBlbHNlIGlmICh0YWdOYW1lID09PSAnVklERU8nKSB7XG4gICAgICAgIHJldHVybiBuZXcgX0hUTUxWaWRlb0VsZW1lbnRbXCJkZWZhdWx0XCJdKCk7XG4gICAgICB9IGVsc2UgaWYgKHRhZ05hbWUgPT09ICdTQ1JJUFQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgX0hUTUxTY3JpcHRFbGVtZW50W1wiZGVmYXVsdFwiXSgpO1xuICAgICAgfSBlbHNlIGlmICh0YWdOYW1lID09PSBcIklOUFVUXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBfSFRNTElucHV0RWxlbWVudFtcImRlZmF1bHRcIl0oKTtcbiAgICAgIH0gZWxzZSBpZiAodGFnTmFtZSA9PT0gXCJBVURJT1wiKSB7XG4gICAgICAgIHJldHVybiBuZXcgX0F1ZGlvW1wiZGVmYXVsdFwiXSgpO1xuICAgICAgfSBlbHNlIGlmICh0YWdOYW1lID09PSBcIlNUWUxFXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBfSFRNTFN0eWxlRWxlbWVudFtcImRlZmF1bHRcIl0oKTtcbiAgICAgIH0gZWxzZSBpZiAodGFnTmFtZSA9PT0gXCJBXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBfSFRNTEFuY2hvckVsZW1lbnRbXCJkZWZhdWx0XCJdKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgX0hUTUxFbGVtZW50W1wiZGVmYXVsdFwiXSh0YWdOYW1lKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3JlYXRlRWxlbWVudE5TXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVsZW1lbnQocXVhbGlmaWVkTmFtZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZUV2ZW50XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUV2ZW50KHR5cGUpIHtcbiAgICAgIGlmICh3aW5kb3dbdHlwZV0pIHtcbiAgICAgICAgcmV0dXJuIG5ldyB3aW5kb3dbdHlwZV0oKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZVRleHROb2RlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKCkge1xuICAgICAgY29uc29sZS53YXJuKFwiZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoKSBpcyBub3Qgc3VwcG9ydCFcIik7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRpc3BhdGNoRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGlzcGF0Y2hFdmVudCgpIHtcbiAgICAgIGlmIChfaHRtbC5kaXNwYXRjaEV2ZW50LmFwcGx5KF9odG1sLCBhcmd1bWVudHMpKSB7XG4gICAgICAgIHJldHVybiBfZ2V0KF9nZXRQcm90b3R5cGVPZihEb2N1bWVudC5wcm90b3R5cGUpLCBcImRpc3BhdGNoRXZlbnRcIiwgdGhpcykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhcHBlbmRDaGlsZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhcHBlbmRDaGlsZChub2RlKSB7XG4gICAgICB2YXIgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lO1xuXG4gICAgICBpZiAobm9kZU5hbWUgPT09IFwiU0NSSVBUXCIpIHtcbiAgICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5zY3JpcHRzLnB1c2gobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfZ2V0KF9nZXRQcm90b3R5cGVPZihEb2N1bWVudC5wcm90b3R5cGUpLCBcImFwcGVuZENoaWxkXCIsIHRoaXMpLmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZUNoaWxkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKG5vZGUpIHtcbiAgICAgIHZhciBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWU7XG5cbiAgICAgIGlmIChub2RlTmFtZSA9PT0gXCJTQ1JJUFRcIikge1xuICAgICAgICB2YXIgc2NyaXB0cyA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuc2NyaXB0cztcblxuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDAsIGxlbmd0aCA9IHNjcmlwdHMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgKytpbmRleCkge1xuICAgICAgICAgIGlmIChub2RlID09PSBzY3JpcHRzW2luZGV4XSkge1xuICAgICAgICAgICAgc2NyaXB0cy5zbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF9nZXQoX2dldFByb3RvdHlwZU9mKERvY3VtZW50LnByb3RvdHlwZSksIFwicmVtb3ZlQ2hpbGRcIiwgdGhpcykuY2FsbCh0aGlzLCBub2RlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0RWxlbWVudEJ5SWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RWxlbWVudEJ5SWQoaWQpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBcIlVuY2F1Z2h0IFR5cGVFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ2dldEVsZW1lbnRCeUlkJyBvbiAnRG9jdW1lbnQnOiAxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuXCI7XG4gICAgICB9XG5cbiAgICAgIHZhciByb290RWxlbWVudCA9IHRoaXMuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgdmFyIGVsZW1lbnRBcnIgPSBbXS5jb25jYXQocm9vdEVsZW1lbnQuY2hpbGROb2Rlcyk7XG4gICAgICB2YXIgZWxlbWVudDtcblxuICAgICAgaWYgKGlkID09PSBcImNhbnZhc1wiIHx8IGlkID09PSBcImdsY2FudmFzXCIpIHtcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQgPSBlbGVtZW50QXJyLnBvcCgpKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuaWQgPT09IFwiY2FudmFzXCIgfHwgZWxlbWVudC5pZCA9PT0gXCJnbGNhbnZhc1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50QXJyID0gZWxlbWVudEFyci5jb25jYXQoZWxlbWVudC5jaGlsZE5vZGVzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQgPSBlbGVtZW50QXJyLnBvcCgpKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuaWQgPT09IGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50QXJyID0gZWxlbWVudEFyci5jb25jYXQoZWxlbWVudC5jaGlsZE5vZGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG5hbWVzKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgXCJVbmNhdWdodCBUeXBlRXJyb3I6IEZhaWxlZCB0byBleGVjdXRlICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyBvbiAnRG9jdW1lbnQnOiAxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgbmFtZXMgIT09IFwic3RyaW5nXCIgJiYgbmFtZXMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBfTm9kZUxpc3RbXCJkZWZhdWx0XCJdKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmRvY3VtZW50RWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKG5hbWVzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0RWxlbWVudHNCeVRhZ05hbWVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IFwiVW5jYXVnaHQgVHlwZUVycm9yOiBGYWlsZWQgdG8gZXhlY3V0ZSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnIG9uICdEb2N1bWVudCc6IDEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC5cIjtcbiAgICAgIH1cblxuICAgICAgdGFnTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgIHZhciByb290RWxlbWVudCA9IHRoaXMuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgdmFyIHJlc3VsdCA9IG5ldyBfTm9kZUxpc3RbXCJkZWZhdWx0XCJdKCk7XG5cbiAgICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlIFwiSEVBRFwiOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGRvY3VtZW50LmhlYWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgXCJCT0RZXCI6XG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZG9jdW1lbnQuYm9keSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHJvb3RFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldEVsZW1lbnRzQnlOYW1lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEVsZW1lbnRzQnlOYW1lKG5hbWUpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBcIlVuY2F1Z2h0IFR5cGVFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ2dldEVsZW1lbnRzQnlOYW1lJyBvbiAnRG9jdW1lbnQnOiAxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuXCI7XG4gICAgICB9XG5cbiAgICAgIHZhciBlbGVtZW50QXJyID0gW10uY29uY2F0KHRoaXMuY2hpbGROb2Rlcyk7XG4gICAgICB2YXIgcmVzdWx0ID0gbmV3IF9Ob2RlTGlzdFtcImRlZmF1bHRcIl0oKTtcbiAgICAgIHZhciBlbGVtZW50O1xuXG4gICAgICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnRBcnIucG9wKCkpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudEFyciA9IGVsZW1lbnRBcnIuY29uY2F0KGVsZW1lbnQuY2hpbGROb2Rlcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInF1ZXJ5U2VsZWN0b3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBcIlVuY2F1Z2h0IFR5cGVFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ3F1ZXJ5U2VsZWN0b3JBbGwnIG9uICdEb2N1bWVudCc6IDEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC5cIjtcbiAgICAgIH1cblxuICAgICAgdmFyIG5vZGVMaXN0ID0gbmV3IF9Ob2RlTGlzdFtcImRlZmF1bHRcIl0oKTtcblxuICAgICAgc3dpdGNoIChzZWxlY3RvcnMpIHtcbiAgICAgICAgY2FzZSBudWxsOlxuICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSBOYU46XG4gICAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgY2FzZSBmYWxzZTpcbiAgICAgICAgY2FzZSBcIlwiOlxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHNlbGVjdG9ycyAhPT0gXCJzdHJpbmdcIiAmJiBzZWxlY3RvcnMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgdGhyb3cgXCJVbmNhdWdodCBET01FeGNlcHRpb246IEZhaWxlZCB0byBleGVjdXRlICdxdWVyeVNlbGVjdG9yQWxsJyBvbiAnRG9jdW1lbnQnOiAnXCIgKyBzZWxlY3RvcnMgKyBcIicgaXMgbm90IGEgdmFsaWQgc2VsZWN0b3IuXCI7XG4gICAgICB9XG5cbiAgICAgIHZhciByZWcgPSAvXltBLVphLXpdKyQvO1xuICAgICAgdmFyIHJlc3VsdCA9IHNlbGVjdG9ycy5tYXRjaChyZWcpO1xuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKHNlbGVjdG9ycyk7XG4gICAgICB9XG5cbiAgICAgIHJlZyA9IC9eXFwuW0EtWmEteiRfXVtBLVphLXokXzAtOVxcLSBdKiQvO1xuICAgICAgcmVzdWx0ID0gc2VsZWN0b3JzLm1hdGNoKHJlZyk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdmFyIHNlbGVjdG9yQXJyID0gc2VsZWN0b3JzLnNwbGl0KFwiIFwiKTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gc2VsZWN0b3JBcnIuc2hpZnQoKTtcbiAgICAgICAgbm9kZUxpc3QgPSB0aGlzLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoc2VsZWN0b3Iuc3Vic3RyKDEpKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlbGVjdG9yQXJyLmxlbmd0aDtcblxuICAgICAgICBpZiAobGVuZ3RoKSB7XG4gICAgICAgICAgc2VsZWN0b3JzID0gc2VsZWN0b3JBcnIuam9pbihcIiBcIik7XG4gICAgICAgICAgbGVuZ3RoID0gbm9kZUxpc3QubGVuZ3RoO1xuXG4gICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHN1Yk5vZGVMaXN0ID0gbm9kZUxpc3RbaW5kZXhdLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3JzKTtcblxuICAgICAgICAgICAgaWYgKHN1Yk5vZGVMaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gc3ViTm9kZUxpc3RbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGVMaXN0WzBdO1xuICAgICAgfVxuXG4gICAgICByZWcgPSAvXiNbQS1aYS16JF9dW0EtWmEteiRfMC05XFwtXSokLztcbiAgICAgIHJlc3VsdCA9IHNlbGVjdG9ycy5tYXRjaChyZWcpO1xuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5nZXRFbGVtZW50QnlJZChzZWxlY3RvcnMuc3Vic3RyKDEpKTtcblxuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgIG5vZGVMaXN0LnB1c2goZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdG9ycyA9PT0gXCIqXCIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoc2VsZWN0b3JzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGVMaXN0WzBdO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJxdWVyeVNlbGVjdG9yQWxsXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgXCJVbmNhdWdodCBUeXBlRXJyb3I6IEZhaWxlZCB0byBleGVjdXRlICdxdWVyeVNlbGVjdG9yQWxsJyBvbiAnRG9jdW1lbnQnOiAxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuXCI7XG4gICAgICB9XG5cbiAgICAgIHZhciBub2RlTGlzdCA9IG5ldyBfTm9kZUxpc3RbXCJkZWZhdWx0XCJdKCk7XG5cbiAgICAgIHN3aXRjaCAoc2VsZWN0b3JzKSB7XG4gICAgICAgIGNhc2UgbnVsbDpcbiAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgIGNhc2UgTmFOOlxuICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgIGNhc2UgZmFsc2U6XG4gICAgICAgIGNhc2UgXCJcIjpcbiAgICAgICAgICByZXR1cm4gbm9kZUxpc3Q7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3JzICE9PSBcInN0cmluZ1wiICYmIHNlbGVjdG9ycyBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICB0aHJvdyBcIlVuY2F1Z2h0IERPTUV4Y2VwdGlvbjogRmFpbGVkIHRvIGV4ZWN1dGUgJ3F1ZXJ5U2VsZWN0b3JBbGwnIG9uICdEb2N1bWVudCc6ICdcIiArIHNlbGVjdG9ycyArIFwiJyBpcyBub3QgYSB2YWxpZCBzZWxlY3Rvci5cIjtcbiAgICAgIH1cblxuICAgICAgdmFyIHJlZyA9IC9eW0EtWmEtel0rJC87XG4gICAgICB2YXIgcmVzdWx0ID0gc2VsZWN0b3JzLm1hdGNoKHJlZyk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RWxlbWVudHNCeVRhZ05hbWUoc2VsZWN0b3JzKTtcbiAgICAgIH1cblxuICAgICAgcmVnID0gL15cXC5bQS1aYS16JF9dW0EtWmEteiRfMC05XFwtXSokLztcbiAgICAgIHJlc3VsdCA9IHNlbGVjdG9ycy5tYXRjaChyZWcpO1xuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoc2VsZWN0b3JzLnN1YnN0cigxKSk7XG4gICAgICB9XG5cbiAgICAgIHJlZyA9IC9eI1tBLVphLXokX11bQS1aYS16JF8wLTlcXC1dKiQvO1xuICAgICAgcmVzdWx0ID0gc2VsZWN0b3JzLm1hdGNoKHJlZyk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmdldEVsZW1lbnRCeUlkKHNlbGVjdG9ycy5zdWJzdHIoMSkpO1xuXG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgbm9kZUxpc3QucHVzaChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0b3JzID09PSBcIipcIikge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRFbGVtZW50c0J5VGFnTmFtZShzZWxlY3RvcnMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbm9kZUxpc3Q7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIERvY3VtZW50O1xufShfTm9kZTJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBEb2N1bWVudDtcblxufSx7XCIuL0F1ZGlvXCI6NCxcIi4vRm9udEZhY2VTZXRcIjoxMyxcIi4vSFRNTEFuY2hvckVsZW1lbnRcIjoxNCxcIi4vSFRNTEJvZHlFbGVtZW50XCI6MTYsXCIuL0hUTUxDYW52YXNFbGVtZW50XCI6MTcsXCIuL0hUTUxFbGVtZW50XCI6MTgsXCIuL0hUTUxIZWFkRWxlbWVudFwiOjE5LFwiLi9IVE1MSHRtbEVsZW1lbnRcIjoyMCxcIi4vSFRNTElucHV0RWxlbWVudFwiOjIyLFwiLi9IVE1MU2NyaXB0RWxlbWVudFwiOjI0LFwiLi9IVE1MU3R5bGVFbGVtZW50XCI6MjUsXCIuL0hUTUxWaWRlb0VsZW1lbnRcIjoyNixcIi4vTm9kZVwiOjMyLFwiLi9Ob2RlTGlzdFwiOjMzLFwiLi91dGlsL1dlYWtNYXBcIjo1Nn1dLDk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX05vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Ob2RlXCIpKTtcblxudmFyIF9Ob2RlTGlzdCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vTm9kZUxpc3RcIikpO1xuXG52YXIgX0RPTVRva2VuTGlzdCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRE9NVG9rZW5MaXN0XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbnZhciBFbGVtZW50ID0gZnVuY3Rpb24gKF9Ob2RlKSB7XG4gIF9pbmhlcml0cyhFbGVtZW50LCBfTm9kZSk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihFbGVtZW50KTtcblxuICBmdW5jdGlvbiBFbGVtZW50KHRhZ05hbWUpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRWxlbWVudCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIHRhZ05hbWUpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNsYXNzTmFtZVwiLCAnJyk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiY2hpbGRyZW5cIiwgW10pO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNsYXNzTGlzdFwiLCBuZXcgX0RPTVRva2VuTGlzdFtcImRlZmF1bHRcIl0oKSk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwidmFsdWVcIiwgMSk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiY29udGVudFwiLCBcIlwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJzY3JvbGxMZWZ0XCIsIDApO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInNjcm9sbFRvcFwiLCAwKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJjbGllbnRMZWZ0XCIsIDApO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNsaWVudFRvcFwiLCAwKTtcblxuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhFbGVtZW50LCBbe1xuICAgIGtleTogXCJnZXRCb3VuZGluZ0NsaWVudFJlY3RcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMCxcbiAgICAgICAgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuICAgICAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICBib3R0b206IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICAgICAgcmlnaHQ6IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICB9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRFbGVtZW50c0J5VGFnTmFtZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKSB7XG4gICAgICB0YWdOYW1lID0gdGFnTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgdmFyIHJlc3VsdCA9IG5ldyBfTm9kZUxpc3RbXCJkZWZhdWx0XCJdKCk7XG4gICAgICB2YXIgY2hpbGROb2RlcyA9IHRoaXMuY2hpbGROb2RlcztcbiAgICAgIHZhciBsZW5ndGggPSBjaGlsZE5vZGVzLmxlbmd0aDtcblxuICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IGNoaWxkTm9kZXNbaW5kZXhdO1xuXG4gICAgICAgIGlmIChlbGVtZW50LnRhZ05hbWUgPT09IHRhZ05hbWUgfHwgdGFnTmFtZSA9PT0gXCIqXCIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoZWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldEVsZW1lbnRzQnlDbGFzc05hbWVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShuYW1lcykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IFwiVW5jYXVnaHQgVHlwZUVycm9yOiBGYWlsZWQgdG8gZXhlY3V0ZSAnZ2V0RWxlbWVudHNCeUNsYXNzTmFtZScgb24gJ0RvY3VtZW50JzogMSBhcmd1bWVudCByZXF1aXJlZCwgYnV0IG9ubHkgMCBwcmVzZW50LlwiO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVzdWx0ID0gbmV3IF9Ob2RlTGlzdFtcImRlZmF1bHRcIl0oKTtcblxuICAgICAgaWYgKHR5cGVvZiBuYW1lcyAhPT0gXCJzdHJpbmdcIiAmJiBuYW1lcyBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICB2YXIgZWxlbWVudEFyciA9IFtdLmNvbmNhdCh0aGlzLmNoaWxkTm9kZXMpO1xuICAgICAgdmFyIGVsZW1lbnQ7XG5cbiAgICAgIHdoaWxlIChlbGVtZW50ID0gZWxlbWVudEFyci5wb3AoKSkge1xuICAgICAgICB2YXIgY2xhc3NTdHIgPSBlbGVtZW50W1wiY2xhc3NcIl07XG5cbiAgICAgICAgaWYgKGNsYXNzU3RyKSB7XG4gICAgICAgICAgdmFyIGNsYXNzQXJyID0gY2xhc3NTdHIuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgIHZhciBsZW5ndGggPSBjbGFzc0Fyci5sZW5ndGg7XG5cbiAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3NBcnJbaW5kZXhdID09PSBuYW1lcykge1xuICAgICAgICAgICAgICByZXN1bHQucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudEFyciA9IGVsZW1lbnRBcnIuY29uY2F0KGVsZW1lbnQuY2hpbGROb2Rlcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInF1ZXJ5U2VsZWN0b3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBcIlVuY2F1Z2h0IFR5cGVFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ3F1ZXJ5U2VsZWN0b3JBbGwnIG9uICdEb2N1bWVudCc6IDEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC5cIjtcbiAgICAgIH1cblxuICAgICAgdmFyIG5vZGVMaXN0ID0gbmV3IF9Ob2RlTGlzdFtcImRlZmF1bHRcIl0oKTtcblxuICAgICAgc3dpdGNoIChzZWxlY3RvcnMpIHtcbiAgICAgICAgY2FzZSBudWxsOlxuICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSBOYU46XG4gICAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgY2FzZSBmYWxzZTpcbiAgICAgICAgY2FzZSBcIlwiOlxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHNlbGVjdG9ycyAhPT0gXCJzdHJpbmdcIiAmJiBzZWxlY3RvcnMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgdGhyb3cgXCJVbmNhdWdodCBET01FeGNlcHRpb246IEZhaWxlZCB0byBleGVjdXRlICdxdWVyeVNlbGVjdG9yQWxsJyBvbiAnRG9jdW1lbnQnOiAnXCIgKyBzZWxlY3RvcnMgKyBcIicgaXMgbm90IGEgdmFsaWQgc2VsZWN0b3IuXCI7XG4gICAgICB9XG5cbiAgICAgIHZhciByZWcgPSAvXltBLVphLXpdKyQvO1xuICAgICAgdmFyIHJlc3VsdCA9IHNlbGVjdG9ycy5tYXRjaChyZWcpO1xuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKHNlbGVjdG9ycyk7XG4gICAgICB9XG5cbiAgICAgIHJlZyA9IC9eLltBLVphLXokX11bQS1aYS16JF8wLTlcXC0gXSokLztcbiAgICAgIHJlc3VsdCA9IHNlbGVjdG9ycy5tYXRjaChyZWcpO1xuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHZhciBzZWxlY3RvckFyciA9IHNlbGVjdG9ycy5zcGxpdChcIiBcIik7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IHNlbGVjdG9yQXJyLnNoaWZ0KCk7XG4gICAgICAgIG5vZGVMaXN0ID0gdGhpcy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHNlbGVjdG9yLnN1YnN0cigxKSk7XG4gICAgICAgIHZhciBsZW5ndGggPSBzZWxlY3RvckFyci5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgIHNlbGVjdG9ycyA9IHNlbGVjdG9yQXJyLmpvaW4oXCIgXCIpO1xuICAgICAgICAgIGxlbmd0aCA9IG5vZGVMaXN0Lmxlbmd0aDtcblxuICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciBzdWJOb2RlTGlzdCA9IG5vZGVMaXN0W2luZGV4XS5xdWVyeVNlbGVjdG9yKHNlbGVjdG9ycyk7XG5cbiAgICAgICAgICAgIGlmIChzdWJOb2RlTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN1Yk5vZGVMaXN0WzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlTGlzdFswXTtcbiAgICAgIH1cblxuICAgICAgcmVnID0gL14jW0EtWmEteiRfXVtBLVphLXokXzAtOVxcLV0qJC87XG4gICAgICByZXN1bHQgPSBzZWxlY3RvcnMubWF0Y2gocmVnKTtcblxuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXMuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3JzLnN1YnN0cigxKSk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICBub2RlTGlzdC5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvcnMgPT09IFwiKlwiKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKHNlbGVjdG9ycyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2RlTGlzdFswXTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZCgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVxdWVzdEZ1bGxzY3JlZW5cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVxdWVzdEZ1bGxzY3JlZW4oKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZUF0dHJpYnV0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpIHtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgIGZvciAodmFyIHN0eWxlTmFtZSBpbiB0aGlzW1wic3R5bGVcIl0pIHtcbiAgICAgICAgICB0aGlzW1wic3R5bGVcIl1bc3R5bGVOYW1lXSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbYXR0ck5hbWVdID0gXCJcIjtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2V0QXR0cmlidXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSkge1xuICAgICAgaWYgKG5hbWUgPT09IFwic3R5bGVcIikge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwidW5kZWZpbmVkXCIgfHwgdmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PSBcIlwiKSB7XG4gICAgICAgICAgZm9yICh2YXIgc3R5bGVOYW1lIGluIHRoaXNbXCJzdHlsZVwiXSkge1xuICAgICAgICAgICAgdGhpc1tcInN0eWxlXCJdW3N0eWxlTmFtZV0gPSBcIlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1xccyovZywgXCJcIik7XG4gICAgICAgICAgdmFyIHZhbHVlQXJyYXkgPSB2YWx1ZS5zcGxpdChcIjtcIik7XG5cbiAgICAgICAgICBmb3IgKHZhciBpbmRleCBpbiB2YWx1ZUFycmF5KSB7XG4gICAgICAgICAgICBpZiAodmFsdWVBcnJheVtpbmRleF0gIT0gXCJcIikge1xuICAgICAgICAgICAgICB2YXIgdmFsdWVUZW1wID0gdmFsdWVBcnJheVtpbmRleF0uc3BsaXQoXCI6XCIpO1xuICAgICAgICAgICAgICB0aGlzW1wic3R5bGVcIl1bdmFsdWVUZW1wWzBdXSA9IHZhbHVlVGVtcFsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0QXR0cmlidXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEF0dHJpYnV0ZShuYW1lKSB7XG4gICAgICB2YXIgYXR0cmlidXRlVmFsdWUgPSBudWxsO1xuXG4gICAgICBpZiAobmFtZSA9PSBcInN0eWxlXCIpIHtcbiAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBKU09OLnN0cmluZ2lmeSh0aGlzW1wic3R5bGVcIl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlVmFsdWUgPSB0aGlzW25hbWVdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXR0cmlidXRlVmFsdWU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNldEF0dHJpYnV0ZU5TXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZU5TKG5zLCBuYW1lLCB2YWx1ZSkge1xuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJmb2N1c1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmb2N1cygpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwiYmx1clwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBibHVyKCkge31cbiAgfSwge1xuICAgIGtleTogXCJsYXN0Q2hpbGRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHZhciBsYXN0Q2hpbGQgPSB0aGlzLmNoaWxkTm9kZXNbdGhpcy5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdO1xuICAgICAgcmV0dXJuIGxhc3RDaGlsZCA/IGxhc3RDaGlsZCA6IHRoaXMuaW5uZXJIVE1MID8gbmV3IEhUTUxFbGVtZW50KCkgOiB1bmRlZmluZWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImZpcnN0Q2hpbGRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGROb2Rlc1swXTtcbiAgICAgIHJldHVybiBjaGlsZCA/IGNoaWxkIDogdGhpcy5pbm5lckhUTUwgPyBuZXcgSFRNTEVsZW1lbnQoKSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZmlyc3RFbGVtZW50Q2hpbGRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGROb2Rlc1swXTtcbiAgICAgIHJldHVybiBjaGlsZCA/IGNoaWxkIDogdGhpcy5pbm5lckhUTUwgPyBuZXcgSFRNTEVsZW1lbnQoKSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2xpZW50SGVpZ2h0XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlIHx8IHt9O1xuICAgICAgcmV0dXJuIHBhcnNlSW50KHN0eWxlLmZvbnRTaXplIHx8IFwiMFwiKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidGFnTmFtZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZU5hbWU7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEVsZW1lbnQ7XG59KF9Ob2RlMltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEVsZW1lbnQ7XG5cbn0se1wiLi9ET01Ub2tlbkxpc3RcIjo2LFwiLi9Ob2RlXCI6MzIsXCIuL05vZGVMaXN0XCI6MzN9XSwxMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbnZhciBFdmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRXZlbnQodHlwZSwgZXZlbnRJbml0KSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEV2ZW50KTtcblxuICAgIHRoaXMuX3R5cGUgPSB0eXBlO1xuICAgIHRoaXMuX3RhcmdldCA9IG51bGw7XG4gICAgdGhpcy5fZXZlbnRQaGFzZSA9IDI7XG4gICAgdGhpcy5fY3VycmVudFRhcmdldCA9IG51bGw7XG4gICAgdGhpcy5fY2FuY2VsZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9zdG9wcGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcGFzc2l2ZUxpc3RlbmVyID0gbnVsbDtcbiAgICB0aGlzLl90aW1lU3RhbXAgPSBEYXRlLm5vdygpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEV2ZW50LCBbe1xuICAgIGtleTogXCJjb21wb3NlZFBhdGhcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY29tcG9zZWRQYXRoKCkge1xuICAgICAgdmFyIGN1cnJlbnRUYXJnZXQgPSB0aGlzLl9jdXJyZW50VGFyZ2V0O1xuXG4gICAgICBpZiAoY3VycmVudFRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbY3VycmVudFRhcmdldF07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInN0b3BQcm9wYWdhdGlvblwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24oKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKSB7XG4gICAgICB0aGlzLl9zdG9wcGVkID0gdHJ1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicHJldmVudERlZmF1bHRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcHJldmVudERlZmF1bHQoKSB7XG4gICAgICBpZiAodGhpcy5fcGFzc2l2ZUxpc3RlbmVyICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkV2ZW50I3ByZXZlbnREZWZhdWx0KCkgd2FzIGNhbGxlZCBmcm9tIGEgcGFzc2l2ZSBsaXN0ZW5lcjpcIiwgdGhpcy5fcGFzc2l2ZUxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuY2FuY2VsYWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NhbmNlbGVkID0gdHJ1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidHlwZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRhcmdldFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3RhcmdldDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3VycmVudFRhcmdldFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRUYXJnZXQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImlzVHJ1c3RlZFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ0aW1lU3RhbXBcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl90aW1lU3RhbXA7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMudHlwZS5pbmRleE9mKFwidG91Y2hcIikpIHtcbiAgICAgICAgdGhpcy5fdGltZVN0YW1wID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImV2ZW50UGhhc2VcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ldmVudFBoYXNlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJidWJibGVzXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNhbmNlbGFibGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJkZWZhdWx0UHJldmVudGVkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY2FuY2VsZWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNvbXBvc2VkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEV2ZW50O1xufSgpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEV2ZW50O1xuRXZlbnQuTk9ORSA9IDA7XG5FdmVudC5DQVBUVVJJTkdfUEhBU0UgPSAxO1xuRXZlbnQuQVRfVEFSR0VUID0gMjtcbkV2ZW50LkJVQkJMSU5HX1BIQVNFID0gMztcblxufSx7fV0sMTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9Ub3VjaEV2ZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Ub3VjaEV2ZW50XCIpKTtcblxudmFyIF9XZWFrTWFwID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi91dGlsL1dlYWtNYXBcIikpO1xuXG52YXIgX0RldmljZU1vdGlvbkV2ZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9EZXZpY2VNb3Rpb25FdmVudFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbnZhciBfbGlzdGVuZXJTdGF0ID0ge307XG5cbnZhciBfb25Ub3VjaFN0YXJ0ID0gZnVuY3Rpb24gX29uVG91Y2hTdGFydChlKSB7XG4gIHZhciBldmVudCA9IG5ldyBfVG91Y2hFdmVudFtcImRlZmF1bHRcIl0oXCJ0b3VjaHN0YXJ0XCIpO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChPYmplY3QuYXNzaWduKGV2ZW50LCBlKSk7XG59O1xuXG52YXIgX29uVG91Y2hNb3ZlID0gZnVuY3Rpb24gX29uVG91Y2hNb3ZlKGUpIHtcbiAgdmFyIGV2ZW50ID0gbmV3IF9Ub3VjaEV2ZW50W1wiZGVmYXVsdFwiXShcInRvdWNobW92ZVwiKTtcbiAgd2luZG93LmRpc3BhdGNoRXZlbnQoT2JqZWN0LmFzc2lnbihldmVudCwgZSkpO1xufTtcblxudmFyIF9vblRvdWNoQ2FuY2VsID0gZnVuY3Rpb24gX29uVG91Y2hDYW5jZWwoZSkge1xuICB2YXIgZXZlbnQgPSBuZXcgX1RvdWNoRXZlbnRbXCJkZWZhdWx0XCJdKFwidG91Y2hjYW5jZWxcIik7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KE9iamVjdC5hc3NpZ24oZXZlbnQsIGUpKTtcbn07XG5cbnZhciBfb25Ub3VjaEVuZCA9IGZ1bmN0aW9uIF9vblRvdWNoRW5kKGUpIHtcbiAgdmFyIGV2ZW50ID0gbmV3IF9Ub3VjaEV2ZW50W1wiZGVmYXVsdFwiXShcInRvdWNoZW5kXCIpO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChPYmplY3QuYXNzaWduKGV2ZW50LCBlKSk7XG59O1xuXG52YXIgX3N5c3RlbUluZm8gPSByYWwuZ2V0U3lzdGVtSW5mb1N5bmMoKTtcblxudmFyIF9pc0FuZHJvaWQgPSBfc3lzdGVtSW5mby5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpID09PSBcImFuZHJvaWRcIjtcblxudmFyIF9hbHBoYSA9IDAuODtcbnZhciBfZ3Jhdml0eSA9IFswLCAwLCAwXTtcblxudmFyIF9vbkFjY2VsZXJvbWV0ZXJDaGFuZ2UgPSBmdW5jdGlvbiBfb25BY2NlbGVyb21ldGVyQ2hhbmdlKGUpIHtcbiAgaWYgKF9pc0FuZHJvaWQpIHtcbiAgICBlLnggKj0gLTEwO1xuICAgIGUueSAqPSAtMTA7XG4gICAgZS56ICo9IC0xMDtcbiAgfSBlbHNlIHtcbiAgICBlLnggKj0gMTA7XG4gICAgZS55ICo9IDEwO1xuICAgIGUueiAqPSAxMDtcbiAgfVxuXG4gIF9ncmF2aXR5WzBdID0gX2FscGhhICogX2dyYXZpdHlbMF0gKyAoMSAtIF9hbHBoYSkgKiBlLng7XG4gIF9ncmF2aXR5WzFdID0gX2FscGhhICogX2dyYXZpdHlbMV0gKyAoMSAtIF9hbHBoYSkgKiBlLnk7XG4gIF9ncmF2aXR5WzJdID0gX2FscGhhICogX2dyYXZpdHlbMl0gKyAoMSAtIF9hbHBoYSkgKiBlLno7XG4gIHZhciBldmVudCA9IG5ldyBfRGV2aWNlTW90aW9uRXZlbnRbXCJkZWZhdWx0XCJdKHtcbiAgICBhY2NlbGVyYXRpb246IHtcbiAgICAgIHg6IGUueCAtIF9ncmF2aXR5WzBdLFxuICAgICAgeTogZS55IC0gX2dyYXZpdHlbMV0sXG4gICAgICB6OiBlLnogLSBfZ3Jhdml0eVsyXVxuICAgIH0sXG4gICAgYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eToge1xuICAgICAgeDogZS54LFxuICAgICAgeTogZS55LFxuICAgICAgejogZS56XG4gICAgfVxuICB9KTtcbiAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxudmFyIEV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdmVudFRhcmdldCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRUYXJnZXQpO1xuXG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLnNldCh0aGlzLCB7fSk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRXZlbnRUYXJnZXQsIFt7XG4gICAga2V5OiBcImFkZEV2ZW50TGlzdGVuZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuXG4gICAgICB2YXIgcHJpdmF0ZVRoaXMgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpO1xuXG4gICAgICBpZiAoIXByaXZhdGVUaGlzKSB7XG4gICAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5zZXQodGhpcywgcHJpdmF0ZVRoaXMgPSB7fSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBldmVudHMgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHByaXZhdGVUaGlzKTtcblxuICAgICAgaWYgKCFldmVudHMpIHtcbiAgICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLnNldChwcml2YXRlVGhpcywgZXZlbnRzID0ge30pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWV2ZW50c1t0eXBlXSkge1xuICAgICAgICBldmVudHNbdHlwZV0gPSBbXTtcbiAgICAgIH1cblxuICAgICAgdmFyIGxpc3RlbmVyQXJyYXkgPSBldmVudHNbdHlwZV07XG4gICAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJBcnJheS5sZW5ndGg7XG5cbiAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7ICsraW5kZXgpIHtcbiAgICAgICAgaWYgKGxpc3RlbmVyQXJyYXlbaW5kZXhdID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lckFycmF5LnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICBpZiAoX2xpc3RlbmVyU3RhdFt0eXBlXSkge1xuICAgICAgICArK19saXN0ZW5lclN0YXRbdHlwZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfbGlzdGVuZXJTdGF0W3R5cGVdID0gMTtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwidG91Y2hzdGFydFwiOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByYWwub25Ub3VjaFN0YXJ0KF9vblRvdWNoU3RhcnQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgXCJ0b3VjaG1vdmVcIjpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcmFsLm9uVG91Y2hNb3ZlKF9vblRvdWNoTW92ZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSBcInRvdWNoY2FuY2VsXCI6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHJhbC5vblRvdWNoQ2FuY2VsKF9vblRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlIFwidG91Y2hlbmRcIjpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcmFsLm9uVG91Y2hFbmQoX29uVG91Y2hFbmQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgXCJkZXZpY2Vtb3Rpb25cIjpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcmFsLm9uQWNjZWxlcm9tZXRlckNoYW5nZShfb25BY2NlbGVyb21ldGVyQ2hhbmdlKTtcbiAgICAgICAgICAgICAgcmFsLnN0YXJ0QWNjZWxlcm9tZXRlcigpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5jYXB0dXJlKSB7fVxuXG4gICAgICBpZiAob3B0aW9ucy5vbmNlKSB7fVxuXG4gICAgICBpZiAob3B0aW9ucy5wYXNzaXZlKSB7fVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZW1vdmVFdmVudExpc3RlbmVyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBwcml2YXRlVGhpcyA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcyk7XG5cbiAgICAgIHZhciBldmVudHM7XG5cbiAgICAgIGlmIChwcml2YXRlVGhpcykge1xuICAgICAgICBldmVudHMgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHByaXZhdGVUaGlzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV2ZW50cykge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgICAgIGlmIChsaXN0ZW5lcnMgJiYgbGlzdGVuZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDsgaS0tOyBpID4gMCkge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcblxuICAgICAgICAgICAgICBpZiAoLS1fbGlzdGVuZXJTdGF0W3R5cGVdID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICBjYXNlIFwidG91Y2hzdGFydFwiOlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgcmFsLm9mZlRvdWNoU3RhcnQoX29uVG91Y2hTdGFydCk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgY2FzZSBcInRvdWNobW92ZVwiOlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgcmFsLm9mZlRvdWNoTW92ZShfb25Ub3VjaE1vdmUpO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0b3VjaGNhbmNlbFwiOlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgcmFsLm9mZlRvdWNoQ2FuY2VsKF9vblRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBjYXNlIFwidG91Y2hlbmRcIjpcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIHJhbC5vZmZUb3VjaEVuZChfb25Ub3VjaEVuZCk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgY2FzZSBcImRldmljZW1vdGlvblwiOlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgcmFsLm9mZkFjY2VsZXJvbWV0ZXJDaGFuZ2UoX29uQWNjZWxlcm9tZXRlckNoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgICAgcmFsLnN0b3BBY2NlbGVyb21ldGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZGlzcGF0Y2hFdmVudFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNwYXRjaEV2ZW50KCkge1xuICAgICAgdmFyIGV2ZW50ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICAgIGV2ZW50Ll90YXJnZXQgPSBldmVudC5fY3VycmVudFRhcmdldCA9IHRoaXM7XG5cbiAgICAgIGlmIChldmVudCBpbnN0YW5jZW9mIF9Ub3VjaEV2ZW50W1wiZGVmYXVsdFwiXSkge1xuICAgICAgICB2YXIgdG91Y2hlQXJyYXkgPSBldmVudC50b3VjaGVzO1xuICAgICAgICB2YXIgbGVuZ3RoID0gdG91Y2hlQXJyYXkubGVuZ3RoO1xuXG4gICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7ICsraW5kZXgpIHtcbiAgICAgICAgICB0b3VjaGVBcnJheVtpbmRleF0udGFyZ2V0ID0gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRvdWNoZUFycmF5ID0gZXZlbnQuY2hhbmdlZFRvdWNoZXM7XG4gICAgICAgIGxlbmd0aCA9IHRvdWNoZUFycmF5Lmxlbmd0aDtcblxuICAgICAgICBmb3IgKHZhciBfaW5kZXggPSAwOyBfaW5kZXggPCBsZW5ndGg7ICsrX2luZGV4KSB7XG4gICAgICAgICAgdG91Y2hlQXJyYXlbX2luZGV4XS50YXJnZXQgPSB0aGlzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBjYWxsYmFjayA9IHRoaXNbXCJvblwiICsgZXZlbnQudHlwZV07XG5cbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgIH1cblxuICAgICAgdmFyIHByaXZhdGVUaGlzID0gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKTtcblxuICAgICAgdmFyIGV2ZW50cztcblxuICAgICAgaWYgKHByaXZhdGVUaGlzKSB7XG4gICAgICAgIGV2ZW50cyA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQocHJpdmF0ZVRoaXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXZlbnRzKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBldmVudHNbZXZlbnQudHlwZV07XG5cbiAgICAgICAgaWYgKGxpc3RlbmVycykge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnNbaV0uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGV2ZW50Ll90YXJnZXQgPSBldmVudC5fY3VycmVudFRhcmdldCA9IG51bGw7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRXZlbnRUYXJnZXQ7XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gRXZlbnRUYXJnZXQ7XG5cbn0se1wiLi9EZXZpY2VNb3Rpb25FdmVudFwiOjcsXCIuL1RvdWNoRXZlbnRcIjozNixcIi4vdXRpbC9XZWFrTWFwXCI6NTZ9XSwxMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9XZWFrTWFwID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi91dGlsL1dlYWtNYXBcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG52YXIgRm9udEZhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEZvbnRGYWNlKGZhbWlseSwgc291cmNlLCBkZXNjcmlwdG9ycykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBGb250RmFjZSk7XG5cbiAgICB0aGlzLmZhbWlseSA9IGZhbWlseTtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB0aGlzLmRlc2NyaXB0b3JzID0gZGVzY3JpcHRvcnM7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBfc2VsZlByaXZhdGUgPSB7XG4gICAgICBzdGF0dXM6IFwidW5sb2FkZWRcIixcbiAgICAgIF9zdGF0dXM6IFwidW5sb2FkZWRcIixcbiAgICAgIGxvYWQ6IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gXCJsb2FkaW5nXCI7XG4gICAgICAgIHZhciBzb3VyY2U7XG5cbiAgICAgICAgaWYgKHNlbGYuc291cmNlLm1hdGNoKC91cmxcXChcXHMqJ1xccyooLio/KVxccyonXFxzKlxcKS8pKSB7XG4gICAgICAgICAgc291cmNlID0gc2VsZi5zb3VyY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc291cmNlID0gXCJ1cmwoJ1wiICsgc2VsZi5zb3VyY2UgKyBcIicpXCI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmFtaWx5ID0gcmFsLmxvYWRGb250KHNlbGYuZmFtaWx5LCBzb3VyY2UpO1xuXG4gICAgICAgIGlmIChmYW1pbHkpIHtcbiAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBcImxvYWRlZFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFwiZXJyb3JcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBzdGF0dXMgPSBfc2VsZlByaXZhdGUuc3RhdHVzID0gX3NlbGZQcml2YXRlLl9zdGF0dXM7XG5cbiAgICAgICAgICBpZiAoc3RhdHVzID09PSBcImxvYWRlZFwiKSB7XG4gICAgICAgICAgICBfc2VsZlByaXZhdGUubG9hZFJlc29sdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3NlbGZQcml2YXRlLmxvYWRSZWplY3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uc2V0KHRoaXMsIF9zZWxmUHJpdmF0ZSk7XG5cbiAgICBfc2VsZlByaXZhdGUubG9hZGVkID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgX3NlbGZQcml2YXRlLmxvYWRSZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIF9zZWxmUHJpdmF0ZS5sb2FkUmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEZvbnRGYWNlLCBbe1xuICAgIGtleTogXCJsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmxvYWQoKTtcblxuICAgICAgcmV0dXJuIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykubG9hZGVkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzdGF0dXNcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLnN0YXR1cztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9hZGVkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5sb2FkZWQ7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEZvbnRGYWNlO1xufSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRGYWNlO1xuXG59LHtcIi4vdXRpbC9XZWFrTWFwXCI6NTZ9XSwxMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfRXZlbnRUYXJnZXQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9FdmVudFRhcmdldFwiKSk7XG5cbnZhciBfRXZlbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50XCIpKTtcblxudmFyIF9XZWFrTWFwID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi91dGlsL1dlYWtNYXBcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxudmFyIEZvbnRGYWNlU2V0ID0gZnVuY3Rpb24gKF9FdmVudFRhcmdldCkge1xuICBfaW5oZXJpdHMoRm9udEZhY2VTZXQsIF9FdmVudFRhcmdldCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihGb250RmFjZVNldCk7XG5cbiAgZnVuY3Rpb24gRm9udEZhY2VTZXQoKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEZvbnRGYWNlU2V0KTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcyk7XG5cbiAgICB2YXIgc2VsZiA9IF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpO1xuXG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkuc3RhdHVzID0gXCJsb2FkZWRcIjtcbiAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKS5yZWFkeSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoc2VsZikucmVhZHlSZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoc2VsZikucmVhZHlSZWplY3QgPSByZWplY3Q7XG4gICAgfSk7XG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkuZm9udEZhY2VTZXQgPSBbXTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRm9udEZhY2VTZXQsIFt7XG4gICAga2V5OiBcImFkZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhZGQoZm9udEZhY2UpIHtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuZm9udEZhY2VTZXQucHVzaChmb250RmFjZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNoZWNrXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNoZWNrKCkge1xuICAgICAgY29uc29sZS53YXJuKFwiRm9udEZhY2VTZXQuY2hlY2soKSBub3QgaW1wbGVtZW50c1wiKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2xlYXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJGb250RmFjZVNldC5jbGVhcigpIG5vdCBpbXBsZW1lbnRzXCIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJkZWxldGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2RlbGV0ZSgpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIkZvbnRGYWNlU2V0LmRlbGV0ZSgpIG5vdCBpbXBsZW1lbnRzXCIpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLnN0YXR1cyA9IFwibG9hZGluZ1wiO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKCdsb2FkaW5nJykpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIGZvbnRGYWNlU2V0ID0gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChzZWxmKS5mb250RmFjZVNldDtcblxuICAgICAgICBpZiAoZm9udEZhY2VTZXQpIHtcbiAgICAgICAgICBmb3IgKHZhciBpbmRleCBpbiBmb250RmFjZVNldCkge1xuICAgICAgICAgICAgdmFyIGZvbnRGYWNlID0gZm9udEZhY2VTZXRbaW5kZXhdO1xuXG4gICAgICAgICAgICB2YXIgc3RhdHVzID0gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChmb250RmFjZSkuc3RhdHVzO1xuXG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBcInVubG9hZGVkXCIgfHwgc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgICAgZm9udEZhY2UubG9hZCgpO1xuXG4gICAgICAgICAgICAgIGlmIChfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KGZvbnRGYWNlKS5fc3RhdHVzICE9PSBcImxvYWRlZFwiKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHNlbGYpLnN0YXR1cyA9IFwibG9hZGVkXCI7XG5cbiAgICAgICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHNlbGYpLnJlYWR5UmVzb2x2ZShbXS5jb25jYXQoX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChzZWxmKS5mb250RmFjZVNldCkpO1xuXG4gICAgICAgICAgcmVzb2x2ZShbXS5jb25jYXQoX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChzZWxmKS5mb250RmFjZVNldCkpO1xuICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXSgnbG9hZGluZ2RvbmUnKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChzZWxmKS5zdGF0dXMgPSBcImxvYWRlZFwiO1xuXG4gICAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoc2VsZikucmVhZHlSZWplY3QoKTtcblxuICAgICAgICByZWplY3QoKTtcbiAgICAgICAgc2VsZi5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKCdsb2FkaW5nZXJyb3InKSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RhdHVzXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5zdGF0dXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlYWR5XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5yZWFkeTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRm9udEZhY2VTZXQ7XG59KF9FdmVudFRhcmdldDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBGb250RmFjZVNldDtcblxufSx7XCIuL0V2ZW50XCI6MTAsXCIuL0V2ZW50VGFyZ2V0XCI6MTEsXCIuL3V0aWwvV2Vha01hcFwiOjU2fV0sMTQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxFbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnRcIikpO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V0aWwvV2Vha01hcFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgSFRNTEFuY2hvckVsZW1lbnQgPSBmdW5jdGlvbiAoX0hUTUxFbGVtZW50KSB7XG4gIF9pbmhlcml0cyhIVE1MQW5jaG9yRWxlbWVudCwgX0hUTUxFbGVtZW50KTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKEhUTUxBbmNob3JFbGVtZW50KTtcblxuICBmdW5jdGlvbiBIVE1MQW5jaG9yRWxlbWVudCgpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSFRNTEFuY2hvckVsZW1lbnQpO1xuXG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBcIkFcIik7XG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkucHJvdG9jb2wgPSBcIjpcIjtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSFRNTEFuY2hvckVsZW1lbnQsIFt7XG4gICAga2V5OiBcInByb3RvY29sXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5wcm90b2NvbDtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSFRNTEFuY2hvckVsZW1lbnQ7XG59KF9IVE1MRWxlbWVudDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBIVE1MQW5jaG9yRWxlbWVudDtcblxufSx7XCIuL0hUTUxFbGVtZW50XCI6MTgsXCIuL3V0aWwvV2Vha01hcFwiOjU2fV0sMTU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxNZWRpYUVsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MTWVkaWFFbGVtZW50XCIpKTtcblxudmFyIF9FdmVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRXZlbnRcIikpO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V0aWwvV2Vha01hcFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIHNldCh0YXJnZXQsIHByb3BlcnR5LCB2YWx1ZSwgcmVjZWl2ZXIpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ICE9PSBcInVuZGVmaW5lZFwiICYmIFJlZmxlY3Quc2V0KSB7IHNldCA9IFJlZmxlY3Quc2V0OyB9IGVsc2UgeyBzZXQgPSBmdW5jdGlvbiBzZXQodGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyKSB7IHZhciBiYXNlID0gX3N1cGVyUHJvcEJhc2UodGFyZ2V0LCBwcm9wZXJ0eSk7IHZhciBkZXNjOyBpZiAoYmFzZSkgeyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihiYXNlLCBwcm9wZXJ0eSk7IGlmIChkZXNjLnNldCkgeyBkZXNjLnNldC5jYWxsKHJlY2VpdmVyLCB2YWx1ZSk7IHJldHVybiB0cnVlOyB9IGVsc2UgaWYgKCFkZXNjLndyaXRhYmxlKSB7IHJldHVybiBmYWxzZTsgfSB9IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHJlY2VpdmVyLCBwcm9wZXJ0eSk7IGlmIChkZXNjKSB7IGlmICghZGVzYy53cml0YWJsZSkgeyByZXR1cm4gZmFsc2U7IH0gZGVzYy52YWx1ZSA9IHZhbHVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVjZWl2ZXIsIHByb3BlcnR5LCBkZXNjKTsgfSBlbHNlIHsgX2RlZmluZVByb3BlcnR5KHJlY2VpdmVyLCBwcm9wZXJ0eSwgdmFsdWUpOyB9IHJldHVybiB0cnVlOyB9OyB9IHJldHVybiBzZXQodGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyKTsgfVxuXG5mdW5jdGlvbiBfc2V0KHRhcmdldCwgcHJvcGVydHksIHZhbHVlLCByZWNlaXZlciwgaXNTdHJpY3QpIHsgdmFyIHMgPSBzZXQodGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyIHx8IHRhcmdldCk7IGlmICghcyAmJiBpc1N0cmljdCkgeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBzZXQgcHJvcGVydHknKTsgfSByZXR1cm4gdmFsdWU7IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxuZnVuY3Rpb24gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikgeyBpZiAodHlwZW9mIFJlZmxlY3QgIT09IFwidW5kZWZpbmVkXCIgJiYgUmVmbGVjdC5nZXQpIHsgX2dldCA9IFJlZmxlY3QuZ2V0OyB9IGVsc2UgeyBfZ2V0ID0gZnVuY3Rpb24gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikgeyB2YXIgYmFzZSA9IF9zdXBlclByb3BCYXNlKHRhcmdldCwgcHJvcGVydHkpOyBpZiAoIWJhc2UpIHJldHVybjsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGJhc2UsIHByb3BlcnR5KTsgaWYgKGRlc2MuZ2V0KSB7IHJldHVybiBkZXNjLmdldC5jYWxsKHJlY2VpdmVyKTsgfSByZXR1cm4gZGVzYy52YWx1ZTsgfTsgfSByZXR1cm4gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlciB8fCB0YXJnZXQpOyB9XG5cbmZ1bmN0aW9uIF9zdXBlclByb3BCYXNlKG9iamVjdCwgcHJvcGVydHkpIHsgd2hpbGUgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHsgb2JqZWN0ID0gX2dldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChvYmplY3QgPT09IG51bGwpIGJyZWFrOyB9IHJldHVybiBvYmplY3Q7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBIVE1MQXVkaW9FbGVtZW50ID0gZnVuY3Rpb24gKF9IVE1MTWVkaWFFbGVtZW50KSB7XG4gIF9pbmhlcml0cyhIVE1MQXVkaW9FbGVtZW50LCBfSFRNTE1lZGlhRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MQXVkaW9FbGVtZW50KTtcblxuICBmdW5jdGlvbiBIVE1MQXVkaW9FbGVtZW50KHVybCkge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBIVE1MQXVkaW9FbGVtZW50KTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgdXJsLCAnQVVESU8nKTtcbiAgICB2YXIgaW5uZXJBdWRpb0NvbnRleHQgPSByYWwuY3JlYXRlSW5uZXJBdWRpb0NvbnRleHQoKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vbkNhbnBsYXkoZnVuY3Rpb24gKCkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5kdXJhdGlvbiA9IGlubmVyQXVkaW9Db250ZXh0LmR1cmF0aW9uO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwiY2FucGxheVwiKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJjYW5wbGF5dGhyb3VnaFwiKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJkdXJhdGlvbmNoYW5nZVwiKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJsb2FkZWRtZXRhZGF0YVwiKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJsb2FkZWRkYXRhXCIpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vblBsYXkoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwicGxheVwiKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJwbGF5aW5nXCIpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vblBhdXNlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcInBhdXNlXCIpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vbkVuZGVkKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImVuZGVkXCIpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vbkVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuZHVyYXRpb24gPSBOYU47XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJlcnJvclwiKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJlbXB0aWVkXCIpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vbldhaXRpbmcoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwid2FpdGluZ1wiKSk7XG4gICAgfS5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKSk7XG4gICAgaW5uZXJBdWRpb0NvbnRleHQub25TZWVrZWQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwic2Vla2VkXCIpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpKTtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vblNlZWtpbmcoZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwic2Vla2luZ1wiKSk7XG4gICAgfS5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKSk7XG4gICAgaW5uZXJBdWRpb0NvbnRleHQub25UaW1lVXBkYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcInRpbWV1cGRhdGVcIikpO1xuICAgIH0uYmluZChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkpO1xuICAgIGlubmVyQXVkaW9Db250ZXh0LnNyYyA9IHVybDtcbiAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKS5pbm5lckF1ZGlvQ29udGV4dCA9IGlubmVyQXVkaW9Db250ZXh0O1xuICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpLmR1cmF0aW9uID0gTmFOO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhIVE1MQXVkaW9FbGVtZW50LCBbe1xuICAgIGtleTogXCJjYW5QbGF5VHlwZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYW5QbGF5VHlwZSgpIHtcbiAgICAgIHZhciBtZWRpYVR5cGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6ICcnO1xuXG4gICAgICBpZiAodHlwZW9mIG1lZGlhVHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICBpZiAobWVkaWFUeXBlLmluZGV4T2YoJ2F1ZGlvL21wZWcnKSA+IC0xIHx8IG1lZGlhVHlwZS5pbmRleE9mKCdhdWRpby9tcDQnKSkge1xuICAgICAgICByZXR1cm4gJ3Byb2JhYmx5JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJsb2Fkc3RhcnRcIikpO1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5pbm5lckF1ZGlvQ29udGV4dC5zcmMgPSBfZ2V0KF9nZXRQcm90b3R5cGVPZihIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZSksIFwic3JjXCIsIHRoaXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJwYXVzZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwYXVzZSgpIHtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQucGF1c2UoKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicGxheVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwbGF5KCkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5pbm5lckF1ZGlvQ29udGV4dC5wbGF5KCk7XG5cbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcInByb2dyZXNzXCIpKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3VycmVudFRpbWVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmlubmVyQXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQuc2Vlayh2YWx1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxvb3BcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfZ2V0KF9nZXRQcm90b3R5cGVPZihIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZSksIFwibG9vcFwiLCB0aGlzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICBfc2V0KF9nZXRQcm90b3R5cGVPZihIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZSksIFwibG9vcFwiLCB2YWx1ZSwgdGhpcywgdHJ1ZSk7XG5cbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQubG9vcCA9IHZhbHVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ2b2x1bWVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfZ2V0KF9nZXRQcm90b3R5cGVPZihIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZSksIFwidm9sdW1lXCIsIHRoaXMpO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIF9zZXQoX2dldFByb3RvdHlwZU9mKEhUTUxBdWRpb0VsZW1lbnQucHJvdG90eXBlKSwgXCJ2b2x1bWVcIiwgdmFsdWUsIHRoaXMsIHRydWUpO1xuXG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmlubmVyQXVkaW9Db250ZXh0LnZvbHVtZSA9IHZhbHVlO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwidm9sdW1lY2hhbmdlXCIpKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3JjXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX2dldChfZ2V0UHJvdG90eXBlT2YoSFRNTEF1ZGlvRWxlbWVudC5wcm90b3R5cGUpLCBcInNyY1wiLCB0aGlzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICBfc2V0KF9nZXRQcm90b3R5cGVPZihIVE1MQXVkaW9FbGVtZW50LnByb3RvdHlwZSksIFwic3JjXCIsIHZhbHVlLCB0aGlzLCB0cnVlKTtcblxuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwibG9hZHN0YXJ0XCIpKTtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQuc3JjID0gdmFsdWU7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEhUTUxBdWRpb0VsZW1lbnQ7XG59KF9IVE1MTWVkaWFFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxBdWRpb0VsZW1lbnQ7XG5cbn0se1wiLi9FdmVudFwiOjEwLFwiLi9IVE1MTWVkaWFFbGVtZW50XCI6MjMsXCIuL3V0aWwvV2Vha01hcFwiOjU2fV0sMTY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxFbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnQuanNcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbnZhciBIVE1MQm9keUVsZW1lbnQgPSBmdW5jdGlvbiAoX0hUTUxFbGVtZW50KSB7XG4gIF9pbmhlcml0cyhIVE1MQm9keUVsZW1lbnQsIF9IVE1MRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MQm9keUVsZW1lbnQpO1xuXG4gIGZ1bmN0aW9uIEhUTUxCb2R5RWxlbWVudChwYXJlbnROb2RlKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEhUTUxCb2R5RWxlbWVudCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIFwiQk9EWVwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJwYXJlbnROb2RlXCIsIG51bGwpO1xuXG4gICAgX3RoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgcmV0dXJuIEhUTUxCb2R5RWxlbWVudDtcbn0oX0hUTUxFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxCb2R5RWxlbWVudDtcblxufSx7XCIuL0hUTUxFbGVtZW50LmpzXCI6MTh9XSwxNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG52YXIgX0hUTUxFbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnRcIikpO1xuXG52YXIgX0ltYWdlRGF0YSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSW1hZ2VEYXRhXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbmlmIChyYWwuZ2V0RmVhdHVyZVByb3BlcnR5KFwiSFRNTENhbnZhc0VsZW1lbnRcIiwgXCJzcGVjXCIpID09PSBcInZpdm9fcGxhdGZvcm1fc3VwcG9ydFwiKSB7XG4gIHZhciBIVE1MQ2FudmFzRWxlbWVudCA9IHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudDtcbiAgbW9kdWxlLmV4cG9ydHMgPSBIVE1MQ2FudmFzRWxlbWVudDtcbn0gZWxzZSB7XG4gIHZhciBDQU5WQVNfREVGQVVMVF9XSURUSCA9IDMwMDtcbiAgdmFyIENBTlZBU19ERUZBVUxUX0hFSUdIVCA9IDE1MDtcbiAgd2luZG93LnJhbCA9IHdpbmRvdy5yYWwgfHwge307XG4gIHZhciBfY3JlYXRlQ2FudmFzID0gcmFsLmNyZWF0ZUNhbnZhcztcblxuICB2YXIgX0hUTUxDYW52YXNFbGVtZW50ID0gZnVuY3Rpb24gKF9IVE1MRWxlbWVudCkge1xuICAgIF9pbmhlcml0cyhfSFRNTENhbnZhc0VsZW1lbnQsIF9IVE1MRWxlbWVudCk7XG5cbiAgICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKF9IVE1MQ2FudmFzRWxlbWVudCk7XG5cbiAgICBmdW5jdGlvbiBfSFRNTENhbnZhc0VsZW1lbnQod2lkdGgsIGhlaWdodCkge1xuICAgICAgdmFyIF90aGlzO1xuXG4gICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0hUTUxDYW52YXNFbGVtZW50KTtcblxuICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCAnQ0FOVkFTJyk7XG4gICAgICBfdGhpcy5pZCA9ICdnbGNhbnZhcyc7XG4gICAgICBfdGhpcy50eXBlID0gJ2NhbnZhcyc7XG4gICAgICBfdGhpcy50b3AgPSAwO1xuICAgICAgX3RoaXMubGVmdCA9IDA7XG5cbiAgICAgIGlmICh0eXBlb2YgcmFsLmdldEZlYXR1cmVQcm9wZXJ0eShcInJhbC5jcmVhdGVDYW52YXNcIiwgXCJzcGVjXCIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHZhciBjYW52YXMgPSBfY3JlYXRlQ2FudmFzKCk7XG5cbiAgICAgICAgY2FudmFzLl9fcHJvdG9fXy5fX3Byb3RvX18gPSBfSFRNTENhbnZhc0VsZW1lbnQucHJvdG90eXBlO1xuICAgICAgICBPYmplY3Qua2V5cyhfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgY2FudmFzW2tleV0gPSB0aGlzW2tleV07XG4gICAgICAgIH0uYmluZChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkpO1xuICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aCA+PSAwID8gTWF0aC5jZWlsKHdpZHRoKSA6IENBTlZBU19ERUZBVUxUX1dJRFRIO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0ID49IDAgPyBNYXRoLmNlaWwoaGVpZ2h0KSA6IENBTlZBU19ERUZBVUxUX0hFSUdIVDtcbiAgICAgICAgY2FudmFzLl90YXJnZXRJRCA9IF90aGlzLl90YXJnZXRJRDtcbiAgICAgICAgY2FudmFzLl9saXN0ZW5lckNvdW50ID0gX3RoaXMuX2xpc3RlbmVyQ291bnQ7XG4gICAgICAgIGNhbnZhcy5fbGlzdGVuZXJzID0gX3RoaXMuX2xpc3RlbmVycztcbiAgICAgICAgcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKF90aGlzLCBjYW52YXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3RoaXMuX3dpZHRoID0gd2lkdGggPyBNYXRoLmNlaWwod2lkdGgpIDogQ0FOVkFTX0RFRkFVTFRfV0lEVEg7XG4gICAgICAgIF90aGlzLl9oZWlnaHQgPSBoZWlnaHQgPyBNYXRoLmNlaWwoaGVpZ2h0KSA6IENBTlZBU19ERUZBVUxUX0hFSUdIVDtcbiAgICAgICAgX3RoaXMuX2NvbnRleHQyRCA9IG51bGw7XG4gICAgICAgIF90aGlzLl9kYXRhSW5uZXIgPSBudWxsO1xuICAgICAgICBfdGhpcy5fYWxpZ25tZW50ID0gX3RoaXMuX3dpZHRoICUgMiA9PT0gMCA/IDggOiA0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKF9IVE1MQ2FudmFzRWxlbWVudCwgW3tcbiAgICAgIGtleTogXCJnZXRDb250ZXh0XCIsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q29udGV4dChuYW1lLCBvcHRzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAobmFtZSA9PT0gJ3dlYmdsJyB8fCBuYW1lID09PSAnZXhwZXJpbWVudGFsLXdlYmdsJykge1xuICAgICAgICAgIHJldHVybiB3aW5kb3cuX19nbDtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSAnMmQnKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLl9jb250ZXh0MkQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQyRCA9IG5ldyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5fY29udGV4dDJELl9pbm5lckNhbnZhcyA9IHRoaXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQyRDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogXCJfZGF0YVwiLFxuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb250ZXh0MkQgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fZGF0YUlubmVyKSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLl9jb250ZXh0MkQuX2dldERhdGEoKTtcblxuICAgICAgICAgIHRoaXMuX2RhdGFJbm5lciA9IG5ldyBfSW1hZ2VEYXRhW1wiZGVmYXVsdFwiXShkYXRhLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YUlubmVyO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogXCJjbGllbnRXaWR0aFwiLFxuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndpZHRoO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogXCJjbGllbnRIZWlnaHRcIixcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oZWlnaHQ7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAga2V5OiBcIndpZHRoXCIsXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldCh3aWR0aCkge1xuICAgICAgICB3aWR0aCA9IHBhcnNlSW50KHdpZHRoKTtcblxuICAgICAgICBpZiAoaXNOYU4od2lkdGgpKSB7XG4gICAgICAgICAgd2lkdGggPSBDQU5WQVNfREVGQVVMVF9XSURUSDtcbiAgICAgICAgfSBlbHNlIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICB3aWR0aCA9IENBTlZBU19ERUZBVUxUX1dJRFRIO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5fYWxpZ25tZW50ID0gdGhpcy5fd2lkdGggJSAyID09PSAwID8gOCA6IDQ7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NvbnRleHQyRCkge1xuICAgICAgICAgIHRoaXMuX2NvbnRleHQyRC5fd2lkdGggPSB3aWR0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2RhdGFJbm5lciA9IG51bGw7XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl93aWR0aDtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6IFwiaGVpZ2h0XCIsXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldChoZWlnaHQpIHtcbiAgICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQoaGVpZ2h0KTtcblxuICAgICAgICBpZiAoaXNOYU4oaGVpZ2h0KSkge1xuICAgICAgICAgIGhlaWdodCA9IENBTlZBU19ERUZBVUxUX0hFSUdIVDtcbiAgICAgICAgfSBlbHNlIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgaGVpZ2h0ID0gQ0FOVkFTX0RFRkFVTFRfSEVJR0hUO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIGlmICh0aGlzLl9jb250ZXh0MkQpIHtcbiAgICAgICAgICB0aGlzLl9jb250ZXh0MkQuX2hlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2RhdGFJbm5lciA9IG51bGw7XG4gICAgICB9LFxuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oZWlnaHQ7XG4gICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIF9IVE1MQ2FudmFzRWxlbWVudDtcbiAgfShfSFRNTEVsZW1lbnQyW1wiZGVmYXVsdFwiXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBfSFRNTENhbnZhc0VsZW1lbnQ7XG59XG5cbn0se1wiLi9IVE1MRWxlbWVudFwiOjE4LFwiLi9JbWFnZURhdGFcIjoyOH1dLDE4OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9FbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRWxlbWVudFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgSFRNTEVsZW1lbnQgPSBmdW5jdGlvbiAoX0VsZW1lbnQpIHtcbiAgX2luaGVyaXRzKEhUTUxFbGVtZW50LCBfRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MRWxlbWVudCk7XG5cbiAgZnVuY3Rpb24gSFRNTEVsZW1lbnQodGFnTmFtZSkge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBIVE1MRWxlbWVudCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIHRhZ05hbWUpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNsYXNzTmFtZVwiLCAnJyk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiY2hpbGRlcm5cIiwgW10pO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInN0eWxlXCIsIHtcbiAgICAgIHdpZHRoOiBcIlwiLmNvbmNhdCh3aW5kb3cuaW5uZXJXaWR0aCwgXCJweFwiKSxcbiAgICAgIGhlaWdodDogXCJcIi5jb25jYXQod2luZG93LmlubmVySGVpZ2h0LCBcInB4XCIpXG4gICAgfSk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiaW5zZXJ0QmVmb3JlXCIsIGZ1bmN0aW9uICgpIHt9KTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJpbm5lckhUTUxcIiwgJycpO1xuXG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEhUTUxFbGVtZW50LCBbe1xuICAgIGtleTogXCJzZXRBdHRyaWJ1dGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKSB7XG4gICAgICB0aGlzW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldEF0dHJpYnV0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUobmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXNbbmFtZV07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNsaWVudFdpZHRoXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICB2YXIgcmV0ID0gcGFyc2VJbnQodGhpcy5zdHlsZS5mb250U2l6ZSwgMTApICogdGhpcy5pbm5lckhUTUwubGVuZ3RoO1xuICAgICAgcmV0dXJuIE51bWJlci5pc05hTihyZXQpID8gMCA6IHJldDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2xpZW50SGVpZ2h0XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICB2YXIgcmV0ID0gcGFyc2VJbnQodGhpcy5zdHlsZS5mb250U2l6ZSwgMTApO1xuICAgICAgcmV0dXJuIE51bWJlci5pc05hTihyZXQpID8gMCA6IHJldDtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSFRNTEVsZW1lbnQ7XG59KF9FbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxFbGVtZW50O1xuXG59LHtcIi4vRWxlbWVudFwiOjl9XSwxOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfSFRNTEVsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MRWxlbWVudC5qc1wiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxudmFyIEhUTUxIZWFkRWxlbWVudCA9IGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQpIHtcbiAgX2luaGVyaXRzKEhUTUxIZWFkRWxlbWVudCwgX0hUTUxFbGVtZW50KTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKEhUTUxIZWFkRWxlbWVudCk7XG5cbiAgZnVuY3Rpb24gSFRNTEhlYWRFbGVtZW50KHBhcmVudE5vZGUpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSFRNTEhlYWRFbGVtZW50KTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgXCJIRUFEXCIpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInBhcmVudE5vZGVcIiwgbnVsbCk7XG5cbiAgICBfdGhpcy5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gSFRNTEhlYWRFbGVtZW50O1xufShfSFRNTEVsZW1lbnQyW1wiZGVmYXVsdFwiXSk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gSFRNTEhlYWRFbGVtZW50O1xuXG59LHtcIi4vSFRNTEVsZW1lbnQuanNcIjoxOH1dLDIwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9IVE1MRWxlbWVudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0hUTUxFbGVtZW50XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBIVE1MSHRtbEVsZW1lbnQgPSBmdW5jdGlvbiAoX0hUTUxFbGVtZW50KSB7XG4gIF9pbmhlcml0cyhIVE1MSHRtbEVsZW1lbnQsIF9IVE1MRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MSHRtbEVsZW1lbnQpO1xuXG4gIGZ1bmN0aW9uIEhUTUxIdG1sRWxlbWVudCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSFRNTEh0bWxFbGVtZW50KTtcblxuICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCBcIkhUTUxcIik7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSFRNTEh0bWxFbGVtZW50LCBbe1xuICAgIGtleTogXCJ2ZXJzaW9uXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSFRNTEh0bWxFbGVtZW50O1xufShfSFRNTEVsZW1lbnQyW1wiZGVmYXVsdFwiXSk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gSFRNTEh0bWxFbGVtZW50O1xuXG59LHtcIi4vSFRNTEVsZW1lbnRcIjoxOH1dLDIxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbnZhciBfSFRNTEVsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MRWxlbWVudFwiKSk7XG5cbnZhciBfRXZlbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbmlmIChyYWwuZ2V0RmVhdHVyZVByb3BlcnR5KFwiSFRNTEltYWdlRWxlbWVudFwiLCBcInNwZWNcIikgPT09IFwidml2b19wbGF0Zm9ybV9zdXBwb3J0XCIpIHtcbiAgdmFyIEhUTUxJbWFnZUVsZW1lbnQgPSB3aW5kb3cuSFRNTEltYWdlRWxlbWVudDtcbiAgbW9kdWxlLmV4cG9ydHMgPSBIVE1MSW1hZ2VFbGVtZW50O1xufSBlbHNlIHtcbiAgd2luZG93LnJhbCA9IHdpbmRvdy5yYWwgfHwge307XG4gIHZhciBfY3JldGVJbWFnZSA9IHJhbC5jcmVhdGVJbWFnZTtcblxuICB2YXIgX2ltYWdlO1xuXG4gIHZhciBfc2V0dGVyO1xuXG4gIHZhciBfZ2V0dGVyO1xuXG4gIGlmICh0eXBlb2YgcmFsLmdldEZlYXR1cmVQcm9wZXJ0eShcInJhbC5jcmVhdGVJbWFnZVwiLCBcInNwZWNcIikgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBfaW1hZ2UgPSBfY3JldGVJbWFnZSgpO1xuXG4gICAgdmFyIF9kZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihfaW1hZ2UuX19wcm90b19fLCBcInNyY1wiKTtcblxuICAgIF9zZXR0ZXIgPSBfZGVzY3JpcHRvci5zZXQ7XG4gICAgX2dldHRlciA9IF9kZXNjcmlwdG9yLmdldDtcbiAgfVxuXG4gIHZhciBfSFRNTEltYWdlRWxlbWVudCA9IGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQpIHtcbiAgICBfaW5oZXJpdHMoX0hUTUxJbWFnZUVsZW1lbnQsIF9IVE1MRWxlbWVudCk7XG5cbiAgICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKF9IVE1MSW1hZ2VFbGVtZW50KTtcblxuICAgIGZ1bmN0aW9uIF9IVE1MSW1hZ2VFbGVtZW50KHdpZHRoLCBoZWlnaHQsIGlzQ2FsbGVkRnJvbUltYWdlKSB7XG4gICAgICB2YXIgX3RoaXM7XG5cbiAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSFRNTEltYWdlRWxlbWVudCk7XG5cbiAgICAgIGlmICghaXNDYWxsZWRGcm9tSW1hZ2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgY29uc3RydWN0b3IsIHVzZSAnbmV3IEltYWdlKHcsIGgpOyBpbnN0ZWFkISdcIik7XG4gICAgICB9XG5cbiAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgJ0lNRycpO1xuICAgICAgX3RoaXMuY29tcGxldGUgPSBmYWxzZTtcbiAgICAgIF90aGlzLmNyb3NzT3JpZ2luID0gbnVsbDtcbiAgICAgIF90aGlzLm5hdHVyYWxXaWR0aCA9IDA7XG4gICAgICBfdGhpcy5uYXR1cmFsSGVpZ2h0ID0gMDtcbiAgICAgIF90aGlzLndpZHRoID0gd2lkdGggfHwgMDtcbiAgICAgIF90aGlzLmhlaWdodCA9IGhlaWdodCB8fCAwO1xuXG4gICAgICBpZiAodHlwZW9mIHJhbC5nZXRGZWF0dXJlUHJvcGVydHkoXCJyYWwuY3JlYXRlSW1hZ2VcIiwgXCJzcGVjXCIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHZhciBpbWFnZSA9IF9jcmV0ZUltYWdlKCk7XG5cbiAgICAgICAgT2JqZWN0LmtleXMoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgIGltYWdlW2tleV0gPSB0aGlzW2tleV07XG4gICAgICAgIH0uYmluZChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkpO1xuXG4gICAgICAgIGltYWdlLl9vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgdGhpcy5uYXR1cmFsV2lkdGggPSB0aGlzLndpZHRoO1xuICAgICAgICAgIHRoaXMubmF0dXJhbEhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImxvYWRcIikpO1xuICAgICAgICB9LmJpbmQoaW1hZ2UpO1xuXG4gICAgICAgIGltYWdlLl9vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImVycm9yXCIpKTtcbiAgICAgICAgfS5iaW5kKGltYWdlKTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW1hZ2UsIFwic3JjXCIsIHtcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiBfZ2V0dGVyLmNhbGwodGhpcyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5jb21wbGV0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIF9zZXR0ZXIuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKF90aGlzLCBpbWFnZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoX0hUTUxJbWFnZUVsZW1lbnQsIFt7XG4gICAgICBrZXk6IFwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0XCIsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkge1xuICAgICAgICByZXR1cm4gbmV3IERPTVJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGtleTogXCJzcmNcIixcbiAgICAgIHNldDogZnVuY3Rpb24gc2V0KHNyYykge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICB0aGlzLl9zcmMgPSBzcmM7XG5cbiAgICAgICAgaWYgKHNyYyA9PT0gXCJcIikge1xuICAgICAgICAgIHRoaXMud2lkdGggPSAwO1xuICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICAgICAgICB0aGlzLl9pbWFnZU1ldGEgPSBudWxsO1xuICAgICAgICAgIHRoaXMuY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX2dsRm9ybWF0ID0gdGhpcy5fZ2xJbnRlcm5hbEZvcm1hdCA9IDB4MTkwODtcbiAgICAgICAgICB0aGlzLmNyb3NzT3JpZ2luID0gbnVsbDtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByYWwubG9hZEltYWdlRGF0YShzcmMsIGZ1bmN0aW9uIChpbmZvKSB7XG4gICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICB2YXIgX2V2ZW50ID0gbmV3IF9FdmVudFtcImRlZmF1bHRcIl0oJ2Vycm9yJyk7XG5cbiAgICAgICAgICAgIF90aGlzMi5kaXNwYXRjaEV2ZW50KF9ldmVudCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfdGhpczIuX2ltYWdlTWV0YSA9IGluZm87XG4gICAgICAgICAgX3RoaXMyLndpZHRoID0gX3RoaXMyLm5hdHVyYWxXaWR0aCA9IGluZm8ud2lkdGg7XG4gICAgICAgICAgX3RoaXMyLmhlaWdodCA9IF90aGlzMi5uYXR1cmFsSGVpZ2h0ID0gaW5mby5oZWlnaHQ7XG4gICAgICAgICAgX3RoaXMyLl9kYXRhID0gaW5mby5kYXRhO1xuICAgICAgICAgIF90aGlzMi5fZ2xGb3JtYXQgPSBpbmZvLmdsRm9ybWF0O1xuICAgICAgICAgIF90aGlzMi5fZ2xJbnRlcm5hbEZvcm1hdCA9IGluZm8uZ2xJbnRlcm5hbEZvcm1hdDtcbiAgICAgICAgICBfdGhpczIuX2dsVHlwZSA9IGluZm8uZ2xUeXBlO1xuICAgICAgICAgIF90aGlzMi5fbnVtYmVyT2ZNaXBtYXBzID0gaW5mby5udW1iZXJPZk1pcG1hcHM7XG4gICAgICAgICAgX3RoaXMyLl9jb21wcmVzc2VkID0gaW5mby5jb21wcmVzc2VkO1xuICAgICAgICAgIF90aGlzMi5fYnBwID0gaW5mby5icHA7XG4gICAgICAgICAgX3RoaXMyLl9wcmVtdWx0aXBseUFscGhhID0gaW5mby5wcmVtdWx0aXBseUFscGhhO1xuICAgICAgICAgIF90aGlzMi5fYWxpZ25tZW50ID0gMTtcblxuICAgICAgICAgIGlmICgoX3RoaXMyLl9udW1iZXJPZk1pcG1hcHMgPT0gMCB8fCBfdGhpczIuX251bWJlck9mTWlwbWFwcyA9PSAxKSAmJiAhX3RoaXMyLl9jb21wcmVzc2VkKSB7XG4gICAgICAgICAgICB2YXIgYnl0ZXNQZXJSb3cgPSBfdGhpczIud2lkdGggKiBfdGhpczIuX2JwcCAvIDg7XG4gICAgICAgICAgICBpZiAoYnl0ZXNQZXJSb3cgJSA4ID09IDApIF90aGlzMi5fYWxpZ25tZW50ID0gODtlbHNlIGlmIChieXRlc1BlclJvdyAlIDQgPT0gMCkgX3RoaXMyLl9hbGlnbm1lbnQgPSA0O2Vsc2UgaWYgKGJ5dGVzUGVyUm93ICUgMiA9PSAwKSBfdGhpczIuX2FsaWdubWVudCA9IDI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgX3RoaXMyLmNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgZXZlbnQgPSBuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXSgnbG9hZCcpO1xuXG4gICAgICAgICAgX3RoaXMyLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NyYztcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6IFwiY2xpZW50V2lkdGhcIixcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy53aWR0aDtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBrZXk6IFwiY2xpZW50SGVpZ2h0XCIsXG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVpZ2h0O1xuICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBfSFRNTEltYWdlRWxlbWVudDtcbiAgfShfSFRNTEVsZW1lbnQyW1wiZGVmYXVsdFwiXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBfSFRNTEltYWdlRWxlbWVudDtcbn1cblxufSx7XCIuL0V2ZW50XCI6MTAsXCIuL0hUTUxFbGVtZW50XCI6MTh9XSwyMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfSFRNTEVsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MRWxlbWVudFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9nZXQodGFyZ2V0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ICE9PSBcInVuZGVmaW5lZFwiICYmIFJlZmxlY3QuZ2V0KSB7IF9nZXQgPSBSZWZsZWN0LmdldDsgfSBlbHNlIHsgX2dldCA9IGZ1bmN0aW9uIF9nZXQodGFyZ2V0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpIHsgdmFyIGJhc2UgPSBfc3VwZXJQcm9wQmFzZSh0YXJnZXQsIHByb3BlcnR5KTsgaWYgKCFiYXNlKSByZXR1cm47IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihiYXNlLCBwcm9wZXJ0eSk7IGlmIChkZXNjLmdldCkgeyByZXR1cm4gZGVzYy5nZXQuY2FsbChyZWNlaXZlcik7IH0gcmV0dXJuIGRlc2MudmFsdWU7IH07IH0gcmV0dXJuIF9nZXQodGFyZ2V0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIgfHwgdGFyZ2V0KTsgfVxuXG5mdW5jdGlvbiBfc3VwZXJQcm9wQmFzZShvYmplY3QsIHByb3BlcnR5KSB7IHdoaWxlICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7IG9iamVjdCA9IF9nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAob2JqZWN0ID09PSBudWxsKSBicmVhazsgfSByZXR1cm4gb2JqZWN0OyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG53aW5kb3cucmFsID0gd2luZG93LnJhbCB8fCB7fTtcblxudmFyIEhUTUxJbnB1dEVsZW1lbnQgPSBmdW5jdGlvbiAoX0hUTUxFbGVtZW50KSB7XG4gIF9pbmhlcml0cyhIVE1MSW5wdXRFbGVtZW50LCBfSFRNTEVsZW1lbnQpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoSFRNTElucHV0RWxlbWVudCk7XG5cbiAgZnVuY3Rpb24gSFRNTElucHV0RWxlbWVudCgpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSFRNTElucHV0RWxlbWVudCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIFwiSU5QVVRcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiZGVmYXVsdFZhbHVlXCIsIG51bGwpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInZhbHVlXCIsIG51bGwpO1xuXG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEhUTUxJbnB1dEVsZW1lbnQsIFt7XG4gICAga2V5OiBcImZvY3VzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGZvY3VzKCkge1xuICAgICAgX2dldChfZ2V0UHJvdG90eXBlT2YoSFRNTElucHV0RWxlbWVudC5wcm90b3R5cGUpLCBcImZvY3VzXCIsIHRoaXMpLmNhbGwodGhpcyk7XG5cbiAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgdmFyIG9uS2V5Ym9hcmRJbnB1dCA9IGZ1bmN0aW9uIG9uS2V5Ym9hcmRJbnB1dChyZXMpIHtcbiAgICAgICAgdmFyIHN0ciA9IHJlcyA/IHJlcy52YWx1ZSA6IFwiXCI7XG4gICAgICAgIHRoYXQudmFsdWUgPSBzdHI7XG4gICAgICB9O1xuXG4gICAgICB2YXIgb25LZXlib2FyZENvbmZpcm0gPSBmdW5jdGlvbiBvbktleWJvYXJkQ29uZmlybShyZXMpIHtcbiAgICAgICAgdmFyIHN0ciA9IHJlcyA/IHJlcy52YWx1ZSA6IFwiXCI7XG4gICAgICAgIHRoYXQudmFsdWUgPSBzdHI7XG4gICAgICAgIHJhbC5vZmZLZXlib2FyZENvbmZpcm0ob25LZXlib2FyZENvbmZpcm0pO1xuICAgICAgICByYWwub2ZmS2V5Ym9hcmRJbnB1dChvbktleWJvYXJkSW5wdXQpO1xuICAgICAgICByYWwuaGlkZUtleWJvYXJkKHt9KTtcbiAgICAgIH07XG5cbiAgICAgIHJhbC5vZmZLZXlib2FyZElucHV0KG9uS2V5Ym9hcmRJbnB1dCk7XG4gICAgICByYWwub2ZmS2V5Ym9hcmRDb25maXJtKG9uS2V5Ym9hcmRDb25maXJtKTtcbiAgICAgIHJhbC5zaG93S2V5Ym9hcmQoe1xuICAgICAgICBkZWZhdWx0VmFsdWU6IHRoaXMuZGVmYXVsdFZhbHVlLFxuICAgICAgICBmYWlsOiBmdW5jdGlvbiBmYWlsKHJlcykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByYWwub25LZXlib2FyZElucHV0KG9uS2V5Ym9hcmRJbnB1dCk7XG4gICAgICByYWwub25LZXlib2FyZENvbmZpcm0ob25LZXlib2FyZENvbmZpcm0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJibHVyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGJsdXIoKSB7XG4gICAgICBfZ2V0KF9nZXRQcm90b3R5cGVPZihIVE1MSW5wdXRFbGVtZW50LnByb3RvdHlwZSksIFwiYmx1clwiLCB0aGlzKS5jYWxsKHRoaXMpO1xuXG4gICAgICByYWwuaGlkZUtleWJvYXJkKHt9KTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSFRNTElucHV0RWxlbWVudDtcbn0oX0hUTUxFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbn0se1wiLi9IVE1MRWxlbWVudFwiOjE4fV0sMjM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxFbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnRcIikpO1xuXG52YXIgX01lZGlhRXJyb3IgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL01lZGlhRXJyb3JcIikpO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V0aWwvV2Vha01hcFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgSFRNTE1lZGlhRWxlbWVudCA9IGZ1bmN0aW9uIChfSFRNTEVsZW1lbnQpIHtcbiAgX2luaGVyaXRzKEhUTUxNZWRpYUVsZW1lbnQsIF9IVE1MRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MTWVkaWFFbGVtZW50KTtcblxuICBfY3JlYXRlQ2xhc3MoSFRNTE1lZGlhRWxlbWVudCwgbnVsbCwgW3tcbiAgICBrZXk6IFwiTkVUV09SS19FTVBUWVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIk5FVFdPUktfSURMRVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIk5FVFdPUktfTE9BRElOR1wiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIDI7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIk5FVFdPUktfTk9fU09VUkNFXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gMztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiSEFWRV9OT1RISU5HXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiSEFWRV9NRVRBREFUQVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIkhBVkVfQ1VSUkVOVF9EQVRBXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gMjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiSEFWRV9GVVRVUkVfREFUQVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIDM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIkhBVkVfRU5PVUdIX0RBVEFcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiA0O1xuICAgIH1cbiAgfV0pO1xuXG4gIGZ1bmN0aW9uIEhUTUxNZWRpYUVsZW1lbnQodXJsLCB0eXBlKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEhUTUxNZWRpYUVsZW1lbnQpO1xuXG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCB0eXBlKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJhdWRpb1RyYWNrc1wiLCB1bmRlZmluZWQpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImF1dG9wbGF5XCIsIGZhbHNlKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJjb250cm9sbGVyXCIsIG51bGwpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNvbnRyb2xzXCIsIGZhbHNlKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJjcm9zc09yaWdpblwiLCBudWxsKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJkZWZhdWx0TXV0ZWRcIiwgZmFsc2UpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImRlZmF1bHRQbGF5YmFja1JhdGVcIiwgMS4wKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJtZWRpYUdyb3VwXCIsIHVuZGVmaW5lZCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwibWVkaWFLZXlzXCIsIG51bGwpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcIm1vekF1ZGlvQ2hhbm5lbFR5cGVcIiwgdW5kZWZpbmVkKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJtdXRlZFwiLCBmYWxzZSk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwibmV0d29ya1N0YXRlXCIsIEhUTUxNZWRpYUVsZW1lbnQuTkVUV09SS19FTVBUWSk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwicGxheWJhY2tSYXRlXCIsIDEpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInByZWxvYWRcIiwgXCJhdXRvXCIpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImxvb3BcIiwgZmFsc2UpO1xuXG4gICAgT2JqZWN0LmFzc2lnbihfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKSwge1xuICAgICAgYnVmZmVyZWQ6IHVuZGVmaW5lZCxcbiAgICAgIGN1cnJlbnRTcmM6IHVybCB8fCBcIlwiLFxuICAgICAgZHVyYXRpb246IDAsXG4gICAgICBlbmRlZDogZmFsc2UsXG4gICAgICBlcnJvcjogbnVsbCxcbiAgICAgIGluaXRpYWxUaW1lOiAwLFxuICAgICAgcGF1c2VkOiB0cnVlLFxuICAgICAgcmVhZHlTdGF0ZTogSFRNTE1lZGlhRWxlbWVudC5IQVZFX05PVEhJTkcsXG4gICAgICB2b2x1bWU6IDEuMCxcbiAgICAgIGN1cnJlbnRUaW1lOiAwXG4gICAgfSk7XG5cbiAgICBfdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5lbmRlZCA9IHRydWU7XG4gICAgfSk7XG5cbiAgICBfdGhpcy5hZGRFdmVudExpc3RlbmVyKFwicGxheVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmVuZGVkID0gZmFsc2U7XG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmVycm9yID0gbnVsbDtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykucGF1c2VkID0gZmFsc2U7XG4gICAgfSk7XG5cbiAgICBfdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5lcnJvciA9IHRydWU7XG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmVuZGVkID0gdHJ1ZTtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykucGF1c2VkID0gZmFsc2U7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSFRNTE1lZGlhRWxlbWVudCwgW3tcbiAgICBrZXk6IFwiY2FuUGxheVR5cGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FuUGxheVR5cGUobWVkaWFUeXBlKSB7XG4gICAgICByZXR1cm4gJ21heWJlJztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2FwdHVyZVN0cmVhbVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYXB0dXJlU3RyZWFtKCkge31cbiAgfSwge1xuICAgIGtleTogXCJmYXN0U2Vla1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmYXN0U2VlaygpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkKCkge31cbiAgfSwge1xuICAgIGtleTogXCJwYXVzZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwYXVzZSgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwicGxheVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwbGF5KCkge31cbiAgfSwge1xuICAgIGtleTogXCJjdXJyZW50VGltZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuY3VycmVudFRpbWU7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5jdXJyZW50VGltZSA9IHZhbHVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzcmNcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmN1cnJlbnRTcmM7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5jdXJyZW50U3JjID0gdmFsdWU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImJ1ZmZlcmVkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5idWZmZXJlZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3VycmVudFNyY1wiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuY3VycmVudFNyYztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZHVyYXRpb25cIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmR1cmF0aW9uO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJlbmRlZFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuZW5kZWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImVycm9yXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5lcnJvcjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaW5pdGlhbFRpbWVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmluaXRpYWxUaW1lO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJwYXVzZWRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLnBhdXNlZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidm9sdW1lXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS52b2x1bWU7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS52b2x1bWUgPSB2YWx1ZTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSFRNTE1lZGlhRWxlbWVudDtcbn0oX0hUTUxFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxNZWRpYUVsZW1lbnQ7XG5cbn0se1wiLi9IVE1MRWxlbWVudFwiOjE4LFwiLi9NZWRpYUVycm9yXCI6MzAsXCIuL3V0aWwvV2Vha01hcFwiOjU2fV0sMjQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxFbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnRcIikpO1xuXG52YXIgX0V2ZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9FdmVudFwiKSk7XG5cbnZhciBfRmlsZUNhY2hlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi91dGlsL0ZpbGVDYWNoZVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxudmFyIF9CQVNFNjRfTkFNRSA9IFwiZGF0YTphcHBsaWNhdGlvbi9qYXZhc2NyaXB0O2Jhc2U2NCxcIjtcbnZhciBfVVJJX05BTUUgPSBcImRhdGE6YXBwbGljYXRpb24vamF2YXNjcmlwdCxcIjtcblxudmFyIF9nZXRQYXRoRnJvbUJhc2U2NFN0cmluZyA9IGZ1bmN0aW9uIF9nZXRQYXRoRnJvbUJhc2U2NFN0cmluZyhzcmMpIHtcbiAgaWYgKHNyYyA9PT0gbnVsbCB8fCBzcmMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBzcmM7XG4gIH1cblxuICBpZiAoc3JjLnN0YXJ0c1dpdGgoX0JBU0U2NF9OQU1FKSkge1xuICAgIHZhciBjb250ZW50ID0gc3JjLnN1YnN0cmluZyhfQkFTRTY0X05BTUUubGVuZ3RoKTtcbiAgICB2YXIgc291cmNlID0gd2luZG93LmF0b2IoY29udGVudCk7XG4gICAgdmFyIGxlbiA9IHNvdXJjZS5sZW5ndGg7XG5cbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgcmV0dXJuIF9nZXREaXNrUGF0aEZyb21BcnJheUJ1ZmZlcihzb3VyY2UsIGxlbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzcmM7XG4gICAgfVxuICB9IGVsc2UgaWYgKHNyYy5zdGFydHNXaXRoKF9VUklfTkFNRSkpIHtcbiAgICB2YXIgX2NvbnRlbnQgPSBzcmMuc3Vic3RyaW5nKF9VUklfTkFNRS5sZW5ndGgpO1xuXG4gICAgdmFyIF9zb3VyY2UgPSBkZWNvZGVVUklDb21wb25lbnQoX2NvbnRlbnQpO1xuXG4gICAgdmFyIF9sZW4gPSBfc291cmNlLmxlbmd0aDtcblxuICAgIGlmIChfbGVuID4gMCkge1xuICAgICAgcmV0dXJuIF9nZXREaXNrUGF0aEZyb21BcnJheUJ1ZmZlcihfc291cmNlLCBfbGVuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNyYztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHNyYztcbiAgfVxufTtcblxuZnVuY3Rpb24gX2dldERpc2tQYXRoRnJvbUFycmF5QnVmZmVyKHNvdXJjZSwgbGVuKSB7XG4gIHZhciBhcnJheUJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihsZW4pO1xuICB2YXIgdWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdWludDhBcnJheVtpXSA9IHNvdXJjZS5jaGFyQ29kZUF0KGkpO1xuICB9XG5cbiAgcmV0dXJuIF9GaWxlQ2FjaGVbXCJkZWZhdWx0XCJdLmdldENhY2hlKGFycmF5QnVmZmVyKTtcbn1cblxudmFyIEhUTUxTY3JpcHRFbGVtZW50ID0gZnVuY3Rpb24gKF9IVE1MRWxlbWVudCkge1xuICBfaW5oZXJpdHMoSFRNTFNjcmlwdEVsZW1lbnQsIF9IVE1MRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MU2NyaXB0RWxlbWVudCk7XG5cbiAgZnVuY3Rpb24gSFRNTFNjcmlwdEVsZW1lbnQoKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEhUTUxTY3JpcHRFbGVtZW50KTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgJ1NDUklQVCcpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcIm5vTW9kdWxlXCIsIGZhbHNlKTtcblxuICAgIHZhciBzZWxmID0gX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyk7XG5cbiAgICB2YXIgb25BcHBlbmQgPSBmdW5jdGlvbiBvbkFwcGVuZCgpIHtcbiAgICAgIHNlbGYucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFwcGVuZFwiLCBvbkFwcGVuZCk7XG5cbiAgICAgIHZhciBzcmMgPSBfZ2V0UGF0aEZyb21CYXNlNjRTdHJpbmcoc2VsZi5zcmMpO1xuXG4gICAgICByZXF1aXJlKHNyYyk7XG5cbiAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXSgnbG9hZCcpKTtcbiAgICB9O1xuXG4gICAgX3RoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImFwcGVuZFwiLCBvbkFwcGVuZCk7XG5cbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gSFRNTFNjcmlwdEVsZW1lbnQ7XG59KF9IVE1MRWxlbWVudDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBIVE1MU2NyaXB0RWxlbWVudDtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShIVE1MU2NyaXB0RWxlbWVudC5wcm90b3R5cGUsIFwibm9Nb2R1bGVcIiwge1xuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKG1lc3NhZ2UsIFwiSWxsZWdhbCBpbnZvY2F0aW9uXCIpO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IobWVzc2FnZSwgXCJJbGxlZ2FsIGludm9jYXRpb25cIik7XG4gIH1cbn0pO1xuXG59LHtcIi4vRXZlbnRcIjoxMCxcIi4vSFRNTEVsZW1lbnRcIjoxOCxcIi4vdXRpbC9GaWxlQ2FjaGVcIjo1NX1dLDI1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9Gb250RmFjZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRm9udEZhY2VcIikpO1xuXG52YXIgX0hUTUxFbGVtZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnRcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBIVE1MU3R5bGVFbGVtZW50ID0gZnVuY3Rpb24gKF9IVE1MRWxlbWVudCkge1xuICBfaW5oZXJpdHMoSFRNTFN0eWxlRWxlbWVudCwgX0hUTUxFbGVtZW50KTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKEhUTUxTdHlsZUVsZW1lbnQpO1xuXG4gIGZ1bmN0aW9uIEhUTUxTdHlsZUVsZW1lbnQoKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEhUTUxTdHlsZUVsZW1lbnQpO1xuXG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBcIlNUWUxFXCIpO1xuXG4gICAgdmFyIHNlbGYgPSBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKTtcblxuICAgIHZhciBvbkFwcGVuZCA9IGZ1bmN0aW9uIG9uQXBwZW5kKCkge1xuICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKFwiYXBwZW5kXCIsIG9uQXBwZW5kKTtcbiAgICAgIHZhciB0ZXh0Q29udGVudCA9IHNlbGYudGV4dENvbnRlbnQgfHwgc2VsZi5pbm5lckhUTUwgfHwgXCJcIjtcbiAgICAgIHZhciBmb250RmFjZVN0ciA9IFwiXCI7XG4gICAgICB2YXIgc3RhcnQgPSAwO1xuICAgICAgdmFyIGxlbmd0aCA9IHRleHRDb250ZW50Lmxlbmd0aDtcbiAgICAgIHZhciBmbGFnID0gMDtcblxuICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgKytpbmRleCkge1xuICAgICAgICBpZiAoc3RhcnQgPiAwKSB7XG4gICAgICAgICAgaWYgKHRleHRDb250ZW50W2luZGV4XSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIGZsYWcrKztcbiAgICAgICAgICB9IGVsc2UgaWYgKHRleHRDb250ZW50W2luZGV4XSA9PT0gXCJ9XCIpIHtcbiAgICAgICAgICAgIGZsYWctLTtcblxuICAgICAgICAgICAgaWYgKGZsYWcgPT09IDApIHtcbiAgICAgICAgICAgICAgZm9udEZhY2VTdHIgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoc3RhcnQsIGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmbGFnIDwgMCkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRleHRDb250ZW50W2luZGV4XSA9PT0gXCJAXCIgJiYgdGV4dENvbnRlbnQuc3Vic3RyKGluZGV4LCBcIkBmb250LWZhY2VcIi5sZW5ndGgpID09PSBcIkBmb250LWZhY2VcIikge1xuICAgICAgICAgICAgaW5kZXggKz0gOTtcbiAgICAgICAgICAgIHN0YXJ0ID0gaW5kZXggKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZm9udEZhY2VTdHIpIHtcbiAgICAgICAgdmFyIGZvbnRGYW1pbHk7XG4gICAgICAgIHZhciBfbGVuZ3RoID0gZm9udEZhY2VTdHIubGVuZ3RoO1xuXG4gICAgICAgIHZhciBfc3RhcnQgPSBmb250RmFjZVN0ci5pbmRleE9mKFwiZm9udC1mYW1pbHlcIik7XG5cbiAgICAgICAgaWYgKF9zdGFydCA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfc3RhcnQgKz0gXCJmb250LWZhbWlseVwiLmxlbmd0aCArIDE7XG4gICAgICAgIHZhciBlbmQgPSBfc3RhcnQ7XG5cbiAgICAgICAgZm9yICg7IGVuZCA8IF9sZW5ndGg7ICsrZW5kKSB7XG4gICAgICAgICAgaWYgKGZvbnRGYWNlU3RyW2VuZF0gPT09IFwiO1wiKSB7XG4gICAgICAgICAgICBmb250RmFtaWx5ID0gZm9udEZhY2VTdHIuc3Vic3RyaW5nKF9zdGFydCwgZW5kKS50cmltKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKGZvbnRGYWNlU3RyW2VuZF0gPT09IFwiOlwiKSB7XG4gICAgICAgICAgICBfc3RhcnQgPSBlbmQgKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZm9udEZhbWlseSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGVuZCA9IGZvbnRGYWNlU3RyLmluZGV4T2YoXCJ1cmwoXCIpO1xuICAgICAgICBfc3RhcnQgPSAwO1xuICAgICAgICB2YXIgc291cmNlO1xuXG4gICAgICAgIGZvciAoOyBlbmQgPCBfbGVuZ3RoOyArK2VuZCkge1xuICAgICAgICAgIGlmIChmb250RmFjZVN0cltlbmRdID09PSBcIidcIiB8fCBmb250RmFjZVN0cltlbmRdID09PSAnXCInKSB7XG4gICAgICAgICAgICBpZiAoX3N0YXJ0ID4gMCkge1xuICAgICAgICAgICAgICBzb3VyY2UgPSBmb250RmFjZVN0ci5zdWJzdHJpbmcoX3N0YXJ0LCBlbmQpLnRyaW0oKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9zdGFydCA9IGVuZCArIDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgIHZhciBmb250RmFjZSA9IG5ldyBfRm9udEZhY2VbXCJkZWZhdWx0XCJdKGZvbnRGYW1pbHksIHNvdXJjZSk7XG4gICAgICAgICAgZm9udEZhY2UubG9hZCgpO1xuICAgICAgICAgIGRvY3VtZW50LmZvbnRzLmFkZChmb250RmFjZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3RoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImFwcGVuZFwiLCBvbkFwcGVuZCk7XG5cbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gSFRNTFN0eWxlRWxlbWVudDtcbn0oX0hUTUxFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxTdHlsZUVsZW1lbnQ7XG5cbn0se1wiLi9Gb250RmFjZVwiOjEyLFwiLi9IVE1MRWxlbWVudFwiOjE4fV0sMjY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0hUTUxNZWRpYUVsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MTWVkaWFFbGVtZW50XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBIVE1MVmlkZW9FbGVtZW50ID0gZnVuY3Rpb24gKF9IVE1MTWVkaWFFbGVtZW50KSB7XG4gIF9pbmhlcml0cyhIVE1MVmlkZW9FbGVtZW50LCBfSFRNTE1lZGlhRWxlbWVudCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihIVE1MVmlkZW9FbGVtZW50KTtcblxuICBmdW5jdGlvbiBIVE1MVmlkZW9FbGVtZW50KCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBIVE1MVmlkZW9FbGVtZW50KTtcblxuICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCAnVklERU8nKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhIVE1MVmlkZW9FbGVtZW50LCBbe1xuICAgIGtleTogXCJjYW5QbGF5VHlwZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjYW5QbGF5VHlwZSh0eXBlKSB7XG4gICAgICByZXR1cm4gdHlwZSA9PT0gJ3ZpZGVvL21wNCc7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEhUTUxWaWRlb0VsZW1lbnQ7XG59KF9IVE1MTWVkaWFFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IEhUTUxWaWRlb0VsZW1lbnQ7XG5cbn0se1wiLi9IVE1MTWVkaWFFbGVtZW50XCI6MjN9XSwyNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG52YXIgX0hUTUxJbWFnZUVsZW1lbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MSW1hZ2VFbGVtZW50XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG5pZiAocmFsLmdldEZlYXR1cmVQcm9wZXJ0eShcIkltYWdlXCIsIFwic3BlY1wiKSA9PT0gXCJ2aXZvX3BsYXRmb3JtX3N1cHBvcnRcIikge1xuICB2YXIgSW1hZ2UgPSB3aW5kb3cuSW1hZ2U7XG4gIG1vZHVsZS5leHBvcnRzID0gSW1hZ2U7XG59IGVsc2Uge1xuICB2YXIgX0ltYWdlID0gd2luZG93LkltYWdlO1xuXG4gIHZhciBfSW1hZ2UyID0gZnVuY3Rpb24gKF9IVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgX2luaGVyaXRzKF9JbWFnZTIsIF9IVE1MSW1hZ2VFbGVtZW50KTtcblxuICAgIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoX0ltYWdlMik7XG5cbiAgICBmdW5jdGlvbiBfSW1hZ2UyKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSW1hZ2UyKTtcblxuICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBfSW1hZ2UyO1xuICB9KF9IVE1MSW1hZ2VFbGVtZW50MltcImRlZmF1bHRcIl0pO1xuXG4gIHZhciBfY3JldGVJbWFnZSA9IHJhbC5jcmVhdGVJbWFnZTtcblxuICBpZiAoX2NyZXRlSW1hZ2UpIHtcbiAgICBfSW1hZ2UucHJvdG90eXBlLl9fcHJvdG9fXyA9IF9JbWFnZTIucHJvdG90eXBlO1xuICB9XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBfSW1hZ2UyO1xufVxuXG59LHtcIi4vSFRNTEltYWdlRWxlbWVudFwiOjIxfV0sMjg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxudmFyIEltYWdlRGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gSW1hZ2VEYXRhKGFycmF5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEltYWdlRGF0YSk7XG5cbiAgICBpZiAodHlwZW9mIGFycmF5ID09PSAnbnVtYmVyJyAmJiB0eXBlb2Ygd2lkdGggPT0gJ251bWJlcicpIHtcbiAgICAgIGhlaWdodCA9IHdpZHRoO1xuICAgICAgd2lkdGggPSBhcnJheTtcbiAgICAgIGFycmF5ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoYXJyYXkgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2RhdGEgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkod2lkdGggKiBoZWlnaHQgKiA0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGF0YSA9IGFycmF5O1xuICAgIH1cblxuICAgIHRoaXMuX3dpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEltYWdlRGF0YSwgW3tcbiAgICBrZXk6IFwiZGF0YVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIndpZHRoXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd2lkdGg7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhlaWdodFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2hlaWdodDtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSW1hZ2VEYXRhO1xufSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlRGF0YTtcblxufSx7fV0sMjk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgTG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIExvY2F0aW9uKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2NhdGlvbik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJhbmNlc3Rvck9yaWdpbnNcIiwgXCJcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJoYXNoXCIsIFwiXCIpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwiaG9zdFwiLCBcIlwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImhvc3RuYW1lXCIsIFwiXCIpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwiaHJlZlwiLCBcIlwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm9yaWdpblwiLCBcIlwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInBhc3N3b3JkXCIsIFwiXCIpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwicGF0aG5hbWVcIiwgXCJcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJwb3J0XCIsIFwiXCIpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwicHJvdG9jb2xcIiwgXCJcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJzZWFyY2hcIiwgXCJcIik7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJ1c2VybmFtZVwiLCBcIlwiKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhMb2NhdGlvbiwgW3tcbiAgICBrZXk6IFwiYXNzaWduXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFzc2lnbigpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbG9hZCgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVwbGFjZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXBsYWNlKCkge31cbiAgfSwge1xuICAgIGtleTogXCJ0b1N0cmluZ1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBMb2NhdGlvbjtcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBMb2NhdGlvbjtcblxufSx7fV0sMzA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG52YXIgTUVESUFfRVJSX0FCT1JURUQgPSAxO1xudmFyIE1FRElBX0VSUl9ORVRXT1JLID0gMjtcbnZhciBNRURJQV9FUlJfREVDT0RFID0gMztcbnZhciBNRURJQV9FUlJfU1JDX05PVF9TVVBQT1JURUQgPSA0O1xuXG52YXIgTWVkaWFFcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTWVkaWFFcnJvcigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTWVkaWFFcnJvcik7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoTWVkaWFFcnJvciwgW3tcbiAgICBrZXk6IFwiY29kZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIE1FRElBX0VSUl9BQk9SVEVEO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gTWVkaWFFcnJvcjtcbn0oKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBNZWRpYUVycm9yO1xubW9kdWxlLmV4cG9ydHMgPSBNZWRpYUVycm9yO1xuXG59LHt9XSwzMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgTmF2aWdhdG9yID0gZnVuY3Rpb24gTmF2aWdhdG9yKHBsYXRmb3JtLCBsYW5ndWFnZSkge1xuICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTmF2aWdhdG9yKTtcblxuICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJwbGF0Zm9ybVwiLCBcIlwiKTtcblxuICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJsYW5ndWFnZVwiLCBcIlwiKTtcblxuICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJhcHBWZXJzaW9uXCIsICc1LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyA5XzEgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjAxLjEuNDYgKEtIVE1MLCBsaWtlIEdlY2tvKSBWZXJzaW9uLzkuMCBNb2JpbGUvMTNCMTQzIFNhZmFyaS82MDEuMScpO1xuXG4gIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVzZXJBZ2VudFwiLCAnTW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxMF8zXzEgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjAzLjEuMzAgKEtIVE1MLCBsaWtlIEdlY2tvKSBNb2JpbGUvMTRFODMwMSBOZXRUeXBlL1dJRkkgTGFuZ3VhZ2UvemhfQ04nKTtcblxuICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJvbkxpbmVcIiwgdHJ1ZSk7XG5cbiAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwibWF4VG91Y2hQb2ludHNcIiwgMTApO1xuXG4gIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImdlb2xvY2F0aW9uXCIsIHtcbiAgICBnZXRDdXJyZW50UG9zaXRpb246IGZ1bmN0aW9uIGdldEN1cnJlbnRQb3NpdGlvbigpIHt9LFxuICAgIHdhdGNoUG9zaXRpb246IGZ1bmN0aW9uIHdhdGNoUG9zaXRpb24oKSB7fSxcbiAgICBjbGVhcldhdGNoOiBmdW5jdGlvbiBjbGVhcldhdGNoKCkge31cbiAgfSk7XG5cbiAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICB0aGlzLmxhbmd1YWdlID0gbGFuZ3VhZ2U7XG59O1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IE5hdmlnYXRvcjtcblxufSx7fV0sMzI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0V2ZW50VGFyZ2V0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRXZlbnRUYXJnZXRcIikpO1xuXG52YXIgX0V2ZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9FdmVudFwiKSk7XG5cbnZhciBfV2Vha01hcCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vdXRpbC9XZWFrTWFwXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikgeyBpZiAodHlwZW9mIFJlZmxlY3QgIT09IFwidW5kZWZpbmVkXCIgJiYgUmVmbGVjdC5nZXQpIHsgX2dldCA9IFJlZmxlY3QuZ2V0OyB9IGVsc2UgeyBfZ2V0ID0gZnVuY3Rpb24gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikgeyB2YXIgYmFzZSA9IF9zdXBlclByb3BCYXNlKHRhcmdldCwgcHJvcGVydHkpOyBpZiAoIWJhc2UpIHJldHVybjsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGJhc2UsIHByb3BlcnR5KTsgaWYgKGRlc2MuZ2V0KSB7IHJldHVybiBkZXNjLmdldC5jYWxsKHJlY2VpdmVyKTsgfSByZXR1cm4gZGVzYy52YWx1ZTsgfTsgfSByZXR1cm4gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlciB8fCB0YXJnZXQpOyB9XG5cbmZ1bmN0aW9uIF9zdXBlclByb3BCYXNlKG9iamVjdCwgcHJvcGVydHkpIHsgd2hpbGUgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHsgb2JqZWN0ID0gX2dldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChvYmplY3QgPT09IG51bGwpIGJyZWFrOyB9IHJldHVybiBvYmplY3Q7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbnZhciBOb2RlID0gZnVuY3Rpb24gKF9FdmVudFRhcmdldCkge1xuICBfaW5oZXJpdHMoTm9kZSwgX0V2ZW50VGFyZ2V0KTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKE5vZGUpO1xuXG4gIGZ1bmN0aW9uIE5vZGUobm9kZU5hbWUpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcImNoaWxkTm9kZXNcIiwgW10pO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcInBhcmVudE5vZGVcIiwgbnVsbCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX25vZGVOYW1lXCIsIFwiXCIpO1xuXG4gICAgX3RoaXMuX25vZGVOYW1lID0gbm9kZU5hbWU7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKE5vZGUsIFt7XG4gICAga2V5OiBcImFwcGVuZENoaWxkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFwcGVuZENoaWxkKG5vZGUpIHtcbiAgICAgIHRoaXMuY2hpbGROb2RlcyAmJiB0aGlzLmNoaWxkTm9kZXMucHVzaChub2RlKTtcbiAgICAgIG5vZGUucGFyZW50Tm9kZSA9IHRoaXM7XG4gICAgICB2YXIgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lO1xuXG4gICAgICBpZiAobm9kZU5hbWUgPT09IFwiU0NSSVBUXCIgfHwgbm9kZU5hbWUgPT09IFwiU1RZTEVcIikge1xuICAgICAgICBub2RlLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJhcHBlbmRcIikpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2xvbmVOb2RlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb25lTm9kZSgpIHtcbiAgICAgIHZhciBjb3B5Tm9kZSA9IE9iamVjdC5jcmVhdGUodGhpcyk7XG4gICAgICBPYmplY3QuYXNzaWduKGNvcHlOb2RlLCB0aGlzKTtcbiAgICAgIGNvcHlOb2RlLnBhcmVudE5vZGUgPSBudWxsO1xuXG4gICAgICB2YXIgcHJpdmF0ZVRoaXMgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpO1xuXG4gICAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uc2V0KGNvcHlOb2RlLCBwcml2YXRlVGhpcyA/IE9iamVjdC5jcmVhdGUocHJpdmF0ZVRoaXMpIDoge30pO1xuXG4gICAgICByZXR1cm4gY29weU5vZGU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZUNoaWxkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKG5vZGUpIHtcbiAgICAgIHZhciBpbmRleCA9IHRoaXMuY2hpbGROb2RlcyAmJiB0aGlzLmNoaWxkTm9kZXMuZmluZEluZGV4KGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICByZXR1cm4gY2hpbGQgPT09IG5vZGU7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgdmFyIF9ub2RlID0gdGhpcy5jaGlsZE5vZGVzICYmIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuXG4gICAgICAgIF9ub2RlLnBhcmVudE5vZGUgPSBudWxsO1xuICAgICAgICByZXR1cm4gX25vZGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjb250YWluc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjb250YWlucyhub2RlKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZE5vZGVzICYmIHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKG5vZGUpID4gLTE7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRpc3BhdGNoRXZlbnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGlzcGF0Y2hFdmVudCgpIHtcbiAgICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuY2hpbGROb2RlcyA/IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGggOiAwO1xuXG4gICAgICBmb3IgKHZhciBpbmRleCA9IGxlbmd0aCAtIDE7IHJlc3VsdCAmJiBpbmRleCA+PSAwOyAtLWluZGV4KSB7XG4gICAgICAgIHZhciBfdGhpcyRjaGlsZE5vZGVzJGluZGU7XG5cbiAgICAgICAgcmVzdWx0ID0gKF90aGlzJGNoaWxkTm9kZXMkaW5kZSA9IHRoaXMuY2hpbGROb2Rlc1tpbmRleF0pLmRpc3BhdGNoRXZlbnQuYXBwbHkoX3RoaXMkY2hpbGROb2RlcyRpbmRlLCBhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBfZ2V0KF9nZXRQcm90b3R5cGVPZihOb2RlLnByb3RvdHlwZSksIFwiZGlzcGF0Y2hFdmVudFwiLCB0aGlzKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm5vZGVOYW1lXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbm9kZU5hbWU7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIE5vZGU7XG59KF9FdmVudFRhcmdldDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBOb2RlO1xuXG59LHtcIi4vRXZlbnRcIjoxMCxcIi4vRXZlbnRUYXJnZXRcIjoxMSxcIi4vdXRpbC9XZWFrTWFwXCI6NTZ9XSwzMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V0aWwvV2Vha01hcFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxudmFyIE5vZGVMaXN0ID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBOb2RlTGlzdCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTm9kZUxpc3QpO1xuXG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLnNldCh0aGlzLCB7XG4gICAgICBhcnJheTogW11cbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgUHJveHkodGhpcywge1xuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICAgICAgaWYgKF90eXBlb2Yoa2V5KSA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKC9eWzAtOV0qJC8udGVzdChrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGFyZ2V0KS5hcnJheVtrZXldO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IHRhcmdldFtrZXldO1xuXG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXN1bHQuYmluZCh0YXJnZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhOb2RlTGlzdCwgW3tcbiAgICBrZXk6IFwicHVzaFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwdXNoKGVsZW1lbnQpIHtcbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuYXJyYXkucHVzaChlbGVtZW50KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaXRlbVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpdGVtKGluZGV4KSB7XG4gICAgICByZXR1cm4gX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldCh0aGlzKS5hcnJheVtpbmRleF07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNvbmNhdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjb25jYXQoKSB7XG4gICAgICB2YXIgYXJyYXkgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmFycmF5O1xuXG4gICAgICByZXR1cm4gYXJyYXkuY29uY2F0LmFwcGx5KGFycmF5LCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsZW5ndGhcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmFycmF5Lmxlbmd0aDtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gTm9kZUxpc3Q7XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gTm9kZUxpc3Q7XG5cbn0se1wiLi91dGlsL1dlYWtNYXBcIjo1Nn1dLDM0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfU2NyZWVuT3JpZW50YXRpb24gPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL1NjcmVlbk9yaWVudGF0aW9uXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxudmFyIFNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gU2NyZWVuKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTY3JlZW4pO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwiYXZhaWxUb3BcIiwgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJhdmFpbExlZnRcIiwgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJhdmFpbEhlaWdodFwiLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwiYXZhaWxXaWR0aFwiLCB3aW5kb3cuaW5uZXJXaWR0aCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJjb2xvckRlcHRoXCIsIDgpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KHRoaXMsIFwicGl4ZWxEZXB0aFwiLCAwKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxlZnRcIiwgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJ0b3BcIiwgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJ3aWR0aFwiLCB3aW5kb3cuaW5uZXJXaWR0aCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkodGhpcywgXCJoZWlnaHRcIiwgd2luZG93LmlubmVySGVpZ2h0KTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm9yaWVudGF0aW9uXCIsIG5ldyBfU2NyZWVuT3JpZW50YXRpb25bXCJkZWZhdWx0XCJdKCkpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFNjcmVlbiwgW3tcbiAgICBrZXk6IFwib25vcmllbnRhdGlvbmNoYW5nZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbm9yaWVudGF0aW9uY2hhbmdlKCkge31cbiAgfV0pO1xuXG4gIHJldHVybiBTY3JlZW47XG59KCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gU2NyZWVuO1xuXG59LHtcIi4vU2NyZWVuT3JpZW50YXRpb25cIjozNX1dLDM1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9FdmVudFRhcmdldDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50VGFyZ2V0XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbnZhciBTY3JlZW5PcmllbnRhdGlvbiA9IGZ1bmN0aW9uIChfRXZlbnRUYXJnZXQpIHtcbiAgX2luaGVyaXRzKFNjcmVlbk9yaWVudGF0aW9uLCBfRXZlbnRUYXJnZXQpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoU2NyZWVuT3JpZW50YXRpb24pO1xuXG4gIGZ1bmN0aW9uIFNjcmVlbk9yaWVudGF0aW9uKCkge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTY3JlZW5PcmllbnRhdGlvbik7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcIl90eXBlXCIsIFwicG9ydHJhaXQtcHJpbWFyeVwiKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJfYW5nbGVcIiwgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX2lzTG9ja2VkXCIsIGZhbHNlKTtcblxuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhTY3JlZW5PcmllbnRhdGlvbiwgW3tcbiAgICBrZXk6IFwib25jaGFuZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25jaGFuZ2UoZXZlbnQpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9ja1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2NrKG9yaWVudGF0aW9uKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgaWYgKF90aGlzMi5faXNMb2NrZWQpIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiU2NyZWVuIG9yaWVudGF0aW9uIGlzIGFscmVhZHkgbG9ja2VkXCIpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfdGhpczIuX2lzTG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInVubG9ja1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1bmxvY2soKSB7XG4gICAgICB0aGlzLl9pc0xvY2tlZCA9IGZhbHNlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ0eXBlXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYW5nbGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hbmdsZTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gU2NyZWVuT3JpZW50YXRpb247XG59KF9FdmVudFRhcmdldDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTY3JlZW5PcmllbnRhdGlvbjtcblxufSx7XCIuL0V2ZW50VGFyZ2V0XCI6MTF9XSwzNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfRXZlbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9FdmVudFwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxudmFyIFRvdWNoRXZlbnQgPSBmdW5jdGlvbiAoX0V2ZW50KSB7XG4gIF9pbmhlcml0cyhUb3VjaEV2ZW50LCBfRXZlbnQpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoVG91Y2hFdmVudCk7XG5cbiAgZnVuY3Rpb24gVG91Y2hFdmVudCh0eXBlKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRvdWNoRXZlbnQpO1xuXG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCB0eXBlKTtcbiAgICBfdGhpcy50b3VjaGVzID0gW107XG4gICAgX3RoaXMudGFyZ2V0VG91Y2hlcyA9IFtdO1xuICAgIF90aGlzLmNoYW5nZWRUb3VjaGVzID0gW107XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgcmV0dXJuIFRvdWNoRXZlbnQ7XG59KF9FdmVudDJbXCJkZWZhdWx0XCJdKTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBUb3VjaEV2ZW50O1xuXG59LHtcIi4vRXZlbnRcIjoxMH1dLDM3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9FdmVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRXZlbnRcIikpO1xuXG52YXIgX0ZpbGVDYWNoZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vdXRpbC9GaWxlQ2FjaGVcIikpO1xuXG52YXIgX1hNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL1hNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXRcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxudmFyIGZzbSA9IHJhbC5nZXRGaWxlU3lzdGVtTWFuYWdlcigpO1xudmFyIF9YTUxIdHRwUmVxdWVzdCA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdDtcbndpbmRvdy5yYWwgPSB3aW5kb3cucmFsIHx8IHt9O1xuXG52YXIgWE1MSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoX1hNTEh0dHBSZXF1ZXN0RXZlbnRUKSB7XG4gIF9pbmhlcml0cyhYTUxIdHRwUmVxdWVzdCwgX1hNTEh0dHBSZXF1ZXN0RXZlbnRUKTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKFhNTEh0dHBSZXF1ZXN0KTtcblxuICBmdW5jdGlvbiBYTUxIdHRwUmVxdWVzdCgpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgWE1MSHR0cFJlcXVlc3QpO1xuXG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBuZXcgX1hNTEh0dHBSZXF1ZXN0KCkpO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcIl9pc0xvY2FsXCIsIGZhbHNlKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJfcmVhZHlTdGF0ZVwiLCAwKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJfcmVzcG9uc2VcIiwgdm9pZCAwKTtcblxuICAgIF9kZWZpbmVQcm9wZXJ0eShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSwgXCJfcmVzcG9uc2VUZXh0XCIsIHZvaWQgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3Jlc3BvbnNlVVJMXCIsIHZvaWQgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3Jlc3BvbnNlWE1MXCIsIHZvaWQgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3N0YXR1c1wiLCB2b2lkIDApO1xuXG4gICAgX2RlZmluZVByb3BlcnR5KF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpLCBcIl9zdGF0dXNUZXh0XCIsIHZvaWQgMCk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3Jlc3BvbnNlVHlwZVwiLCB2b2lkIDApO1xuXG4gICAgdmFyIHhociA9IF90aGlzLl94aHI7XG5cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBldmVudCA9IG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwicmVhZHlzdGF0ZWNoYW5nZVwiKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChPYmplY3QuYXNzaWduKGV2ZW50LCBlKSk7XG4gICAgfS5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcblxuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhYTUxIdHRwUmVxdWVzdCwgW3tcbiAgICBrZXk6IFwiYWJvcnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWJvcnQoKSB7XG4gICAgICB0aGlzLl94aHIuYWJvcnQoKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0QWxsUmVzcG9uc2VIZWFkZXJzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEFsbFJlc3BvbnNlSGVhZGVycygpIHtcbiAgICAgIHJldHVybiB0aGlzLl94aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldFJlc3BvbnNlSGVhZGVyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFJlc3BvbnNlSGVhZGVyKG5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl94aHIuZ2V0UmVzcG9uc2VIZWFkZXIobmFtZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm9wZW5cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gb3BlbihtZXRob2QsIHVybCwgYXN5bmMsIHVzZXIsIHBhc3N3b3JkKSB7XG4gICAgICBpZiAodHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgX3VybCA9IHVybC50b0xvY2FsZVN0cmluZygpO1xuXG4gICAgICAgIGlmIChfdXJsLnN0YXJ0c1dpdGgoXCJodHRwOi8vXCIpIHx8IF91cmwuc3RhcnRzV2l0aChcImh0dHBzOi8vXCIpKSB7XG4gICAgICAgICAgdmFyIF90aGlzJF94aHI7XG5cbiAgICAgICAgICB0aGlzLl9pc0xvY2FsID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIChfdGhpcyRfeGhyID0gdGhpcy5feGhyKS5vcGVuLmFwcGx5KF90aGlzJF94aHIsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5faXNMb2NhbCA9IHRydWU7XG4gICAgICB0aGlzLl91cmwgPSB1cmw7XG5cbiAgICAgIGlmICh0aGlzLl9yZWFkeVN0YXRlICE9IDEpIHtcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IDE7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcInJlYWR5c3RhdGVjaGFuZ2VcIikpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvdmVycmlkZU1pbWVUeXBlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG92ZXJyaWRlTWltZVR5cGUoKSB7XG4gICAgICB2YXIgX3RoaXMkX3hocjI7XG5cbiAgICAgIHJldHVybiAoX3RoaXMkX3hocjIgPSB0aGlzLl94aHIpLm92ZXJyaWRlTWltZVR5cGUuYXBwbHkoX3RoaXMkX3hocjIsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNlbmRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2VuZCgpIHtcbiAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgIT09IDEpIHtcbiAgICAgICAgdGhyb3cgXCJVbmNhdWdodCBET01FeGNlcHRpb246IEZhaWxlZCB0byBleGVjdXRlICdzZW5kJyBvbiAnWE1MSHR0cFJlcXVlc3QnOiBUaGUgb2JqZWN0J3Mgc3RhdGUgbXVzdCBiZSBPUEVORUQuXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9pc0xvY2FsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGlzQmluYXJ5ID0gdGhpcy5feGhyLnJlc3BvbnNlVHlwZSA9PT0gXCJhcnJheWJ1ZmZlclwiO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gMjtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwicmVhZHlzdGF0ZWNoYW5nZVwiKSk7XG4gICAgICAgIGZzbS5yZWFkRmlsZSh7XG4gICAgICAgICAgZmlsZVBhdGg6IHRoaXMuX3VybCxcbiAgICAgICAgICBlbmNvZGluZzogaXNCaW5hcnkgPyBcImJpbmFyeVwiIDogXCJ1dGY4XCIsXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcyhyZXMpIHtcbiAgICAgICAgICAgIHNlbGYuX3N0YXR1cyA9IDIwMDtcbiAgICAgICAgICAgIHNlbGYuX3Jlc3BvbnNlID0gc2VsZi5fcmVzcG9uc2VUZXh0ID0gcmVzLmRhdGE7XG5cbiAgICAgICAgICAgIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAgICAgICBfRmlsZUNhY2hlW1wiZGVmYXVsdFwiXS5zZXRDYWNoZShzZWxmLl91cmwsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGV2ZW50UHJvZ3Jlc3NTdGFydCA9IG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwicHJvZ3Jlc3NcIik7XG4gICAgICAgICAgICBldmVudFByb2dyZXNzU3RhcnQubG9hZGVkID0gMDtcbiAgICAgICAgICAgIGV2ZW50UHJvZ3Jlc3NTdGFydC50b3RhbCA9IGlzQmluYXJ5ID8gcmVzLmRhdGEuYnl0ZUxlbmd0aCA6IHJlcy5kYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBldmVudFByb2dyZXNzRW5kID0gbmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJwcm9ncmVzc1wiKTtcbiAgICAgICAgICAgIGV2ZW50UHJvZ3Jlc3NFbmQubG9hZGVkID0gZXZlbnRQcm9ncmVzc1N0YXJ0LnRvdGFsO1xuICAgICAgICAgICAgZXZlbnRQcm9ncmVzc0VuZC50b3RhbCA9IGV2ZW50UHJvZ3Jlc3NTdGFydC50b3RhbDtcbiAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImxvYWRzdGFydFwiKSk7XG4gICAgICAgICAgICBzZWxmLmRpc3BhdGNoRXZlbnQoZXZlbnRQcm9ncmVzc1N0YXJ0KTtcbiAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChldmVudFByb2dyZXNzRW5kKTtcbiAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImxvYWRcIikpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgaWYgKHJlcy5lcnJDb2RlID09PSAxKSB7XG4gICAgICAgICAgICAgIHNlbGYuX3N0YXR1cyA9IDQwNDtcbiAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwibG9hZHN0YXJ0XCIpKTtcbiAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwibG9hZFwiKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJlcnJvclwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gNDtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcInJlYWR5c3RhdGVjaGFuZ2VcIikpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwibG9hZGVuZFwiKSk7XG4gICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIF90aGlzJF94aHIzO1xuXG4gICAgICAgIChfdGhpcyRfeGhyMyA9IHRoaXMuX3hocikuc2VuZC5hcHBseShfdGhpcyRfeGhyMywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2V0UmVxdWVzdEhlYWRlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRSZXF1ZXN0SGVhZGVyKCkge1xuICAgICAgdmFyIF90aGlzJF94aHI0O1xuXG4gICAgICAoX3RoaXMkX3hocjQgPSB0aGlzLl94aHIpLnNldFJlcXVlc3RIZWFkZXIuYXBwbHkoX3RoaXMkX3hocjQsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlYWR5U3RhdGVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIGlmICh0aGlzLl9pc0xvY2FsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWFkeVN0YXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3hoci5yZWFkeVN0YXRlO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZXNwb25zZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgdmFyIHJlc3BvbnNlID0gdGhpcy5faXNMb2NhbCA/IHRoaXMuX3Jlc3BvbnNlIDogdGhpcy5feGhyLnJlc3BvbnNlO1xuICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX3Jlc3BvbnNlVHlwZSA9PT0gXCJibG9iXCIgPyBuZXcgQmxvYihbcmVzcG9uc2VdKSA6IHJlc3BvbnNlO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVzcG9uc2VUZXh0XCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICBpZiAodGhpcy5faXNMb2NhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2VUZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3hoci5yZXNwb25zZVRleHQ7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlc3BvbnNlVHlwZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Jlc3BvbnNlVHlwZTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICB0aGlzLl9yZXNwb25zZVR5cGUgPSB0aGlzLl94aHIucmVzcG9uc2VUeXBlID0gdmFsdWU7XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gXCJibG9iXCIpIHtcbiAgICAgICAgdGhpcy5feGhyLnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVzcG9uc2VVUkxcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIGlmICh0aGlzLl9pc0xvY2FsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXNwb25zZVVSTDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl94aHIucmVzcG9uc2VVUkw7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlc3BvbnNlWE1MXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICBpZiAodGhpcy5faXNMb2NhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzcG9uc2VYTUw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5feGhyLnJlc3BvbnNlWE1MO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzdGF0dXNcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIGlmICh0aGlzLl9pc0xvY2FsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5feGhyLnN0YXR1cztcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RhdHVzVGV4dFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgaWYgKHRoaXMuX2lzTG9jYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1c1RleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5feGhyLnN0YXR1c1RleHQ7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRpbWVvdXRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl94aHIudGltZW91dDtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICB0aGlzLl94aHIudGltZW91dCA9IHZhbHVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ1cGxvYWRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl94aHIudXBsb2FkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ3aXRoQ3JlZGVudGlhbHNcIixcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgdGhpcy5feGhyLndpdGhDcmVkZW50aWFscyA9IHZhbHVlO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5feGhyLndpdGhDcmVkZW50aWFscztcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gWE1MSHR0cFJlcXVlc3Q7XG59KF9YTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0W1wiZGVmYXVsdFwiXSk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gWE1MSHR0cFJlcXVlc3Q7XG5cbn0se1wiLi9FdmVudFwiOjEwLFwiLi9YTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0XCI6MzgsXCIuL3V0aWwvRmlsZUNhY2hlXCI6NTV9XSwzODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfRXZlbnRUYXJnZXQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9FdmVudFRhcmdldFwiKSk7XG5cbnZhciBfRXZlbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50XCIpKTtcblxudmFyIF9GaWxlQ2FjaGUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3V0aWwvRmlsZUNhY2hlXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG52YXIgWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCA9IGZ1bmN0aW9uIChfRXZlbnRUYXJnZXQpIHtcbiAgX2luaGVyaXRzKFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQsIF9FdmVudFRhcmdldCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0KTtcblxuICBmdW5jdGlvbiBYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0KHhocikge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0KTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcyk7XG5cbiAgICBfZGVmaW5lUHJvcGVydHkoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksIFwiX3hoclwiLCB2b2lkIDApO1xuXG4gICAgX3RoaXMuX3hociA9IHhocjtcblxuICAgIHhoci5vbmFib3J0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBldmVudCA9IG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwiYWJvcnRcIik7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoT2JqZWN0LmFzc2lnbihldmVudCwgZSkpO1xuICAgIH0uYmluZChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG5cbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgZXZlbnQgPSBuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImVycm9yXCIpO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KE9iamVjdC5hc3NpZ24oZXZlbnQsIGUpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpO1xuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAodGhpcy5yZXNwb25zZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIF9GaWxlQ2FjaGVbXCJkZWZhdWx0XCJdLnNldEl0ZW0odGhpcy5yZXNwb25zZSwgdGhpcy5fdXJsKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGV2ZW50ID0gbmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJsb2FkXCIpO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KE9iamVjdC5hc3NpZ24oZXZlbnQsIGUpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpO1xuXG4gICAgeGhyLm9ubG9hZHN0YXJ0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBldmVudCA9IG5ldyBfRXZlbnRbXCJkZWZhdWx0XCJdKFwibG9hZHN0YXJ0XCIpO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KE9iamVjdC5hc3NpZ24oZXZlbnQsIGUpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpO1xuXG4gICAgeGhyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGV2ZW50ID0gbmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJwcm9ncmVzc1wiKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChPYmplY3QuYXNzaWduKGV2ZW50LCBlKSk7XG4gICAgfS5iaW5kKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcblxuICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGV2ZW50ID0gbmV3IF9FdmVudFtcImRlZmF1bHRcIl0oXCJ0aW1lb3V0XCIpO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KE9iamVjdC5hc3NpZ24oZXZlbnQsIGUpKTtcbiAgICB9LmJpbmQoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpO1xuXG4gICAgeGhyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgZXZlbnQgPSBuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcImxvYWRlbmRcIik7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoT2JqZWN0LmFzc2lnbihldmVudCwgZSkpO1xuICAgIH0uYmluZChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG5cbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldDtcbn0oX0V2ZW50VGFyZ2V0MltcImRlZmF1bHRcIl0pO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQ7XG5cbn0se1wiLi9FdmVudFwiOjEwLFwiLi9FdmVudFRhcmdldFwiOjExLFwiLi91dGlsL0ZpbGVDYWNoZVwiOjU1fV0sMzk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0F1ZGlvTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvTm9kZVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgQW5hbHlzZXJOb2RlID0gZnVuY3Rpb24gKF9BdWRpb05vZGUpIHtcbiAgX2luaGVyaXRzKEFuYWx5c2VyTm9kZSwgX0F1ZGlvTm9kZSk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihBbmFseXNlck5vZGUpO1xuXG4gIGZ1bmN0aW9uIEFuYWx5c2VyTm9kZShjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEFuYWx5c2VyTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgIF90aGlzLl9mZnRTaXplO1xuICAgIF90aGlzLmZyZXF1ZW5jeUJpbkNvdW50O1xuICAgIF90aGlzLm1pbkRlY2liZWxzO1xuICAgIF90aGlzLm1heERlY2liZWxzO1xuICAgIF90aGlzLnNtb290aGluZ1RpbWVDb25zdGFudDtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoQW5hbHlzZXJOb2RlLCBbe1xuICAgIGtleTogXCJnZXRGbG9hdEZyZXF1ZW5jeURhdGFcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RmxvYXRGcmVxdWVuY3lEYXRhKGFycmF5KSB7fVxuICB9LCB7XG4gICAga2V5OiBcImdldEJ5dGVGcmVxdWVuY3lEYXRhXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEJ5dGVGcmVxdWVuY3lEYXRhKGRhdGFBcnJheSkge1xuICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGRhdGFBcnJheS5sZW5ndGgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRGbG9hdFRpbWVEb21haW5EYXRhXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEZsb2F0VGltZURvbWFpbkRhdGEoZGF0YUFycmF5KSB7fVxuICB9LCB7XG4gICAga2V5OiBcImdldEJ5dGVUaW1lRG9tYWluRGF0YVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRCeXRlVGltZURvbWFpbkRhdGEoZGF0YUFycmF5KSB7fVxuICB9LCB7XG4gICAga2V5OiBcImZmdFNpemVcIixcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgdGhpcy5fZmZ0U2l6ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5mcmVxdWVuY3lCaW5Db3VudCA9IHZhbHVlIC8gMjtcbiAgICB9LFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZmdFNpemU7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEFuYWx5c2VyTm9kZTtcbn0oX0F1ZGlvTm9kZTJbXCJkZWZhdWx0XCJdKTtcblxudmFyIF9kZWZhdWx0ID0gQW5hbHlzZXJOb2RlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuL0F1ZGlvTm9kZVwiOjQ1fV0sNDA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9GaWxlQ2FjaGUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuLi91dGlsL0ZpbGVDYWNoZVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbnZhciBBdWRpb0J1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQXVkaW9CdWZmZXIoY29udGV4dCwgYnVmZmVyLCBjYWxsYmFjaykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBdWRpb0J1ZmZlcik7XG5cbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIHRoaXMudXJsID0gXCJcIjtcbiAgICB0aGlzLl9zYW1wbGVSYXRlID0gNDgwMDA7XG4gICAgdGhpcy5fbGVuZ3RoID0gMzg2NjgxO1xuICAgIHRoaXMuX2R1cmF0aW9uID0gMDtcbiAgICB0aGlzLl9udW1iZXJPZkNoYW5uZWxzID0gNDgwMDA7XG5cbiAgICBfRmlsZUNhY2hlW1wiZGVmYXVsdFwiXS5nZXRQYXRoKGJ1ZmZlciwgZnVuY3Rpb24gKHVybCkge1xuICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnVybCA9IHVybDtcbiAgICAgIHZhciBpbm5lckF1ZGlvQ29udGV4dCA9IHJhbC5jcmVhdGVJbm5lckF1ZGlvQ29udGV4dCgpO1xuICAgICAgaW5uZXJBdWRpb0NvbnRleHQuc3JjID0gdXJsO1xuICAgICAgaW5uZXJBdWRpb0NvbnRleHQub25DYW5wbGF5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5hdWRpb0J1ZmZlci5fZHVyYXRpb24gPSB0aGlzLmlubmVyQXVkaW9Db250ZXh0LmR1cmF0aW9uO1xuICAgICAgICB0aGlzLmlubmVyQXVkaW9Db250ZXh0LmRlc3Ryb3koKTtcbiAgICAgICAgY2FsbGJhY2sodGhpcy5hdWRpb0J1ZmZlcik7XG4gICAgICB9LmJpbmQoe1xuICAgICAgICBhdWRpb0J1ZmZlcjogdGhpcyxcbiAgICAgICAgaW5uZXJBdWRpb0NvbnRleHQ6IGlubmVyQXVkaW9Db250ZXh0XG4gICAgICB9KSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhBdWRpb0J1ZmZlciwgW3tcbiAgICBrZXk6IFwic2FtcGxlUmF0ZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NhbXBsZVJhdGU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxlbmd0aFwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZHVyYXRpb25cIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kdXJhdGlvbjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibnVtYmVyT2ZDaGFubmVsc1wiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX251bWJlck9mQ2hhbm5lbHM7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEF1ZGlvQnVmZmVyO1xufSgpO1xuXG52YXIgX2RlZmF1bHQgPSBBdWRpb0J1ZmZlcjtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se1wiLi4vdXRpbC9GaWxlQ2FjaGVcIjo1NX1dLDQxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9BdWRpb05vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdWRpb05vZGVcIikpO1xuXG52YXIgX0F1ZGlvUGFyYW0gPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvUGFyYW1cIikpO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuLi91dGlsL1dlYWtNYXBcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxudmFyIF9kZXN0cm95ID0gZnVuY3Rpb24gX2Rlc3Ryb3koKSB7XG4gIHZhciBpbm5lckF1ZGlvQ29udGV4dCA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcy5zb3VyY2VOb2RlKS5pbm5lckF1ZGlvQ29udGV4dDtcblxuICBpZiAoaW5uZXJBdWRpb0NvbnRleHQgIT09IG51bGwpIHtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5kZXN0cm95KCk7XG5cbiAgICB2YXIgYXVkaW9CdWZmZXJTb3VyY2VOb2RlQXJyYXkgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMuYXVkaW9Db250ZXh0KS5hdWRpb0J1ZmZlclNvdXJjZU5vZGVBcnJheTtcblxuICAgIHZhciBsZW5ndGggPSBhdWRpb0J1ZmZlclNvdXJjZU5vZGVBcnJheS5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChhdWRpb0J1ZmZlclNvdXJjZU5vZGVBcnJheVtpXSkuaW5uZXJBdWRpb0NvbnRleHQgPT0gaW5uZXJBdWRpb0NvbnRleHQpIHtcbiAgICAgICAgYXVkaW9CdWZmZXJTb3VyY2VOb2RlQXJyYXkuc3BsaWNlKGksIDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMuc291cmNlTm9kZSkuaW5uZXJBdWRpb0NvbnRleHQgPSBudWxsO1xuICB9XG59O1xuXG52YXIgQXVkaW9CdWZmZXJTb3VyY2VOb2RlID0gZnVuY3Rpb24gKF9BdWRpb05vZGUpIHtcbiAgX2luaGVyaXRzKEF1ZGlvQnVmZmVyU291cmNlTm9kZSwgX0F1ZGlvTm9kZSk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihBdWRpb0J1ZmZlclNvdXJjZU5vZGUpO1xuXG4gIGZ1bmN0aW9uIEF1ZGlvQnVmZmVyU291cmNlTm9kZShjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEF1ZGlvQnVmZmVyU291cmNlTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgIF90aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgX3RoaXMuZGV0dW5lID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMFxuICAgIH0pO1xuICAgIF90aGlzLl9sb29wID0gZmFsc2U7XG4gICAgX3RoaXMubG9vcFN0YXJ0ID0gMDtcbiAgICBfdGhpcy5sb29wRW5kID0gMDtcbiAgICBfdGhpcy5fcGxheWJhY2tSYXRlID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMS4wXG4gICAgfSk7XG4gICAgdmFyIGlubmVyQXVkaW9Db250ZXh0ID0gcmFsLmNyZWF0ZUlubmVyQXVkaW9Db250ZXh0KCk7XG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkuaW5uZXJBdWRpb0NvbnRleHQgPSBpbm5lckF1ZGlvQ29udGV4dDtcbiAgICBpbm5lckF1ZGlvQ29udGV4dC5vbkVuZGVkKF9kZXN0cm95LmJpbmQoe1xuICAgICAgc291cmNlTm9kZTogX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksXG4gICAgICBhdWRpb0NvbnRleHQ6IGNvbnRleHRcbiAgICB9KSk7XG4gICAgaW5uZXJBdWRpb0NvbnRleHQub25TdG9wKF9kZXN0cm95LmJpbmQoe1xuICAgICAgc291cmNlTm9kZTogX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcyksXG4gICAgICBhdWRpb0NvbnRleHQ6IGNvbnRleHRcbiAgICB9KSk7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEF1ZGlvQnVmZmVyU291cmNlTm9kZSwgW3tcbiAgICBrZXk6IFwic3RhcnRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc3RhcnQod2hlbiwgb2Zmc2V0LCBkdXJhdGlvbikge1xuICAgICAgaWYgKHRoaXMuYnVmZmVyKSB7XG4gICAgICAgIHZhciBpbm5lckF1ZGlvQ29udGV4dCA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgaWYgKGlubmVyQXVkaW9Db250ZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvZmZzZXQgfHwgdHlwZW9mIG9mZnNldCAhPT0gJ251bWJlcicgfHwgb2Zmc2V0IDw9IDApIHtcbiAgICAgICAgICBpbm5lckF1ZGlvQ29udGV4dC5zdGFydFRpbWUgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlubmVyQXVkaW9Db250ZXh0LnN0YXJ0VGltZSA9IG9mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlubmVyQXVkaW9Db250ZXh0LnNyYyA9IHRoaXMuYnVmZmVyLnVybDtcblxuICAgICAgICBpZiAoIXdoZW4gfHwgdHlwZW9mIHdoZW4gIT09ICdudW1iZXInIHx8IHdoZW4gPD0gMCkge1xuICAgICAgICAgIGlubmVyQXVkaW9Db250ZXh0LnBsYXkoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhdWRpb0NvbnRleHQgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmlubmVyQXVkaW9Db250ZXh0O1xuXG4gICAgICAgICAgICBpZiAoYXVkaW9Db250ZXh0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIGF1ZGlvQ29udGV4dC5wbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5iaW5kKHRoaXMpLCB3aGVuICogMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RvcFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKHdoZW4pIHtcbiAgICAgIHZhciBpbm5lckF1ZGlvQ29udGV4dCA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQ7XG5cbiAgICAgIGlmIChpbm5lckF1ZGlvQ29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghd2hlbiB8fCB0eXBlb2Ygd2hlbiAhPT0gJ251bWJlcicgfHwgd2hlbiA8PSAwKSB7XG4gICAgICAgIGlubmVyQXVkaW9Db250ZXh0LnN0b3AoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBhdWRpb0NvbnRleHQgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmlubmVyQXVkaW9Db250ZXh0O1xuXG4gICAgICAgICAgaWYgKGF1ZGlvQ29udGV4dCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYXVkaW9Db250ZXh0LnN0b3AoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSwgd2hlbiAqIDEwMDApO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvbmVuZGVkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uZW5kZWQoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInBsYXliYWNrUmF0ZVwiLFxuICAgIHNldDogZnVuY3Rpb24gc2V0KHZhbHVlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJwbGF5YmFja1JhdGUgbm9uc3VwcG9ydFwiKTtcbiAgICAgIHRoaXMuX3BsYXliYWNrUmF0ZSA9IHZhbHVlO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGxheWJhY2tSYXRlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb29wXCIsXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQodmFsdWUpIHtcbiAgICAgIHZhciBpbm5lckF1ZGlvQ29udGV4dCA9IF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuaW5uZXJBdWRpb0NvbnRleHQ7XG5cbiAgICAgIGlmIChpbm5lckF1ZGlvQ29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2xvb3AgPSB2YWx1ZTtcbiAgICAgIGlubmVyQXVkaW9Db250ZXh0Lmxvb3AgPSB2YWx1ZTtcbiAgICB9LFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xvb3A7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEF1ZGlvQnVmZmVyU291cmNlTm9kZTtcbn0oX0F1ZGlvTm9kZTJbXCJkZWZhdWx0XCJdKTtcblxudmFyIF9kZWZhdWx0ID0gQXVkaW9CdWZmZXJTb3VyY2VOb2RlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuLi91dGlsL1dlYWtNYXBcIjo1NixcIi4vQXVkaW9Ob2RlXCI6NDUsXCIuL0F1ZGlvUGFyYW1cIjo0Nn1dLDQyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9CYXNlQXVkaW9Db250ZXh0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQmFzZUF1ZGlvQ29udGV4dFwiKSk7XG5cbnZhciBfTWVkaWFFbGVtZW50QXVkaW9Tb3VyY2VOb2RlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9NZWRpYUVsZW1lbnRBdWRpb1NvdXJjZU5vZGVcIikpO1xuXG52YXIgX1dlYWtNYXAgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuLi91dGlsL1dlYWtNYXBcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxudmFyIEF1ZGlvQ29udGV4dCA9IGZ1bmN0aW9uIChfQmFzZUF1ZGlvQ29udGV4dCkge1xuICBfaW5oZXJpdHMoQXVkaW9Db250ZXh0LCBfQmFzZUF1ZGlvQ29udGV4dCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihBdWRpb0NvbnRleHQpO1xuXG4gIGZ1bmN0aW9uIEF1ZGlvQ29udGV4dChvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEF1ZGlvQ29udGV4dCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuICAgIF90aGlzLmJhc2VMYXRlbmN5O1xuICAgIF90aGlzLm91dHB1dExhdGVuY3k7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEF1ZGlvQ29udGV4dCwgW3tcbiAgICBrZXk6IFwiY2xvc2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICB2YXIgYXVkaW9CdWZmZXJTb3VyY2VOb2RlQXJyYXkgPSBfV2Vha01hcFtcImRlZmF1bHRcIl0uZ2V0KHRoaXMpLmF1ZGlvQnVmZmVyU291cmNlTm9kZUFycmF5O1xuXG4gICAgICBhdWRpb0J1ZmZlclNvdXJjZU5vZGVBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoZWxlbWVudCkuaW5uZXJBdWRpb0NvbnRleHQuZGVzdHJveSgpO1xuXG4gICAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQoZWxlbWVudCkuaW5uZXJBdWRpb0NvbnRleHQgPSBudWxsO1xuICAgICAgfSk7XG4gICAgICBhcnJheS5sZW5ndGggPSAwO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVNZWRpYUVsZW1lbnRTb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlTWVkaWFFbGVtZW50U291cmNlKG15TWVkaWFFbGVtZW50KSB7XG4gICAgICByZXR1cm4gbmV3IF9NZWRpYUVsZW1lbnRBdWRpb1NvdXJjZU5vZGVbXCJkZWZhdWx0XCJdKHRoaXMsIHtcbiAgICAgICAgbWVkaWFFbGVtZW50OiBteU1lZGlhRWxlbWVudFxuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZU1lZGlhU3RyZWFtU291cmNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVNZWRpYVN0cmVhbURlc3RpbmF0aW9uXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZU1lZGlhU3RyZWFtRGVzdGluYXRpb24oKSB7fVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZU1lZGlhU3RyZWFtVHJhY2tTb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlTWVkaWFTdHJlYW1UcmFja1NvdXJjZSgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0T3V0cHV0VGltZXN0YW1wXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldE91dHB1dFRpbWVzdGFtcCgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVzdW1lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlc3VtZSgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwic3VzcGVuZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdXNwZW5kKCkge31cbiAgfV0pO1xuXG4gIHJldHVybiBBdWRpb0NvbnRleHQ7XG59KF9CYXNlQXVkaW9Db250ZXh0MltcImRlZmF1bHRcIl0pO1xuXG52YXIgX2RlZmF1bHQgPSBBdWRpb0NvbnRleHQ7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0O1xuXG59LHtcIi4uL3V0aWwvV2Vha01hcFwiOjU2LFwiLi9CYXNlQXVkaW9Db250ZXh0XCI6NDgsXCIuL01lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZVwiOjUxfV0sNDM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0F1ZGlvTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvTm9kZVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxudmFyIEF1ZGlvRGVzdGluYXRpb25Ob2RlID0gZnVuY3Rpb24gKF9BdWRpb05vZGUpIHtcbiAgX2luaGVyaXRzKEF1ZGlvRGVzdGluYXRpb25Ob2RlLCBfQXVkaW9Ob2RlKTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKEF1ZGlvRGVzdGluYXRpb25Ob2RlKTtcblxuICBmdW5jdGlvbiBBdWRpb0Rlc3RpbmF0aW9uTm9kZShjb250ZXh0KSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEF1ZGlvRGVzdGluYXRpb25Ob2RlKTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgX3RoaXMubWF4Q2hhbm5lbENvdW50ID0gMjtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gQXVkaW9EZXN0aW5hdGlvbk5vZGU7XG59KF9BdWRpb05vZGUyW1wiZGVmYXVsdFwiXSk7XG5cbnZhciBfZGVmYXVsdCA9IEF1ZGlvRGVzdGluYXRpb25Ob2RlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuL0F1ZGlvTm9kZVwiOjQ1fV0sNDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0F1ZGlvTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvTm9kZVwiKSk7XG5cbnZhciBfQXVkaW9QYXJhbSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9QYXJhbVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgQXVkaW9MaXN0ZW5lciA9IGZ1bmN0aW9uIChfQXVkaW9Ob2RlKSB7XG4gIF9pbmhlcml0cyhBdWRpb0xpc3RlbmVyLCBfQXVkaW9Ob2RlKTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKEF1ZGlvTGlzdGVuZXIpO1xuXG4gIGZ1bmN0aW9uIEF1ZGlvTGlzdGVuZXIoY29udGV4dCkge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBdWRpb0xpc3RlbmVyKTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgX3RoaXMucG9zaXRpb25YID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMFxuICAgIH0pO1xuICAgIF90aGlzLnBvc2l0aW9uWSA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IDBcbiAgICB9KTtcbiAgICBfdGhpcy5wb3NpdGlvblogPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAwXG4gICAgfSk7XG4gICAgX3RoaXMuZm9yd2FyZFggPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAwXG4gICAgfSk7XG4gICAgX3RoaXMuZm9yd2FyZFkgPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAwXG4gICAgfSk7XG4gICAgX3RoaXMuZm9yd2FyZFogPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAtMVxuICAgIH0pO1xuICAgIF90aGlzLnVwWCA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IDBcbiAgICB9KTtcbiAgICBfdGhpcy51cFkgPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAxXG4gICAgfSk7XG4gICAgX3RoaXMudXBaID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMFxuICAgIH0pO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhBdWRpb0xpc3RlbmVyLCBbe1xuICAgIGtleTogXCJzZXRPcmllbnRhdGlvblwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcmllbnRhdGlvbih4LCB5LCB6KSB7fVxuICB9LCB7XG4gICAga2V5OiBcInNldFBvc2l0aW9uXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldFBvc2l0aW9uKHgsIHksIHopIHtcbiAgICAgIHggPSB4IHx8IDA7XG4gICAgICB5ID0geSB8fCAwO1xuICAgICAgeiA9IHogfHwgMDtcbiAgICAgIHRoaXMucG9zaXRpb25YLnZhbHVlID0geDtcbiAgICAgIHRoaXMucG9zaXRpb25ZLnZhbHVlID0geTtcbiAgICAgIHRoaXMucG9zaXRpb25aLnZhbHVlID0gejtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gQXVkaW9MaXN0ZW5lcjtcbn0oX0F1ZGlvTm9kZTJbXCJkZWZhdWx0XCJdKTtcblxudmFyIF9kZWZhdWx0ID0gQXVkaW9MaXN0ZW5lcjtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se1wiLi9BdWRpb05vZGVcIjo0NSxcIi4vQXVkaW9QYXJhbVwiOjQ2fV0sNDU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0V2ZW50VGFyZ2V0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4uL0V2ZW50VGFyZ2V0XCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBBdWRpb05vZGUgPSBmdW5jdGlvbiAoX0V2ZW50VGFyZ2V0KSB7XG4gIF9pbmhlcml0cyhBdWRpb05vZGUsIF9FdmVudFRhcmdldCk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihBdWRpb05vZGUpO1xuXG4gIGZ1bmN0aW9uIEF1ZGlvTm9kZShjb250ZXh0KSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEF1ZGlvTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuICAgIF90aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICBfdGhpcy5udW1iZXJPZklucHV0cyA9IDE7XG4gICAgX3RoaXMubnVtYmVyT2ZPdXRwdXRzID0gMTtcbiAgICBfdGhpcy5jaGFubmVsQ291bnQgPSAyO1xuICAgIF90aGlzLmNoYW5uZWxDb3VudE1vZGUgPSBcImV4cGxpY2l0XCI7XG4gICAgX3RoaXMuY2hhbm5lbEludGVycHJldGF0aW9uID0gXCJzcGVha2Vyc1wiO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhBdWRpb05vZGUsIFt7XG4gICAga2V5OiBcImNvbm5lY3RcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY29ubmVjdChkZXN0aW5hdGlvbiwgb3V0cHV0SW5kZXgsIGlucHV0SW5kZXgpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwiZGlzY29ubmVjdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNjb25uZWN0KCkge31cbiAgfSwge1xuICAgIGtleTogXCJpc051bWJlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpc051bWJlcihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnbnVtYmVyJyB8fCBvYmogaW5zdGFuY2VvZiBOdW1iZXI7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNvbnRleHRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBBdWRpb05vZGU7XG59KF9FdmVudFRhcmdldDJbXCJkZWZhdWx0XCJdKTtcblxudmFyIF9kZWZhdWx0ID0gQXVkaW9Ob2RlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuLi9FdmVudFRhcmdldFwiOjExfV0sNDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG52YXIgQXVkaW9QYXJhbSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQXVkaW9QYXJhbSgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQXVkaW9QYXJhbSk7XG5cbiAgICB0aGlzLmF1dG9tYXRpb25SYXRlID0gb3B0aW9ucy5hdXRvbWF0aW9uUmF0ZSB8fCBcImEtcmF0ZVwiO1xuICAgIHRoaXMuX2RlZmF1bHRWYWx1ZSA9IG9wdGlvbnMuZGVmYXVsdFZhbHVlIHx8IDE7XG4gICAgdGhpcy5fbWF4VmFsdWUgPSBvcHRpb25zLm1heFZhbHVlIHx8IE51bWJlci5NQVhfVkFMVUU7XG4gICAgdGhpcy5fbWluVmFsdWUgPSBvcHRpb25zLm1pblZhbHVlIHx8IC1OdW1iZXIuTUFYX1ZBTFVFO1xuICAgIHRoaXMudmFsdWUgPSBvcHRpb25zLnZhbHVlIHx8IDE7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoQXVkaW9QYXJhbSwgW3tcbiAgICBrZXk6IFwic2V0VmFsdWVBdFRpbWVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0VmFsdWVBdFRpbWUodmFsdWUsIHN0YXJ0VGltZSkge1xuICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsaW5lYXJSYW1wVG9WYWx1ZUF0VGltZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lYXJSYW1wVG9WYWx1ZUF0VGltZSh2YWx1ZSwgZW5kVGltZSkge1xuICAgICAgaWYgKGVuZFRpbWUgPCAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGsgPSB2YWx1ZSAvIGVuZFRpbWU7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHZhciBmdW5jID0gZnVuY3Rpb24gZnVuYyhkdCkge1xuICAgICAgICBkdCA9IGR0IC8gMTAwMDtcblxuICAgICAgICBpZiAoZHQgPiBlbmRUaW1lKSB7XG4gICAgICAgICAgZHQgPSBlbmRUaW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGR0IDwgMCkge1xuICAgICAgICAgIGR0ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVuZFRpbWUgLT0gZHQ7XG4gICAgICAgIHNlbGYudmFsdWUgKz0gZHQgKiBrO1xuXG4gICAgICAgIGlmIChlbmRUaW1lID4gMCkge1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJleHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInNldFRhcmdldEF0VGltZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRUYXJnZXRBdFRpbWUodGFyZ2V0LCBzdGFydFRpbWUsIHRpbWVDb25zdGFudCkge1xuICAgICAgdGhpcy52YWx1ZSA9IHRhcmdldDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2V0VmFsdWVDdXJ2ZUF0VGltZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRWYWx1ZUN1cnZlQXRUaW1lKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjYW5jZWxTY2hlZHVsZWRWYWx1ZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2FuY2VsU2NoZWR1bGVkVmFsdWVzKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjYW5jZWxBbmRIb2xkQXRUaW1lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhbmNlbEFuZEhvbGRBdFRpbWUoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcImRlZmF1bHRWYWx1ZVwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHRWYWx1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibWF4VmFsdWVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9tYXhWYWx1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibWluVmFsdWVcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9taW5WYWx1ZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidmFsdWVcIixcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCh2YWx1ZSkge1xuICAgICAgdmFsdWUgPSBNYXRoLm1pbih0aGlzLl9tYXhWYWx1ZSwgdmFsdWUpO1xuICAgICAgdGhpcy5fdmFsdWUgPSBNYXRoLm1heCh0aGlzLl9taW5WYWx1ZSwgdmFsdWUpO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEF1ZGlvUGFyYW07XG59KCk7XG5cbnZhciBfZGVmYXVsdCA9IEF1ZGlvUGFyYW07XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0O1xuXG59LHt9XSw0NzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfQXVkaW9Ob2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9Ob2RlXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBBdWRpb1NjaGVkdWxlZFNvdXJjZU5vZGUgPSBmdW5jdGlvbiAoX0F1ZGlvTm9kZSkge1xuICBfaW5oZXJpdHMoQXVkaW9TY2hlZHVsZWRTb3VyY2VOb2RlLCBfQXVkaW9Ob2RlKTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKEF1ZGlvU2NoZWR1bGVkU291cmNlTm9kZSk7XG5cbiAgZnVuY3Rpb24gQXVkaW9TY2hlZHVsZWRTb3VyY2VOb2RlKGNvbnRleHQpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQXVkaW9TY2hlZHVsZWRTb3VyY2VOb2RlKTtcblxuICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCBjb250ZXh0KTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhBdWRpb1NjaGVkdWxlZFNvdXJjZU5vZGUsIFt7XG4gICAga2V5OiBcIm9uZW5kZWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25lbmRlZChldmVudCkge31cbiAgfSwge1xuICAgIGtleTogXCJzdGFydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydCh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInN0b3BcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc3RvcCh3aGVuKSB7fVxuICB9XSk7XG5cbiAgcmV0dXJuIEF1ZGlvU2NoZWR1bGVkU291cmNlTm9kZTtcbn0oX0F1ZGlvTm9kZTJbXCJkZWZhdWx0XCJdKTtcblxudmFyIF9kZWZhdWx0ID0gQXVkaW9TY2hlZHVsZWRTb3VyY2VOb2RlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuL0F1ZGlvTm9kZVwiOjQ1fV0sNDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0V2ZW50VGFyZ2V0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4uL0V2ZW50VGFyZ2V0XCIpKTtcblxudmFyIF9BdWRpb0xpc3RlbmVyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdWRpb0xpc3RlbmVyXCIpKTtcblxudmFyIF9QZXJpb2RpY1dhdmUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL1BlcmlvZGljV2F2ZVwiKSk7XG5cbnZhciBfQXVkaW9CdWZmZXIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvQnVmZmVyXCIpKTtcblxudmFyIF9XZWFrTWFwID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi4vdXRpbC9XZWFrTWFwXCIpKTtcblxudmFyIF9EeW5hbWljc0NvbXByZXNzb3JOb2RlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9EeW5hbWljc0NvbXByZXNzb3JOb2RlXCIpKTtcblxudmFyIF9BdWRpb0J1ZmZlclNvdXJjZU5vZGUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvQnVmZmVyU291cmNlTm9kZVwiKSk7XG5cbnZhciBfQXVkaW9EZXN0aW5hdGlvbk5vZGUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvRGVzdGluYXRpb25Ob2RlXCIpKTtcblxudmFyIF9Pc2NpbGxhdG9yTm9kZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vT3NjaWxsYXRvck5vZGVcIikpO1xuXG52YXIgX0FuYWx5c2VyTm9kZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQW5hbHlzZXJOb2RlXCIpKTtcblxudmFyIF9QYW5uZXJOb2RlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9QYW5uZXJOb2RlXCIpKTtcblxudmFyIF9HYWluTm9kZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vR2Fpbk5vZGVcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgX3NldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTsgfVxuXG5mdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgby5fX3Byb3RvX18gPSBwOyByZXR1cm4gbzsgfTsgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTsgfVxuXG5mdW5jdGlvbiBfY3JlYXRlU3VwZXIoRGVyaXZlZCkgeyB2YXIgaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKTsgcmV0dXJuIGZ1bmN0aW9uIF9jcmVhdGVTdXBlckludGVybmFsKCkgeyB2YXIgU3VwZXIgPSBfZ2V0UHJvdG90eXBlT2YoRGVyaXZlZCksIHJlc3VsdDsgaWYgKGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QpIHsgdmFyIE5ld1RhcmdldCA9IF9nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3RvcjsgcmVzdWx0ID0gUmVmbGVjdC5jb25zdHJ1Y3QoU3VwZXIsIGFyZ3VtZW50cywgTmV3VGFyZ2V0KTsgfSBlbHNlIHsgcmVzdWx0ID0gU3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfSByZXR1cm4gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgcmVzdWx0KTsgfTsgfVxuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7IGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7IHJldHVybiBjYWxsOyB9IHJldHVybiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpOyB9XG5cbmZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikgeyBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gc2VsZjsgfVxuXG5mdW5jdGlvbiBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkgeyBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgIVJlZmxlY3QuY29uc3RydWN0KSByZXR1cm4gZmFsc2U7IGlmIChSZWZsZWN0LmNvbnN0cnVjdC5zaGFtKSByZXR1cm4gZmFsc2U7IGlmICh0eXBlb2YgUHJveHkgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHRydWU7IHRyeSB7IERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUmVmbGVjdC5jb25zdHJ1Y3QoRGF0ZSwgW10sIGZ1bmN0aW9uICgpIHt9KSk7IHJldHVybiB0cnVlOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfSB9XG5cbmZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7IHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7IH07IHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7IH1cblxudmFyIEJhc2VBdWRpb0NvbnRleHQgPSBmdW5jdGlvbiAoX0V2ZW50VGFyZ2V0KSB7XG4gIF9pbmhlcml0cyhCYXNlQXVkaW9Db250ZXh0LCBfRXZlbnRUYXJnZXQpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoQmFzZUF1ZGlvQ29udGV4dCk7XG5cbiAgZnVuY3Rpb24gQmFzZUF1ZGlvQ29udGV4dCgpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQmFzZUF1ZGlvQ29udGV4dCk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuICAgIF90aGlzLmF1ZGlvV29ya2xldDtcbiAgICBfdGhpcy5jdXJyZW50VGltZSA9IDA7XG4gICAgX3RoaXMuZGVzdGluYXRpb24gPSBuZXcgX0F1ZGlvRGVzdGluYXRpb25Ob2RlW1wiZGVmYXVsdFwiXShfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgX3RoaXMubGlzdGVuZXIgPSBuZXcgX0F1ZGlvTGlzdGVuZXJbXCJkZWZhdWx0XCJdKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcbiAgICBfdGhpcy5zYW1wbGVSYXRlO1xuICAgIF90aGlzLnN0YXRlID0gXCJydW5uaW5nXCI7XG4gICAgX1dlYWtNYXBbXCJkZWZhdWx0XCJdLmdldChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSkuYXVkaW9CdWZmZXJTb3VyY2VOb2RlQXJyYXkgPSBbXTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoQmFzZUF1ZGlvQ29udGV4dCwgW3tcbiAgICBrZXk6IFwiY3JlYXRlQW5hbHlzZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQW5hbHlzZXIoKSB7XG4gICAgICByZXR1cm4gbmV3IF9BbmFseXNlck5vZGVbXCJkZWZhdWx0XCJdKHRoaXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVCaXF1YWRGaWx0ZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQmlxdWFkRmlsdGVyKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVCdWZmZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQnVmZmVyKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVCdWZmZXJTb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQnVmZmVyU291cmNlKCkge1xuICAgICAgdmFyIHNvdXJjZU5vZGUgPSBuZXcgX0F1ZGlvQnVmZmVyU291cmNlTm9kZVtcImRlZmF1bHRcIl0odGhpcyk7XG5cbiAgICAgIF9XZWFrTWFwW1wiZGVmYXVsdFwiXS5nZXQodGhpcykuYXVkaW9CdWZmZXJTb3VyY2VOb2RlQXJyYXkucHVzaChzb3VyY2VOb2RlKTtcblxuICAgICAgcmV0dXJuIHNvdXJjZU5vZGU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZUNvbnN0YW50U291cmNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUNvbnN0YW50U291cmNlKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVDaGFubmVsTWVyZ2VyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUNoYW5uZWxNZXJnZXIoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZUNoYW5uZWxTcGxpdHRlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVDaGFubmVsU3BsaXR0ZXIoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZUNvbnZvbHZlclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVDb252b2x2ZXIoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZURlbGF5XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZURlbGF5KCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVEeW5hbWljc0NvbXByZXNzb3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCkge1xuICAgICAgcmV0dXJuIG5ldyBfRHluYW1pY3NDb21wcmVzc29yTm9kZVtcImRlZmF1bHRcIl0odGhpcyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZUdhaW5cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlR2FpbigpIHtcbiAgICAgIHJldHVybiBuZXcgX0dhaW5Ob2RlW1wiZGVmYXVsdFwiXSh0aGlzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3JlYXRlSUlSRmlsdGVyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUlJUkZpbHRlcigpIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3JlYXRlT3NjaWxsYXRvclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVPc2NpbGxhdG9yKCkge1xuICAgICAgcmV0dXJuIG5ldyBfT3NjaWxsYXRvck5vZGVbXCJkZWZhdWx0XCJdKHRoaXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVQYW5uZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlUGFubmVyKCkge1xuICAgICAgcmV0dXJuIG5ldyBfUGFubmVyTm9kZVtcImRlZmF1bHRcIl0odGhpcyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZVBlcmlvZGljV2F2ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVQZXJpb2RpY1dhdmUoKSB7XG4gICAgICByZXR1cm4gbmV3IF9QZXJpb2RpY1dhdmVbXCJkZWZhdWx0XCJdKHRoaXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVTY3JpcHRQcm9jZXNzb3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlU2NyaXB0UHJvY2Vzc29yKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVTdGVyZW9QYW5uZXJcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlU3RlcmVvUGFubmVyKCkge31cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVXYXZlU2hhcGVyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZVdhdmVTaGFwZXIoKSB7fVxuICB9LCB7XG4gICAga2V5OiBcImRlY29kZUF1ZGlvRGF0YVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhLCBjYWxsRnVuYykge1xuICAgICAgbmV3IF9BdWRpb0J1ZmZlcltcImRlZmF1bHRcIl0odGhpcywgYXVkaW9EYXRhLCBjYWxsRnVuYyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm9uc3RhdGVjaGFuZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25zdGF0ZWNoYW5nZSgpIHt9XG4gIH1dKTtcblxuICByZXR1cm4gQmFzZUF1ZGlvQ29udGV4dDtcbn0oX0V2ZW50VGFyZ2V0MltcImRlZmF1bHRcIl0pO1xuXG52YXIgX2RlZmF1bHQgPSBCYXNlQXVkaW9Db250ZXh0O1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuLi9FdmVudFRhcmdldFwiOjExLFwiLi4vdXRpbC9XZWFrTWFwXCI6NTYsXCIuL0FuYWx5c2VyTm9kZVwiOjM5LFwiLi9BdWRpb0J1ZmZlclwiOjQwLFwiLi9BdWRpb0J1ZmZlclNvdXJjZU5vZGVcIjo0MSxcIi4vQXVkaW9EZXN0aW5hdGlvbk5vZGVcIjo0MyxcIi4vQXVkaW9MaXN0ZW5lclwiOjQ0LFwiLi9EeW5hbWljc0NvbXByZXNzb3JOb2RlXCI6NDksXCIuL0dhaW5Ob2RlXCI6NTAsXCIuL09zY2lsbGF0b3JOb2RlXCI6NTIsXCIuL1Bhbm5lck5vZGVcIjo1MyxcIi4vUGVyaW9kaWNXYXZlXCI6NTR9XSw0OTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfQXVkaW9Ob2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9Ob2RlXCIpKTtcblxudmFyIF9BdWRpb1BhcmFtID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdWRpb1BhcmFtXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBEeW5hbWljc0NvbXByZXNzb3JOb2RlID0gZnVuY3Rpb24gKF9BdWRpb05vZGUpIHtcbiAgX2luaGVyaXRzKER5bmFtaWNzQ29tcHJlc3Nvck5vZGUsIF9BdWRpb05vZGUpO1xuXG4gIHZhciBfc3VwZXIgPSBfY3JlYXRlU3VwZXIoRHluYW1pY3NDb21wcmVzc29yTm9kZSk7XG5cbiAgZnVuY3Rpb24gRHluYW1pY3NDb21wcmVzc29yTm9kZShjb250ZXh0KSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIER5bmFtaWNzQ29tcHJlc3Nvck5vZGUpO1xuXG4gICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBjb250ZXh0KTtcbiAgICBfdGhpcy5fdGhyZXNob2xkID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogLTI0LFxuICAgICAgZGVmYXVsdFZhbHVlOiAtMjQsXG4gICAgICBtYXhWYWx1ZTogMCxcbiAgICAgIG1pblZhbHVlOiAtMTAwXG4gICAgfSk7XG4gICAgX3RoaXMuX2tuZWUgPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAzMCxcbiAgICAgIGRlZmF1bHRWYWx1ZTogMzAsXG4gICAgICBtYXhWYWx1ZTogNDAsXG4gICAgICBtaW5WYWx1ZTogMFxuICAgIH0pO1xuICAgIF90aGlzLl9yYXRpbyA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IDEyLFxuICAgICAgZGVmYXVsdFZhbHVlOiAxMixcbiAgICAgIG1heFZhbHVlOiAyMCxcbiAgICAgIG1pblZhbHVlOiAxXG4gICAgfSk7XG4gICAgX3RoaXMuX3JlZHVjdGlvbiA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IDAsXG4gICAgICBkZWZhdWx0VmFsdWU6IDAsXG4gICAgICBtYXhWYWx1ZTogMCxcbiAgICAgIG1pblZhbHVlOiAtMjBcbiAgICB9KTtcbiAgICBfdGhpcy5fYXR0YWNrID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMC4wMDMsXG4gICAgICBkZWZhdWx0VmFsdWU6IDAuMDAzLFxuICAgICAgbWF4VmFsdWU6IDEsXG4gICAgICBtaW5WYWx1ZTogMFxuICAgIH0pO1xuICAgIF90aGlzLl9yZWxlYXNlID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMC4yNSxcbiAgICAgIGRlZmF1bHRWYWx1ZTogMC4yNSxcbiAgICAgIG1heFZhbHVlOiAxLFxuICAgICAgbWluVmFsdWU6IDBcbiAgICB9KTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRHluYW1pY3NDb21wcmVzc29yTm9kZSwgW3tcbiAgICBrZXk6IFwidGhyZXNob2xkXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdGhyZXNob2xkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJrZWVuXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fa2VlbjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmF0aW9cIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yYXRpbztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVkdWN0aW9uXCIsXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVkdWN0aW9uO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhdHRhY2tcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hdHRhY2s7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbGVhc2VcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZWxlYXNlO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBEeW5hbWljc0NvbXByZXNzb3JOb2RlO1xufShfQXVkaW9Ob2RlMltcImRlZmF1bHRcIl0pO1xuXG52YXIgX2RlZmF1bHQgPSBEeW5hbWljc0NvbXByZXNzb3JOb2RlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDtcblxufSx7XCIuL0F1ZGlvTm9kZVwiOjQ1LFwiLi9BdWRpb1BhcmFtXCI6NDZ9XSw1MDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfQXVkaW9Ob2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9Ob2RlXCIpKTtcblxudmFyIF9BdWRpb1BhcmFtID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdWRpb1BhcmFtXCIpKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIF9zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7IH1cblxuZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHsgX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IG8uX19wcm90b19fID0gcDsgcmV0dXJuIG87IH07IHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7IH1cblxuZnVuY3Rpb24gX2NyZWF0ZVN1cGVyKERlcml2ZWQpIHsgdmFyIGhhc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSBfaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCk7IHJldHVybiBmdW5jdGlvbiBfY3JlYXRlU3VwZXJJbnRlcm5hbCgpIHsgdmFyIFN1cGVyID0gX2dldFByb3RvdHlwZU9mKERlcml2ZWQpLCByZXN1bHQ7IGlmIChoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KSB7IHZhciBOZXdUYXJnZXQgPSBfZ2V0UHJvdG90eXBlT2YodGhpcykuY29uc3RydWN0b3I7IHJlc3VsdCA9IFJlZmxlY3QuY29uc3RydWN0KFN1cGVyLCBhcmd1bWVudHMsIE5ld1RhcmdldCk7IH0gZWxzZSB7IHJlc3VsdCA9IFN1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0gcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIHJlc3VsdCk7IH07IH1cblxuZnVuY3Rpb24gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4oc2VsZiwgY2FsbCkgeyBpZiAoY2FsbCAmJiAoX3R5cGVvZihjYWxsKSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY2FsbCA9PT0gXCJmdW5jdGlvblwiKSkgeyByZXR1cm4gY2FsbDsgfSByZXR1cm4gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKTsgfVxuXG5mdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHsgaWYgKHNlbGYgPT09IHZvaWQgMCkgeyB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7IH0gcmV0dXJuIHNlbGY7IH1cblxuZnVuY3Rpb24gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpIHsgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmNvbnN0cnVjdCkgcmV0dXJuIGZhbHNlOyBpZiAoUmVmbGVjdC5jb25zdHJ1Y3Quc2hhbSkgcmV0dXJuIGZhbHNlOyBpZiAodHlwZW9mIFByb3h5ID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB0cnVlOyB0cnkgeyBEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFJlZmxlY3QuY29uc3RydWN0KERhdGUsIFtdLCBmdW5jdGlvbiAoKSB7fSkpOyByZXR1cm4gdHJ1ZTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH0gfVxuXG5mdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2YobykgeyByZXR1cm4gby5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG8pOyB9OyByZXR1cm4gX2dldFByb3RvdHlwZU9mKG8pOyB9XG5cbnZhciBHYWluTm9kZSA9IGZ1bmN0aW9uIChfQXVkaW9Ob2RlKSB7XG4gIF9pbmhlcml0cyhHYWluTm9kZSwgX0F1ZGlvTm9kZSk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihHYWluTm9kZSk7XG5cbiAgZnVuY3Rpb24gR2Fpbk5vZGUoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBHYWluTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgIF90aGlzLl9nYWluID0gb3B0aW9ucyAmJiBvcHRpb25zLmdhaW4gfHwgbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSgpO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhHYWluTm9kZSwgW3tcbiAgICBrZXk6IFwiZ2FpblwiLFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dhaW47XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEdhaW5Ob2RlO1xufShfQXVkaW9Ob2RlMltcImRlZmF1bHRcIl0pO1xuXG52YXIgX2RlZmF1bHQgPSBHYWluTm9kZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se1wiLi9BdWRpb05vZGVcIjo0NSxcIi4vQXVkaW9QYXJhbVwiOjQ2fV0sNTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0F1ZGlvTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvTm9kZVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgTWVkaWFFbGVtZW50QXVkaW9Tb3VyY2VOb2RlID0gZnVuY3Rpb24gKF9BdWRpb05vZGUpIHtcbiAgX2luaGVyaXRzKE1lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZSwgX0F1ZGlvTm9kZSk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihNZWRpYUVsZW1lbnRBdWRpb1NvdXJjZU5vZGUpO1xuXG4gIGZ1bmN0aW9uIE1lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZShjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE1lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgIF90aGlzLl9vcHRpb25zID0gb3B0aW9ucztcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoTWVkaWFFbGVtZW50QXVkaW9Tb3VyY2VOb2RlLCBbe1xuICAgIGtleTogXCJtZWRpYUVsZW1lbnRcIixcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcHRpb25zID8gdGhpcy5fb3B0aW9ucy5tZWRpYUVsZW1lbnQgOiBudWxsO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBNZWRpYUVsZW1lbnRBdWRpb1NvdXJjZU5vZGU7XG59KF9BdWRpb05vZGUyW1wiZGVmYXVsdFwiXSk7XG5cbnZhciBfZGVmYXVsdCA9IE1lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se1wiLi9BdWRpb05vZGVcIjo0NX1dLDUyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHZvaWQgMDtcblxudmFyIF9BdWRpb1NjaGVkdWxlZFNvdXJjZU5vZGUgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvU2NoZWR1bGVkU291cmNlTm9kZVwiKSk7XG5cbnZhciBfQXVkaW9QYXJhbSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9QYXJhbVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgdHlwZXMgPSB7XG4gIFwic2luZVwiOiAwLFxuICBcInNxdWFyZVwiOiAwLFxuICBcInNhd3Rvb3RoXCI6IDAsXG4gIFwidHJpYW5nbGVcIjogMCxcbiAgXCJjdXN0b21cIjogMFxufTtcblxudmFyIE9zY2lsbGF0b3JOb2RlID0gZnVuY3Rpb24gKF9BdWRpb1NjaGVkdWxlZFNvdXJjZSkge1xuICBfaW5oZXJpdHMoT3NjaWxsYXRvck5vZGUsIF9BdWRpb1NjaGVkdWxlZFNvdXJjZSk7XG5cbiAgdmFyIF9zdXBlciA9IF9jcmVhdGVTdXBlcihPc2NpbGxhdG9yTm9kZSk7XG5cbiAgZnVuY3Rpb24gT3NjaWxsYXRvck5vZGUoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBPc2NpbGxhdG9yTm9kZSk7XG5cbiAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIF90aGlzLmZyZXF1ZW5jeSA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IF90aGlzLmlzTnVtYmVyKG9wdGlvbnMuZnJlcXVlbmN5KSA/IG9wdGlvbnMuZnJlcXVlbmN5IDogNDQwXG4gICAgfSk7XG4gICAgX3RoaXMuZGV0dW5lID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogX3RoaXMuaXNOdW1iZXIob3B0aW9ucy5kZXR1bmUpID8gb3B0aW9ucy5kZXR1bmUgOiAwXG4gICAgfSk7XG4gICAgX3RoaXMudHlwZSA9IG9wdGlvbnMudHlwZSBpbiB0eXBlcyA/IG9wdGlvbnMudHlwZSA6IFwic2luZVwiO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhPc2NpbGxhdG9yTm9kZSwgW3tcbiAgICBrZXk6IFwic2V0UGVyaW9kaWNXYXZlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldFBlcmlvZGljV2F2ZSh3YXZlKSB7fVxuICB9LCB7XG4gICAga2V5OiBcInN0YXJ0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0YXJ0KHdoZW4pIHt9XG4gIH0sIHtcbiAgICBrZXk6IFwic3RvcFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKHdlbikge31cbiAgfV0pO1xuXG4gIHJldHVybiBPc2NpbGxhdG9yTm9kZTtcbn0oX0F1ZGlvU2NoZWR1bGVkU291cmNlTm9kZVtcImRlZmF1bHRcIl0pO1xuXG52YXIgX2RlZmF1bHQgPSBPc2NpbGxhdG9yTm9kZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se1wiLi9BdWRpb1BhcmFtXCI6NDYsXCIuL0F1ZGlvU2NoZWR1bGVkU291cmNlTm9kZVwiOjQ3fV0sNTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX0F1ZGlvTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0F1ZGlvTm9kZVwiKSk7XG5cbnZhciBfQXVkaW9QYXJhbSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9QYXJhbVwiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IFwiZGVmYXVsdFwiOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBfc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpOyB9XG5cbmZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7IF9zZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiBfc2V0UHJvdG90eXBlT2YobywgcCkgeyBvLl9fcHJvdG9fXyA9IHA7IHJldHVybiBvOyB9OyByZXR1cm4gX3NldFByb3RvdHlwZU9mKG8sIHApOyB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVTdXBlcihEZXJpdmVkKSB7IHZhciBoYXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0ID0gX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCgpOyByZXR1cm4gZnVuY3Rpb24gX2NyZWF0ZVN1cGVySW50ZXJuYWwoKSB7IHZhciBTdXBlciA9IF9nZXRQcm90b3R5cGVPZihEZXJpdmVkKSwgcmVzdWx0OyBpZiAoaGFzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCkgeyB2YXIgTmV3VGFyZ2V0ID0gX2dldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yOyByZXN1bHQgPSBSZWZsZWN0LmNvbnN0cnVjdChTdXBlciwgYXJndW1lbnRzLCBOZXdUYXJnZXQpOyB9IGVsc2UgeyByZXN1bHQgPSBTdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9IHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCByZXN1bHQpOyB9OyB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHsgcmV0dXJuIGNhbGw7IH0gcmV0dXJuIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7IH1cblxuZnVuY3Rpb24gX2Fzc2VydFRoaXNJbml0aWFsaXplZChzZWxmKSB7IGlmIChzZWxmID09PSB2b2lkIDApIHsgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpOyB9IHJldHVybiBzZWxmOyB9XG5cbmZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7IGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTsgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTsgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTsgdHJ5IHsgRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChEYXRlLCBbXSwgZnVuY3Rpb24gKCkge30pKTsgcmV0dXJuIHRydWU7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9IH1cblxuZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgX2dldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LmdldFByb3RvdHlwZU9mIDogZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHsgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTsgfTsgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTsgfVxuXG52YXIgUGFubmVyTm9kZSA9IGZ1bmN0aW9uIChfQXVkaW9Ob2RlKSB7XG4gIF9pbmhlcml0cyhQYW5uZXJOb2RlLCBfQXVkaW9Ob2RlKTtcblxuICB2YXIgX3N1cGVyID0gX2NyZWF0ZVN1cGVyKFBhbm5lck5vZGUpO1xuXG4gIGZ1bmN0aW9uIFBhbm5lck5vZGUoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBfdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQYW5uZXJOb2RlKTtcblxuICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgX3RoaXMuY29uZUlubmVyQW5nbGUgPSAzNjA7XG4gICAgX3RoaXMuY29uZU91dGVyQW5nbGUgPSAzNjA7XG4gICAgX3RoaXMuY29uZU91dGVyR2FpbiA9IDA7XG4gICAgX3RoaXMuZGlzdGFuY2VNb2RlbCA9IFwiaW52ZXJzZVwiO1xuICAgIF90aGlzLm1heERpc3RhbmNlID0gMTAwMDA7XG4gICAgX3RoaXMub3JpZW50YXRpb25YID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMVxuICAgIH0pO1xuICAgIF90aGlzLm9yaWVudGF0aW9uWSA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IDBcbiAgICB9KTtcbiAgICBfdGhpcy5vcmllbnRhdGlvblogPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAwXG4gICAgfSk7XG4gICAgX3RoaXMucGFubmluZ01vZGVsID0gXCJlcXVhbHBvd2VyXCI7XG4gICAgX3RoaXMucG9zaXRpb25YID0gbmV3IF9BdWRpb1BhcmFtW1wiZGVmYXVsdFwiXSh7XG4gICAgICB2YWx1ZTogMFxuICAgIH0pO1xuICAgIF90aGlzLnBvc2l0aW9uWSA9IG5ldyBfQXVkaW9QYXJhbVtcImRlZmF1bHRcIl0oe1xuICAgICAgdmFsdWU6IDBcbiAgICB9KTtcbiAgICBfdGhpcy5wb3NpdGlvblogPSBuZXcgX0F1ZGlvUGFyYW1bXCJkZWZhdWx0XCJdKHtcbiAgICAgIHZhbHVlOiAwXG4gICAgfSk7XG4gICAgX3RoaXMucmVmRGlzdGFuY2UgPSAxO1xuICAgIF90aGlzLnJvbGxvZmZGYWN0b3IgPSAxO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhQYW5uZXJOb2RlLCBbe1xuICAgIGtleTogXCJzZXRQb3NpdGlvblwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRQb3NpdGlvbih4LCB5LCB6KSB7XG4gICAgICB0aGlzLnBvc2l0aW9uWCA9IHg7XG4gICAgICB0aGlzLnBvc2l0aW9uWSA9IHk7XG4gICAgICB0aGlzLnBvc2l0aW9uWiA9IHo7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNldE9yaWVudGF0aW9uXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldE9yaWVudGF0aW9uKHgsIHksIHopIHtcbiAgICAgIHRoaXMub3JpZW50YXRpb25YID0geDtcbiAgICAgIHRoaXMub3JpZW50YXRpb25ZID0geTtcbiAgICAgIHRoaXMub3JpZW50YXRpb25aID0gejtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2V0VmVsb2NpdHlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0VmVsb2NpdHkoKSB7fVxuICB9XSk7XG5cbiAgcmV0dXJuIFBhbm5lck5vZGU7XG59KF9BdWRpb05vZGUyW1wiZGVmYXVsdFwiXSk7XG5cbnZhciBfZGVmYXVsdCA9IFBhbm5lck5vZGU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0O1xuXG59LHtcIi4vQXVkaW9Ob2RlXCI6NDUsXCIuL0F1ZGlvUGFyYW1cIjo0Nn1dLDU0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBQZXJpb2RpY1dhdmUgPSBmdW5jdGlvbiBQZXJpb2RpY1dhdmUoY29udGV4dCwgb3B0aW9ucykge1xuICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUGVyaW9kaWNXYXZlKTtcbn07XG5cbnZhciBfZGVmYXVsdCA9IFBlcmlvZGljV2F2ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se31dLDU1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxudmFyIG1kNSA9IHJlcXVpcmUoXCIuLi8uLi9saWIvbWQ1Lm1pblwiKTtcblxudmFyIGZpbGVNZ3IgPSByYWwuZ2V0RmlsZVN5c3RlbU1hbmFnZXIoKTtcbnZhciBjYWNoZURpciA9IHJhbC5lbnYuVVNFUl9EQVRBX1BBVEggKyBcIi9maWxlQ2FjaGUvXCI7XG5cbnZhciBGaWxlQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEZpbGVDYWNoZSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRmlsZUNhY2hlKTtcblxuICAgIHRoaXMuX2NhY2hlcyA9IHt9O1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEZpbGVDYWNoZSwgW3tcbiAgICBrZXk6IFwiZ2V0Q2FjaGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q2FjaGUoZGF0YSkge1xuICAgICAgdmFyIGtleSA9IEZpbGVDYWNoZS5fZ2VuRGF0YUtleShkYXRhKTtcblxuICAgICAgaWYgKGtleSBpbiB0aGlzLl9jYWNoZXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlc1trZXldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNldENhY2hlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldENhY2hlKHBhdGgsIGRhdGEpIHtcbiAgICAgIHZhciBrZXkgPSBGaWxlQ2FjaGUuX2dlbkRhdGFLZXkoZGF0YSk7XG5cbiAgICAgIHRoaXMuX2NhY2hlc1trZXldID0gcGF0aDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2V0SXRlbVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRJdGVtKGRhdGEsIHBhdGgsIGtleSwgY2FsbEJhY2spIHtcbiAgICAgIGtleSA9IGtleSB8fCBGaWxlQ2FjaGUuX2dlbkRhdGFLZXkoZGF0YSk7XG4gICAgICB2YXIgY2FjaGVzID0gdGhpcy5fY2FjaGVzO1xuXG4gICAgICBpZiAoa2V5IGluIGNhY2hlcykge1xuICAgICAgICBjYWxsQmFjayAmJiBjYWxsQmFjayhjYWNoZXNba2V5XSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIHBhdGggPSBjYWNoZURpciArIGtleTtcbiAgICAgICAgZmlsZU1nci53cml0ZUZpbGUoe1xuICAgICAgICAgIGZpbGVQYXRoOiBwYXRoLFxuICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgZW5jb2Rpbmc6IFwiYmluYXJ5XCIsXG4gICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgICAgIGNhY2hlc1trZXldID0gcGF0aDtcbiAgICAgICAgICAgIGNhbGxCYWNrICYmIGNhbGxCYWNrKHBhdGgpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogZnVuY3Rpb24gZmFpbCgpIHtcbiAgICAgICAgICAgIGNhbGxCYWNrICYmIGNhbGxCYWNrKCk7XG4gICAgICAgICAgICB0aHJvdyBwYXRoICsgXCJ3cml0ZUZpbGUgZmFpbCFcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRQYXRoXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFBhdGgoZGF0YSwgY2FsbEJhY2spIHtcbiAgICAgIHZhciBrZXkgPSBGaWxlQ2FjaGUuX2dlbkRhdGFLZXkoZGF0YSk7XG5cbiAgICAgIHZhciBjYWNoZXMgPSB0aGlzLl9jYWNoZXM7XG5cbiAgICAgIGlmIChrZXkgaW4gY2FjaGVzKSB7XG4gICAgICAgIGNhbGxCYWNrKGNhY2hlc1trZXldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0SXRlbShkYXRhLCB1bmRlZmluZWQsIGtleSwgY2FsbEJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgfV0sIFt7XG4gICAga2V5OiBcIl9nZW5EYXRhS2V5XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9nZW5EYXRhS2V5KGRhdGEpIHtcbiAgICAgIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KGRhdGEpO1xuICAgICAgdmFyIGxlbmd0aCA9IHZpZXcuYnl0ZUxlbmd0aCAvIDQ7XG4gICAgICB2YXIgY291bnQgPSAxMDtcbiAgICAgIHZhciBzcGFjZSA9IGxlbmd0aCAvIGNvdW50O1xuICAgICAgdmFyIGtleSA9IFwibGVuZ3RoOlwiICsgbGVuZ3RoO1xuICAgICAga2V5ICs9IFwiZmlyc3Q6XCIgKyB2aWV3LmdldEludDMyKDApO1xuICAgICAga2V5ICs9IFwibGFzdDpcIiArIHZpZXcuZ2V0SW50MzIobGVuZ3RoIC0gMSk7XG5cbiAgICAgIHdoaWxlIChjb3VudC0tKSB7XG4gICAgICAgIGtleSArPSBjb3VudCArIFwiOlwiICsgdmlldy5nZXRJbnQzMihNYXRoLmZsb29yKHNwYWNlICogY291bnQpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1kNShrZXkpO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBGaWxlQ2FjaGU7XG59KCk7XG5cbnRyeSB7XG4gIGZpbGVNZ3IuYWNjZXNzU3luYyhjYWNoZURpcik7XG4gIGZpbGVNZ3Iucm1kaXJTeW5jKGNhY2hlRGlyLCB0cnVlKTtcbn0gY2F0Y2ggKGUpIHt9XG5cbmZpbGVNZ3IubWtkaXJTeW5jKGNhY2hlRGlyLCB0cnVlKTtcblxudmFyIF9kZWZhdWx0ID0gbmV3IEZpbGVDYWNoZSgpO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0O1xuXG59LHtcIi4uLy4uL2xpYi9tZDUubWluXCI6Mn1dLDU2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfZGVmYXVsdCA9IG5ldyBXZWFrTWFwKCk7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX2RlZmF1bHQ7XG5cbn0se31dLDU3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgX0F1ZGlvID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9BdWRpb1wiKSk7XG5cbnZhciBfQXVkaW9Db250ZXh0ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9hdWRpb0NvbnRleHQvQXVkaW9Db250ZXh0XCIpKTtcblxudmFyIF9EZXZpY2VNb3Rpb25FdmVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRGV2aWNlTW90aW9uRXZlbnRcIikpO1xuXG52YXIgX0RvY3VtZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Eb2N1bWVudFwiKSk7XG5cbnZhciBfRXZlbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50XCIpKTtcblxudmFyIF9Gb250RmFjZSA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vRm9udEZhY2VcIikpO1xuXG52YXIgX0ZvbnRGYWNlU2V0ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9Gb250RmFjZVNldFwiKSk7XG5cbnZhciBfRXZlbnRUYXJnZXQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0V2ZW50VGFyZ2V0XCIpKTtcblxudmFyIF9IVE1MRWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEVsZW1lbnRcIikpO1xuXG52YXIgX0hUTUxBdWRpb0VsZW1lbnQgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0hUTUxBdWRpb0VsZW1lbnRcIikpO1xuXG52YXIgX0hUTUxDYW52YXNFbGVtZW50ID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9IVE1MQ2FudmFzRWxlbWVudFwiKSk7XG5cbnZhciBfSFRNTEltYWdlRWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTEltYWdlRWxlbWVudFwiKSk7XG5cbnZhciBfSFRNTFZpZGVvRWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTFZpZGVvRWxlbWVudFwiKSk7XG5cbnZhciBfSW1hZ2UgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL0ltYWdlXCIpKTtcblxudmFyIF9Mb2NhdGlvbiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vTG9jYXRpb25cIikpO1xuXG52YXIgX05hdmlnYXRvciA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vTmF2aWdhdG9yXCIpKTtcblxudmFyIF9TY3JlZW4gPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL1NjcmVlblwiKSk7XG5cbnZhciBfVG91Y2hFdmVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vVG91Y2hFdmVudFwiKSk7XG5cbnZhciBfWE1MSHR0cFJlcXVlc3QgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL1hNTEh0dHBSZXF1ZXN0XCIpKTtcblxudmFyIF9IVE1MU2NyaXB0RWxlbWVudCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vSFRNTFNjcmlwdEVsZW1lbnRcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBcImRlZmF1bHRcIjogb2JqIH07IH1cblxud2luZG93LnJhbCA9IHdpbmRvdy5yYWwgfHwge307XG5cbnZhciBfc3lzdGVtSW5mbyA9IHdpbmRvdy5yYWwuZ2V0U3lzdGVtSW5mb1N5bmMoKTtcblxud2luZG93LmNsaWVudFRvcCA9IDA7XG53aW5kb3cuY2xpZW50TGVmdCA9IDA7XG53aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA9IF9zeXN0ZW1JbmZvLnBpeGVsUmF0aW87XG53aW5kb3cuZG9jdW1lbnQgPSBuZXcgX0RvY3VtZW50W1wiZGVmYXVsdFwiXSgpO1xud2luZG93LmZyYW1lRWxlbWVudCA9IG51bGw7XG53aW5kb3cuZnVsbFNjcmVlbiA9IHRydWU7XG53aW5kb3cuaW5uZXJIZWlnaHQgPSBfc3lzdGVtSW5mby53aW5kb3dIZWlnaHQ7XG53aW5kb3cuaW5uZXJXaWR0aCA9IF9zeXN0ZW1JbmZvLndpbmRvd1dpZHRoO1xud2luZG93Lmxlbmd0aCA9IDA7XG53aW5kb3cubG9jYXRpb24gPSBuZXcgX0xvY2F0aW9uW1wiZGVmYXVsdFwiXSgpO1xud2luZG93Lm5hbWUgPSBcInJ1bnRpbWVcIjtcbndpbmRvdy5uYXZpZ2F0b3IgPSBuZXcgX05hdmlnYXRvcltcImRlZmF1bHRcIl0oX3N5c3RlbUluZm8ucGxhdGZvcm0sIF9zeXN0ZW1JbmZvLmxhbmd1YWdlKTtcbndpbmRvdy5vdXRlckhlaWdodCA9IF9zeXN0ZW1JbmZvLndpbmRvd0hlaWdodDtcbndpbmRvdy5vdXRlcldpZHRoID0gX3N5c3RlbUluZm8ud2luZG93V2lkdGg7XG53aW5kb3cucGFnZVhPZmZzZXQgPSAwO1xud2luZG93LnBhZ2VZT2Zmc2V0ID0gMDtcbndpbmRvdy5wYXJlbnQgPSB3aW5kb3c7XG53aW5kb3cuc2NyZWVuID0gbmV3IF9TY3JlZW5bXCJkZWZhdWx0XCJdKCk7XG53aW5kb3cuc2NyZWVuTGVmdCA9IDA7XG53aW5kb3cuc2NyZWVuVG9wID0gMDtcbndpbmRvdy5zY3JlZW5YID0gMDtcbndpbmRvdy5zY3JlZW5ZID0gMDtcbndpbmRvdy5zY3JvbGxYID0gMDtcbndpbmRvdy5zY3JvbGxZID0gMDtcbndpbmRvdy5zZWxmID0gd2luZG93O1xud2luZG93LnRvcCA9IHdpbmRvdztcbndpbmRvdy53aW5kb3cgPSB3aW5kb3c7XG53aW5kb3cuYWxlcnQgPSB3aW5kb3cuY29uc29sZS5lcnJvcjtcblxudmFyIF9yZXF1aXJlID0gcmVxdWlyZSgnLi4vbGliL2Jhc2U2NC5taW4uanMnKSxcbiAgICBidG9hID0gX3JlcXVpcmUuYnRvYSxcbiAgICBhdG9iID0gX3JlcXVpcmUuYXRvYjtcblxud2luZG93LmF0b2IgPSBhdG9iO1xud2luZG93LmJ0b2EgPSBidG9hO1xuXG53aW5kb3cuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUud2FybihcIndpbmRvdy5jbG9zZSgpIGlzIGRlcHJlY2F0ZWQhXCIpO1xufTtcblxud2luZG93LnByaW50ID0gd2luZG93LmNvbnNvbGUubG9nO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIgPSBfRXZlbnRUYXJnZXRbXCJkZWZhdWx0XCJdLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyLmJpbmQod2luZG93KTtcbndpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyID0gX0V2ZW50VGFyZ2V0W1wiZGVmYXVsdFwiXS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lci5iaW5kKHdpbmRvdyk7XG52YXIgX2Rpc3BhdGNoRXZlbnQgPSBfRXZlbnRUYXJnZXRbXCJkZWZhdWx0XCJdLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuXG53aW5kb3cuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAod2luZG93LmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpKSB7XG4gICAgcmV0dXJuIF9kaXNwYXRjaEV2ZW50LmFwcGx5KHRoaXMgfHwgd2luZG93LCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxud2luZG93LmdldENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgbGVmdDogJzBweCcsXG4gICAgdG9wOiAnMHB4JyxcbiAgICBoZWlnaHQ6ICcwcHgnLFxuICAgIHBhZGRpbmdMZWZ0OiAwLFxuICAgIGdldFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uIGdldFByb3BlcnR5VmFsdWUoa2V5KSB7XG4gICAgICByZXR1cm4gdGhpc1trZXldO1xuICAgIH1cbiAgfTtcbn07XG5cbnJhbC5vbldpbmRvd1Jlc2l6ZSAmJiByYWwub25XaW5kb3dSZXNpemUoZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgd2luZG93LmlubmVyV2lkdGggPSB3aWR0aDtcbiAgd2luZG93LmlubmVySGVpZ2h0ID0gaGVpZ2h0O1xuICB3aW5kb3cub3V0ZXJXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB3aW5kb3cub3V0ZXJIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB3aW5kb3cuc2NyZWVuLmF2YWlsSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB3aW5kb3cuc2NyZWVuLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gIHdpbmRvdy5zY3JlZW4uaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB2YXIgZXZlbnQgPSBuZXcgX0V2ZW50W1wiZGVmYXVsdFwiXShcInJlc2l6ZVwiKTtcbiAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufSk7XG5yYWwub25EZXZpY2VPcmllbnRhdGlvbkNoYW5nZSAmJiByYWwub25EZXZpY2VPcmllbnRhdGlvbkNoYW5nZShmdW5jdGlvbiAocmVzKSB7XG4gIGlmIChyZXMudmFsdWUgPT09IFwicG9ydHJhaXRcIikge1xuICAgIHdpbmRvdy5vcmllbnRhdGlvbiA9IDA7XG4gIH0gZWxzZSBpZiAocmVzLnZhbHVlID09PSBcImxhbmRzY2FwZVwiKSB7XG4gICAgd2luZG93Lm9yaWVudGF0aW9uID0gOTA7XG4gIH0gZWxzZSBpZiAocmVzLnZhbHVlID09PSBcImxhbmRzY2FwZVJldmVyc2VcIikge1xuICAgIHdpbmRvdy5vcmllbnRhdGlvbiA9IC05MDtcbiAgfSBlbHNlIGlmIChyZXMudmFsdWUgPT09IFwicG9ydHJhaXRSZXZlcnNlXCIpIHtcbiAgICB3aW5kb3cub3JpZW50YXRpb24gPSAxODA7XG4gIH1cbn0pO1xuXG53aW5kb3cuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS53YXJuKFwid2luZG93LnN0b3AoKSBub3QgaW1wbGVtZW50ZWRcIik7XG59O1xuXG53aW5kb3cuQXVkaW8gPSBfQXVkaW9bXCJkZWZhdWx0XCJdO1xud2luZG93LkF1ZGlvQ29udGV4dCA9IF9BdWRpb0NvbnRleHRbXCJkZWZhdWx0XCJdO1xud2luZG93LkRldmljZU1vdGlvbkV2ZW50ID0gX0RldmljZU1vdGlvbkV2ZW50W1wiZGVmYXVsdFwiXTtcbndpbmRvdy5FdmVudCA9IF9FdmVudFtcImRlZmF1bHRcIl07XG53aW5kb3cuRm9udEZhY2UgPSBfRm9udEZhY2VbXCJkZWZhdWx0XCJdO1xud2luZG93LkZvbnRGYWNlU2V0ID0gX0ZvbnRGYWNlU2V0W1wiZGVmYXVsdFwiXTtcbndpbmRvdy5IVE1MRWxlbWVudCA9IF9IVE1MRWxlbWVudFtcImRlZmF1bHRcIl07XG53aW5kb3cuSFRNTEF1ZGlvRWxlbWVudCA9IF9IVE1MQXVkaW9FbGVtZW50W1wiZGVmYXVsdFwiXTtcbndpbmRvdy5IVE1MQ2FudmFzRWxlbWVudCA9IF9IVE1MQ2FudmFzRWxlbWVudFtcImRlZmF1bHRcIl07XG53aW5kb3cuSFRNTEltYWdlRWxlbWVudCA9IF9IVE1MSW1hZ2VFbGVtZW50W1wiZGVmYXVsdFwiXTtcbndpbmRvdy5IVE1MVmlkZW9FbGVtZW50ID0gX0hUTUxWaWRlb0VsZW1lbnRbXCJkZWZhdWx0XCJdO1xud2luZG93LkltYWdlID0gX0ltYWdlW1wiZGVmYXVsdFwiXTtcbndpbmRvdy5Ub3VjaEV2ZW50ID0gX1RvdWNoRXZlbnRbXCJkZWZhdWx0XCJdO1xud2luZG93LlhNTEh0dHBSZXF1ZXN0ID0gX1hNTEh0dHBSZXF1ZXN0W1wiZGVmYXVsdFwiXTtcbndpbmRvdy5IVE1MU2NyaXB0RWxlbWVudCA9IF9IVE1MU2NyaXB0RWxlbWVudFtcImRlZmF1bHRcIl07XG5cbmlmICghd2luZG93LkJsb2IgfHwgIXdpbmRvdy5VUkwpIHtcbiAgdmFyIF9yZXF1aXJlMiA9IHJlcXVpcmUoJy4vQmxvYi5qcycpLFxuICAgICAgQmxvYiA9IF9yZXF1aXJlMi5CbG9iLFxuICAgICAgVVJMID0gX3JlcXVpcmUyLlVSTDtcblxuICB3aW5kb3cuQmxvYiA9IEJsb2I7XG4gIHdpbmRvdy5VUkwgPSBVUkw7XG59XG5cbmlmICghd2luZG93LkRPTVBhcnNlcikge1xuICB3aW5kb3cuRE9NUGFyc2VyID0gcmVxdWlyZSgnLi94bWxkb20vZG9tLXBhcnNlci5qcycpLkRPTVBhcnNlcjtcbn1cblxufSx7XCIuLi9saWIvYmFzZTY0Lm1pbi5qc1wiOjEsXCIuL0F1ZGlvXCI6NCxcIi4vQmxvYi5qc1wiOjUsXCIuL0RldmljZU1vdGlvbkV2ZW50XCI6NyxcIi4vRG9jdW1lbnRcIjo4LFwiLi9FdmVudFwiOjEwLFwiLi9FdmVudFRhcmdldFwiOjExLFwiLi9Gb250RmFjZVwiOjEyLFwiLi9Gb250RmFjZVNldFwiOjEzLFwiLi9IVE1MQXVkaW9FbGVtZW50XCI6MTUsXCIuL0hUTUxDYW52YXNFbGVtZW50XCI6MTcsXCIuL0hUTUxFbGVtZW50XCI6MTgsXCIuL0hUTUxJbWFnZUVsZW1lbnRcIjoyMSxcIi4vSFRNTFNjcmlwdEVsZW1lbnRcIjoyNCxcIi4vSFRNTFZpZGVvRWxlbWVudFwiOjI2LFwiLi9JbWFnZVwiOjI3LFwiLi9Mb2NhdGlvblwiOjI5LFwiLi9OYXZpZ2F0b3JcIjozMSxcIi4vU2NyZWVuXCI6MzQsXCIuL1RvdWNoRXZlbnRcIjozNixcIi4vWE1MSHR0cFJlcXVlc3RcIjozNyxcIi4vYXVkaW9Db250ZXh0L0F1ZGlvQ29udGV4dFwiOjQyLFwiLi94bWxkb20vZG9tLXBhcnNlci5qc1wiOjU4fV0sNTg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIERPTVBhcnNlcihvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge1xuICAgIGxvY2F0b3I6IHt9XG4gIH07XG59XG5cbkRPTVBhcnNlci5wcm90b3R5cGUucGFyc2VGcm9tU3RyaW5nID0gZnVuY3Rpb24gKHNvdXJjZSwgbWltZVR5cGUpIHtcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gIHZhciBzYXggPSBuZXcgWE1MUmVhZGVyKCk7XG4gIHZhciBkb21CdWlsZGVyID0gb3B0aW9ucy5kb21CdWlsZGVyIHx8IG5ldyBET01IYW5kbGVyKCk7XG4gIHZhciBlcnJvckhhbmRsZXIgPSBvcHRpb25zLmVycm9ySGFuZGxlcjtcbiAgdmFyIGxvY2F0b3IgPSBvcHRpb25zLmxvY2F0b3I7XG4gIHZhciBkZWZhdWx0TlNNYXAgPSBvcHRpb25zLnhtbG5zIHx8IHt9O1xuICB2YXIgaXNIVE1MID0gL1xcL3g/aHRtbD8kLy50ZXN0KG1pbWVUeXBlKTtcbiAgdmFyIGVudGl0eU1hcCA9IGlzSFRNTCA/IGh0bWxFbnRpdHkuZW50aXR5TWFwIDoge1xuICAgICdsdCc6ICc8JyxcbiAgICAnZ3QnOiAnPicsXG4gICAgJ2FtcCc6ICcmJyxcbiAgICAncXVvdCc6ICdcIicsXG4gICAgJ2Fwb3MnOiBcIidcIlxuICB9O1xuXG4gIGlmIChsb2NhdG9yKSB7XG4gICAgZG9tQnVpbGRlci5zZXREb2N1bWVudExvY2F0b3IobG9jYXRvcik7XG4gIH1cblxuICBzYXguZXJyb3JIYW5kbGVyID0gYnVpbGRFcnJvckhhbmRsZXIoZXJyb3JIYW5kbGVyLCBkb21CdWlsZGVyLCBsb2NhdG9yKTtcbiAgc2F4LmRvbUJ1aWxkZXIgPSBvcHRpb25zLmRvbUJ1aWxkZXIgfHwgZG9tQnVpbGRlcjtcblxuICBpZiAoaXNIVE1MKSB7XG4gICAgZGVmYXVsdE5TTWFwWycnXSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcbiAgfVxuXG4gIGRlZmF1bHROU01hcC54bWwgPSBkZWZhdWx0TlNNYXAueG1sIHx8ICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xuXG4gIGlmIChzb3VyY2UpIHtcbiAgICBzYXgucGFyc2Uoc291cmNlLCBkZWZhdWx0TlNNYXAsIGVudGl0eU1hcCk7XG4gIH0gZWxzZSB7XG4gICAgc2F4LmVycm9ySGFuZGxlci5lcnJvcihcImludmFsaWQgZG9jIHNvdXJjZVwiKTtcbiAgfVxuXG4gIHJldHVybiBkb21CdWlsZGVyLmRvYztcbn07XG5cbmZ1bmN0aW9uIGJ1aWxkRXJyb3JIYW5kbGVyKGVycm9ySW1wbCwgZG9tQnVpbGRlciwgbG9jYXRvcikge1xuICBpZiAoIWVycm9ySW1wbCkge1xuICAgIGlmIChkb21CdWlsZGVyIGluc3RhbmNlb2YgRE9NSGFuZGxlcikge1xuICAgICAgcmV0dXJuIGRvbUJ1aWxkZXI7XG4gICAgfVxuXG4gICAgZXJyb3JJbXBsID0gZG9tQnVpbGRlcjtcbiAgfVxuXG4gIHZhciBlcnJvckhhbmRsZXIgPSB7fTtcbiAgdmFyIGlzQ2FsbGJhY2sgPSBlcnJvckltcGwgaW5zdGFuY2VvZiBGdW5jdGlvbjtcbiAgbG9jYXRvciA9IGxvY2F0b3IgfHwge307XG5cbiAgZnVuY3Rpb24gYnVpbGQoa2V5KSB7XG4gICAgdmFyIGZuID0gZXJyb3JJbXBsW2tleV07XG5cbiAgICBpZiAoIWZuICYmIGlzQ2FsbGJhY2spIHtcbiAgICAgIGZuID0gZXJyb3JJbXBsLmxlbmd0aCA9PSAyID8gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICBlcnJvckltcGwoa2V5LCBtc2cpO1xuICAgICAgfSA6IGVycm9ySW1wbDtcbiAgICB9XG5cbiAgICBlcnJvckhhbmRsZXJba2V5XSA9IGZuICYmIGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgIGZuKCdbeG1sZG9tICcgKyBrZXkgKyAnXVxcdCcgKyBtc2cgKyBfbG9jYXRvcihsb2NhdG9yKSk7XG4gICAgfSB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgfVxuXG4gIGJ1aWxkKCd3YXJuaW5nJyk7XG4gIGJ1aWxkKCdlcnJvcicpO1xuICBidWlsZCgnZmF0YWxFcnJvcicpO1xuICByZXR1cm4gZXJyb3JIYW5kbGVyO1xufVxuXG5mdW5jdGlvbiBET01IYW5kbGVyKCkge1xuICB0aGlzLmNkYXRhID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHBvc2l0aW9uKGxvY2F0b3IsIG5vZGUpIHtcbiAgbm9kZS5saW5lTnVtYmVyID0gbG9jYXRvci5saW5lTnVtYmVyO1xuICBub2RlLmNvbHVtbk51bWJlciA9IGxvY2F0b3IuY29sdW1uTnVtYmVyO1xufVxuXG5ET01IYW5kbGVyLnByb3RvdHlwZSA9IHtcbiAgc3RhcnREb2N1bWVudDogZnVuY3Rpb24gc3RhcnREb2N1bWVudCgpIHtcbiAgICB0aGlzLmRvYyA9IG5ldyBET01JbXBsZW1lbnRhdGlvbigpLmNyZWF0ZURvY3VtZW50KG51bGwsIG51bGwsIG51bGwpO1xuXG4gICAgaWYgKHRoaXMubG9jYXRvcikge1xuICAgICAgdGhpcy5kb2MuZG9jdW1lbnRVUkkgPSB0aGlzLmxvY2F0b3Iuc3lzdGVtSWQ7XG4gICAgfVxuICB9LFxuICBzdGFydEVsZW1lbnQ6IGZ1bmN0aW9uIHN0YXJ0RWxlbWVudChuYW1lc3BhY2VVUkksIGxvY2FsTmFtZSwgcU5hbWUsIGF0dHJzKSB7XG4gICAgdmFyIGRvYyA9IHRoaXMuZG9jO1xuICAgIHZhciBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxTmFtZSB8fCBsb2NhbE5hbWUpO1xuICAgIHZhciBsZW4gPSBhdHRycy5sZW5ndGg7XG4gICAgYXBwZW5kRWxlbWVudCh0aGlzLCBlbCk7XG4gICAgdGhpcy5jdXJyZW50RWxlbWVudCA9IGVsO1xuICAgIHRoaXMubG9jYXRvciAmJiBwb3NpdGlvbih0aGlzLmxvY2F0b3IsIGVsKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBuYW1lc3BhY2VVUkkgPSBhdHRycy5nZXRVUkkoaSk7XG4gICAgICB2YXIgdmFsdWUgPSBhdHRycy5nZXRWYWx1ZShpKTtcbiAgICAgIHZhciBxTmFtZSA9IGF0dHJzLmdldFFOYW1lKGkpO1xuICAgICAgdmFyIGF0dHIgPSBkb2MuY3JlYXRlQXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBxTmFtZSk7XG4gICAgICB0aGlzLmxvY2F0b3IgJiYgcG9zaXRpb24oYXR0cnMuZ2V0TG9jYXRvcihpKSwgYXR0cik7XG4gICAgICBhdHRyLnZhbHVlID0gYXR0ci5ub2RlVmFsdWUgPSB2YWx1ZTtcbiAgICAgIGVsLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XG4gICAgfVxuICB9LFxuICBlbmRFbGVtZW50OiBmdW5jdGlvbiBlbmRFbGVtZW50KG5hbWVzcGFjZVVSSSwgbG9jYWxOYW1lLCBxTmFtZSkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5jdXJyZW50RWxlbWVudDtcbiAgICB2YXIgdGFnTmFtZSA9IGN1cnJlbnQudGFnTmFtZTtcbiAgICB0aGlzLmN1cnJlbnRFbGVtZW50ID0gY3VycmVudC5wYXJlbnROb2RlO1xuICB9LFxuICBzdGFydFByZWZpeE1hcHBpbmc6IGZ1bmN0aW9uIHN0YXJ0UHJlZml4TWFwcGluZyhwcmVmaXgsIHVyaSkge30sXG4gIGVuZFByZWZpeE1hcHBpbmc6IGZ1bmN0aW9uIGVuZFByZWZpeE1hcHBpbmcocHJlZml4KSB7fSxcbiAgcHJvY2Vzc2luZ0luc3RydWN0aW9uOiBmdW5jdGlvbiBwcm9jZXNzaW5nSW5zdHJ1Y3Rpb24odGFyZ2V0LCBkYXRhKSB7XG4gICAgdmFyIGlucyA9IHRoaXMuZG9jLmNyZWF0ZVByb2Nlc3NpbmdJbnN0cnVjdGlvbih0YXJnZXQsIGRhdGEpO1xuICAgIHRoaXMubG9jYXRvciAmJiBwb3NpdGlvbih0aGlzLmxvY2F0b3IsIGlucyk7XG4gICAgYXBwZW5kRWxlbWVudCh0aGlzLCBpbnMpO1xuICB9LFxuICBpZ25vcmFibGVXaGl0ZXNwYWNlOiBmdW5jdGlvbiBpZ25vcmFibGVXaGl0ZXNwYWNlKGNoLCBzdGFydCwgbGVuZ3RoKSB7fSxcbiAgY2hhcmFjdGVyczogZnVuY3Rpb24gY2hhcmFjdGVycyhjaGFycywgc3RhcnQsIGxlbmd0aCkge1xuICAgIGNoYXJzID0gX3RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICBpZiAoY2hhcnMpIHtcbiAgICAgIGlmICh0aGlzLmNkYXRhKSB7XG4gICAgICAgIHZhciBjaGFyTm9kZSA9IHRoaXMuZG9jLmNyZWF0ZUNEQVRBU2VjdGlvbihjaGFycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgY2hhck5vZGUgPSB0aGlzLmRvYy5jcmVhdGVUZXh0Tm9kZShjaGFycyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuY3VycmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hhck5vZGUpO1xuICAgICAgfSBlbHNlIGlmICgvXlxccyokLy50ZXN0KGNoYXJzKSkge1xuICAgICAgICB0aGlzLmRvYy5hcHBlbmRDaGlsZChjaGFyTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubG9jYXRvciAmJiBwb3NpdGlvbih0aGlzLmxvY2F0b3IsIGNoYXJOb2RlKTtcbiAgICB9XG4gIH0sXG4gIHNraXBwZWRFbnRpdHk6IGZ1bmN0aW9uIHNraXBwZWRFbnRpdHkobmFtZSkge30sXG4gIGVuZERvY3VtZW50OiBmdW5jdGlvbiBlbmREb2N1bWVudCgpIHtcbiAgICB0aGlzLmRvYy5ub3JtYWxpemUoKTtcbiAgfSxcbiAgc2V0RG9jdW1lbnRMb2NhdG9yOiBmdW5jdGlvbiBzZXREb2N1bWVudExvY2F0b3IobG9jYXRvcikge1xuICAgIGlmICh0aGlzLmxvY2F0b3IgPSBsb2NhdG9yKSB7XG4gICAgICBsb2NhdG9yLmxpbmVOdW1iZXIgPSAwO1xuICAgIH1cbiAgfSxcbiAgY29tbWVudDogZnVuY3Rpb24gY29tbWVudChjaGFycywgc3RhcnQsIGxlbmd0aCkge1xuICAgIGNoYXJzID0gX3RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdmFyIGNvbW0gPSB0aGlzLmRvYy5jcmVhdGVDb21tZW50KGNoYXJzKTtcbiAgICB0aGlzLmxvY2F0b3IgJiYgcG9zaXRpb24odGhpcy5sb2NhdG9yLCBjb21tKTtcbiAgICBhcHBlbmRFbGVtZW50KHRoaXMsIGNvbW0pO1xuICB9LFxuICBzdGFydENEQVRBOiBmdW5jdGlvbiBzdGFydENEQVRBKCkge1xuICAgIHRoaXMuY2RhdGEgPSB0cnVlO1xuICB9LFxuICBlbmRDREFUQTogZnVuY3Rpb24gZW5kQ0RBVEEoKSB7XG4gICAgdGhpcy5jZGF0YSA9IGZhbHNlO1xuICB9LFxuICBzdGFydERURDogZnVuY3Rpb24gc3RhcnREVEQobmFtZSwgcHVibGljSWQsIHN5c3RlbUlkKSB7XG4gICAgdmFyIGltcGwgPSB0aGlzLmRvYy5pbXBsZW1lbnRhdGlvbjtcblxuICAgIGlmIChpbXBsICYmIGltcGwuY3JlYXRlRG9jdW1lbnRUeXBlKSB7XG4gICAgICB2YXIgZHQgPSBpbXBsLmNyZWF0ZURvY3VtZW50VHlwZShuYW1lLCBwdWJsaWNJZCwgc3lzdGVtSWQpO1xuICAgICAgdGhpcy5sb2NhdG9yICYmIHBvc2l0aW9uKHRoaXMubG9jYXRvciwgZHQpO1xuICAgICAgYXBwZW5kRWxlbWVudCh0aGlzLCBkdCk7XG4gICAgfVxuICB9LFxuICB3YXJuaW5nOiBmdW5jdGlvbiB3YXJuaW5nKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKCdbeG1sZG9tIHdhcm5pbmddXFx0JyArIGVycm9yLCBfbG9jYXRvcih0aGlzLmxvY2F0b3IpKTtcbiAgfSxcbiAgZXJyb3I6IGZ1bmN0aW9uIGVycm9yKF9lcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1t4bWxkb20gZXJyb3JdXFx0JyArIF9lcnJvciwgX2xvY2F0b3IodGhpcy5sb2NhdG9yKSk7XG4gIH0sXG4gIGZhdGFsRXJyb3I6IGZ1bmN0aW9uIGZhdGFsRXJyb3IoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbeG1sZG9tIGZhdGFsRXJyb3JdXFx0JyArIGVycm9yLCBfbG9jYXRvcih0aGlzLmxvY2F0b3IpKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2xvY2F0b3IobCkge1xuICBpZiAobCkge1xuICAgIHJldHVybiAnXFxuQCcgKyAobC5zeXN0ZW1JZCB8fCAnJykgKyAnI1tsaW5lOicgKyBsLmxpbmVOdW1iZXIgKyAnLGNvbDonICsgbC5jb2x1bW5OdW1iZXIgKyAnXSc7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3RvU3RyaW5nKGNoYXJzLCBzdGFydCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgY2hhcnMgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gY2hhcnMuc3Vic3RyKHN0YXJ0LCBsZW5ndGgpO1xuICB9IGVsc2Uge1xuICAgIGlmIChjaGFycy5sZW5ndGggPj0gc3RhcnQgKyBsZW5ndGggfHwgc3RhcnQpIHtcbiAgICAgIHJldHVybiBuZXcgamF2YS5sYW5nLlN0cmluZyhjaGFycywgc3RhcnQsIGxlbmd0aCkgKyAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhcnM7XG4gIH1cbn1cblxuXCJlbmREVEQsc3RhcnRFbnRpdHksZW5kRW50aXR5LGF0dHJpYnV0ZURlY2wsZWxlbWVudERlY2wsZXh0ZXJuYWxFbnRpdHlEZWNsLGludGVybmFsRW50aXR5RGVjbCxyZXNvbHZlRW50aXR5LGdldEV4dGVybmFsU3Vic2V0LG5vdGF0aW9uRGVjbCx1bnBhcnNlZEVudGl0eURlY2xcIi5yZXBsYWNlKC9cXHcrL2csIGZ1bmN0aW9uIChrZXkpIHtcbiAgRE9NSGFuZGxlci5wcm90b3R5cGVba2V5XSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbn0pO1xuXG5mdW5jdGlvbiBhcHBlbmRFbGVtZW50KGhhbmRlciwgbm9kZSkge1xuICBpZiAoIWhhbmRlci5jdXJyZW50RWxlbWVudCkge1xuICAgIGhhbmRlci5kb2MuYXBwZW5kQ2hpbGQobm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgaGFuZGVyLmN1cnJlbnRFbGVtZW50LmFwcGVuZENoaWxkKG5vZGUpO1xuICB9XG59XG5cbnZhciBodG1sRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdGllcycpO1xuXG52YXIgWE1MUmVhZGVyID0gcmVxdWlyZSgnLi9zYXgnKS5YTUxSZWFkZXI7XG5cbnZhciBET01JbXBsZW1lbnRhdGlvbiA9IGV4cG9ydHMuRE9NSW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2RvbScpLkRPTUltcGxlbWVudGF0aW9uO1xuXG5leHBvcnRzLlhNTFNlcmlhbGl6ZXIgPSByZXF1aXJlKCcuL2RvbScpLlhNTFNlcmlhbGl6ZXI7XG5leHBvcnRzLkRPTVBhcnNlciA9IERPTVBhcnNlcjtcblxufSx7XCIuL2RvbVwiOjU5LFwiLi9lbnRpdGllc1wiOjYwLFwiLi9zYXhcIjo2MX1dLDU5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbmZ1bmN0aW9uIGNvcHkoc3JjLCBkZXN0KSB7XG4gIGZvciAodmFyIHAgaW4gc3JjKSB7XG4gICAgZGVzdFtwXSA9IHNyY1twXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfZXh0ZW5kcyhDbGFzcywgU3VwZXIpIHtcbiAgdmFyIHB0ID0gQ2xhc3MucHJvdG90eXBlO1xuXG4gIGlmICghKHB0IGluc3RhbmNlb2YgU3VwZXIpKSB7XG4gICAgdmFyIHQgPSBmdW5jdGlvbiB0KCkge307XG5cbiAgICA7XG4gICAgdC5wcm90b3R5cGUgPSBTdXBlci5wcm90b3R5cGU7XG4gICAgdCA9IG5ldyB0KCk7XG4gICAgY29weShwdCwgdCk7XG4gICAgQ2xhc3MucHJvdG90eXBlID0gcHQgPSB0O1xuICB9XG5cbiAgaWYgKHB0LmNvbnN0cnVjdG9yICE9IENsYXNzKSB7XG4gICAgaWYgKHR5cGVvZiBDbGFzcyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwidW5rbm93IENsYXNzOlwiICsgQ2xhc3MpO1xuICAgIH1cblxuICAgIHB0LmNvbnN0cnVjdG9yID0gQ2xhc3M7XG4gIH1cbn1cblxudmFyIGh0bWxucyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcbnZhciBOb2RlVHlwZSA9IHt9O1xudmFyIEVMRU1FTlRfTk9ERSA9IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSA9IDE7XG52YXIgQVRUUklCVVRFX05PREUgPSBOb2RlVHlwZS5BVFRSSUJVVEVfTk9ERSA9IDI7XG52YXIgVEVYVF9OT0RFID0gTm9kZVR5cGUuVEVYVF9OT0RFID0gMztcbnZhciBDREFUQV9TRUNUSU9OX05PREUgPSBOb2RlVHlwZS5DREFUQV9TRUNUSU9OX05PREUgPSA0O1xudmFyIEVOVElUWV9SRUZFUkVOQ0VfTk9ERSA9IE5vZGVUeXBlLkVOVElUWV9SRUZFUkVOQ0VfTk9ERSA9IDU7XG52YXIgRU5USVRZX05PREUgPSBOb2RlVHlwZS5FTlRJVFlfTk9ERSA9IDY7XG52YXIgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFID0gTm9kZVR5cGUuUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFID0gNztcbnZhciBDT01NRU5UX05PREUgPSBOb2RlVHlwZS5DT01NRU5UX05PREUgPSA4O1xudmFyIERPQ1VNRU5UX05PREUgPSBOb2RlVHlwZS5ET0NVTUVOVF9OT0RFID0gOTtcbnZhciBET0NVTUVOVF9UWVBFX05PREUgPSBOb2RlVHlwZS5ET0NVTUVOVF9UWVBFX05PREUgPSAxMDtcbnZhciBET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gTm9kZVR5cGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERSA9IDExO1xudmFyIE5PVEFUSU9OX05PREUgPSBOb2RlVHlwZS5OT1RBVElPTl9OT0RFID0gMTI7XG52YXIgRXhjZXB0aW9uQ29kZSA9IHt9O1xudmFyIEV4Y2VwdGlvbk1lc3NhZ2UgPSB7fTtcbnZhciBJTkRFWF9TSVpFX0VSUiA9IEV4Y2VwdGlvbkNvZGUuSU5ERVhfU0laRV9FUlIgPSAoRXhjZXB0aW9uTWVzc2FnZVsxXSA9IFwiSW5kZXggc2l6ZSBlcnJvclwiLCAxKTtcbnZhciBET01TVFJJTkdfU0laRV9FUlIgPSBFeGNlcHRpb25Db2RlLkRPTVNUUklOR19TSVpFX0VSUiA9IChFeGNlcHRpb25NZXNzYWdlWzJdID0gXCJET01TdHJpbmcgc2l6ZSBlcnJvclwiLCAyKTtcbnZhciBISUVSQVJDSFlfUkVRVUVTVF9FUlIgPSBFeGNlcHRpb25Db2RlLkhJRVJBUkNIWV9SRVFVRVNUX0VSUiA9IChFeGNlcHRpb25NZXNzYWdlWzNdID0gXCJIaWVyYXJjaHkgcmVxdWVzdCBlcnJvclwiLCAzKTtcbnZhciBXUk9OR19ET0NVTUVOVF9FUlIgPSBFeGNlcHRpb25Db2RlLldST05HX0RPQ1VNRU5UX0VSUiA9IChFeGNlcHRpb25NZXNzYWdlWzRdID0gXCJXcm9uZyBkb2N1bWVudFwiLCA0KTtcbnZhciBJTlZBTElEX0NIQVJBQ1RFUl9FUlIgPSBFeGNlcHRpb25Db2RlLklOVkFMSURfQ0hBUkFDVEVSX0VSUiA9IChFeGNlcHRpb25NZXNzYWdlWzVdID0gXCJJbnZhbGlkIGNoYXJhY3RlclwiLCA1KTtcbnZhciBOT19EQVRBX0FMTE9XRURfRVJSID0gRXhjZXB0aW9uQ29kZS5OT19EQVRBX0FMTE9XRURfRVJSID0gKEV4Y2VwdGlvbk1lc3NhZ2VbNl0gPSBcIk5vIGRhdGEgYWxsb3dlZFwiLCA2KTtcbnZhciBOT19NT0RJRklDQVRJT05fQUxMT1dFRF9FUlIgPSBFeGNlcHRpb25Db2RlLk5PX01PRElGSUNBVElPTl9BTExPV0VEX0VSUiA9IChFeGNlcHRpb25NZXNzYWdlWzddID0gXCJObyBtb2RpZmljYXRpb24gYWxsb3dlZFwiLCA3KTtcbnZhciBOT1RfRk9VTkRfRVJSID0gRXhjZXB0aW9uQ29kZS5OT1RfRk9VTkRfRVJSID0gKEV4Y2VwdGlvbk1lc3NhZ2VbOF0gPSBcIk5vdCBmb3VuZFwiLCA4KTtcbnZhciBOT1RfU1VQUE9SVEVEX0VSUiA9IEV4Y2VwdGlvbkNvZGUuTk9UX1NVUFBPUlRFRF9FUlIgPSAoRXhjZXB0aW9uTWVzc2FnZVs5XSA9IFwiTm90IHN1cHBvcnRlZFwiLCA5KTtcbnZhciBJTlVTRV9BVFRSSUJVVEVfRVJSID0gRXhjZXB0aW9uQ29kZS5JTlVTRV9BVFRSSUJVVEVfRVJSID0gKEV4Y2VwdGlvbk1lc3NhZ2VbMTBdID0gXCJBdHRyaWJ1dGUgaW4gdXNlXCIsIDEwKTtcbnZhciBJTlZBTElEX1NUQVRFX0VSUiA9IEV4Y2VwdGlvbkNvZGUuSU5WQUxJRF9TVEFURV9FUlIgPSAoRXhjZXB0aW9uTWVzc2FnZVsxMV0gPSBcIkludmFsaWQgc3RhdGVcIiwgMTEpO1xudmFyIFNZTlRBWF9FUlIgPSBFeGNlcHRpb25Db2RlLlNZTlRBWF9FUlIgPSAoRXhjZXB0aW9uTWVzc2FnZVsxMl0gPSBcIlN5bnRheCBlcnJvclwiLCAxMik7XG52YXIgSU5WQUxJRF9NT0RJRklDQVRJT05fRVJSID0gRXhjZXB0aW9uQ29kZS5JTlZBTElEX01PRElGSUNBVElPTl9FUlIgPSAoRXhjZXB0aW9uTWVzc2FnZVsxM10gPSBcIkludmFsaWQgbW9kaWZpY2F0aW9uXCIsIDEzKTtcbnZhciBOQU1FU1BBQ0VfRVJSID0gRXhjZXB0aW9uQ29kZS5OQU1FU1BBQ0VfRVJSID0gKEV4Y2VwdGlvbk1lc3NhZ2VbMTRdID0gXCJJbnZhbGlkIG5hbWVzcGFjZVwiLCAxNCk7XG52YXIgSU5WQUxJRF9BQ0NFU1NfRVJSID0gRXhjZXB0aW9uQ29kZS5JTlZBTElEX0FDQ0VTU19FUlIgPSAoRXhjZXB0aW9uTWVzc2FnZVsxNV0gPSBcIkludmFsaWQgYWNjZXNzXCIsIDE1KTtcblxuZnVuY3Rpb24gRE9NRXhjZXB0aW9uKGNvZGUsIG1lc3NhZ2UpIHtcbiAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIHZhciBlcnJvciA9IG1lc3NhZ2U7XG4gIH0gZWxzZSB7XG4gICAgZXJyb3IgPSB0aGlzO1xuICAgIEVycm9yLmNhbGwodGhpcywgRXhjZXB0aW9uTWVzc2FnZVtjb2RlXSk7XG4gICAgdGhpcy5tZXNzYWdlID0gRXhjZXB0aW9uTWVzc2FnZVtjb2RlXTtcbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIERPTUV4Y2VwdGlvbik7XG4gIH1cblxuICBlcnJvci5jb2RlID0gY29kZTtcbiAgaWYgKG1lc3NhZ2UpIHRoaXMubWVzc2FnZSA9IHRoaXMubWVzc2FnZSArIFwiOiBcIiArIG1lc3NhZ2U7XG4gIHJldHVybiBlcnJvcjtcbn1cblxuO1xuRE9NRXhjZXB0aW9uLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcbmNvcHkoRXhjZXB0aW9uQ29kZSwgRE9NRXhjZXB0aW9uKTtcblxuZnVuY3Rpb24gTm9kZUxpc3QoKSB7fVxuXG47XG5Ob2RlTGlzdC5wcm90b3R5cGUgPSB7XG4gIGxlbmd0aDogMCxcbiAgaXRlbTogZnVuY3Rpb24gaXRlbShpbmRleCkge1xuICAgIHJldHVybiB0aGlzW2luZGV4XSB8fCBudWxsO1xuICB9LFxuICB0b1N0cmluZzogZnVuY3Rpb24gdG9TdHJpbmcoaXNIVE1MLCBub2RlRmlsdGVyKSB7XG4gICAgZm9yICh2YXIgYnVmID0gW10sIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgc2VyaWFsaXplVG9TdHJpbmcodGhpc1tpXSwgYnVmLCBpc0hUTUwsIG5vZGVGaWx0ZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIExpdmVOb2RlTGlzdChub2RlLCByZWZyZXNoKSB7XG4gIHRoaXMuX25vZGUgPSBub2RlO1xuICB0aGlzLl9yZWZyZXNoID0gcmVmcmVzaDtcblxuICBfdXBkYXRlTGl2ZUxpc3QodGhpcyk7XG59XG5cbmZ1bmN0aW9uIF91cGRhdGVMaXZlTGlzdChsaXN0KSB7XG4gIHZhciBpbmMgPSBsaXN0Ll9ub2RlLl9pbmMgfHwgbGlzdC5fbm9kZS5vd25lckRvY3VtZW50Ll9pbmM7XG5cbiAgaWYgKGxpc3QuX2luYyAhPSBpbmMpIHtcbiAgICB2YXIgbHMgPSBsaXN0Ll9yZWZyZXNoKGxpc3QuX25vZGUpO1xuXG4gICAgX19zZXRfXyhsaXN0LCAnbGVuZ3RoJywgbHMubGVuZ3RoKTtcblxuICAgIGNvcHkobHMsIGxpc3QpO1xuICAgIGxpc3QuX2luYyA9IGluYztcbiAgfVxufVxuXG5MaXZlTm9kZUxpc3QucHJvdG90eXBlLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuICBfdXBkYXRlTGl2ZUxpc3QodGhpcyk7XG5cbiAgcmV0dXJuIHRoaXNbaV07XG59O1xuXG5fZXh0ZW5kcyhMaXZlTm9kZUxpc3QsIE5vZGVMaXN0KTtcblxuZnVuY3Rpb24gTmFtZWROb2RlTWFwKCkge31cblxuO1xuXG5mdW5jdGlvbiBfZmluZE5vZGVJbmRleChsaXN0LCBub2RlKSB7XG4gIHZhciBpID0gbGlzdC5sZW5ndGg7XG5cbiAgd2hpbGUgKGktLSkge1xuICAgIGlmIChsaXN0W2ldID09PSBub2RlKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX2FkZE5hbWVkTm9kZShlbCwgbGlzdCwgbmV3QXR0ciwgb2xkQXR0cikge1xuICBpZiAob2xkQXR0cikge1xuICAgIGxpc3RbX2ZpbmROb2RlSW5kZXgobGlzdCwgb2xkQXR0cildID0gbmV3QXR0cjtcbiAgfSBlbHNlIHtcbiAgICBsaXN0W2xpc3QubGVuZ3RoKytdID0gbmV3QXR0cjtcbiAgfVxuXG4gIGlmIChlbCkge1xuICAgIG5ld0F0dHIub3duZXJFbGVtZW50ID0gZWw7XG4gICAgdmFyIGRvYyA9IGVsLm93bmVyRG9jdW1lbnQ7XG5cbiAgICBpZiAoZG9jKSB7XG4gICAgICBvbGRBdHRyICYmIF9vblJlbW92ZUF0dHJpYnV0ZShkb2MsIGVsLCBvbGRBdHRyKTtcblxuICAgICAgX29uQWRkQXR0cmlidXRlKGRvYywgZWwsIG5ld0F0dHIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVtb3ZlTmFtZWROb2RlKGVsLCBsaXN0LCBhdHRyKSB7XG4gIHZhciBpID0gX2ZpbmROb2RlSW5kZXgobGlzdCwgYXR0cik7XG5cbiAgaWYgKGkgPj0gMCkge1xuICAgIHZhciBsYXN0SW5kZXggPSBsaXN0Lmxlbmd0aCAtIDE7XG5cbiAgICB3aGlsZSAoaSA8IGxhc3RJbmRleCkge1xuICAgICAgbGlzdFtpXSA9IGxpc3RbKytpXTtcbiAgICB9XG5cbiAgICBsaXN0Lmxlbmd0aCA9IGxhc3RJbmRleDtcblxuICAgIGlmIChlbCkge1xuICAgICAgdmFyIGRvYyA9IGVsLm93bmVyRG9jdW1lbnQ7XG5cbiAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgX29uUmVtb3ZlQXR0cmlidXRlKGRvYywgZWwsIGF0dHIpO1xuXG4gICAgICAgIGF0dHIub3duZXJFbGVtZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRE9NRXhjZXB0aW9uKE5PVF9GT1VORF9FUlIsIG5ldyBFcnJvcihlbC50YWdOYW1lICsgJ0AnICsgYXR0cikpO1xuICB9XG59XG5cbk5hbWVkTm9kZU1hcC5wcm90b3R5cGUgPSB7XG4gIGxlbmd0aDogMCxcbiAgaXRlbTogTm9kZUxpc3QucHJvdG90eXBlLml0ZW0sXG4gIGdldE5hbWVkSXRlbTogZnVuY3Rpb24gZ2V0TmFtZWRJdGVtKGtleSkge1xuICAgIHZhciBpID0gdGhpcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB2YXIgYXR0ciA9IHRoaXNbaV07XG5cbiAgICAgIGlmIChhdHRyLm5vZGVOYW1lID09IGtleSkge1xuICAgICAgICByZXR1cm4gYXR0cjtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHNldE5hbWVkSXRlbTogZnVuY3Rpb24gc2V0TmFtZWRJdGVtKGF0dHIpIHtcbiAgICB2YXIgZWwgPSBhdHRyLm93bmVyRWxlbWVudDtcblxuICAgIGlmIChlbCAmJiBlbCAhPSB0aGlzLl9vd25lckVsZW1lbnQpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oSU5VU0VfQVRUUklCVVRFX0VSUik7XG4gICAgfVxuXG4gICAgdmFyIG9sZEF0dHIgPSB0aGlzLmdldE5hbWVkSXRlbShhdHRyLm5vZGVOYW1lKTtcblxuICAgIF9hZGROYW1lZE5vZGUodGhpcy5fb3duZXJFbGVtZW50LCB0aGlzLCBhdHRyLCBvbGRBdHRyKTtcblxuICAgIHJldHVybiBvbGRBdHRyO1xuICB9LFxuICBzZXROYW1lZEl0ZW1OUzogZnVuY3Rpb24gc2V0TmFtZWRJdGVtTlMoYXR0cikge1xuICAgIHZhciBlbCA9IGF0dHIub3duZXJFbGVtZW50LFxuICAgICAgICBvbGRBdHRyO1xuXG4gICAgaWYgKGVsICYmIGVsICE9IHRoaXMuX293bmVyRWxlbWVudCkge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihJTlVTRV9BVFRSSUJVVEVfRVJSKTtcbiAgICB9XG5cbiAgICBvbGRBdHRyID0gdGhpcy5nZXROYW1lZEl0ZW1OUyhhdHRyLm5hbWVzcGFjZVVSSSwgYXR0ci5sb2NhbE5hbWUpO1xuXG4gICAgX2FkZE5hbWVkTm9kZSh0aGlzLl9vd25lckVsZW1lbnQsIHRoaXMsIGF0dHIsIG9sZEF0dHIpO1xuXG4gICAgcmV0dXJuIG9sZEF0dHI7XG4gIH0sXG4gIHJlbW92ZU5hbWVkSXRlbTogZnVuY3Rpb24gcmVtb3ZlTmFtZWRJdGVtKGtleSkge1xuICAgIHZhciBhdHRyID0gdGhpcy5nZXROYW1lZEl0ZW0oa2V5KTtcblxuICAgIF9yZW1vdmVOYW1lZE5vZGUodGhpcy5fb3duZXJFbGVtZW50LCB0aGlzLCBhdHRyKTtcblxuICAgIHJldHVybiBhdHRyO1xuICB9LFxuICByZW1vdmVOYW1lZEl0ZW1OUzogZnVuY3Rpb24gcmVtb3ZlTmFtZWRJdGVtTlMobmFtZXNwYWNlVVJJLCBsb2NhbE5hbWUpIHtcbiAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0TmFtZWRJdGVtTlMobmFtZXNwYWNlVVJJLCBsb2NhbE5hbWUpO1xuXG4gICAgX3JlbW92ZU5hbWVkTm9kZSh0aGlzLl9vd25lckVsZW1lbnQsIHRoaXMsIGF0dHIpO1xuXG4gICAgcmV0dXJuIGF0dHI7XG4gIH0sXG4gIGdldE5hbWVkSXRlbU5TOiBmdW5jdGlvbiBnZXROYW1lZEl0ZW1OUyhuYW1lc3BhY2VVUkksIGxvY2FsTmFtZSkge1xuICAgIHZhciBpID0gdGhpcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXNbaV07XG5cbiAgICAgIGlmIChub2RlLmxvY2FsTmFtZSA9PSBsb2NhbE5hbWUgJiYgbm9kZS5uYW1lc3BhY2VVUkkgPT0gbmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuXG5mdW5jdGlvbiBET01JbXBsZW1lbnRhdGlvbihmZWF0dXJlcykge1xuICB0aGlzLl9mZWF0dXJlcyA9IHt9O1xuXG4gIGlmIChmZWF0dXJlcykge1xuICAgIGZvciAodmFyIGZlYXR1cmUgaW4gZmVhdHVyZXMpIHtcbiAgICAgIHRoaXMuX2ZlYXR1cmVzID0gZmVhdHVyZXNbZmVhdHVyZV07XG4gICAgfVxuICB9XG59XG5cbjtcbkRPTUltcGxlbWVudGF0aW9uLnByb3RvdHlwZSA9IHtcbiAgaGFzRmVhdHVyZTogZnVuY3Rpb24gaGFzRmVhdHVyZShmZWF0dXJlLCB2ZXJzaW9uKSB7XG4gICAgdmFyIHZlcnNpb25zID0gdGhpcy5fZmVhdHVyZXNbZmVhdHVyZS50b0xvd2VyQ2FzZSgpXTtcblxuICAgIGlmICh2ZXJzaW9ucyAmJiAoIXZlcnNpb24gfHwgdmVyc2lvbiBpbiB2ZXJzaW9ucykpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBjcmVhdGVEb2N1bWVudDogZnVuY3Rpb24gY3JlYXRlRG9jdW1lbnQobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lLCBkb2N0eXBlKSB7XG4gICAgdmFyIGRvYyA9IG5ldyBEb2N1bWVudCgpO1xuICAgIGRvYy5pbXBsZW1lbnRhdGlvbiA9IHRoaXM7XG4gICAgZG9jLmNoaWxkTm9kZXMgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICBkb2MuZG9jdHlwZSA9IGRvY3R5cGU7XG5cbiAgICBpZiAoZG9jdHlwZSkge1xuICAgICAgZG9jLmFwcGVuZENoaWxkKGRvY3R5cGUpO1xuICAgIH1cblxuICAgIGlmIChxdWFsaWZpZWROYW1lKSB7XG4gICAgICB2YXIgcm9vdCA9IGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKTtcbiAgICAgIGRvYy5hcHBlbmRDaGlsZChyb290KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZG9jO1xuICB9LFxuICBjcmVhdGVEb2N1bWVudFR5cGU6IGZ1bmN0aW9uIGNyZWF0ZURvY3VtZW50VHlwZShxdWFsaWZpZWROYW1lLCBwdWJsaWNJZCwgc3lzdGVtSWQpIHtcbiAgICB2YXIgbm9kZSA9IG5ldyBEb2N1bWVudFR5cGUoKTtcbiAgICBub2RlLm5hbWUgPSBxdWFsaWZpZWROYW1lO1xuICAgIG5vZGUubm9kZU5hbWUgPSBxdWFsaWZpZWROYW1lO1xuICAgIG5vZGUucHVibGljSWQgPSBwdWJsaWNJZDtcbiAgICBub2RlLnN5c3RlbUlkID0gc3lzdGVtSWQ7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIE5vZGUoKSB7fVxuXG47XG5Ob2RlLnByb3RvdHlwZSA9IHtcbiAgZmlyc3RDaGlsZDogbnVsbCxcbiAgbGFzdENoaWxkOiBudWxsLFxuICBwcmV2aW91c1NpYmxpbmc6IG51bGwsXG4gIG5leHRTaWJsaW5nOiBudWxsLFxuICBhdHRyaWJ1dGVzOiBudWxsLFxuICBwYXJlbnROb2RlOiBudWxsLFxuICBjaGlsZE5vZGVzOiBudWxsLFxuICBvd25lckRvY3VtZW50OiBudWxsLFxuICBub2RlVmFsdWU6IG51bGwsXG4gIG5hbWVzcGFjZVVSSTogbnVsbCxcbiAgcHJlZml4OiBudWxsLFxuICBsb2NhbE5hbWU6IG51bGwsXG4gIGluc2VydEJlZm9yZTogZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKG5ld0NoaWxkLCByZWZDaGlsZCkge1xuICAgIHJldHVybiBfaW5zZXJ0QmVmb3JlKHRoaXMsIG5ld0NoaWxkLCByZWZDaGlsZCk7XG4gIH0sXG4gIHJlcGxhY2VDaGlsZDogZnVuY3Rpb24gcmVwbGFjZUNoaWxkKG5ld0NoaWxkLCBvbGRDaGlsZCkge1xuICAgIHRoaXMuaW5zZXJ0QmVmb3JlKG5ld0NoaWxkLCBvbGRDaGlsZCk7XG5cbiAgICBpZiAob2xkQ2hpbGQpIHtcbiAgICAgIHRoaXMucmVtb3ZlQ2hpbGQob2xkQ2hpbGQpO1xuICAgIH1cbiAgfSxcbiAgcmVtb3ZlQ2hpbGQ6IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKG9sZENoaWxkKSB7XG4gICAgcmV0dXJuIF9yZW1vdmVDaGlsZCh0aGlzLCBvbGRDaGlsZCk7XG4gIH0sXG4gIGFwcGVuZENoaWxkOiBmdW5jdGlvbiBhcHBlbmRDaGlsZChuZXdDaGlsZCkge1xuICAgIHJldHVybiB0aGlzLmluc2VydEJlZm9yZShuZXdDaGlsZCwgbnVsbCk7XG4gIH0sXG4gIGhhc0NoaWxkTm9kZXM6IGZ1bmN0aW9uIGhhc0NoaWxkTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmlyc3RDaGlsZCAhPSBudWxsO1xuICB9LFxuICBjbG9uZU5vZGU6IGZ1bmN0aW9uIGNsb25lTm9kZShkZWVwKSB7XG4gICAgcmV0dXJuIF9jbG9uZU5vZGUodGhpcy5vd25lckRvY3VtZW50IHx8IHRoaXMsIHRoaXMsIGRlZXApO1xuICB9LFxuICBub3JtYWxpemU6IGZ1bmN0aW9uIG5vcm1hbGl6ZSgpIHtcbiAgICB2YXIgY2hpbGQgPSB0aGlzLmZpcnN0Q2hpbGQ7XG5cbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIHZhciBuZXh0ID0gY2hpbGQubmV4dFNpYmxpbmc7XG5cbiAgICAgIGlmIChuZXh0ICYmIG5leHQubm9kZVR5cGUgPT0gVEVYVF9OT0RFICYmIGNoaWxkLm5vZGVUeXBlID09IFRFWFRfTk9ERSkge1xuICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKG5leHQpO1xuICAgICAgICBjaGlsZC5hcHBlbmREYXRhKG5leHQuZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGlsZC5ub3JtYWxpemUoKTtcbiAgICAgICAgY2hpbGQgPSBuZXh0O1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgaXNTdXBwb3J0ZWQ6IGZ1bmN0aW9uIGlzU3VwcG9ydGVkKGZlYXR1cmUsIHZlcnNpb24pIHtcbiAgICByZXR1cm4gdGhpcy5vd25lckRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoZmVhdHVyZSwgdmVyc2lvbik7XG4gIH0sXG4gIGhhc0F0dHJpYnV0ZXM6IGZ1bmN0aW9uIGhhc0F0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5sZW5ndGggPiAwO1xuICB9LFxuICBsb29rdXBQcmVmaXg6IGZ1bmN0aW9uIGxvb2t1cFByZWZpeChuYW1lc3BhY2VVUkkpIHtcbiAgICB2YXIgZWwgPSB0aGlzO1xuXG4gICAgd2hpbGUgKGVsKSB7XG4gICAgICB2YXIgbWFwID0gZWwuX25zTWFwO1xuXG4gICAgICBpZiAobWFwKSB7XG4gICAgICAgIGZvciAodmFyIG4gaW4gbWFwKSB7XG4gICAgICAgICAgaWYgKG1hcFtuXSA9PSBuYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlbCA9IGVsLm5vZGVUeXBlID09IEFUVFJJQlVURV9OT0RFID8gZWwub3duZXJEb2N1bWVudCA6IGVsLnBhcmVudE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGxvb2t1cE5hbWVzcGFjZVVSSTogZnVuY3Rpb24gbG9va3VwTmFtZXNwYWNlVVJJKHByZWZpeCkge1xuICAgIHZhciBlbCA9IHRoaXM7XG5cbiAgICB3aGlsZSAoZWwpIHtcbiAgICAgIHZhciBtYXAgPSBlbC5fbnNNYXA7XG5cbiAgICAgIGlmIChtYXApIHtcbiAgICAgICAgaWYgKHByZWZpeCBpbiBtYXApIHtcbiAgICAgICAgICByZXR1cm4gbWFwW3ByZWZpeF07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZWwgPSBlbC5ub2RlVHlwZSA9PSBBVFRSSUJVVEVfTk9ERSA/IGVsLm93bmVyRG9jdW1lbnQgOiBlbC5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9LFxuICBpc0RlZmF1bHROYW1lc3BhY2U6IGZ1bmN0aW9uIGlzRGVmYXVsdE5hbWVzcGFjZShuYW1lc3BhY2VVUkkpIHtcbiAgICB2YXIgcHJlZml4ID0gdGhpcy5sb29rdXBQcmVmaXgobmFtZXNwYWNlVVJJKTtcbiAgICByZXR1cm4gcHJlZml4ID09IG51bGw7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF94bWxFbmNvZGVyKGMpIHtcbiAgcmV0dXJuIGMgPT0gJzwnICYmICcmbHQ7JyB8fCBjID09ICc+JyAmJiAnJmd0OycgfHwgYyA9PSAnJicgJiYgJyZhbXA7JyB8fCBjID09ICdcIicgJiYgJyZxdW90OycgfHwgJyYjJyArIGMuY2hhckNvZGVBdCgpICsgJzsnO1xufVxuXG5jb3B5KE5vZGVUeXBlLCBOb2RlKTtcbmNvcHkoTm9kZVR5cGUsIE5vZGUucHJvdG90eXBlKTtcblxuZnVuY3Rpb24gX3Zpc2l0Tm9kZShub2RlLCBjYWxsYmFjaykge1xuICBpZiAoY2FsbGJhY2sobm9kZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChub2RlID0gbm9kZS5maXJzdENoaWxkKSB7XG4gICAgZG8ge1xuICAgICAgaWYgKF92aXNpdE5vZGUobm9kZSwgY2FsbGJhY2spKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gd2hpbGUgKG5vZGUgPSBub2RlLm5leHRTaWJsaW5nKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBEb2N1bWVudCgpIHt9XG5cbmZ1bmN0aW9uIF9vbkFkZEF0dHJpYnV0ZShkb2MsIGVsLCBuZXdBdHRyKSB7XG4gIGRvYyAmJiBkb2MuX2luYysrO1xuICB2YXIgbnMgPSBuZXdBdHRyLm5hbWVzcGFjZVVSSTtcblxuICBpZiAobnMgPT0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvJykge1xuICAgIGVsLl9uc01hcFtuZXdBdHRyLnByZWZpeCA/IG5ld0F0dHIubG9jYWxOYW1lIDogJyddID0gbmV3QXR0ci52YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfb25SZW1vdmVBdHRyaWJ1dGUoZG9jLCBlbCwgbmV3QXR0ciwgcmVtb3ZlKSB7XG4gIGRvYyAmJiBkb2MuX2luYysrO1xuICB2YXIgbnMgPSBuZXdBdHRyLm5hbWVzcGFjZVVSSTtcblxuICBpZiAobnMgPT0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvJykge1xuICAgIGRlbGV0ZSBlbC5fbnNNYXBbbmV3QXR0ci5wcmVmaXggPyBuZXdBdHRyLmxvY2FsTmFtZSA6ICcnXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfb25VcGRhdGVDaGlsZChkb2MsIGVsLCBuZXdDaGlsZCkge1xuICBpZiAoZG9jICYmIGRvYy5faW5jKSB7XG4gICAgZG9jLl9pbmMrKztcbiAgICB2YXIgY3MgPSBlbC5jaGlsZE5vZGVzO1xuXG4gICAgaWYgKG5ld0NoaWxkKSB7XG4gICAgICBjc1tjcy5sZW5ndGgrK10gPSBuZXdDaGlsZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNoaWxkID0gZWwuZmlyc3RDaGlsZDtcbiAgICAgIHZhciBpID0gMDtcblxuICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgIGNzW2krK10gPSBjaGlsZDtcbiAgICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICAgIH1cblxuICAgICAgY3MubGVuZ3RoID0gaTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX3JlbW92ZUNoaWxkKHBhcmVudE5vZGUsIGNoaWxkKSB7XG4gIHZhciBwcmV2aW91cyA9IGNoaWxkLnByZXZpb3VzU2libGluZztcbiAgdmFyIG5leHQgPSBjaGlsZC5uZXh0U2libGluZztcblxuICBpZiAocHJldmlvdXMpIHtcbiAgICBwcmV2aW91cy5uZXh0U2libGluZyA9IG5leHQ7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Tm9kZS5maXJzdENoaWxkID0gbmV4dDtcbiAgfVxuXG4gIGlmIChuZXh0KSB7XG4gICAgbmV4dC5wcmV2aW91c1NpYmxpbmcgPSBwcmV2aW91cztcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnROb2RlLmxhc3RDaGlsZCA9IHByZXZpb3VzO1xuICB9XG5cbiAgX29uVXBkYXRlQ2hpbGQocGFyZW50Tm9kZS5vd25lckRvY3VtZW50LCBwYXJlbnROb2RlKTtcblxuICByZXR1cm4gY2hpbGQ7XG59XG5cbmZ1bmN0aW9uIF9pbnNlcnRCZWZvcmUocGFyZW50Tm9kZSwgbmV3Q2hpbGQsIG5leHRDaGlsZCkge1xuICB2YXIgY3AgPSBuZXdDaGlsZC5wYXJlbnROb2RlO1xuXG4gIGlmIChjcCkge1xuICAgIGNwLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgfVxuXG4gIGlmIChuZXdDaGlsZC5ub2RlVHlwZSA9PT0gRE9DVU1FTlRfRlJBR01FTlRfTk9ERSkge1xuICAgIHZhciBuZXdGaXJzdCA9IG5ld0NoaWxkLmZpcnN0Q2hpbGQ7XG5cbiAgICBpZiAobmV3Rmlyc3QgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5ld0NoaWxkO1xuICAgIH1cblxuICAgIHZhciBuZXdMYXN0ID0gbmV3Q2hpbGQubGFzdENoaWxkO1xuICB9IGVsc2Uge1xuICAgIG5ld0ZpcnN0ID0gbmV3TGFzdCA9IG5ld0NoaWxkO1xuICB9XG5cbiAgdmFyIHByZSA9IG5leHRDaGlsZCA/IG5leHRDaGlsZC5wcmV2aW91c1NpYmxpbmcgOiBwYXJlbnROb2RlLmxhc3RDaGlsZDtcbiAgbmV3Rmlyc3QucHJldmlvdXNTaWJsaW5nID0gcHJlO1xuICBuZXdMYXN0Lm5leHRTaWJsaW5nID0gbmV4dENoaWxkO1xuXG4gIGlmIChwcmUpIHtcbiAgICBwcmUubmV4dFNpYmxpbmcgPSBuZXdGaXJzdDtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnROb2RlLmZpcnN0Q2hpbGQgPSBuZXdGaXJzdDtcbiAgfVxuXG4gIGlmIChuZXh0Q2hpbGQgPT0gbnVsbCkge1xuICAgIHBhcmVudE5vZGUubGFzdENoaWxkID0gbmV3TGFzdDtcbiAgfSBlbHNlIHtcbiAgICBuZXh0Q2hpbGQucHJldmlvdXNTaWJsaW5nID0gbmV3TGFzdDtcbiAgfVxuXG4gIGRvIHtcbiAgICBuZXdGaXJzdC5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgfSB3aGlsZSAobmV3Rmlyc3QgIT09IG5ld0xhc3QgJiYgKG5ld0ZpcnN0ID0gbmV3Rmlyc3QubmV4dFNpYmxpbmcpKTtcblxuICBfb25VcGRhdGVDaGlsZChwYXJlbnROb2RlLm93bmVyRG9jdW1lbnQgfHwgcGFyZW50Tm9kZSwgcGFyZW50Tm9kZSk7XG5cbiAgaWYgKG5ld0NoaWxkLm5vZGVUeXBlID09IERPQ1VNRU5UX0ZSQUdNRU5UX05PREUpIHtcbiAgICBuZXdDaGlsZC5maXJzdENoaWxkID0gbmV3Q2hpbGQubGFzdENoaWxkID0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBuZXdDaGlsZDtcbn1cblxuZnVuY3Rpb24gX2FwcGVuZFNpbmdsZUNoaWxkKHBhcmVudE5vZGUsIG5ld0NoaWxkKSB7XG4gIHZhciBjcCA9IG5ld0NoaWxkLnBhcmVudE5vZGU7XG5cbiAgaWYgKGNwKSB7XG4gICAgdmFyIHByZSA9IHBhcmVudE5vZGUubGFzdENoaWxkO1xuICAgIGNwLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICB2YXIgcHJlID0gcGFyZW50Tm9kZS5sYXN0Q2hpbGQ7XG4gIH1cblxuICB2YXIgcHJlID0gcGFyZW50Tm9kZS5sYXN0Q2hpbGQ7XG4gIG5ld0NoaWxkLnBhcmVudE5vZGUgPSBwYXJlbnROb2RlO1xuICBuZXdDaGlsZC5wcmV2aW91c1NpYmxpbmcgPSBwcmU7XG4gIG5ld0NoaWxkLm5leHRTaWJsaW5nID0gbnVsbDtcblxuICBpZiAocHJlKSB7XG4gICAgcHJlLm5leHRTaWJsaW5nID0gbmV3Q2hpbGQ7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Tm9kZS5maXJzdENoaWxkID0gbmV3Q2hpbGQ7XG4gIH1cblxuICBwYXJlbnROb2RlLmxhc3RDaGlsZCA9IG5ld0NoaWxkO1xuXG4gIF9vblVwZGF0ZUNoaWxkKHBhcmVudE5vZGUub3duZXJEb2N1bWVudCwgcGFyZW50Tm9kZSwgbmV3Q2hpbGQpO1xuXG4gIHJldHVybiBuZXdDaGlsZDtcbn1cblxuRG9jdW1lbnQucHJvdG90eXBlID0ge1xuICBub2RlTmFtZTogJyNkb2N1bWVudCcsXG4gIG5vZGVUeXBlOiBET0NVTUVOVF9OT0RFLFxuICBkb2N0eXBlOiBudWxsLFxuICBkb2N1bWVudEVsZW1lbnQ6IG51bGwsXG4gIF9pbmM6IDEsXG4gIGluc2VydEJlZm9yZTogZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKG5ld0NoaWxkLCByZWZDaGlsZCkge1xuICAgIGlmIChuZXdDaGlsZC5ub2RlVHlwZSA9PSBET0NVTUVOVF9GUkFHTUVOVF9OT0RFKSB7XG4gICAgICB2YXIgY2hpbGQgPSBuZXdDaGlsZC5maXJzdENoaWxkO1xuXG4gICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgdmFyIG5leHQgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgdGhpcy5pbnNlcnRCZWZvcmUoY2hpbGQsIHJlZkNoaWxkKTtcbiAgICAgICAgY2hpbGQgPSBuZXh0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3Q2hpbGQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZG9jdW1lbnRFbGVtZW50ID09IG51bGwgJiYgbmV3Q2hpbGQubm9kZVR5cGUgPT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICB0aGlzLmRvY3VtZW50RWxlbWVudCA9IG5ld0NoaWxkO1xuICAgIH1cblxuICAgIHJldHVybiBfaW5zZXJ0QmVmb3JlKHRoaXMsIG5ld0NoaWxkLCByZWZDaGlsZCksIG5ld0NoaWxkLm93bmVyRG9jdW1lbnQgPSB0aGlzLCBuZXdDaGlsZDtcbiAgfSxcbiAgcmVtb3ZlQ2hpbGQ6IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKG9sZENoaWxkKSB7XG4gICAgaWYgKHRoaXMuZG9jdW1lbnRFbGVtZW50ID09IG9sZENoaWxkKSB7XG4gICAgICB0aGlzLmRvY3VtZW50RWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9yZW1vdmVDaGlsZCh0aGlzLCBvbGRDaGlsZCk7XG4gIH0sXG4gIGltcG9ydE5vZGU6IGZ1bmN0aW9uIGltcG9ydE5vZGUoaW1wb3J0ZWROb2RlLCBkZWVwKSB7XG4gICAgcmV0dXJuIF9pbXBvcnROb2RlKHRoaXMsIGltcG9ydGVkTm9kZSwgZGVlcCk7XG4gIH0sXG4gIGdldEVsZW1lbnRCeUlkOiBmdW5jdGlvbiBnZXRFbGVtZW50QnlJZChpZCkge1xuICAgIHZhciBydHYgPSBudWxsO1xuXG4gICAgX3Zpc2l0Tm9kZSh0aGlzLmRvY3VtZW50RWxlbWVudCwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoJ2lkJykgPT0gaWQpIHtcbiAgICAgICAgICBydHYgPSBub2RlO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcnR2O1xuICB9LFxuICBjcmVhdGVFbGVtZW50OiBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZ05hbWUpIHtcbiAgICB2YXIgbm9kZSA9IG5ldyBFbGVtZW50KCk7XG4gICAgbm9kZS5vd25lckRvY3VtZW50ID0gdGhpcztcbiAgICBub2RlLm5vZGVOYW1lID0gdGFnTmFtZTtcbiAgICBub2RlLnRhZ05hbWUgPSB0YWdOYW1lO1xuICAgIG5vZGUuY2hpbGROb2RlcyA9IG5ldyBOb2RlTGlzdCgpO1xuICAgIHZhciBhdHRycyA9IG5vZGUuYXR0cmlidXRlcyA9IG5ldyBOYW1lZE5vZGVNYXAoKTtcbiAgICBhdHRycy5fb3duZXJFbGVtZW50ID0gbm9kZTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSxcbiAgY3JlYXRlRG9jdW1lbnRGcmFnbWVudDogZnVuY3Rpb24gY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpIHtcbiAgICB2YXIgbm9kZSA9IG5ldyBEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgbm9kZS5vd25lckRvY3VtZW50ID0gdGhpcztcbiAgICBub2RlLmNoaWxkTm9kZXMgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSxcbiAgY3JlYXRlVGV4dE5vZGU6IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKGRhdGEpIHtcbiAgICB2YXIgbm9kZSA9IG5ldyBUZXh0KCk7XG4gICAgbm9kZS5vd25lckRvY3VtZW50ID0gdGhpcztcbiAgICBub2RlLmFwcGVuZERhdGEoZGF0YSk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH0sXG4gIGNyZWF0ZUNvbW1lbnQ6IGZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQoZGF0YSkge1xuICAgIHZhciBub2RlID0gbmV3IENvbW1lbnQoKTtcbiAgICBub2RlLm93bmVyRG9jdW1lbnQgPSB0aGlzO1xuICAgIG5vZGUuYXBwZW5kRGF0YShkYXRhKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSxcbiAgY3JlYXRlQ0RBVEFTZWN0aW9uOiBmdW5jdGlvbiBjcmVhdGVDREFUQVNlY3Rpb24oZGF0YSkge1xuICAgIHZhciBub2RlID0gbmV3IENEQVRBU2VjdGlvbigpO1xuICAgIG5vZGUub3duZXJEb2N1bWVudCA9IHRoaXM7XG4gICAgbm9kZS5hcHBlbmREYXRhKGRhdGEpO1xuICAgIHJldHVybiBub2RlO1xuICB9LFxuICBjcmVhdGVQcm9jZXNzaW5nSW5zdHJ1Y3Rpb246IGZ1bmN0aW9uIGNyZWF0ZVByb2Nlc3NpbmdJbnN0cnVjdGlvbih0YXJnZXQsIGRhdGEpIHtcbiAgICB2YXIgbm9kZSA9IG5ldyBQcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oKTtcbiAgICBub2RlLm93bmVyRG9jdW1lbnQgPSB0aGlzO1xuICAgIG5vZGUudGFnTmFtZSA9IG5vZGUudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIG5vZGUubm9kZVZhbHVlID0gbm9kZS5kYXRhID0gZGF0YTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSxcbiAgY3JlYXRlQXR0cmlidXRlOiBmdW5jdGlvbiBjcmVhdGVBdHRyaWJ1dGUobmFtZSkge1xuICAgIHZhciBub2RlID0gbmV3IEF0dHIoKTtcbiAgICBub2RlLm93bmVyRG9jdW1lbnQgPSB0aGlzO1xuICAgIG5vZGUubmFtZSA9IG5hbWU7XG4gICAgbm9kZS5ub2RlTmFtZSA9IG5hbWU7XG4gICAgbm9kZS5sb2NhbE5hbWUgPSBuYW1lO1xuICAgIG5vZGUuc3BlY2lmaWVkID0gdHJ1ZTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSxcbiAgY3JlYXRlRW50aXR5UmVmZXJlbmNlOiBmdW5jdGlvbiBjcmVhdGVFbnRpdHlSZWZlcmVuY2UobmFtZSkge1xuICAgIHZhciBub2RlID0gbmV3IEVudGl0eVJlZmVyZW5jZSgpO1xuICAgIG5vZGUub3duZXJEb2N1bWVudCA9IHRoaXM7XG4gICAgbm9kZS5ub2RlTmFtZSA9IG5hbWU7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH0sXG4gIGNyZWF0ZUVsZW1lbnROUzogZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSkge1xuICAgIHZhciBub2RlID0gbmV3IEVsZW1lbnQoKTtcbiAgICB2YXIgcGwgPSBxdWFsaWZpZWROYW1lLnNwbGl0KCc6Jyk7XG4gICAgdmFyIGF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzID0gbmV3IE5hbWVkTm9kZU1hcCgpO1xuICAgIG5vZGUuY2hpbGROb2RlcyA9IG5ldyBOb2RlTGlzdCgpO1xuICAgIG5vZGUub3duZXJEb2N1bWVudCA9IHRoaXM7XG4gICAgbm9kZS5ub2RlTmFtZSA9IHF1YWxpZmllZE5hbWU7XG4gICAgbm9kZS50YWdOYW1lID0gcXVhbGlmaWVkTmFtZTtcbiAgICBub2RlLm5hbWVzcGFjZVVSSSA9IG5hbWVzcGFjZVVSSTtcblxuICAgIGlmIChwbC5sZW5ndGggPT0gMikge1xuICAgICAgbm9kZS5wcmVmaXggPSBwbFswXTtcbiAgICAgIG5vZGUubG9jYWxOYW1lID0gcGxbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUubG9jYWxOYW1lID0gcXVhbGlmaWVkTmFtZTtcbiAgICB9XG5cbiAgICBhdHRycy5fb3duZXJFbGVtZW50ID0gbm9kZTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfSxcbiAgY3JlYXRlQXR0cmlidXRlTlM6IGZ1bmN0aW9uIGNyZWF0ZUF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSkge1xuICAgIHZhciBub2RlID0gbmV3IEF0dHIoKTtcbiAgICB2YXIgcGwgPSBxdWFsaWZpZWROYW1lLnNwbGl0KCc6Jyk7XG4gICAgbm9kZS5vd25lckRvY3VtZW50ID0gdGhpcztcbiAgICBub2RlLm5vZGVOYW1lID0gcXVhbGlmaWVkTmFtZTtcbiAgICBub2RlLm5hbWUgPSBxdWFsaWZpZWROYW1lO1xuICAgIG5vZGUubmFtZXNwYWNlVVJJID0gbmFtZXNwYWNlVVJJO1xuICAgIG5vZGUuc3BlY2lmaWVkID0gdHJ1ZTtcblxuICAgIGlmIChwbC5sZW5ndGggPT0gMikge1xuICAgICAgbm9kZS5wcmVmaXggPSBwbFswXTtcbiAgICAgIG5vZGUubG9jYWxOYW1lID0gcGxbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUubG9jYWxOYW1lID0gcXVhbGlmaWVkTmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxufTtcblxuX2V4dGVuZHMoRG9jdW1lbnQsIE5vZGUpO1xuXG5mdW5jdGlvbiBFbGVtZW50KCkge1xuICB0aGlzLl9uc01hcCA9IHt9O1xufVxuXG47XG5FbGVtZW50LnByb3RvdHlwZSA9IHtcbiAgbm9kZVR5cGU6IEVMRU1FTlRfTk9ERSxcbiAgaGFzQXR0cmlidXRlOiBmdW5jdGlvbiBoYXNBdHRyaWJ1dGUobmFtZSkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZU5vZGUobmFtZSkgIT0gbnVsbDtcbiAgfSxcbiAgZ2V0QXR0cmlidXRlOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGUobmFtZSkge1xuICAgIHZhciBhdHRyID0gdGhpcy5nZXRBdHRyaWJ1dGVOb2RlKG5hbWUpO1xuICAgIHJldHVybiBhdHRyICYmIGF0dHIudmFsdWUgfHwgJyc7XG4gIH0sXG4gIGdldEF0dHJpYnV0ZU5vZGU6IGZ1bmN0aW9uIGdldEF0dHJpYnV0ZU5vZGUobmFtZSkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKG5hbWUpO1xuICB9LFxuICBzZXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBhdHRyID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICBhdHRyLnZhbHVlID0gYXR0ci5ub2RlVmFsdWUgPSBcIlwiICsgdmFsdWU7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xuICB9LFxuICByZW1vdmVBdHRyaWJ1dGU6IGZ1bmN0aW9uIHJlbW92ZUF0dHJpYnV0ZShuYW1lKSB7XG4gICAgdmFyIGF0dHIgPSB0aGlzLmdldEF0dHJpYnV0ZU5vZGUobmFtZSk7XG4gICAgYXR0ciAmJiB0aGlzLnJlbW92ZUF0dHJpYnV0ZU5vZGUoYXR0cik7XG4gIH0sXG4gIGFwcGVuZENoaWxkOiBmdW5jdGlvbiBhcHBlbmRDaGlsZChuZXdDaGlsZCkge1xuICAgIGlmIChuZXdDaGlsZC5ub2RlVHlwZSA9PT0gRE9DVU1FTlRfRlJBR01FTlRfTk9ERSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0QmVmb3JlKG5ld0NoaWxkLCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIF9hcHBlbmRTaW5nbGVDaGlsZCh0aGlzLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9LFxuICBzZXRBdHRyaWJ1dGVOb2RlOiBmdW5jdGlvbiBzZXRBdHRyaWJ1dGVOb2RlKG5ld0F0dHIpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnNldE5hbWVkSXRlbShuZXdBdHRyKTtcbiAgfSxcbiAgc2V0QXR0cmlidXRlTm9kZU5TOiBmdW5jdGlvbiBzZXRBdHRyaWJ1dGVOb2RlTlMobmV3QXR0cikge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuc2V0TmFtZWRJdGVtTlMobmV3QXR0cik7XG4gIH0sXG4gIHJlbW92ZUF0dHJpYnV0ZU5vZGU6IGZ1bmN0aW9uIHJlbW92ZUF0dHJpYnV0ZU5vZGUob2xkQXR0cikge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMucmVtb3ZlTmFtZWRJdGVtKG9sZEF0dHIubm9kZU5hbWUpO1xuICB9LFxuICByZW1vdmVBdHRyaWJ1dGVOUzogZnVuY3Rpb24gcmVtb3ZlQXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBsb2NhbE5hbWUpIHtcbiAgICB2YXIgb2xkID0gdGhpcy5nZXRBdHRyaWJ1dGVOb2RlTlMobmFtZXNwYWNlVVJJLCBsb2NhbE5hbWUpO1xuICAgIG9sZCAmJiB0aGlzLnJlbW92ZUF0dHJpYnV0ZU5vZGUob2xkKTtcbiAgfSxcbiAgaGFzQXR0cmlidXRlTlM6IGZ1bmN0aW9uIGhhc0F0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgbG9jYWxOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlTm9kZU5TKG5hbWVzcGFjZVVSSSwgbG9jYWxOYW1lKSAhPSBudWxsO1xuICB9LFxuICBnZXRBdHRyaWJ1dGVOUzogZnVuY3Rpb24gZ2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBsb2NhbE5hbWUpIHtcbiAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0QXR0cmlidXRlTm9kZU5TKG5hbWVzcGFjZVVSSSwgbG9jYWxOYW1lKTtcbiAgICByZXR1cm4gYXR0ciAmJiBhdHRyLnZhbHVlIHx8ICcnO1xuICB9LFxuICBzZXRBdHRyaWJ1dGVOUzogZnVuY3Rpb24gc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lLCB2YWx1ZSkge1xuICAgIHZhciBhdHRyID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSk7XG4gICAgYXR0ci52YWx1ZSA9IGF0dHIubm9kZVZhbHVlID0gXCJcIiArIHZhbHVlO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcbiAgfSxcbiAgZ2V0QXR0cmlidXRlTm9kZU5TOiBmdW5jdGlvbiBnZXRBdHRyaWJ1dGVOb2RlTlMobmFtZXNwYWNlVVJJLCBsb2NhbE5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbU5TKG5hbWVzcGFjZVVSSSwgbG9jYWxOYW1lKTtcbiAgfSxcbiAgZ2V0RWxlbWVudHNCeVRhZ05hbWU6IGZ1bmN0aW9uIGdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpIHtcbiAgICByZXR1cm4gbmV3IExpdmVOb2RlTGlzdCh0aGlzLCBmdW5jdGlvbiAoYmFzZSkge1xuICAgICAgdmFyIGxzID0gW107XG5cbiAgICAgIF92aXNpdE5vZGUoYmFzZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgIT09IGJhc2UgJiYgbm9kZS5ub2RlVHlwZSA9PSBFTEVNRU5UX05PREUgJiYgKHRhZ05hbWUgPT09ICcqJyB8fCBub2RlLnRhZ05hbWUgPT0gdGFnTmFtZSkpIHtcbiAgICAgICAgICBscy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGxzO1xuICAgIH0pO1xuICB9LFxuICBnZXRFbGVtZW50c0J5VGFnTmFtZU5TOiBmdW5jdGlvbiBnZXRFbGVtZW50c0J5VGFnTmFtZU5TKG5hbWVzcGFjZVVSSSwgbG9jYWxOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBMaXZlTm9kZUxpc3QodGhpcywgZnVuY3Rpb24gKGJhc2UpIHtcbiAgICAgIHZhciBscyA9IFtdO1xuXG4gICAgICBfdmlzaXROb2RlKGJhc2UsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlICE9PSBiYXNlICYmIG5vZGUubm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSAmJiAobmFtZXNwYWNlVVJJID09PSAnKicgfHwgbm9kZS5uYW1lc3BhY2VVUkkgPT09IG5hbWVzcGFjZVVSSSkgJiYgKGxvY2FsTmFtZSA9PT0gJyonIHx8IG5vZGUubG9jYWxOYW1lID09IGxvY2FsTmFtZSkpIHtcbiAgICAgICAgICBscy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGxzO1xuICAgIH0pO1xuICB9XG59O1xuRG9jdW1lbnQucHJvdG90eXBlLmdldEVsZW1lbnRzQnlUYWdOYW1lID0gRWxlbWVudC5wcm90b3R5cGUuZ2V0RWxlbWVudHNCeVRhZ05hbWU7XG5Eb2N1bWVudC5wcm90b3R5cGUuZ2V0RWxlbWVudHNCeVRhZ05hbWVOUyA9IEVsZW1lbnQucHJvdG90eXBlLmdldEVsZW1lbnRzQnlUYWdOYW1lTlM7XG5cbl9leHRlbmRzKEVsZW1lbnQsIE5vZGUpO1xuXG5mdW5jdGlvbiBBdHRyKCkge31cblxuO1xuQXR0ci5wcm90b3R5cGUubm9kZVR5cGUgPSBBVFRSSUJVVEVfTk9ERTtcblxuX2V4dGVuZHMoQXR0ciwgTm9kZSk7XG5cbmZ1bmN0aW9uIENoYXJhY3RlckRhdGEoKSB7fVxuXG47XG5DaGFyYWN0ZXJEYXRhLnByb3RvdHlwZSA9IHtcbiAgZGF0YTogJycsXG4gIHN1YnN0cmluZ0RhdGE6IGZ1bmN0aW9uIHN1YnN0cmluZ0RhdGEob2Zmc2V0LCBjb3VudCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuc3Vic3RyaW5nKG9mZnNldCwgb2Zmc2V0ICsgY291bnQpO1xuICB9LFxuICBhcHBlbmREYXRhOiBmdW5jdGlvbiBhcHBlbmREYXRhKHRleHQpIHtcbiAgICB0ZXh0ID0gdGhpcy5kYXRhICsgdGV4dDtcbiAgICB0aGlzLm5vZGVWYWx1ZSA9IHRoaXMuZGF0YSA9IHRleHQ7XG4gICAgdGhpcy5sZW5ndGggPSB0ZXh0Lmxlbmd0aDtcbiAgfSxcbiAgaW5zZXJ0RGF0YTogZnVuY3Rpb24gaW5zZXJ0RGF0YShvZmZzZXQsIHRleHQpIHtcbiAgICB0aGlzLnJlcGxhY2VEYXRhKG9mZnNldCwgMCwgdGV4dCk7XG4gIH0sXG4gIGFwcGVuZENoaWxkOiBmdW5jdGlvbiBhcHBlbmRDaGlsZChuZXdDaGlsZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihFeGNlcHRpb25NZXNzYWdlW0hJRVJBUkNIWV9SRVFVRVNUX0VSUl0pO1xuICB9LFxuICBkZWxldGVEYXRhOiBmdW5jdGlvbiBkZWxldGVEYXRhKG9mZnNldCwgY291bnQpIHtcbiAgICB0aGlzLnJlcGxhY2VEYXRhKG9mZnNldCwgY291bnQsIFwiXCIpO1xuICB9LFxuICByZXBsYWNlRGF0YTogZnVuY3Rpb24gcmVwbGFjZURhdGEob2Zmc2V0LCBjb3VudCwgdGV4dCkge1xuICAgIHZhciBzdGFydCA9IHRoaXMuZGF0YS5zdWJzdHJpbmcoMCwgb2Zmc2V0KTtcbiAgICB2YXIgZW5kID0gdGhpcy5kYXRhLnN1YnN0cmluZyhvZmZzZXQgKyBjb3VudCk7XG4gICAgdGV4dCA9IHN0YXJ0ICsgdGV4dCArIGVuZDtcbiAgICB0aGlzLm5vZGVWYWx1ZSA9IHRoaXMuZGF0YSA9IHRleHQ7XG4gICAgdGhpcy5sZW5ndGggPSB0ZXh0Lmxlbmd0aDtcbiAgfVxufTtcblxuX2V4dGVuZHMoQ2hhcmFjdGVyRGF0YSwgTm9kZSk7XG5cbmZ1bmN0aW9uIFRleHQoKSB7fVxuXG47XG5UZXh0LnByb3RvdHlwZSA9IHtcbiAgbm9kZU5hbWU6IFwiI3RleHRcIixcbiAgbm9kZVR5cGU6IFRFWFRfTk9ERSxcbiAgc3BsaXRUZXh0OiBmdW5jdGlvbiBzcGxpdFRleHQob2Zmc2V0KSB7XG4gICAgdmFyIHRleHQgPSB0aGlzLmRhdGE7XG4gICAgdmFyIG5ld1RleHQgPSB0ZXh0LnN1YnN0cmluZyhvZmZzZXQpO1xuICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBvZmZzZXQpO1xuICAgIHRoaXMuZGF0YSA9IHRoaXMubm9kZVZhbHVlID0gdGV4dDtcbiAgICB0aGlzLmxlbmd0aCA9IHRleHQubGVuZ3RoO1xuICAgIHZhciBuZXdOb2RlID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5ld1RleHQpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShuZXdOb2RlLCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Tm9kZTtcbiAgfVxufTtcblxuX2V4dGVuZHMoVGV4dCwgQ2hhcmFjdGVyRGF0YSk7XG5cbmZ1bmN0aW9uIENvbW1lbnQoKSB7fVxuXG47XG5Db21tZW50LnByb3RvdHlwZSA9IHtcbiAgbm9kZU5hbWU6IFwiI2NvbW1lbnRcIixcbiAgbm9kZVR5cGU6IENPTU1FTlRfTk9ERVxufTtcblxuX2V4dGVuZHMoQ29tbWVudCwgQ2hhcmFjdGVyRGF0YSk7XG5cbmZ1bmN0aW9uIENEQVRBU2VjdGlvbigpIHt9XG5cbjtcbkNEQVRBU2VjdGlvbi5wcm90b3R5cGUgPSB7XG4gIG5vZGVOYW1lOiBcIiNjZGF0YS1zZWN0aW9uXCIsXG4gIG5vZGVUeXBlOiBDREFUQV9TRUNUSU9OX05PREVcbn07XG5cbl9leHRlbmRzKENEQVRBU2VjdGlvbiwgQ2hhcmFjdGVyRGF0YSk7XG5cbmZ1bmN0aW9uIERvY3VtZW50VHlwZSgpIHt9XG5cbjtcbkRvY3VtZW50VHlwZS5wcm90b3R5cGUubm9kZVR5cGUgPSBET0NVTUVOVF9UWVBFX05PREU7XG5cbl9leHRlbmRzKERvY3VtZW50VHlwZSwgTm9kZSk7XG5cbmZ1bmN0aW9uIE5vdGF0aW9uKCkge31cblxuO1xuTm90YXRpb24ucHJvdG90eXBlLm5vZGVUeXBlID0gTk9UQVRJT05fTk9ERTtcblxuX2V4dGVuZHMoTm90YXRpb24sIE5vZGUpO1xuXG5mdW5jdGlvbiBFbnRpdHkoKSB7fVxuXG47XG5FbnRpdHkucHJvdG90eXBlLm5vZGVUeXBlID0gRU5USVRZX05PREU7XG5cbl9leHRlbmRzKEVudGl0eSwgTm9kZSk7XG5cbmZ1bmN0aW9uIEVudGl0eVJlZmVyZW5jZSgpIHt9XG5cbjtcbkVudGl0eVJlZmVyZW5jZS5wcm90b3R5cGUubm9kZVR5cGUgPSBFTlRJVFlfUkVGRVJFTkNFX05PREU7XG5cbl9leHRlbmRzKEVudGl0eVJlZmVyZW5jZSwgTm9kZSk7XG5cbmZ1bmN0aW9uIERvY3VtZW50RnJhZ21lbnQoKSB7fVxuXG47XG5Eb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZS5ub2RlTmFtZSA9IFwiI2RvY3VtZW50LWZyYWdtZW50XCI7XG5Eb2N1bWVudEZyYWdtZW50LnByb3RvdHlwZS5ub2RlVHlwZSA9IERPQ1VNRU5UX0ZSQUdNRU5UX05PREU7XG5cbl9leHRlbmRzKERvY3VtZW50RnJhZ21lbnQsIE5vZGUpO1xuXG5mdW5jdGlvbiBQcm9jZXNzaW5nSW5zdHJ1Y3Rpb24oKSB7fVxuXG5Qcm9jZXNzaW5nSW5zdHJ1Y3Rpb24ucHJvdG90eXBlLm5vZGVUeXBlID0gUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFO1xuXG5fZXh0ZW5kcyhQcm9jZXNzaW5nSW5zdHJ1Y3Rpb24sIE5vZGUpO1xuXG5mdW5jdGlvbiBYTUxTZXJpYWxpemVyKCkge31cblxuWE1MU2VyaWFsaXplci5wcm90b3R5cGUuc2VyaWFsaXplVG9TdHJpbmcgPSBmdW5jdGlvbiAobm9kZSwgaXNIdG1sLCBub2RlRmlsdGVyKSB7XG4gIHJldHVybiBub2RlU2VyaWFsaXplVG9TdHJpbmcuY2FsbChub2RlLCBpc0h0bWwsIG5vZGVGaWx0ZXIpO1xufTtcblxuTm9kZS5wcm90b3R5cGUudG9TdHJpbmcgPSBub2RlU2VyaWFsaXplVG9TdHJpbmc7XG5cbmZ1bmN0aW9uIG5vZGVTZXJpYWxpemVUb1N0cmluZyhpc0h0bWwsIG5vZGVGaWx0ZXIpIHtcbiAgdmFyIGJ1ZiA9IFtdO1xuICB2YXIgcmVmTm9kZSA9IHRoaXMubm9kZVR5cGUgPT0gOSAmJiB0aGlzLmRvY3VtZW50RWxlbWVudCB8fCB0aGlzO1xuICB2YXIgcHJlZml4ID0gcmVmTm9kZS5wcmVmaXg7XG4gIHZhciB1cmkgPSByZWZOb2RlLm5hbWVzcGFjZVVSSTtcblxuICBpZiAodXJpICYmIHByZWZpeCA9PSBudWxsKSB7XG4gICAgdmFyIHByZWZpeCA9IHJlZk5vZGUubG9va3VwUHJlZml4KHVyaSk7XG5cbiAgICBpZiAocHJlZml4ID09IG51bGwpIHtcbiAgICAgIHZhciB2aXNpYmxlTmFtZXNwYWNlcyA9IFt7XG4gICAgICAgIG5hbWVzcGFjZTogdXJpLFxuICAgICAgICBwcmVmaXg6IG51bGxcbiAgICAgIH1dO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZVRvU3RyaW5nKHRoaXMsIGJ1ZiwgaXNIdG1sLCBub2RlRmlsdGVyLCB2aXNpYmxlTmFtZXNwYWNlcyk7XG4gIHJldHVybiBidWYuam9pbignJyk7XG59XG5cbmZ1bmN0aW9uIG5lZWROYW1lc3BhY2VEZWZpbmUobm9kZSwgaXNIVE1MLCB2aXNpYmxlTmFtZXNwYWNlcykge1xuICB2YXIgcHJlZml4ID0gbm9kZS5wcmVmaXggfHwgJyc7XG4gIHZhciB1cmkgPSBub2RlLm5hbWVzcGFjZVVSSTtcblxuICBpZiAoIXByZWZpeCAmJiAhdXJpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHByZWZpeCA9PT0gXCJ4bWxcIiAmJiB1cmkgPT09IFwiaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlXCIgfHwgdXJpID09ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3htbG5zLycpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgaSA9IHZpc2libGVOYW1lc3BhY2VzLmxlbmd0aDtcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgdmFyIG5zID0gdmlzaWJsZU5hbWVzcGFjZXNbaV07XG5cbiAgICBpZiAobnMucHJlZml4ID09IHByZWZpeCkge1xuICAgICAgcmV0dXJuIG5zLm5hbWVzcGFjZSAhPSB1cmk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZVRvU3RyaW5nKG5vZGUsIGJ1ZiwgaXNIVE1MLCBub2RlRmlsdGVyLCB2aXNpYmxlTmFtZXNwYWNlcykge1xuICBpZiAobm9kZUZpbHRlcikge1xuICAgIG5vZGUgPSBub2RlRmlsdGVyKG5vZGUpO1xuXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIGlmICh0eXBlb2Ygbm9kZSA9PSAnc3RyaW5nJykge1xuICAgICAgICBidWYucHVzaChub2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgY2FzZSBFTEVNRU5UX05PREU6XG4gICAgICBpZiAoIXZpc2libGVOYW1lc3BhY2VzKSB2aXNpYmxlTmFtZXNwYWNlcyA9IFtdO1xuICAgICAgdmFyIHN0YXJ0VmlzaWJsZU5hbWVzcGFjZXMgPSB2aXNpYmxlTmFtZXNwYWNlcy5sZW5ndGg7XG4gICAgICB2YXIgYXR0cnMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgICB2YXIgbGVuID0gYXR0cnMubGVuZ3RoO1xuICAgICAgdmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgdmFyIG5vZGVOYW1lID0gbm9kZS50YWdOYW1lO1xuICAgICAgaXNIVE1MID0gaHRtbG5zID09PSBub2RlLm5hbWVzcGFjZVVSSSB8fCBpc0hUTUw7XG4gICAgICBidWYucHVzaCgnPCcsIG5vZGVOYW1lKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgYXR0ciA9IGF0dHJzLml0ZW0oaSk7XG5cbiAgICAgICAgaWYgKGF0dHIucHJlZml4ID09ICd4bWxucycpIHtcbiAgICAgICAgICB2aXNpYmxlTmFtZXNwYWNlcy5wdXNoKHtcbiAgICAgICAgICAgIHByZWZpeDogYXR0ci5sb2NhbE5hbWUsXG4gICAgICAgICAgICBuYW1lc3BhY2U6IGF0dHIudmFsdWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChhdHRyLm5vZGVOYW1lID09ICd4bWxucycpIHtcbiAgICAgICAgICB2aXNpYmxlTmFtZXNwYWNlcy5wdXNoKHtcbiAgICAgICAgICAgIHByZWZpeDogJycsXG4gICAgICAgICAgICBuYW1lc3BhY2U6IGF0dHIudmFsdWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBhdHRyID0gYXR0cnMuaXRlbShpKTtcblxuICAgICAgICBpZiAobmVlZE5hbWVzcGFjZURlZmluZShhdHRyLCBpc0hUTUwsIHZpc2libGVOYW1lc3BhY2VzKSkge1xuICAgICAgICAgIHZhciBwcmVmaXggPSBhdHRyLnByZWZpeCB8fCAnJztcbiAgICAgICAgICB2YXIgdXJpID0gYXR0ci5uYW1lc3BhY2VVUkk7XG4gICAgICAgICAgdmFyIG5zID0gcHJlZml4ID8gJyB4bWxuczonICsgcHJlZml4IDogXCIgeG1sbnNcIjtcbiAgICAgICAgICBidWYucHVzaChucywgJz1cIicsIHVyaSwgJ1wiJyk7XG4gICAgICAgICAgdmlzaWJsZU5hbWVzcGFjZXMucHVzaCh7XG4gICAgICAgICAgICBwcmVmaXg6IHByZWZpeCxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogdXJpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXJpYWxpemVUb1N0cmluZyhhdHRyLCBidWYsIGlzSFRNTCwgbm9kZUZpbHRlciwgdmlzaWJsZU5hbWVzcGFjZXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmVlZE5hbWVzcGFjZURlZmluZShub2RlLCBpc0hUTUwsIHZpc2libGVOYW1lc3BhY2VzKSkge1xuICAgICAgICB2YXIgcHJlZml4ID0gbm9kZS5wcmVmaXggfHwgJyc7XG4gICAgICAgIHZhciB1cmkgPSBub2RlLm5hbWVzcGFjZVVSSTtcbiAgICAgICAgdmFyIG5zID0gcHJlZml4ID8gJyB4bWxuczonICsgcHJlZml4IDogXCIgeG1sbnNcIjtcbiAgICAgICAgYnVmLnB1c2gobnMsICc9XCInLCB1cmksICdcIicpO1xuICAgICAgICB2aXNpYmxlTmFtZXNwYWNlcy5wdXNoKHtcbiAgICAgICAgICBwcmVmaXg6IHByZWZpeCxcbiAgICAgICAgICBuYW1lc3BhY2U6IHVyaVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNoaWxkIHx8IGlzSFRNTCAmJiAhL14oPzptZXRhfGxpbmt8aW1nfGJyfGhyfGlucHV0KSQvaS50ZXN0KG5vZGVOYW1lKSkge1xuICAgICAgICBidWYucHVzaCgnPicpO1xuXG4gICAgICAgIGlmIChpc0hUTUwgJiYgL15zY3JpcHQkL2kudGVzdChub2RlTmFtZSkpIHtcbiAgICAgICAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZC5kYXRhKSB7XG4gICAgICAgICAgICAgIGJ1Zi5wdXNoKGNoaWxkLmRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2VyaWFsaXplVG9TdHJpbmcoY2hpbGQsIGJ1ZiwgaXNIVE1MLCBub2RlRmlsdGVyLCB2aXNpYmxlTmFtZXNwYWNlcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICAgICAgc2VyaWFsaXplVG9TdHJpbmcoY2hpbGQsIGJ1ZiwgaXNIVE1MLCBub2RlRmlsdGVyLCB2aXNpYmxlTmFtZXNwYWNlcyk7XG4gICAgICAgICAgICBjaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGJ1Zi5wdXNoKCc8LycsIG5vZGVOYW1lLCAnPicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnVmLnB1c2goJy8+Jyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcblxuICAgIGNhc2UgRE9DVU1FTlRfTk9ERTpcbiAgICBjYXNlIERPQ1VNRU5UX0ZSQUdNRU5UX05PREU6XG4gICAgICB2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG5cbiAgICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgICBzZXJpYWxpemVUb1N0cmluZyhjaGlsZCwgYnVmLCBpc0hUTUwsIG5vZGVGaWx0ZXIsIHZpc2libGVOYW1lc3BhY2VzKTtcbiAgICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuXG4gICAgY2FzZSBBVFRSSUJVVEVfTk9ERTpcbiAgICAgIHJldHVybiBidWYucHVzaCgnICcsIG5vZGUubmFtZSwgJz1cIicsIG5vZGUudmFsdWUucmVwbGFjZSgvWzwmXCJdL2csIF94bWxFbmNvZGVyKSwgJ1wiJyk7XG5cbiAgICBjYXNlIFRFWFRfTk9ERTpcbiAgICAgIHJldHVybiBidWYucHVzaChub2RlLmRhdGEucmVwbGFjZSgvWzwmXS9nLCBfeG1sRW5jb2RlcikpO1xuXG4gICAgY2FzZSBDREFUQV9TRUNUSU9OX05PREU6XG4gICAgICByZXR1cm4gYnVmLnB1c2goJzwhW0NEQVRBWycsIG5vZGUuZGF0YSwgJ11dPicpO1xuXG4gICAgY2FzZSBDT01NRU5UX05PREU6XG4gICAgICByZXR1cm4gYnVmLnB1c2goXCI8IS0tXCIsIG5vZGUuZGF0YSwgXCItLT5cIik7XG5cbiAgICBjYXNlIERPQ1VNRU5UX1RZUEVfTk9ERTpcbiAgICAgIHZhciBwdWJpZCA9IG5vZGUucHVibGljSWQ7XG4gICAgICB2YXIgc3lzaWQgPSBub2RlLnN5c3RlbUlkO1xuICAgICAgYnVmLnB1c2goJzwhRE9DVFlQRSAnLCBub2RlLm5hbWUpO1xuXG4gICAgICBpZiAocHViaWQpIHtcbiAgICAgICAgYnVmLnB1c2goJyBQVUJMSUMgXCInLCBwdWJpZCk7XG5cbiAgICAgICAgaWYgKHN5c2lkICYmIHN5c2lkICE9ICcuJykge1xuICAgICAgICAgIGJ1Zi5wdXNoKCdcIiBcIicsIHN5c2lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1Zi5wdXNoKCdcIj4nKTtcbiAgICAgIH0gZWxzZSBpZiAoc3lzaWQgJiYgc3lzaWQgIT0gJy4nKSB7XG4gICAgICAgIGJ1Zi5wdXNoKCcgU1lTVEVNIFwiJywgc3lzaWQsICdcIj4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBzdWIgPSBub2RlLmludGVybmFsU3Vic2V0O1xuXG4gICAgICAgIGlmIChzdWIpIHtcbiAgICAgICAgICBidWYucHVzaChcIiBbXCIsIHN1YiwgXCJdXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnVmLnB1c2goXCI+XCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG5cbiAgICBjYXNlIFBST0NFU1NJTkdfSU5TVFJVQ1RJT05fTk9ERTpcbiAgICAgIHJldHVybiBidWYucHVzaChcIjw/XCIsIG5vZGUudGFyZ2V0LCBcIiBcIiwgbm9kZS5kYXRhLCBcIj8+XCIpO1xuXG4gICAgY2FzZSBFTlRJVFlfUkVGRVJFTkNFX05PREU6XG4gICAgICByZXR1cm4gYnVmLnB1c2goJyYnLCBub2RlLm5vZGVOYW1lLCAnOycpO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIGJ1Zi5wdXNoKCc/PycsIG5vZGUubm9kZU5hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9pbXBvcnROb2RlKGRvYywgbm9kZSwgZGVlcCkge1xuICB2YXIgbm9kZTI7XG5cbiAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgY2FzZSBFTEVNRU5UX05PREU6XG4gICAgICBub2RlMiA9IG5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgIG5vZGUyLm93bmVyRG9jdW1lbnQgPSBkb2M7XG5cbiAgICBjYXNlIERPQ1VNRU5UX0ZSQUdNRU5UX05PREU6XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgQVRUUklCVVRFX05PREU6XG4gICAgICBkZWVwID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKCFub2RlMikge1xuICAgIG5vZGUyID0gbm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICB9XG5cbiAgbm9kZTIub3duZXJEb2N1bWVudCA9IGRvYztcbiAgbm9kZTIucGFyZW50Tm9kZSA9IG51bGw7XG5cbiAgaWYgKGRlZXApIHtcbiAgICB2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG5cbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIG5vZGUyLmFwcGVuZENoaWxkKF9pbXBvcnROb2RlKGRvYywgY2hpbGQsIGRlZXApKTtcbiAgICAgIGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGUyO1xufVxuXG5mdW5jdGlvbiBfY2xvbmVOb2RlKGRvYywgbm9kZSwgZGVlcCkge1xuICB2YXIgbm9kZTIgPSBuZXcgbm9kZS5jb25zdHJ1Y3RvcigpO1xuXG4gIGZvciAodmFyIG4gaW4gbm9kZSkge1xuICAgIHZhciB2ID0gbm9kZVtuXTtcblxuICAgIGlmIChfdHlwZW9mKHYpICE9ICdvYmplY3QnKSB7XG4gICAgICBpZiAodiAhPSBub2RlMltuXSkge1xuICAgICAgICBub2RlMltuXSA9IHY7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKG5vZGUuY2hpbGROb2Rlcykge1xuICAgIG5vZGUyLmNoaWxkTm9kZXMgPSBuZXcgTm9kZUxpc3QoKTtcbiAgfVxuXG4gIG5vZGUyLm93bmVyRG9jdW1lbnQgPSBkb2M7XG5cbiAgc3dpdGNoIChub2RlMi5ub2RlVHlwZSkge1xuICAgIGNhc2UgRUxFTUVOVF9OT0RFOlxuICAgICAgdmFyIGF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgICAgdmFyIGF0dHJzMiA9IG5vZGUyLmF0dHJpYnV0ZXMgPSBuZXcgTmFtZWROb2RlTWFwKCk7XG4gICAgICB2YXIgbGVuID0gYXR0cnMubGVuZ3RoO1xuICAgICAgYXR0cnMyLl9vd25lckVsZW1lbnQgPSBub2RlMjtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBub2RlMi5zZXRBdHRyaWJ1dGVOb2RlKF9jbG9uZU5vZGUoZG9jLCBhdHRycy5pdGVtKGkpLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgICAgO1xuXG4gICAgY2FzZSBBVFRSSUJVVEVfTk9ERTpcbiAgICAgIGRlZXAgPSB0cnVlO1xuICB9XG5cbiAgaWYgKGRlZXApIHtcbiAgICB2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG5cbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIG5vZGUyLmFwcGVuZENoaWxkKF9jbG9uZU5vZGUoZG9jLCBjaGlsZCwgZGVlcCkpO1xuICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZTI7XG59XG5cbmZ1bmN0aW9uIF9fc2V0X18ob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gIG9iamVjdFtrZXldID0gdmFsdWU7XG59XG5cbnRyeSB7XG4gIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHtcbiAgICB2YXIgZ2V0VGV4dENvbnRlbnQgPSBmdW5jdGlvbiBnZXRUZXh0Q29udGVudChub2RlKSB7XG4gICAgICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgY2FzZSBFTEVNRU5UX05PREU6XG4gICAgICAgIGNhc2UgRE9DVU1FTlRfRlJBR01FTlRfTk9ERTpcbiAgICAgICAgICB2YXIgYnVmID0gW107XG4gICAgICAgICAgbm9kZSA9IG5vZGUuZmlyc3RDaGlsZDtcblxuICAgICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPT0gNyAmJiBub2RlLm5vZGVUeXBlICE9PSA4KSB7XG4gICAgICAgICAgICAgIGJ1Zi5wdXNoKGdldFRleHRDb250ZW50KG5vZGUpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBub2RlLm5vZGVWYWx1ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KExpdmVOb2RlTGlzdC5wcm90b3R5cGUsICdsZW5ndGgnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgX3VwZGF0ZUxpdmVMaXN0KHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLiQkbGVuZ3RoO1xuICAgICAgfVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShOb2RlLnByb3RvdHlwZSwgJ3RleHRDb250ZW50Jywge1xuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIHJldHVybiBnZXRUZXh0Q29udGVudCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldChkYXRhKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5ub2RlVHlwZSkge1xuICAgICAgICAgIGNhc2UgRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNhc2UgRE9DVU1FTlRfRlJBR01FTlRfTk9ERTpcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZCh0aGlzLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YSB8fCBTdHJpbmcoZGF0YSkpIHtcbiAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGRhdGE7XG4gICAgICAgICAgICB0aGlzLm5vZGVWYWx1ZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIF9fc2V0X18gPSBmdW5jdGlvbiBfX3NldF9fKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgb2JqZWN0WyckJCcgKyBrZXldID0gdmFsdWU7XG4gICAgfTtcbiAgfVxufSBjYXRjaCAoZSkge31cblxuZXhwb3J0cy5ET01JbXBsZW1lbnRhdGlvbiA9IERPTUltcGxlbWVudGF0aW9uO1xuZXhwb3J0cy5YTUxTZXJpYWxpemVyID0gWE1MU2VyaWFsaXplcjtcblxufSx7fV0sNjA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuZW50aXR5TWFwID0ge1xuICBsdDogJzwnLFxuICBndDogJz4nLFxuICBhbXA6ICcmJyxcbiAgcXVvdDogJ1wiJyxcbiAgYXBvczogXCInXCIsXG4gIEFncmF2ZTogXCLDgFwiLFxuICBBYWN1dGU6IFwiw4FcIixcbiAgQWNpcmM6IFwiw4JcIixcbiAgQXRpbGRlOiBcIsODXCIsXG4gIEF1bWw6IFwiw4RcIixcbiAgQXJpbmc6IFwiw4VcIixcbiAgQUVsaWc6IFwiw4ZcIixcbiAgQ2NlZGlsOiBcIsOHXCIsXG4gIEVncmF2ZTogXCLDiFwiLFxuICBFYWN1dGU6IFwiw4lcIixcbiAgRWNpcmM6IFwiw4pcIixcbiAgRXVtbDogXCLDi1wiLFxuICBJZ3JhdmU6IFwiw4xcIixcbiAgSWFjdXRlOiBcIsONXCIsXG4gIEljaXJjOiBcIsOOXCIsXG4gIEl1bWw6IFwiw49cIixcbiAgRVRIOiBcIsOQXCIsXG4gIE50aWxkZTogXCLDkVwiLFxuICBPZ3JhdmU6IFwiw5JcIixcbiAgT2FjdXRlOiBcIsOTXCIsXG4gIE9jaXJjOiBcIsOUXCIsXG4gIE90aWxkZTogXCLDlVwiLFxuICBPdW1sOiBcIsOWXCIsXG4gIE9zbGFzaDogXCLDmFwiLFxuICBVZ3JhdmU6IFwiw5lcIixcbiAgVWFjdXRlOiBcIsOaXCIsXG4gIFVjaXJjOiBcIsObXCIsXG4gIFV1bWw6IFwiw5xcIixcbiAgWWFjdXRlOiBcIsOdXCIsXG4gIFRIT1JOOiBcIsOeXCIsXG4gIHN6bGlnOiBcIsOfXCIsXG4gIGFncmF2ZTogXCLDoFwiLFxuICBhYWN1dGU6IFwiw6FcIixcbiAgYWNpcmM6IFwiw6JcIixcbiAgYXRpbGRlOiBcIsOjXCIsXG4gIGF1bWw6IFwiw6RcIixcbiAgYXJpbmc6IFwiw6VcIixcbiAgYWVsaWc6IFwiw6ZcIixcbiAgY2NlZGlsOiBcIsOnXCIsXG4gIGVncmF2ZTogXCLDqFwiLFxuICBlYWN1dGU6IFwiw6lcIixcbiAgZWNpcmM6IFwiw6pcIixcbiAgZXVtbDogXCLDq1wiLFxuICBpZ3JhdmU6IFwiw6xcIixcbiAgaWFjdXRlOiBcIsOtXCIsXG4gIGljaXJjOiBcIsOuXCIsXG4gIGl1bWw6IFwiw69cIixcbiAgZXRoOiBcIsOwXCIsXG4gIG50aWxkZTogXCLDsVwiLFxuICBvZ3JhdmU6IFwiw7JcIixcbiAgb2FjdXRlOiBcIsOzXCIsXG4gIG9jaXJjOiBcIsO0XCIsXG4gIG90aWxkZTogXCLDtVwiLFxuICBvdW1sOiBcIsO2XCIsXG4gIG9zbGFzaDogXCLDuFwiLFxuICB1Z3JhdmU6IFwiw7lcIixcbiAgdWFjdXRlOiBcIsO6XCIsXG4gIHVjaXJjOiBcIsO7XCIsXG4gIHV1bWw6IFwiw7xcIixcbiAgeWFjdXRlOiBcIsO9XCIsXG4gIHRob3JuOiBcIsO+XCIsXG4gIHl1bWw6IFwiw79cIixcbiAgbmJzcDogXCIgXCIsXG4gIGlleGNsOiBcIsKhXCIsXG4gIGNlbnQ6IFwiwqJcIixcbiAgcG91bmQ6IFwiwqNcIixcbiAgY3VycmVuOiBcIsKkXCIsXG4gIHllbjogXCLCpVwiLFxuICBicnZiYXI6IFwiwqZcIixcbiAgc2VjdDogXCLCp1wiLFxuICB1bWw6IFwiwqhcIixcbiAgY29weTogXCLCqVwiLFxuICBvcmRmOiBcIsKqXCIsXG4gIGxhcXVvOiBcIsKrXCIsXG4gIG5vdDogXCLCrFwiLFxuICBzaHk6IFwiwq3CrVwiLFxuICByZWc6IFwiwq5cIixcbiAgbWFjcjogXCLCr1wiLFxuICBkZWc6IFwiwrBcIixcbiAgcGx1c21uOiBcIsKxXCIsXG4gIHN1cDI6IFwiwrJcIixcbiAgc3VwMzogXCLCs1wiLFxuICBhY3V0ZTogXCLCtFwiLFxuICBtaWNybzogXCLCtVwiLFxuICBwYXJhOiBcIsK2XCIsXG4gIG1pZGRvdDogXCLCt1wiLFxuICBjZWRpbDogXCLCuFwiLFxuICBzdXAxOiBcIsK5XCIsXG4gIG9yZG06IFwiwrpcIixcbiAgcmFxdW86IFwiwrtcIixcbiAgZnJhYzE0OiBcIsK8XCIsXG4gIGZyYWMxMjogXCLCvVwiLFxuICBmcmFjMzQ6IFwiwr5cIixcbiAgaXF1ZXN0OiBcIsK/XCIsXG4gIHRpbWVzOiBcIsOXXCIsXG4gIGRpdmlkZTogXCLDt1wiLFxuICBmb3JhbGw6IFwi4oiAXCIsXG4gIHBhcnQ6IFwi4oiCXCIsXG4gIGV4aXN0OiBcIuKIg1wiLFxuICBlbXB0eTogXCLiiIVcIixcbiAgbmFibGE6IFwi4oiHXCIsXG4gIGlzaW46IFwi4oiIXCIsXG4gIG5vdGluOiBcIuKIiVwiLFxuICBuaTogXCLiiItcIixcbiAgcHJvZDogXCLiiI9cIixcbiAgc3VtOiBcIuKIkVwiLFxuICBtaW51czogXCLiiJJcIixcbiAgbG93YXN0OiBcIuKIl1wiLFxuICByYWRpYzogXCLiiJpcIixcbiAgcHJvcDogXCLiiJ1cIixcbiAgaW5maW46IFwi4oieXCIsXG4gIGFuZzogXCLiiKBcIixcbiAgYW5kOiBcIuKIp1wiLFxuICBvcjogXCLiiKhcIixcbiAgY2FwOiBcIuKIqVwiLFxuICBjdXA6IFwi4oiqXCIsXG4gICdpbnQnOiBcIuKIq1wiLFxuICB0aGVyZTQ6IFwi4oi0XCIsXG4gIHNpbTogXCLiiLxcIixcbiAgY29uZzogXCLiiYVcIixcbiAgYXN5bXA6IFwi4omIXCIsXG4gIG5lOiBcIuKJoFwiLFxuICBlcXVpdjogXCLiiaFcIixcbiAgbGU6IFwi4omkXCIsXG4gIGdlOiBcIuKJpVwiLFxuICBzdWI6IFwi4oqCXCIsXG4gIHN1cDogXCLiioNcIixcbiAgbnN1YjogXCLiioRcIixcbiAgc3ViZTogXCLiioZcIixcbiAgc3VwZTogXCLiiodcIixcbiAgb3BsdXM6IFwi4oqVXCIsXG4gIG90aW1lczogXCLiipdcIixcbiAgcGVycDogXCLiiqVcIixcbiAgc2RvdDogXCLii4VcIixcbiAgQWxwaGE6IFwizpFcIixcbiAgQmV0YTogXCLOklwiLFxuICBHYW1tYTogXCLOk1wiLFxuICBEZWx0YTogXCLOlFwiLFxuICBFcHNpbG9uOiBcIs6VXCIsXG4gIFpldGE6IFwizpZcIixcbiAgRXRhOiBcIs6XXCIsXG4gIFRoZXRhOiBcIs6YXCIsXG4gIElvdGE6IFwizplcIixcbiAgS2FwcGE6IFwizppcIixcbiAgTGFtYmRhOiBcIs6bXCIsXG4gIE11OiBcIs6cXCIsXG4gIE51OiBcIs6dXCIsXG4gIFhpOiBcIs6eXCIsXG4gIE9taWNyb246IFwizp9cIixcbiAgUGk6IFwizqBcIixcbiAgUmhvOiBcIs6hXCIsXG4gIFNpZ21hOiBcIs6jXCIsXG4gIFRhdTogXCLOpFwiLFxuICBVcHNpbG9uOiBcIs6lXCIsXG4gIFBoaTogXCLOplwiLFxuICBDaGk6IFwizqdcIixcbiAgUHNpOiBcIs6oXCIsXG4gIE9tZWdhOiBcIs6pXCIsXG4gIGFscGhhOiBcIs6xXCIsXG4gIGJldGE6IFwizrJcIixcbiAgZ2FtbWE6IFwizrNcIixcbiAgZGVsdGE6IFwizrRcIixcbiAgZXBzaWxvbjogXCLOtVwiLFxuICB6ZXRhOiBcIs62XCIsXG4gIGV0YTogXCLOt1wiLFxuICB0aGV0YTogXCLOuFwiLFxuICBpb3RhOiBcIs65XCIsXG4gIGthcHBhOiBcIs66XCIsXG4gIGxhbWJkYTogXCLOu1wiLFxuICBtdTogXCLOvFwiLFxuICBudTogXCLOvVwiLFxuICB4aTogXCLOvlwiLFxuICBvbWljcm9uOiBcIs6/XCIsXG4gIHBpOiBcIs+AXCIsXG4gIHJobzogXCLPgVwiLFxuICBzaWdtYWY6IFwiz4JcIixcbiAgc2lnbWE6IFwiz4NcIixcbiAgdGF1OiBcIs+EXCIsXG4gIHVwc2lsb246IFwiz4VcIixcbiAgcGhpOiBcIs+GXCIsXG4gIGNoaTogXCLPh1wiLFxuICBwc2k6IFwiz4hcIixcbiAgb21lZ2E6IFwiz4lcIixcbiAgdGhldGFzeW06IFwiz5FcIixcbiAgdXBzaWg6IFwiz5JcIixcbiAgcGl2OiBcIs+WXCIsXG4gIE9FbGlnOiBcIsWSXCIsXG4gIG9lbGlnOiBcIsWTXCIsXG4gIFNjYXJvbjogXCLFoFwiLFxuICBzY2Fyb246IFwixaFcIixcbiAgWXVtbDogXCLFuFwiLFxuICBmbm9mOiBcIsaSXCIsXG4gIGNpcmM6IFwiy4ZcIixcbiAgdGlsZGU6IFwiy5xcIixcbiAgZW5zcDogXCLigIJcIixcbiAgZW1zcDogXCLigINcIixcbiAgdGhpbnNwOiBcIuKAiVwiLFxuICB6d25qOiBcIuKAjFwiLFxuICB6d2o6IFwi4oCNXCIsXG4gIGxybTogXCLigI5cIixcbiAgcmxtOiBcIuKAj1wiLFxuICBuZGFzaDogXCLigJNcIixcbiAgbWRhc2g6IFwi4oCUXCIsXG4gIGxzcXVvOiBcIuKAmFwiLFxuICByc3F1bzogXCLigJlcIixcbiAgc2JxdW86IFwi4oCaXCIsXG4gIGxkcXVvOiBcIuKAnFwiLFxuICByZHF1bzogXCLigJ1cIixcbiAgYmRxdW86IFwi4oCeXCIsXG4gIGRhZ2dlcjogXCLigKBcIixcbiAgRGFnZ2VyOiBcIuKAoVwiLFxuICBidWxsOiBcIuKAolwiLFxuICBoZWxsaXA6IFwi4oCmXCIsXG4gIHBlcm1pbDogXCLigLBcIixcbiAgcHJpbWU6IFwi4oCyXCIsXG4gIFByaW1lOiBcIuKAs1wiLFxuICBsc2FxdW86IFwi4oC5XCIsXG4gIHJzYXF1bzogXCLigLpcIixcbiAgb2xpbmU6IFwi4oC+XCIsXG4gIGV1cm86IFwi4oKsXCIsXG4gIHRyYWRlOiBcIuKEolwiLFxuICBsYXJyOiBcIuKGkFwiLFxuICB1YXJyOiBcIuKGkVwiLFxuICByYXJyOiBcIuKGklwiLFxuICBkYXJyOiBcIuKGk1wiLFxuICBoYXJyOiBcIuKGlFwiLFxuICBjcmFycjogXCLihrVcIixcbiAgbGNlaWw6IFwi4oyIXCIsXG4gIHJjZWlsOiBcIuKMiVwiLFxuICBsZmxvb3I6IFwi4oyKXCIsXG4gIHJmbG9vcjogXCLijItcIixcbiAgbG96OiBcIuKXilwiLFxuICBzcGFkZXM6IFwi4pmgXCIsXG4gIGNsdWJzOiBcIuKZo1wiLFxuICBoZWFydHM6IFwi4pmlXCIsXG4gIGRpYW1zOiBcIuKZplwiXG59O1xuXG59LHt9XSw2MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIG5hbWVTdGFydENoYXIgPSAvW0EtWl9hLXpcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx1MDBGOC1cXHUwMkZGXFx1MDM3MC1cXHUwMzdEXFx1MDM3Ri1cXHUxRkZGXFx1MjAwQy1cXHUyMDBEXFx1MjA3MC1cXHUyMThGXFx1MkMwMC1cXHUyRkVGXFx1MzAwMS1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkZEXS87XG52YXIgbmFtZUNoYXIgPSBuZXcgUmVnRXhwKFwiW1xcXFwtXFxcXC4wLTlcIiArIG5hbWVTdGFydENoYXIuc291cmNlLnNsaWNlKDEsIC0xKSArIFwiXFxcXHUwMEI3XFxcXHUwMzAwLVxcXFx1MDM2RlxcXFx1MjAzRi1cXFxcdTIwNDBdXCIpO1xudmFyIHRhZ05hbWVQYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXicgKyBuYW1lU3RhcnRDaGFyLnNvdXJjZSArIG5hbWVDaGFyLnNvdXJjZSArICcqKD86XFw6JyArIG5hbWVTdGFydENoYXIuc291cmNlICsgbmFtZUNoYXIuc291cmNlICsgJyopPyQnKTtcbnZhciBTX1RBRyA9IDA7XG52YXIgU19BVFRSID0gMTtcbnZhciBTX0FUVFJfU1BBQ0UgPSAyO1xudmFyIFNfRVEgPSAzO1xudmFyIFNfQVRUUl9OT1FVT1RfVkFMVUUgPSA0O1xudmFyIFNfQVRUUl9FTkQgPSA1O1xudmFyIFNfVEFHX1NQQUNFID0gNjtcbnZhciBTX1RBR19DTE9TRSA9IDc7XG5cbmZ1bmN0aW9uIFhNTFJlYWRlcigpIHt9XG5cblhNTFJlYWRlci5wcm90b3R5cGUgPSB7XG4gIHBhcnNlOiBmdW5jdGlvbiBwYXJzZShzb3VyY2UsIGRlZmF1bHROU01hcCwgZW50aXR5TWFwKSB7XG4gICAgdmFyIGRvbUJ1aWxkZXIgPSB0aGlzLmRvbUJ1aWxkZXI7XG4gICAgZG9tQnVpbGRlci5zdGFydERvY3VtZW50KCk7XG5cbiAgICBfY29weShkZWZhdWx0TlNNYXAsIGRlZmF1bHROU01hcCA9IHt9KTtcblxuICAgIF9wYXJzZShzb3VyY2UsIGRlZmF1bHROU01hcCwgZW50aXR5TWFwLCBkb21CdWlsZGVyLCB0aGlzLmVycm9ySGFuZGxlcik7XG5cbiAgICBkb21CdWlsZGVyLmVuZERvY3VtZW50KCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9wYXJzZShzb3VyY2UsIGRlZmF1bHROU01hcENvcHksIGVudGl0eU1hcCwgZG9tQnVpbGRlciwgZXJyb3JIYW5kbGVyKSB7XG4gIGZ1bmN0aW9uIGZpeGVkRnJvbUNoYXJDb2RlKGNvZGUpIHtcbiAgICBpZiAoY29kZSA+IDB4ZmZmZikge1xuICAgICAgY29kZSAtPSAweDEwMDAwO1xuICAgICAgdmFyIHN1cnJvZ2F0ZTEgPSAweGQ4MDAgKyAoY29kZSA+PiAxMCksXG4gICAgICAgICAgc3Vycm9nYXRlMiA9IDB4ZGMwMCArIChjb2RlICYgMHgzZmYpO1xuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoc3Vycm9nYXRlMSwgc3Vycm9nYXRlMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGl0eVJlcGxhY2VyKGEpIHtcbiAgICB2YXIgayA9IGEuc2xpY2UoMSwgLTEpO1xuXG4gICAgaWYgKGsgaW4gZW50aXR5TWFwKSB7XG4gICAgICByZXR1cm4gZW50aXR5TWFwW2tdO1xuICAgIH0gZWxzZSBpZiAoay5jaGFyQXQoMCkgPT09ICcjJykge1xuICAgICAgcmV0dXJuIGZpeGVkRnJvbUNoYXJDb2RlKHBhcnNlSW50KGsuc3Vic3RyKDEpLnJlcGxhY2UoJ3gnLCAnMHgnKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvckhhbmRsZXIuZXJyb3IoJ2VudGl0eSBub3QgZm91bmQ6JyArIGEpO1xuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kVGV4dChlbmQpIHtcbiAgICBpZiAoZW5kID4gc3RhcnQpIHtcbiAgICAgIHZhciB4dCA9IHNvdXJjZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCkucmVwbGFjZSgvJiM/XFx3KzsvZywgZW50aXR5UmVwbGFjZXIpO1xuICAgICAgbG9jYXRvciAmJiBwb3NpdGlvbihzdGFydCk7XG4gICAgICBkb21CdWlsZGVyLmNoYXJhY3RlcnMoeHQsIDAsIGVuZCAtIHN0YXJ0KTtcbiAgICAgIHN0YXJ0ID0gZW5kO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBvc2l0aW9uKHAsIG0pIHtcbiAgICB3aGlsZSAocCA+PSBsaW5lRW5kICYmIChtID0gbGluZVBhdHRlcm4uZXhlYyhzb3VyY2UpKSkge1xuICAgICAgbGluZVN0YXJ0ID0gbS5pbmRleDtcbiAgICAgIGxpbmVFbmQgPSBsaW5lU3RhcnQgKyBtWzBdLmxlbmd0aDtcbiAgICAgIGxvY2F0b3IubGluZU51bWJlcisrO1xuICAgIH1cblxuICAgIGxvY2F0b3IuY29sdW1uTnVtYmVyID0gcCAtIGxpbmVTdGFydCArIDE7XG4gIH1cblxuICB2YXIgbGluZVN0YXJ0ID0gMDtcbiAgdmFyIGxpbmVFbmQgPSAwO1xuICB2YXIgbGluZVBhdHRlcm4gPSAvLiooPzpcXHJcXG4/fFxcbil8LiokL2c7XG4gIHZhciBsb2NhdG9yID0gZG9tQnVpbGRlci5sb2NhdG9yO1xuICB2YXIgcGFyc2VTdGFjayA9IFt7XG4gICAgY3VycmVudE5TTWFwOiBkZWZhdWx0TlNNYXBDb3B5XG4gIH1dO1xuICB2YXIgY2xvc2VNYXAgPSB7fTtcbiAgdmFyIHN0YXJ0ID0gMDtcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgdGFnU3RhcnQgPSBzb3VyY2UuaW5kZXhPZignPCcsIHN0YXJ0KTtcblxuICAgICAgaWYgKHRhZ1N0YXJ0IDwgMCkge1xuICAgICAgICBpZiAoIXNvdXJjZS5zdWJzdHIoc3RhcnQpLm1hdGNoKC9eXFxzKiQvKSkge1xuICAgICAgICAgIHZhciBkb2MgPSBkb21CdWlsZGVyLmRvYztcbiAgICAgICAgICB2YXIgdGV4dCA9IGRvYy5jcmVhdGVUZXh0Tm9kZShzb3VyY2Uuc3Vic3RyKHN0YXJ0KSk7XG4gICAgICAgICAgZG9jLmFwcGVuZENoaWxkKHRleHQpO1xuICAgICAgICAgIGRvbUJ1aWxkZXIuY3VycmVudEVsZW1lbnQgPSB0ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFnU3RhcnQgPiBzdGFydCkge1xuICAgICAgICBhcHBlbmRUZXh0KHRhZ1N0YXJ0KTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChzb3VyY2UuY2hhckF0KHRhZ1N0YXJ0ICsgMSkpIHtcbiAgICAgICAgY2FzZSAnLyc6XG4gICAgICAgICAgdmFyIGVuZCA9IHNvdXJjZS5pbmRleE9mKCc+JywgdGFnU3RhcnQgKyAzKTtcbiAgICAgICAgICB2YXIgdGFnTmFtZSA9IHNvdXJjZS5zdWJzdHJpbmcodGFnU3RhcnQgKyAyLCBlbmQpO1xuICAgICAgICAgIHZhciBjb25maWcgPSBwYXJzZVN0YWNrLnBvcCgpO1xuXG4gICAgICAgICAgaWYgKGVuZCA8IDApIHtcbiAgICAgICAgICAgIHRhZ05hbWUgPSBzb3VyY2Uuc3Vic3RyaW5nKHRhZ1N0YXJ0ICsgMikucmVwbGFjZSgvW1xcczxdLiovLCAnJyk7XG4gICAgICAgICAgICBlcnJvckhhbmRsZXIuZXJyb3IoXCJlbmQgdGFnIG5hbWU6IFwiICsgdGFnTmFtZSArICcgaXMgbm90IGNvbXBsZXRlOicgKyBjb25maWcudGFnTmFtZSk7XG4gICAgICAgICAgICBlbmQgPSB0YWdTdGFydCArIDEgKyB0YWdOYW1lLmxlbmd0aDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRhZ05hbWUubWF0Y2goL1xcczwvKSkge1xuICAgICAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUucmVwbGFjZSgvW1xcczxdLiovLCAnJyk7XG4gICAgICAgICAgICBlcnJvckhhbmRsZXIuZXJyb3IoXCJlbmQgdGFnIG5hbWU6IFwiICsgdGFnTmFtZSArICcgbWF5YmUgbm90IGNvbXBsZXRlJyk7XG4gICAgICAgICAgICBlbmQgPSB0YWdTdGFydCArIDEgKyB0YWdOYW1lLmxlbmd0aDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbG9jYWxOU01hcCA9IGNvbmZpZy5sb2NhbE5TTWFwO1xuICAgICAgICAgIHZhciBlbmRNYXRjaCA9IGNvbmZpZy50YWdOYW1lID09IHRhZ05hbWU7XG4gICAgICAgICAgdmFyIGVuZElnbm9yZUNhc2VNYWNoID0gZW5kTWF0Y2ggfHwgY29uZmlnLnRhZ05hbWUgJiYgY29uZmlnLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSB0YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICBpZiAoZW5kSWdub3JlQ2FzZU1hY2gpIHtcbiAgICAgICAgICAgIGRvbUJ1aWxkZXIuZW5kRWxlbWVudChjb25maWcudXJpLCBjb25maWcubG9jYWxOYW1lLCB0YWdOYW1lKTtcblxuICAgICAgICAgICAgaWYgKGxvY2FsTlNNYXApIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgcHJlZml4IGluIGxvY2FsTlNNYXApIHtcbiAgICAgICAgICAgICAgICBkb21CdWlsZGVyLmVuZFByZWZpeE1hcHBpbmcocHJlZml4KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWVuZE1hdGNoKSB7XG4gICAgICAgICAgICAgIGVycm9ySGFuZGxlci5mYXRhbEVycm9yKFwiZW5kIHRhZyBuYW1lOiBcIiArIHRhZ05hbWUgKyAnIGlzIG5vdCBtYXRjaCB0aGUgY3VycmVudCBzdGFydCB0YWdOYW1lOicgKyBjb25maWcudGFnTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNlU3RhY2sucHVzaChjb25maWcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVuZCsrO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJz8nOlxuICAgICAgICAgIGxvY2F0b3IgJiYgcG9zaXRpb24odGFnU3RhcnQpO1xuICAgICAgICAgIGVuZCA9IHBhcnNlSW5zdHJ1Y3Rpb24oc291cmNlLCB0YWdTdGFydCwgZG9tQnVpbGRlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnISc6XG4gICAgICAgICAgbG9jYXRvciAmJiBwb3NpdGlvbih0YWdTdGFydCk7XG4gICAgICAgICAgZW5kID0gcGFyc2VEQ0Moc291cmNlLCB0YWdTdGFydCwgZG9tQnVpbGRlciwgZXJyb3JIYW5kbGVyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGxvY2F0b3IgJiYgcG9zaXRpb24odGFnU3RhcnQpO1xuICAgICAgICAgIHZhciBlbCA9IG5ldyBFbGVtZW50QXR0cmlidXRlcygpO1xuICAgICAgICAgIHZhciBjdXJyZW50TlNNYXAgPSBwYXJzZVN0YWNrW3BhcnNlU3RhY2subGVuZ3RoIC0gMV0uY3VycmVudE5TTWFwO1xuICAgICAgICAgIHZhciBlbmQgPSBwYXJzZUVsZW1lbnRTdGFydFBhcnQoc291cmNlLCB0YWdTdGFydCwgZWwsIGN1cnJlbnROU01hcCwgZW50aXR5UmVwbGFjZXIsIGVycm9ySGFuZGxlcik7XG4gICAgICAgICAgdmFyIGxlbiA9IGVsLmxlbmd0aDtcblxuICAgICAgICAgIGlmICghZWwuY2xvc2VkICYmIGZpeFNlbGZDbG9zZWQoc291cmNlLCBlbmQsIGVsLnRhZ05hbWUsIGNsb3NlTWFwKSkge1xuICAgICAgICAgICAgZWwuY2xvc2VkID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKCFlbnRpdHlNYXAubmJzcCkge1xuICAgICAgICAgICAgICBlcnJvckhhbmRsZXIud2FybmluZygndW5jbG9zZWQgeG1sIGF0dHJpYnV0ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChsb2NhdG9yICYmIGxlbikge1xuICAgICAgICAgICAgdmFyIGxvY2F0b3IyID0gY29weUxvY2F0b3IobG9jYXRvciwge30pO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgIHZhciBhID0gZWxbaV07XG4gICAgICAgICAgICAgIHBvc2l0aW9uKGEub2Zmc2V0KTtcbiAgICAgICAgICAgICAgYS5sb2NhdG9yID0gY29weUxvY2F0b3IobG9jYXRvciwge30pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb21CdWlsZGVyLmxvY2F0b3IgPSBsb2NhdG9yMjtcblxuICAgICAgICAgICAgaWYgKGFwcGVuZEVsZW1lbnQoZWwsIGRvbUJ1aWxkZXIsIGN1cnJlbnROU01hcCkpIHtcbiAgICAgICAgICAgICAgcGFyc2VTdGFjay5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9tQnVpbGRlci5sb2NhdG9yID0gbG9jYXRvcjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGFwcGVuZEVsZW1lbnQoZWwsIGRvbUJ1aWxkZXIsIGN1cnJlbnROU01hcCkpIHtcbiAgICAgICAgICAgICAgcGFyc2VTdGFjay5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZWwudXJpID09PSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCcgJiYgIWVsLmNsb3NlZCkge1xuICAgICAgICAgICAgZW5kID0gcGFyc2VIdG1sU3BlY2lhbENvbnRlbnQoc291cmNlLCBlbmQsIGVsLnRhZ05hbWUsIGVudGl0eVJlcGxhY2VyLCBkb21CdWlsZGVyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW5kKys7XG4gICAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyb3JIYW5kbGVyLmVycm9yKCdlbGVtZW50IHBhcnNlIGVycm9yOiAnICsgZSk7XG4gICAgICBlbmQgPSAtMTtcbiAgICB9XG5cbiAgICBpZiAoZW5kID4gc3RhcnQpIHtcbiAgICAgIHN0YXJ0ID0gZW5kO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcHBlbmRUZXh0KE1hdGgubWF4KHRhZ1N0YXJ0LCBzdGFydCkgKyAxKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY29weUxvY2F0b3IoZiwgdCkge1xuICB0LmxpbmVOdW1iZXIgPSBmLmxpbmVOdW1iZXI7XG4gIHQuY29sdW1uTnVtYmVyID0gZi5jb2x1bW5OdW1iZXI7XG4gIHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBwYXJzZUVsZW1lbnRTdGFydFBhcnQoc291cmNlLCBzdGFydCwgZWwsIGN1cnJlbnROU01hcCwgZW50aXR5UmVwbGFjZXIsIGVycm9ySGFuZGxlcikge1xuICB2YXIgYXR0ck5hbWU7XG4gIHZhciB2YWx1ZTtcbiAgdmFyIHAgPSArK3N0YXJ0O1xuICB2YXIgcyA9IFNfVEFHO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIGMgPSBzb3VyY2UuY2hhckF0KHApO1xuXG4gICAgc3dpdGNoIChjKSB7XG4gICAgICBjYXNlICc9JzpcbiAgICAgICAgaWYgKHMgPT09IFNfQVRUUikge1xuICAgICAgICAgIGF0dHJOYW1lID0gc291cmNlLnNsaWNlKHN0YXJ0LCBwKTtcbiAgICAgICAgICBzID0gU19FUTtcbiAgICAgICAgfSBlbHNlIGlmIChzID09PSBTX0FUVFJfU1BBQ0UpIHtcbiAgICAgICAgICBzID0gU19FUTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2F0dHJpYnV0ZSBlcXVhbCBtdXN0IGFmdGVyIGF0dHJOYW1lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnXFwnJzpcbiAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgaWYgKHMgPT09IFNfRVEgfHwgcyA9PT0gU19BVFRSKSB7XG4gICAgICAgICAgICBpZiAocyA9PT0gU19BVFRSKSB7XG4gICAgICAgICAgICAgIGVycm9ySGFuZGxlci53YXJuaW5nKCdhdHRyaWJ1dGUgdmFsdWUgbXVzdCBhZnRlciBcIj1cIicpO1xuICAgICAgICAgICAgICBhdHRyTmFtZSA9IHNvdXJjZS5zbGljZShzdGFydCwgcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXJ0ID0gcCArIDE7XG4gICAgICAgICAgICBwID0gc291cmNlLmluZGV4T2YoYywgc3RhcnQpO1xuXG4gICAgICAgICAgICBpZiAocCA+IDApIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQsIHApLnJlcGxhY2UoLyYjP1xcdys7L2csIGVudGl0eVJlcGxhY2VyKTtcbiAgICAgICAgICAgICAgZWwuYWRkKGF0dHJOYW1lLCB2YWx1ZSwgc3RhcnQgLSAxKTtcbiAgICAgICAgICAgICAgcyA9IFNfQVRUUl9FTkQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2F0dHJpYnV0ZSB2YWx1ZSBubyBlbmQgXFwnJyArIGMgKyAnXFwnIG1hdGNoJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzID09IFNfQVRUUl9OT1FVT1RfVkFMVUUpIHtcbiAgICAgICAgICB2YWx1ZSA9IHNvdXJjZS5zbGljZShzdGFydCwgcCkucmVwbGFjZSgvJiM/XFx3KzsvZywgZW50aXR5UmVwbGFjZXIpO1xuICAgICAgICAgIGVsLmFkZChhdHRyTmFtZSwgdmFsdWUsIHN0YXJ0KTtcbiAgICAgICAgICBlcnJvckhhbmRsZXIud2FybmluZygnYXR0cmlidXRlIFwiJyArIGF0dHJOYW1lICsgJ1wiIG1pc3NlZCBzdGFydCBxdW90KCcgKyBjICsgJykhIScpO1xuICAgICAgICAgIHN0YXJ0ID0gcCArIDE7XG4gICAgICAgICAgcyA9IFNfQVRUUl9FTkQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhdHRyaWJ1dGUgdmFsdWUgbXVzdCBhZnRlciBcIj1cIicpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJy8nOlxuICAgICAgICBzd2l0Y2ggKHMpIHtcbiAgICAgICAgICBjYXNlIFNfVEFHOlxuICAgICAgICAgICAgZWwuc2V0VGFnTmFtZShzb3VyY2Uuc2xpY2Uoc3RhcnQsIHApKTtcblxuICAgICAgICAgIGNhc2UgU19BVFRSX0VORDpcbiAgICAgICAgICBjYXNlIFNfVEFHX1NQQUNFOlxuICAgICAgICAgIGNhc2UgU19UQUdfQ0xPU0U6XG4gICAgICAgICAgICBzID0gU19UQUdfQ0xPU0U7XG4gICAgICAgICAgICBlbC5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgICAgY2FzZSBTX0FUVFJfTk9RVU9UX1ZBTFVFOlxuICAgICAgICAgIGNhc2UgU19BVFRSOlxuICAgICAgICAgIGNhc2UgU19BVFRSX1NQQUNFOlxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXR0cmlidXRlIGludmFsaWQgY2xvc2UgY2hhcignLycpXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJyc6XG4gICAgICAgIGVycm9ySGFuZGxlci5lcnJvcigndW5leHBlY3RlZCBlbmQgb2YgaW5wdXQnKTtcblxuICAgICAgICBpZiAocyA9PSBTX1RBRykge1xuICAgICAgICAgIGVsLnNldFRhZ05hbWUoc291cmNlLnNsaWNlKHN0YXJ0LCBwKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcDtcblxuICAgICAgY2FzZSAnPic6XG4gICAgICAgIHN3aXRjaCAocykge1xuICAgICAgICAgIGNhc2UgU19UQUc6XG4gICAgICAgICAgICBlbC5zZXRUYWdOYW1lKHNvdXJjZS5zbGljZShzdGFydCwgcCkpO1xuXG4gICAgICAgICAgY2FzZSBTX0FUVFJfRU5EOlxuICAgICAgICAgIGNhc2UgU19UQUdfU1BBQ0U6XG4gICAgICAgICAgY2FzZSBTX1RBR19DTE9TRTpcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBTX0FUVFJfTk9RVU9UX1ZBTFVFOlxuICAgICAgICAgIGNhc2UgU19BVFRSOlxuICAgICAgICAgICAgdmFsdWUgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQsIHApO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UoLTEpID09PSAnLycpIHtcbiAgICAgICAgICAgICAgZWwuY2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlIFNfQVRUUl9TUEFDRTpcbiAgICAgICAgICAgIGlmIChzID09PSBTX0FUVFJfU1BBQ0UpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBhdHRyTmFtZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHMgPT0gU19BVFRSX05PUVVPVF9WQUxVRSkge1xuICAgICAgICAgICAgICBlcnJvckhhbmRsZXIud2FybmluZygnYXR0cmlidXRlIFwiJyArIHZhbHVlICsgJ1wiIG1pc3NlZCBxdW90KFwiKSEhJyk7XG4gICAgICAgICAgICAgIGVsLmFkZChhdHRyTmFtZSwgdmFsdWUucmVwbGFjZSgvJiM/XFx3KzsvZywgZW50aXR5UmVwbGFjZXIpLCBzdGFydCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoY3VycmVudE5TTWFwWycnXSAhPT0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnIHx8ICF2YWx1ZS5tYXRjaCgvXig/OmRpc2FibGVkfGNoZWNrZWR8c2VsZWN0ZWQpJC9pKSkge1xuICAgICAgICAgICAgICAgIGVycm9ySGFuZGxlci53YXJuaW5nKCdhdHRyaWJ1dGUgXCInICsgdmFsdWUgKyAnXCIgbWlzc2VkIHZhbHVlISEgXCInICsgdmFsdWUgKyAnXCIgaW5zdGVhZCEhJyk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBlbC5hZGQodmFsdWUsIHZhbHVlLCBzdGFydCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBTX0VROlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhdHRyaWJ1dGUgdmFsdWUgbWlzc2VkISEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwO1xuXG4gICAgICBjYXNlIFwiXFx4ODBcIjpcbiAgICAgICAgYyA9ICcgJztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGMgPD0gJyAnKSB7XG4gICAgICAgICAgc3dpdGNoIChzKSB7XG4gICAgICAgICAgICBjYXNlIFNfVEFHOlxuICAgICAgICAgICAgICBlbC5zZXRUYWdOYW1lKHNvdXJjZS5zbGljZShzdGFydCwgcCkpO1xuICAgICAgICAgICAgICBzID0gU19UQUdfU1BBQ0U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFNfQVRUUjpcbiAgICAgICAgICAgICAgYXR0ck5hbWUgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQsIHApO1xuICAgICAgICAgICAgICBzID0gU19BVFRSX1NQQUNFO1xuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBTX0FUVFJfTk9RVU9UX1ZBTFVFOlxuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQsIHApLnJlcGxhY2UoLyYjP1xcdys7L2csIGVudGl0eVJlcGxhY2VyKTtcbiAgICAgICAgICAgICAgZXJyb3JIYW5kbGVyLndhcm5pbmcoJ2F0dHJpYnV0ZSBcIicgKyB2YWx1ZSArICdcIiBtaXNzZWQgcXVvdChcIikhIScpO1xuICAgICAgICAgICAgICBlbC5hZGQoYXR0ck5hbWUsIHZhbHVlLCBzdGFydCk7XG5cbiAgICAgICAgICAgIGNhc2UgU19BVFRSX0VORDpcbiAgICAgICAgICAgICAgcyA9IFNfVEFHX1NQQUNFO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3dpdGNoIChzKSB7XG4gICAgICAgICAgICBjYXNlIFNfQVRUUl9TUEFDRTpcbiAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBlbC50YWdOYW1lO1xuXG4gICAgICAgICAgICAgIGlmIChjdXJyZW50TlNNYXBbJyddICE9PSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCcgfHwgIWF0dHJOYW1lLm1hdGNoKC9eKD86ZGlzYWJsZWR8Y2hlY2tlZHxzZWxlY3RlZCkkL2kpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JIYW5kbGVyLndhcm5pbmcoJ2F0dHJpYnV0ZSBcIicgKyBhdHRyTmFtZSArICdcIiBtaXNzZWQgdmFsdWUhISBcIicgKyBhdHRyTmFtZSArICdcIiBpbnN0ZWFkMiEhJyk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBlbC5hZGQoYXR0ck5hbWUsIGF0dHJOYW1lLCBzdGFydCk7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gcDtcbiAgICAgICAgICAgICAgcyA9IFNfQVRUUjtcbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgU19BVFRSX0VORDpcbiAgICAgICAgICAgICAgZXJyb3JIYW5kbGVyLndhcm5pbmcoJ2F0dHJpYnV0ZSBzcGFjZSBpcyByZXF1aXJlZFwiJyArIGF0dHJOYW1lICsgJ1wiISEnKTtcblxuICAgICAgICAgICAgY2FzZSBTX1RBR19TUEFDRTpcbiAgICAgICAgICAgICAgcyA9IFNfQVRUUjtcbiAgICAgICAgICAgICAgc3RhcnQgPSBwO1xuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBTX0VROlxuICAgICAgICAgICAgICBzID0gU19BVFRSX05PUVVPVF9WQUxVRTtcbiAgICAgICAgICAgICAgc3RhcnQgPSBwO1xuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBTX1RBR19DTE9TRTpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZWxlbWVudHMgY2xvc2VkIGNoYXJhY3RlciAnLycgYW5kICc+JyBtdXN0IGJlIGNvbm5lY3RlZCB0b1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHArKztcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBlbmRFbGVtZW50KGVsLCBkb21CdWlsZGVyLCBjdXJyZW50TlNNYXApIHtcbiAgdmFyIHRhZ05hbWUgPSBlbC50YWdOYW1lO1xuICB2YXIgbG9jYWxOU01hcCA9IG51bGw7XG4gIHZhciBpID0gZWwubGVuZ3RoO1xuXG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIgYSA9IGVsW2ldO1xuICAgIHZhciBxTmFtZSA9IGEucU5hbWU7XG4gICAgdmFyIHZhbHVlID0gYS52YWx1ZTtcbiAgICB2YXIgbnNwID0gcU5hbWUuaW5kZXhPZignOicpO1xuXG4gICAgaWYgKG5zcCA+IDApIHtcbiAgICAgIHZhciBwcmVmaXggPSBhLnByZWZpeCA9IHFOYW1lLnNsaWNlKDAsIG5zcCk7XG4gICAgICB2YXIgbG9jYWxOYW1lID0gcU5hbWUuc2xpY2UobnNwICsgMSk7XG4gICAgICB2YXIgbnNQcmVmaXggPSBwcmVmaXggPT09ICd4bWxucycgJiYgbG9jYWxOYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbE5hbWUgPSBxTmFtZTtcbiAgICAgIHByZWZpeCA9IG51bGw7XG4gICAgICBuc1ByZWZpeCA9IHFOYW1lID09PSAneG1sbnMnICYmICcnO1xuICAgIH1cblxuICAgIGEubG9jYWxOYW1lID0gbG9jYWxOYW1lO1xuXG4gICAgaWYgKG5zUHJlZml4ICE9PSBmYWxzZSkge1xuICAgICAgaWYgKGxvY2FsTlNNYXAgPT0gbnVsbCkge1xuICAgICAgICBsb2NhbE5TTWFwID0ge307XG5cbiAgICAgICAgX2NvcHkoY3VycmVudE5TTWFwLCBjdXJyZW50TlNNYXAgPSB7fSk7XG4gICAgICB9XG5cbiAgICAgIGN1cnJlbnROU01hcFtuc1ByZWZpeF0gPSBsb2NhbE5TTWFwW25zUHJlZml4XSA9IHZhbHVlO1xuICAgICAgYS51cmkgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC94bWxucy8nO1xuICAgICAgZG9tQnVpbGRlci5zdGFydFByZWZpeE1hcHBpbmcobnNQcmVmaXgsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgaSA9IGVsLmxlbmd0aDtcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgYSA9IGVsW2ldO1xuICAgIHZhciBwcmVmaXggPSBhLnByZWZpeDtcblxuICAgIGlmIChwcmVmaXgpIHtcbiAgICAgIGlmIChwcmVmaXggPT09ICd4bWwnKSB7XG4gICAgICAgIGEudXJpID0gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcmVmaXggIT09ICd4bWxucycpIHtcbiAgICAgICAgYS51cmkgPSBjdXJyZW50TlNNYXBbcHJlZml4IHx8ICcnXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2YXIgbnNwID0gdGFnTmFtZS5pbmRleE9mKCc6Jyk7XG5cbiAgaWYgKG5zcCA+IDApIHtcbiAgICBwcmVmaXggPSBlbC5wcmVmaXggPSB0YWdOYW1lLnNsaWNlKDAsIG5zcCk7XG4gICAgbG9jYWxOYW1lID0gZWwubG9jYWxOYW1lID0gdGFnTmFtZS5zbGljZShuc3AgKyAxKTtcbiAgfSBlbHNlIHtcbiAgICBwcmVmaXggPSBudWxsO1xuICAgIGxvY2FsTmFtZSA9IGVsLmxvY2FsTmFtZSA9IHRhZ05hbWU7XG4gIH1cblxuICB2YXIgbnMgPSBlbC51cmkgPSBjdXJyZW50TlNNYXBbcHJlZml4IHx8ICcnXTtcbiAgZG9tQnVpbGRlci5zdGFydEVsZW1lbnQobnMsIGxvY2FsTmFtZSwgdGFnTmFtZSwgZWwpO1xuXG4gIGlmIChlbC5jbG9zZWQpIHtcbiAgICBkb21CdWlsZGVyLmVuZEVsZW1lbnQobnMsIGxvY2FsTmFtZSwgdGFnTmFtZSk7XG5cbiAgICBpZiAobG9jYWxOU01hcCkge1xuICAgICAgZm9yIChwcmVmaXggaW4gbG9jYWxOU01hcCkge1xuICAgICAgICBkb21CdWlsZGVyLmVuZFByZWZpeE1hcHBpbmcocHJlZml4KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZWwuY3VycmVudE5TTWFwID0gY3VycmVudE5TTWFwO1xuICAgIGVsLmxvY2FsTlNNYXAgPSBsb2NhbE5TTWFwO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlSHRtbFNwZWNpYWxDb250ZW50KHNvdXJjZSwgZWxTdGFydEVuZCwgdGFnTmFtZSwgZW50aXR5UmVwbGFjZXIsIGRvbUJ1aWxkZXIpIHtcbiAgaWYgKC9eKD86c2NyaXB0fHRleHRhcmVhKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgdmFyIGVsRW5kU3RhcnQgPSBzb3VyY2UuaW5kZXhPZignPC8nICsgdGFnTmFtZSArICc+JywgZWxTdGFydEVuZCk7XG4gICAgdmFyIHRleHQgPSBzb3VyY2Uuc3Vic3RyaW5nKGVsU3RhcnRFbmQgKyAxLCBlbEVuZFN0YXJ0KTtcblxuICAgIGlmICgvWyY8XS8udGVzdCh0ZXh0KSkge1xuICAgICAgaWYgKC9ec2NyaXB0JC9pLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgICAgZG9tQnVpbGRlci5jaGFyYWN0ZXJzKHRleHQsIDAsIHRleHQubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIGVsRW5kU3RhcnQ7XG4gICAgICB9XG5cbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYjP1xcdys7L2csIGVudGl0eVJlcGxhY2VyKTtcbiAgICAgIGRvbUJ1aWxkZXIuY2hhcmFjdGVycyh0ZXh0LCAwLCB0ZXh0Lmxlbmd0aCk7XG4gICAgICByZXR1cm4gZWxFbmRTdGFydDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZWxTdGFydEVuZCArIDE7XG59XG5cbmZ1bmN0aW9uIGZpeFNlbGZDbG9zZWQoc291cmNlLCBlbFN0YXJ0RW5kLCB0YWdOYW1lLCBjbG9zZU1hcCkge1xuICB2YXIgcG9zID0gY2xvc2VNYXBbdGFnTmFtZV07XG5cbiAgaWYgKHBvcyA9PSBudWxsKSB7XG4gICAgcG9zID0gc291cmNlLmxhc3RJbmRleE9mKCc8LycgKyB0YWdOYW1lICsgJz4nKTtcblxuICAgIGlmIChwb3MgPCBlbFN0YXJ0RW5kKSB7XG4gICAgICBwb3MgPSBzb3VyY2UubGFzdEluZGV4T2YoJzwvJyArIHRhZ05hbWUpO1xuICAgIH1cblxuICAgIGNsb3NlTWFwW3RhZ05hbWVdID0gcG9zO1xuICB9XG5cbiAgcmV0dXJuIHBvcyA8IGVsU3RhcnRFbmQ7XG59XG5cbmZ1bmN0aW9uIF9jb3B5KHNvdXJjZSwgdGFyZ2V0KSB7XG4gIGZvciAodmFyIG4gaW4gc291cmNlKSB7XG4gICAgdGFyZ2V0W25dID0gc291cmNlW25dO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlRENDKHNvdXJjZSwgc3RhcnQsIGRvbUJ1aWxkZXIsIGVycm9ySGFuZGxlcikge1xuICB2YXIgbmV4dCA9IHNvdXJjZS5jaGFyQXQoc3RhcnQgKyAyKTtcblxuICBzd2l0Y2ggKG5leHQpIHtcbiAgICBjYXNlICctJzpcbiAgICAgIGlmIChzb3VyY2UuY2hhckF0KHN0YXJ0ICsgMykgPT09ICctJykge1xuICAgICAgICB2YXIgZW5kID0gc291cmNlLmluZGV4T2YoJy0tPicsIHN0YXJ0ICsgNCk7XG5cbiAgICAgICAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgICAgICAgZG9tQnVpbGRlci5jb21tZW50KHNvdXJjZSwgc3RhcnQgKyA0LCBlbmQgLSBzdGFydCAtIDQpO1xuICAgICAgICAgIHJldHVybiBlbmQgKyAzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVycm9ySGFuZGxlci5lcnJvcihcIlVuY2xvc2VkIGNvbW1lbnRcIik7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG5cbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKHNvdXJjZS5zdWJzdHIoc3RhcnQgKyAzLCA2KSA9PSAnQ0RBVEFbJykge1xuICAgICAgICB2YXIgZW5kID0gc291cmNlLmluZGV4T2YoJ11dPicsIHN0YXJ0ICsgOSk7XG4gICAgICAgIGRvbUJ1aWxkZXIuc3RhcnRDREFUQSgpO1xuICAgICAgICBkb21CdWlsZGVyLmNoYXJhY3RlcnMoc291cmNlLCBzdGFydCArIDksIGVuZCAtIHN0YXJ0IC0gOSk7XG4gICAgICAgIGRvbUJ1aWxkZXIuZW5kQ0RBVEEoKTtcbiAgICAgICAgcmV0dXJuIGVuZCArIDM7XG4gICAgICB9XG5cbiAgICAgIHZhciBtYXRjaHMgPSBzcGxpdChzb3VyY2UsIHN0YXJ0KTtcbiAgICAgIHZhciBsZW4gPSBtYXRjaHMubGVuZ3RoO1xuXG4gICAgICBpZiAobGVuID4gMSAmJiAvIWRvY3R5cGUvaS50ZXN0KG1hdGNoc1swXVswXSkpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBtYXRjaHNbMV1bMF07XG4gICAgICAgIHZhciBwdWJpZCA9IGxlbiA+IDMgJiYgL15wdWJsaWMkL2kudGVzdChtYXRjaHNbMl1bMF0pICYmIG1hdGNoc1szXVswXTtcbiAgICAgICAgdmFyIHN5c2lkID0gbGVuID4gNCAmJiBtYXRjaHNbNF1bMF07XG4gICAgICAgIHZhciBsYXN0TWF0Y2ggPSBtYXRjaHNbbGVuIC0gMV07XG4gICAgICAgIGRvbUJ1aWxkZXIuc3RhcnREVEQobmFtZSwgcHViaWQgJiYgcHViaWQucmVwbGFjZSgvXihbJ1wiXSkoLio/KVxcMSQvLCAnJDInKSwgc3lzaWQgJiYgc3lzaWQucmVwbGFjZSgvXihbJ1wiXSkoLio/KVxcMSQvLCAnJDInKSk7XG4gICAgICAgIGRvbUJ1aWxkZXIuZW5kRFREKCk7XG4gICAgICAgIHJldHVybiBsYXN0TWF0Y2guaW5kZXggKyBsYXN0TWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfVxuXG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSW5zdHJ1Y3Rpb24oc291cmNlLCBzdGFydCwgZG9tQnVpbGRlcikge1xuICB2YXIgZW5kID0gc291cmNlLmluZGV4T2YoJz8+Jywgc3RhcnQpO1xuXG4gIGlmIChlbmQpIHtcbiAgICB2YXIgbWF0Y2ggPSBzb3VyY2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpLm1hdGNoKC9ePFxcPyhcXFMqKVxccyooW1xcc1xcU10qPylcXHMqJC8pO1xuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICB2YXIgbGVuID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgZG9tQnVpbGRlci5wcm9jZXNzaW5nSW5zdHJ1Y3Rpb24obWF0Y2hbMV0sIG1hdGNoWzJdKTtcbiAgICAgIHJldHVybiBlbmQgKyAyO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBFbGVtZW50QXR0cmlidXRlcyhzb3VyY2UpIHt9XG5cbkVsZW1lbnRBdHRyaWJ1dGVzLnByb3RvdHlwZSA9IHtcbiAgc2V0VGFnTmFtZTogZnVuY3Rpb24gc2V0VGFnTmFtZSh0YWdOYW1lKSB7XG4gICAgaWYgKCF0YWdOYW1lUGF0dGVybi50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgdGFnTmFtZTonICsgdGFnTmFtZSk7XG4gICAgfVxuXG4gICAgdGhpcy50YWdOYW1lID0gdGFnTmFtZTtcbiAgfSxcbiAgYWRkOiBmdW5jdGlvbiBhZGQocU5hbWUsIHZhbHVlLCBvZmZzZXQpIHtcbiAgICBpZiAoIXRhZ05hbWVQYXR0ZXJuLnRlc3QocU5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgYXR0cmlidXRlOicgKyBxTmFtZSk7XG4gICAgfVxuXG4gICAgdGhpc1t0aGlzLmxlbmd0aCsrXSA9IHtcbiAgICAgIHFOYW1lOiBxTmFtZSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIG9mZnNldDogb2Zmc2V0XG4gICAgfTtcbiAgfSxcbiAgbGVuZ3RoOiAwLFxuICBnZXRMb2NhbE5hbWU6IGZ1bmN0aW9uIGdldExvY2FsTmFtZShpKSB7XG4gICAgcmV0dXJuIHRoaXNbaV0ubG9jYWxOYW1lO1xuICB9LFxuICBnZXRMb2NhdG9yOiBmdW5jdGlvbiBnZXRMb2NhdG9yKGkpIHtcbiAgICByZXR1cm4gdGhpc1tpXS5sb2NhdG9yO1xuICB9LFxuICBnZXRRTmFtZTogZnVuY3Rpb24gZ2V0UU5hbWUoaSkge1xuICAgIHJldHVybiB0aGlzW2ldLnFOYW1lO1xuICB9LFxuICBnZXRVUkk6IGZ1bmN0aW9uIGdldFVSSShpKSB7XG4gICAgcmV0dXJuIHRoaXNbaV0udXJpO1xuICB9LFxuICBnZXRWYWx1ZTogZnVuY3Rpb24gZ2V0VmFsdWUoaSkge1xuICAgIHJldHVybiB0aGlzW2ldLnZhbHVlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBzcGxpdChzb3VyY2UsIHN0YXJ0KSB7XG4gIHZhciBtYXRjaDtcbiAgdmFyIGJ1ZiA9IFtdO1xuICB2YXIgcmVnID0gLydbXiddKyd8XCJbXlwiXStcInxbXlxcczw+XFwvPV0rPT98KFxcLz9cXHMqPnw8KS9nO1xuICByZWcubGFzdEluZGV4ID0gc3RhcnQ7XG4gIHJlZy5leGVjKHNvdXJjZSk7XG5cbiAgd2hpbGUgKG1hdGNoID0gcmVnLmV4ZWMoc291cmNlKSkge1xuICAgIGJ1Zi5wdXNoKG1hdGNoKTtcbiAgICBpZiAobWF0Y2hbMV0pIHJldHVybiBidWY7XG4gIH1cbn1cblxuZXhwb3J0cy5YTUxSZWFkZXIgPSBYTUxSZWFkZXI7XG5cbn0se31dfSx7fSxbNTddKTtcbiJdLCJmaWxlIjoid2ViLWFkYXB0ZXIuanMifQ==
