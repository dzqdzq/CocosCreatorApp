'use strict';

const fs = require('fs');
const path = require('path');

const Base = Editor.UI.Base;

const DragArea = Editor.UI.DragArea;

const STYLE = `<style>${fs.readFileSync(path.join(__dirname, './../../../dist/ui-components/asset.css'), 'utf8')}</style>`;
const CUSTOM_STYLE = `<style id="custom-style"></style>`;
const HTML = `${fs.readFileSync(path.join(__dirname, '../../../static/template/ui-components/asset.html'), 'utf8')}`;
const instanceArray = [];

let customStyle = '';

class Asset extends Base {
    _value = '';
    _droppable = null;
    _placeholder = null;
    /**
     * 监听的 Attribute
     */
    static get observedAttributes() {
        return ['disabled', 'droppable', 'value', 'placeholder', 'readonly', 'invalid', 'edit-mode'];
    }

    ////////////////////////////
    //

    get droppable() {
        return this._droppable;
    }

    set droppable(val) {
        val = val.toString().trim();
        if (this._droppable === val) {
            return;
        }

        this.setAttribute('droppable', val);
    }

    get value() {
        return this._value || ''; // 默认值统一为空字符串
    }

    set value(val) {
        val = val.toString().trim();

        if (this.invalid) {
            this.invalid = false;
        } else if (this._value === val) {
            return;
        }

        this.setAttribute('value', val);

        this.dispatch('change');
        this.dispatch('confirm');
    }

    get placeholder() {
        return this._placeholder;
    }

    set placeholder(val) {
        val = val.toString().trim();
        if (this._placeholder === val) {
            return;
        }

        this.setAttribute('placeholder', val);
    }

    get invalid() {
        return this.getAttribute('invalid') !== null;
    }
    set invalid(val) {
        if (val) {
            this.setAttribute('invalid', '');
        } else {
            this.removeAttribute('invalid');
        }
    }

    get nodeInfo() {
        return this.getAttribute('node-info');
    }

