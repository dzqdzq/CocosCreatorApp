"use strict";
Vue.component("cc-image-preview", {
  template:
    '\n    <div :style="cssHost">\n      <div v-el:content :style="cssContent">\n        <canvas v-el:canvas class="fit" :style="cssCanvas" width=1 height=1></canvas>\n      </div>\n      <div :style="cssLabels" class="layout horizontal center-center">\n        <div :style="cssLabel">{{ info }}</div>\n      </div>\n    </div>\n  ',
  compiled() {
    this._loadImage();
  },
  destroyed() {
    this._destroyed = true;
  },
  data: () => ({
    cssHost: {
      position: "relative",
      height: "300px",
      overflow: "hidden",
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
    cssCanvas: {
      margin: "auto",
      display: "block",
      backgroundImage:
        "url('packages://inspector/static/checkerboard-32x32.png')",
      backgroundSize: "32px 32px",
      backgroundPosition: "center center",
    },
    cssLabels: { position: "absolute", bottom: "10px", width: "100%" },
    cssLabel: {
      textAlign: "center",
      padding: "2px 10px",
      fontSize: "10px",
      fontWeight: "bold",
      borderRadius: "3px",
      color: "#fff",
      background: "#4281b6",
    },
    info: "0 x 0",
  }),
  props: { target: Object, uuid: String },
  watch: {
    uuid: "_loadImage",
    "target.__mtime__": "_loadImage",
    target: { handler: "_updateImage", deep: true },
  },
  methods: {
    _loadImage() {
      if (this.uuid) {
        this._image = new Image();

        this._image.onload = () => {
          if (!this._destroyed) {
            this._updateImage();
          }
        };

        this._image.src = "uuid://" + this.uuid + "?" + this.target.__mtime__;
      }
    },
    _updateImage() {
      let t = this._getSize();
      this.info = t.width + " x " + t.height;
      this.resize();
    },
    _getSize() {
      let t = 0;
      let e = 0;

      if ("texture" === this.target.__assetType__) {
        t = this._image.width;
        e = this._image.height;
      } else {
        if ("sprite-frame" === this.target.__assetType__) {
          t = this.target.width;
          e = this.target.height;
        }
      }

      return { width: t, height: e };
    },
    resize() {
      let t = this.$els.content.getBoundingClientRect();
      let e = this._getSize();
      let i = Editor.Utils.fitSize(e.width, e.height, t.width, t.height);

      if (this.target.rotated) {
        this._scalingSize = {
            width: Math.ceil(i[1]),
            height: Math.ceil(i[0]),
          };
      }

      this.$els.canvas.width = Math.ceil(i[0]);
      this.$els.canvas.height = Math.ceil(i[1]);
      this.repaint();
    },
    repaint() {
      if (!this.target || !this._image) {
        return;
      }
      let t = this.$els.canvas.getContext("2d");
      t.imageSmoothingEnabled = false;
      let e = this.$els.canvas.width;
      let i = this.$els.canvas.height;
      if ("texture" === this.target.__assetType__) {
        t.drawImage(this._image, 0, 0, e, i);

        if (this.target.subMetas) {
          this.target.subMetas.forEach((s) => {
            let a = e / this._image.width;
            let h = i / this._image.height;
            t.beginPath();
            t.rect(s.trimX * a, s.trimY * h, s.width * a, s.height * h);
            t.lineWidth = 1;
            t.strokeStyle = "#ff00ff";
            t.stroke();
          });
        }
      } else {
        if ("sprite-frame" === this.target.__assetType__) {
          let s;
          let a;
          let h;
          let g;
          if (this.target.rotated) {
            let r = e / 2;
            let n = i / 2;
            t.translate(r, n);
            t.rotate((-90 * Math.PI) / 180);
            t.translate(-r, -n);
            s = e / 2 - this._scalingSize.width / 2;
            a = i / 2 - this._scalingSize.height / 2;
            h = this.target.height;
            g = this.target.width;
            e = this.$els.canvas.height;
            i = this.$els.canvas.width;
          } else {
            s = 0;
            a = 0;
            h = this.target.width;
            g = this.target.height;
            e = this.$els.canvas.width;
            i = this.$els.canvas.height;
          }
          t.drawImage(
            this._image,
            this.target.trimX,
            this.target.trimY,
            h,
            g,
            s,
            a,
            e,
            i
          );
        }
      }
    },
  },
});
