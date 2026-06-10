Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetImage = undefined;
const preview_image_manager_1 = require("./preview-image-manager");
class AssetImage extends HTMLElement {
  _value = null;
  _importer = "";
  _iconInfo = null;
  $uiImage;
  $uiIcon;
  $uiLoading;
  static previewImageManager = preview_image_manager_1.previewImageManager;
  static _waitingRefreshInstance = [];
  static MAX_RETRY = 3;
  static RETRY_DELAY = 100;
  _retryCount = 0;
  _size = "small";
  static init() {
    preview_image_manager_1.previewImageManager.init();

    preview_image_manager_1.previewImageManager.on("ready", () => {
      if (AssetImage._waitingRefreshInstance.length) {
        AssetImage._waitingRefreshInstance.forEach((e) => {
          e.resolveValue(e._value);
        });

        AssetImage._waitingRefreshInstance.length = 0;
      }
    });
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `<style></style>
                                    <div style="width: 100%; height: 100%;">
                                        <ui-loading style="display: none;"></ui-loading>
                                        <ui-image style="width: 100%; height: 100%; line-height: 100%;" hidden></ui-image>
                                        <ui-icon color="true" style="width: 100%; height: 100%;" class="icon" hidden></ui-icon>
                                     </div>`;

    this.$uiImage = this.shadowRoot?.querySelector("ui-image");
    this.$uiIcon = this.shadowRoot?.querySelector("ui-icon");
    this.$uiLoading = this.shadowRoot?.querySelector("ui-loading");
  }
  get value() {
    return this._value;
  }
  set value(e) {
    if ((this._value = e)) {
      this.setAttribute("value", e);
    }
  }
  get importer() {
    return this._importer;
  }
  set importer(e) {
    if ((this._importer = e)) {
      this.setAttribute("importer", e);
    }
  }
  get size() {
    return this._size;
  }
  disconnectedCallback() {}
  static get observedAttributes() {
    return ["value", "importer", "size"];
  }
  attributeChangedCallback(e, i, t) {
    switch (e) {
      case "value": {
        requestAnimationFrame(() => {
          this.resolveValue(t);
        });
        break;
      }
      case "importer": {
        this._importer = t;
        break;
      }
      case "size": {
        if (["large", "small", "origin", "middle"].includes(t)) {
          this._size = t;
        }
      }
    }
  }
  async resolveValue(e) {
    if (e) {
      if (preview_image_manager_1.previewImageManager.ready) {
        this._iconInfo = await preview_image_manager_1.previewImageManager.get(
          e,
          this.size,
          this._importer
        );

        this._iconInfo.type === "icon"
          ? this._showIcon(this._iconInfo.value)
          : ((this._retryCount = 0),
            this._showImage(this._iconInfo.value, this._iconInfo.timestamp));
      } else {
        AssetImage._waitingRefreshInstance.push(this);
        this._showLoading();
      }
    }
  }
  _showLoading() {
    this.$uiLoading.style.display = "inline-block";
  }
  _showIcon(e) {
    this.$uiIcon.setAttribute("value", e);
    this.$uiIcon.removeAttribute("hidden");
    this.$uiIcon.style.fontSize = this.getBoundingClientRect().width - 4 + "px";
    this.$uiImage.setAttribute("hidden", "");
    this.$uiLoading.style.display = "none";
  }
  _showImage(e, i) {
    this.$uiImage.setAttribute("value", e + "?" + i);
    this.$uiImage.removeAttribute("hidden");
    this.$uiIcon.setAttribute("hidden", "");
    i = this.$uiImage.$img;

    i.onload = () => {
      this.$uiLoading.style.display = "none";
    };

    i.onerror = () => {
      this._handleImageError(e);
    };
  }
  _handleImageError(e) {
    if (this._retryCount >= AssetImage.MAX_RETRY) {
      console.warn(
        `AssetImage: image load ${e} failed, retry count: `,
        this._retryCount
      );

      this._showIcon("image");
    } else {
      setTimeout(() => {
        this._retryCount++;
        this._showImage(e, new Date().getTime());
      }, AssetImage.RETRY_DELAY);
    }
  }
}
exports.AssetImage = AssetImage;
