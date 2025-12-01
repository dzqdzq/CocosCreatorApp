"use strict";
Vue.component("cc-audio-preview", {
  template:
    '\n    <div :style="cssHost" class="layout vertical">\n      <div class="toolbar">\n        <ui-button class="transparent green" @confirm="playOrPause">\n          <i class="{{state === \'playing\' ? \'icon-pause\' : \'icon-play\'}}"></i>\n        </ui-button>\n\n        <ui-button class="transparent red" @confirm="stop">\n          <i class="icon-stop"></i>\n        </ui-button>\n\n        <ui-button class="transparent blue" @confirm="replay">\n          <i class="icon-cw"></i>\n        </ui-button>\n      </div>\n\n      <div :style="cssView" class="flex-1">\n        <div v-el:content :style="cssContent">\n          <canvas v-el:canvas class="fit" @mousedown="mouseDown"></canvas>\n          <div v-el:progress-bar :style="cssProgressBar" hidden @mousedown="mouseDown">\n            <div :style="cssBar"></div>\n          </div>\n        </div>\n        <div :style="[cssLabel, cssAudioInfo]">{{ audioInfo }}</div>\n        <div :style="[cssLabel, cssTimeInfo]">{{ timeInfo }}</div>\n        <ui-loader v-el:loader hidden>\n          {{ _T(\'SHARED.loading\') }}\n        </ui-loader>\n      </div>\n    </div>\n  ',
  data: () => ({
    cssHost: { position: "relative", height: "300px", overflow: "hidden" },
    cssView: {
      position: "relative",
      boxShadow: "inset 0 0 15px 5px rgba(0,0,0,0.5)",
      background: "#292929",
    },
    cssContent: {
      position: "absolute",
      top: "15px",
      right: "15px",
      bottom: "15px",
      left: "15px",
    },
    cssProgressBar: {
      position: "absolute",
      marginLeft: "-4px",
      marginRight: "-4px",
      width: "10px",
      height: "100%",
      cursor: "ew-resize",
    },
    cssBar: {
      position: "absolute",
      left: "4px",
      width: "1px",
      height: "100%",
      backgroundColor: "#09f",
      cursor: "ew-resize",
    },
    cssLabel: {
      position: "absolute",
      textAlign: "center",
      width: "100%",
      color: "#aaa",
    },
    cssAudioInfo: { right: "5px", top: "4px" },
    cssTimeInfo: { right: "5px", bottom: "4px" },
    audioInfo: "",
    timeInfo: "",
    state: "stopped",
  }),
  props: { target: Object },
  watch: { "target.uuid": "_updateAudio", "target.__mtime__": "_updateAudio" },
  compiled() {
    this._updateAudio();
  },
  destroyed() {
    if (this._sessionId) {
      Editor.Audio.cancel(this._sessionId);
      this._sessionId = null;
    }

    if (this._audioCtrl) {
      this._audioCtrl.stop();
      this._audioCtrl = null;
    }

    clearTimeout(this._loaderID);
    this._destroyed = true;
  },
  methods: {
    _T: Editor.T,
    _reset() {
      if (this._sessionId) {
        Editor.Audio.cancel(this._sessionId);
        this._sessionId = null;
      }

      if (this._audioCtrl) {
        this._audioCtrl.stop();
        this._audioCtrl = null;
      }

      let t = this.$els.canvas.getContext("2d");

      if (t) {
        t.clearRect(0, 0, this.$els.canvas.width, this.$els.canvas.height);
      }

      this.$els.progressBar.hidden = true;
      this.audioInfo = "";
      this.timeInfo = "";
    },
    _updateAudio() {
      this._reset();
      if (!this.target.uuid) {
        return;
      }
      this.showLoaderAfter(100);
      let t = this.target.uuid;
      let i = `uuid://${this.target.uuid}?${this.target.__mtime__}`;

      this._sessionId = Editor.Audio.load(i, (i, e) => {
        if (!this._destroyed && t === this.target.uuid) {
          this.hideLoader();
          if (i) {
            Editor.error(`Failed to decoding audio data: ${i.message}`);
            return;
          }

          e.on("started", () => {
            this.state = this._audioCtrl.state();
            this._tickProgress();
          });

          e.on("ended", () => {
            this.state = this._audioCtrl.state();
          });

          e.on("paused", () => {
            this.state = this._audioCtrl.state();
          });

          this._audioCtrl = e;
          this._updateAudioInfo();
          this.setProgress(0);
          this.resize();
        }
      });
    },
    _playIconClass: (t) => ("playing" === t ? "fa fa-pause" : "fa fa-play"),
    playOrPause() {
      if (this._audioCtrl) {
        if ("playing" === this.state) {
          this._audioCtrl.pause();
        } else {
          this._audioCtrl.resume();
        }
      }
    },
    replay() {
      if (this._audioCtrl) {
        this._audioCtrl.play();
      }
    },
    stop() {
      if (this._audioCtrl) {
        this._audioCtrl.stop();
      }
    },
    mouseDown(t) {
      t.stopPropagation();
      if ((1 === t.which)) {
        let i = this.$els.content.getBoundingClientRect().left;
        let e = t.clientX - i;

        let s = (e = Editor.Math.clamp(e, 0, this._contentRectWidth)) /
        this._contentRectWidth;

        let a = this._audioCtrl.buffer().duration;

        if ("playing" === this.state) {
          this._audioCtrl.play(s * a);
        } else {
          this.setProgress(s);
        }

        Editor.UI.startDrag(
          "ew-resize",
          t,
          (t) => {
            let e = t.clientX - i;

            let s = (e = Editor.Math.clamp(e, 0, this._contentRectWidth)) /
            this._contentRectWidth;

            let a = this._audioCtrl.buffer().duration;

            if ("playing" === this.state) {
              this._audioCtrl.play(s * a);
            } else {
              this.setProgress(s);
            }
          },
          (t) => {
            if ("playing" === this.state) {
              return;
            }
            let e = t.clientX - i;

            let s = (e = Editor.Math.clamp(e, 0, this._contentRectWidth)) /
            this._contentRectWidth;

            let a = this._audioCtrl.buffer().duration;
            this._audioCtrl.play(s * a);
          }
        );
      }
    },
    resize() {
      var t = this.$els.content.getBoundingClientRect();

      if (Editor.isRetina) {
        this.$els.canvas.width = 2 * t.width;
        this.$els.canvas.height = 2 * t.height;
      } else {
        this.$els.canvas.width = t.width;
        this.$els.canvas.height = t.height;
      }

      this.$els.canvas.style.width = t.width + "px";
      this.$els.canvas.style.height = t.height + "px";
      this._contentRectWidth = t.width;
      this.repaint();
    },
    _updateAudioInfo() {
      let t = this._audioCtrl.buffer();
      this.audioInfo = `ch:${t.numberOfChannels}, ${t.sampleRate}Hz`;
    },
    _updateTimeInfo(t) {
      let i = this._audioCtrl.buffer().duration;
      let e = new Date(t * i * 1e3);
      let s = Editor.Utils.padLeft(e.getMinutes(), 2, "0");
      let a = Editor.Utils.padLeft(e.getSeconds(), 2, "0");
      let o = Editor.Utils.padLeft(e.getMilliseconds(), 3, "0");
      this.timeInfo = `${s}:${a}.${o}`;
    },
    setProgress(t) {
      let i = Math.floor(t * this._contentRectWidth);
      this.$els.progressBar.hidden = false;
      this.$els.progressBar.style.transform = `translateX(${i}px)`;
      this._updateTimeInfo(t);
    },
    repaint() {
      if (!this._audioCtrl) {
        return;
      }
      let t = this.$els.canvas.getContext("2d");
      t.imageSmoothingEnabled = false;
      t.clearRect(0, 0, this.$els.canvas.width, this.$els.canvas.height);
      let i = this._audioCtrl.buffer();
      let e = null;
      let s = this.$els.canvas.height / i.numberOfChannels;
      let a = 0;
      for (let o = 0; o < i.numberOfChannels; ++o) {
        e = this._getPeaks(i, o, this.$els.canvas.width);
        this._drawWave(t, e, 0, a, this.$els.canvas.width, s);

        if (i.numberOfChannels > 1) {
          this._drawChannelTip(t, o, a);
        }

        a += s;
      }
    },
    showLoaderAfter(t) {
      if (this.$els.loader.hidden) {
        if (!this._loaderID) {
          this._loaderID = setTimeout(() => {
            this._loaderID = null;
            this.$els.loader.hidden = false;
          }, t);
        }
      }
    },
    hideLoader() {
      clearTimeout(this._loaderID);
      this._loaderID = null;
      this.$els.loader.hidden = true;
    },
    _getPeaks(t, i, e) {
      let s = t.length / e;
      let a = ~~(s / 10) || 1;
      let o = new Float32Array(e);
      let n = t.getChannelData(i);
      for (let t = 0; t < e; t++) {
        let i = ~~(t * s);
        let e = ~~(i + s);
        let r = 0;
        for (let t = i; t < e; t += a) {
          let i = n[t];

          if (i > r) {
            r = i;
          } else {
            if (-i > r) {
              r = -i;
            }
          }
        }
        o[t] = r;
      }
      return o;
    },
    _drawChannelTip: function (t, i, e) {
      let s = 0;
      t.fillStyle = "#aaa";

      if (Editor.isRetina) {
        t.font = "24px Arial";
        s = 24;
      } else {
        t.font = "12px Arial";
        s = 12;
      }

      t.fillText("ch" + (i + 1), 4, e + s);
    },
    _drawWave(t, i, e, s, a, o) {
      let n = 0;
      n = Editor.isRetina ? 0.25 : 0.5;
      let r = o / 2;
      let l = s + r;
      let d = i.length;
      let h = 1;
      t.fillStyle = "#ff8e00";

      if (a !== d) {
        h = a / d;
      }

      t.beginPath();
      t.moveTo(n, l);
      for (let e = 0; e < d; e++) {
        let s = Math.round(i[e] * r);
        t.lineTo(e * h + n, l + s);
      }
      t.lineTo(a + n, l);
      t.moveTo(n, l);
      for (let e = 0; e < d; e++) {
        let s = Math.round(i[e] * r);
        t.lineTo(e * h + n, l - s);
      }
      t.lineTo(a + n, l);
      t.fill();
      t.fillRect(0, l - n, a, 2 * n);
    },
    _tickProgress() {
      window.requestAnimationFrame(() => {
        if (!this._audioCtrl) {
          return;
        }
        if ("stopped" === this.state) {
          this.setProgress(0);
          return;
        }
        if ("paused" === this.state) {
          return;
        }
        let t = this._audioCtrl.buffer().duration;
        let i = (this._audioCtrl.time() % t) / t;
        this.setProgress(i);
        this._tickProgress();
      });
    },
  },
});
