'use strict';

const fs = require('fs');
const path = require('path');

const Base = Editor.UI.Base;

const DragArea = Editor.UI.DragArea;

const STYLE = `<style>${fs.readFileSync(path.join(__dirname, './../../../dist/ui-components/node.css'), 'utf8')}</style>`;
const CUSTOM_STYLE = `<style id="custom-style"></style>`;
const HTML = `${fs.readFileSync(path.join(__dirname, '../../../static/template/ui-components/node.html'), 'utf8')}`;
const instanceArray = [];

let customStyle = '';
async function nameTranslator(uuid) {
    if (!uuid || !typeof uuid === 'string') {
        return null;
    }

    const info = await Editor.Message.request('scene', 'query-node', uuid);
    if (info) {
        return info.name.value;
    }
    return null;
}
class Node extends Base {
    _value = '';
    _droppable = 'cc.Node';
    _placeholder = 'cc.Node';
    /**
     * 监听的 Attribute
     */
    static get observedAttributes() {
        return ['disabled', 'value', 'placeholder', 'readonly', 'invalid', 'edit-mode'];
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
    async attributeChangedCallback(attr, oldData, newData) {
        switch (attr) {
            case 'droppable':
                this._droppable = newData.trim();
                this.$type.innerHTML = this._droppable;
                this.$area.droppable = this._droppable;
                this.$area.setAttribute('title', this._droppable);
                this.placeholder = this._droppable;
                break;
            case 'value':
                {
                    // newData 有可能是 null ，但不能是 null，默认输出为空字符串
                    this._value = newData ? newData.trim() : '';

                    let name = this._value;
                    if (this._value) {
                        name = await nameTranslator(this._value);
                        if (name === null) {
                            this.setAttribute('missing', true);
                            name = `Missing Node`;
                        } else {
                            this.removeAttribute('missing');
                        }
                    } else {
                        this.removeAttribute('missing');
                    }

                    this.$value.innerHTML = name;

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
            const types = 'cc.Node';
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
            droppable: 'cc.Node',
            type: 'node',
            timestamp: rawTimestamp,
            events: {
                confirm: (value) => {
                    this.$root.value = value;
                    this.$root.dispatch('confirm');
                },
                change: (value) => {
                    this.$root.value = value;
                    this.$root.dispatch('change');
                },
                cancel: (value) => {
                    this.$root.value = value;
                    this.$root.dispatch('cancel');
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
        Editor.Message.send('hierarchy', 'twinkle', this.$root.value.trim());
    }

    /**
     * 双击资源区域，编辑资源
     */
    _onAreaDblClick() {
        if (!this.$root.value) {
            return;
        }
        Editor.Selection.clear(Editor.Selection.getLastSelectedType());
        Editor.Selection.select('node', this.$root.value);
    }
}

module.exports = Node;