    set nodeInfo(val) {
        if (val) {
            this.setAttribute('node-info', '');
        } else {
            this.removeAttribute('node-info');
        }
    }

    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src) {
        if (!fs.existsSync(src)) {
            return;
        }

        // 读取 css 并缓存到模块变量内
        customStyle = fs.readFileSync(src, 'utf8');

        // 应用到之前所有的模块上
        instanceArray.map((elem) => {
            const $style = elem.shadowRoot.querySelector('#custom-style');
            $style.innerHTML = customStyle;
        });
    }

    /**
     * 构造函数
     */
    constructor() {
        super();
        this.shadowRoot.innerHTML = `${STYLE}${CUSTOM_STYLE}${HTML}`;

        this.$area = this.shadowRoot.querySelector('.area ui-drag-area');
        this.$clear = this.shadowRoot.querySelector('.area .clear');
        this.$type = this.shadowRoot.querySelector('.type .name');
        this.$select = this.shadowRoot.querySelector('.select');
        this.$value = this.shadowRoot.querySelector('.area ui-drag-area .value');
        this.$placeholder = this.shadowRoot.querySelector('.area ui-drag-area .placeholder');

        this.$select.$root = this.$area.$root = this.$clear.$root = this;
    }

    /**
     * Attribute 更改后的回调
     * @param {*} attr
     * @param {*} oldData
     * @param {*} newData
     */
    attributeChangedCallback(attr, oldData, newData) {
        switch (attr) {
            case 'droppable':
                this._droppable = newData ? newData.trim() : null;
                this.$type.innerHTML = this._droppable;
                this.$area.droppable = this._droppable;
                this.$area.setAttribute('title', this._droppable);
                this.placeholder = this._droppable;

                this._checkValueAndShowName();
                break;
            case 'value':
                {
                    // newData 有可能是 null ，但不能是 null，默认输出为空字符串
                    this._value = newData ? newData.trim() : '';

                    if (this._value) {
                        this.setAttribute('effective', '');
                        this.$clear.style.display = 'inline';
                        if (this.hasAttribute('editable')) {
                            this.setAttribute('editable', 'true');
                        }
                    } else {
                        this.removeAttribute('effective');
                        this.$clear.style.display = 'none';

                        if (this.hasAttribute('editable')) {
                            this.setAttribute('editable', 'false');
                        }
                    }

                    this._checkValueAndShowName();

                    /**
                     * 支持在编辑节点的时候同时编辑材质资源
                     * 传入 assetUuid
                     * 传入 nodeInfo 是为了支持 inspector 多开能够区别面板。
                     */
                    if (this.nodeInfo) {
                        if (oldData) {
                            Editor.Message.send('inspector', 'close-sub-inspector', oldData, this.nodeInfo);
                        }

                        if (newData) {
                            Editor.Message.send('inspector', 'open-sub-inspector', newData, this.nodeInfo);
                        }
                    }
                }
                break;
            case 'placeholder':
                this._placeholder = newData.trim();
                this.$placeholder.innerHTML = this._placeholder;
                break;
        }
    }

    /**
     * 插入文档流
     */
    async connectedCallback() {
        super.connectedCallback();

        // 缓存元素
        instanceArray.push(this);

        // 插入自定义样式
        const $style = this.shadowRoot.querySelector('#custom-style');
        $style.innerHTML = customStyle;

        // 绑定事件
        this.$area.addEventListener('dragover', this._onAreaDragOver);
        this.$area.addEventListener('dragleave', this._onAreaDragLeave);
        this.$area.addEventListener('drop', this._onAreaDrop);
        this.$clear.addEventListener('click', this._onClearClick);
        this.$area.addEventListener('click', this._onAreaClick);
        this.$area.addEventListener('dblclick', this._onAreaDblClick);
        this.$select.addEventListener('click', this._onSelectClick);
    }

    /**
     * 移除文档流
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        // 移除缓存的元素对象
        const index = instanceArray.indexOf(this);
        instanceArray.splice(index, 1);

        // 取消绑定事件
        this.$area.removeEventListener('dragover', this._onAreaDragOver);
        this.$area.removeEventListener('dragleave', this._onAreaDragLeave);
        this.$area.removeEventListener('drop', this._onAreaDrop);
        this.$area.removeEventListener('click', this._onAreaClick);
        this.$area.removeEventListener('dblclick', this._onAreaDblClick);
        this.$clear.removeEventListener('click', this._onClearClick);
        this.$select.addEventListener('click', this._onSelectClick);

        if (this.nodeInfo) {
            if (this.value) {
                Editor.Message.send('inspector', 'close-sub-inspector', this.value, this.nodeInfo);
            }
        }
    }

    //////////////////////
    // 私有事件

    /**
     * 拖拽进入 area 元素
     */
    _onAreaDragOver() {
        if (this.$root.disabled || this.$root.readonly) {
            return;
        }
        this.$root.setAttribute('state', this.hoving || this.additional ? 'allow' : 'refused');
    }

    /**
     * 拖拽离开 area 元素
     */
    _onAreaDragLeave() {
        if (this.$root.disabled || this.$root.readonly) {
            return;
        }
        this.$root.removeAttribute('state');
    }

    /**
     * 拖放到 area 元素
     */
    _onAreaDrop(event) {
        if (this.$root.disabled || this.$root.readonly) {
            return;
        }
        const state = this.$root.getAttribute('state');
        this.$root.removeAttribute('state');
        if (state === 'refused') {
            return;
        }

        if (this.additional) {
            const types = this.$root.droppable;
            const list = DragArea.currentDragInfo.additional;
            if (list) {
                for (const item of list) {
                    if (types.includes(item.type)) {
                        this.$root.value = item.value;
                        return;
                    }
                }
            }
        } else {
            if (this.$root.invalid) {
                this.$root.invalid = false;
            }
        }
        this.$root.value = event.dataTransfer.getData('value');
    }

    /**
     * 点击清空按钮
     */
    _onClearClick(event) {
        if (this.$root.disabled || this.$root.readonly) {
            return;
        }
        this.$root.value = '';
        event.stopPropagation();
    }

    /**
     * 点击选择图标
     */
    _onSelectClick() {
        if (this.$root.disabled || this.$root.readonly) {
            return;
        }
        const rawTimestamp = Date.now();
        Editor.Panel._kitControl.open({
            $kit: this.$root,
            name: 'ui-kit.searcher',
            value: this.$root.value,
            droppable: this.$root.droppable,
            type: 'asset',
            timestamp: rawTimestamp,
            events: {
                confirm: (value) => {
                    this.$root.value = value;
                },
                change: (value) => {
                    this.$root.value = value;
                },
            },
        });
    }

    /**
     * 单击资源区域，资源高亮
     */
    _onAreaClick() {
        if (typeof this.$root.value !== 'string') {
            return;
        }
        Editor.Message.send('assets', 'twinkle', this.$root.value.trim());
    }

    /**
     * 双击资源区域，编辑资源
     */
    _onAreaDblClick() {
        if (!this.$root.value) {
            return;
        }

        Editor.Selection.clear('asset');
        Editor.Selection.select('asset', this.$root.value);
    }

    async _checkValueAndShowName() {
        const uuid = this._value;

        let name = '';
        if (uuid && typeof uuid === 'string') {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);

            if (info) {
                if (info.source) {
                    name = path.basename(info.source);
                } else if (info.displayName) {
                    name = info.displayName;
                } else {
                    name = info.name;
                }

                // 判断类型是否满足 droppable
                const droppableArr = this._droppable.split(',').filter(Boolean);
                let isLegal = droppableArr.includes(info.type);

                // 判断继承链
                if (info.extends && info.extends.length) { 
                    droppableArr.forEach((type) => {
                        if (info.extends.includes(type)) {
                            isLegal = true;
                        }
                    });
                }

                if (!isLegal) {
                    this.setAttribute('error', true);
                } else {
                    this.removeAttribute('error');
                    this.removeAttribute('state');
                }
            }

            if (!name) {
                this.setAttribute('missing', true);
                name = `Missing Asset`;
            } else {
                this.removeAttribute('missing');
            }
        } else {
            this.removeAttribute('missing');
            this.removeAttribute('error');
        }

        this.$value.innerHTML = name;
    }
}

module.exports = Asset;
