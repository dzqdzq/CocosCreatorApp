'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.listeners = exports.methods = exports.$ = exports.template = exports.style = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const lodash_1 = require("lodash");
const SVG = require('svg.js');
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
/**
 * 保留两位小数，避免 double 类型导致的精度问题。涉及 number 类型的加减乘除操作时需要特别注意
 */
function roundDouble(num) {
    return (0, lodash_1.round)(num, 2);
}
let panel = null;
let vm = null;
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../index.css'), 'utf8');
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static', '/template/sprite-editor.html'), 'utf8');
exports.$ = {
    container: '.sprite-editor',
};
exports.methods = {
    currentKeys(meta) {
        if (vm && meta) {
            if (vm.uuid !== meta.uuid) {
                vm.uuid = meta.uuid;
                vm.scale = 100;
            }
            vm.userData = meta.userData;
        }
    },
};
exports.listeners = {
    resize() {
        if (vm) {
            vm.resize();
            vm.refreshScaleSlider();
        }
    },
};
async function ready(data) {
    // @ts-ignore
    panel = this;
    // 初始化 vue
    vm?.$destroy();
    vm = new Vue({
        el: panel.$.container,
        data: {
            uuid: null,
            userData: null,
            svg: null,
            image: null,
            svgColor: '#5c5',
            svgColorBright: '#8fef8f',
            dotSize: 6,
            borderLeft: 0,
            borderRight: 0,
            borderBottom: 0,
            borderTop: 0,
            width: 0,
            height: 0,
            leftPos: 0,
            rightPos: 0,
            topPos: 0,
            bottomPos: 0,
            startLeftPos: 0,
            startRightPos: 0,
            startTopPos: 0,
            startBottomPos: 0,
            scale: 100,
            minScale: 5,
            maxScale: 500,
            horizontal: 'center',
            changed: false,
        },
        computed: {
            topPosMax() {
                const val = this.height - this.bottomPos;
                return val ? roundDouble(val) : false;
            },
            bottomPosMax() {
                const val = this.height - this.topPos;
                return val ? roundDouble(val) : false;
            },
            leftPosMax() {
                const val = this.width - this.rightPos;
                return val ? roundDouble(val) : false;
            },
            rightPosMax() {
                const val = this.width - this.leftPos;
                return val ? roundDouble(val) : false;
            },
        },
        watch: {
            async userData() {
                if (this.userData.imageUuidOrDatabaseUri) {
                    await this.openSprite();
                    // 限制缩放比例
                    const width = this.userData.rawWidth || this.userData.width;
                    const height = this.userData.rawHeight || this.userData.height;
                    const maxWidth = window.screen.width * window.devicePixelRatio * 2;
                    const maxHeight = window.screen.height * window.devicePixelRatio * 2;
                    if (width > maxWidth || height > maxHeight) {
                        // 大图，限制缩放比例
                        this.minScale = 1;
                        this.maxScale = 200;
                        // @ts-ignore
                        const radioWidth = parseInt((this.$refs.canvas.parentNode.clientWidth / width) * 100, 10);
                        // @ts-ignore
                        const radioHeight = parseInt((this.$refs.canvas.parentNode.clientHeight / height) * 100, 10);
                        this.scale = Math.min(radioWidth, radioHeight) || this.minScale;
                    }
                    this.refreshScaleSlider();
                }
            },
            scale() {
                this.resize();
            },
            leftPos() {
                this.leftPosChanged();
            },
            rightPos() {
                this.rightPosChanged();
            },
            topPos() {
                this.topPosChanged();
            },
            bottomPos() {
                this.bottomPosChanged();
            },
        },
        mounted() {
            this.svg = SVG(this.$refs.svg);
            this.svg.spof();
            this.refreshScaleSlider();
        },
        methods: {
            t(key) {
                return Editor.I18n.t(`inspector.sprite_editor.${key}`);
            },
            resize() {
                if (!this.image && !this.userData) {
                    return;
                }
                const width = (this.userData.width * this.scale) / 100;
                const height = (this.userData.height * this.scale) / 100;
                if (this.userData.rotated) {
                    this._scalingSize = {
                        width: Math.ceil(height),
                        height: Math.ceil(width),
                    };
                }
                this.$refs.canvas.width = width;
                this.$refs.canvas.height = height;
                const canvasParent = this.$refs.canvas.parentNode;
                const canvasParentWidth = canvasParent.clientWidth;
                if (canvasParentWidth > width) {
                    this.horizontal = 'center';
                }
                else {
                    this.horizontal = 'left';
                }
                this.repaint();
            },
            refreshScaleSlider() {
                // @ts-ignore
                const vm = this;
                // @ts-ignore
                const $scale = this.$refs.scale;
                // @ts-ignore
                $scale.min = this.minScale;
                // @ts-ignore
                $scale.max = this.maxScale;
                // @ts-ignore
                $scale.value = this.scale;
                // @ts-ignore
                this.$refs.content.onmousewheel = (wheelEvent) => {
                    let deltaY = 1;
                    if (wheelEvent.deltaY < 0) {
                        deltaY = -1;
                    }
                    $scale.value -= deltaY;
                    // @ts-ignore
                    this.scale = $scale.value;
                    wheelEvent.preventDefault();
                };
            },
            scaleChange() {
                if (!this.image || !this.userData) {
                    return;
                }
                this.scale = this.$refs.scale.value;
            },
            async openSprite() {
                this.width = this.userData.width;
                this.height = this.userData.height;
                this.leftPos = this.userData.borderLeft;
                this.rightPos = this.userData.borderRight;
                this.topPos = this.userData.borderTop;
                this.bottomPos = this.userData.borderBottom;
                const info = await Editor.Message.request('asset-db', 'query-asset-info', this.userData.imageUuidOrDatabaseUri.split('@')[0]);
                if (!info) {
                    return;
                }
                const key = Object.keys(info.library).find((key) => key !== '.json');
                if (!key) {
                    return;
                }
                this.image = new Image();
                this.image.src = info.library[key].replace('#', '%23');
                this.image.onload = () => {
                    this.resize();
                };
            },
            repaint() {
                const canvas = this.$refs.canvas.getContext('2d');
                // canvas.height = canvas.height; // 先清空画布
                const canvasWidth = this.$refs.canvas.width;
                const canvasHeight = this.$refs.canvas.height;
                let sWidth;
                let sHeight;
                let dx;
                let dy;
                let dWidth;
                let dHeight;
                if (this.userData.rotated) {
                    const centerX = canvasWidth / 2;
                    const centerY = canvasHeight / 2;
                    canvas.translate(centerX, centerY);
                    canvas.rotate((-90 * Math.PI) / 180);
                    canvas.translate(-centerX, -centerY);
                    dx = centerX - this._scalingSize.width / 2;
                    dy = centerY - this._scalingSize.height / 2;
                    sWidth = this.userData.height;
                    sHeight = this.userData.width;
                    dWidth = canvasHeight;
                    dHeight = canvasWidth;
                }
                else {
                    dx = 0;
                    dy = 0;
                    sWidth = this.userData.width;
                    sHeight = this.userData.height;
                    dWidth = canvasWidth;
                    dHeight = canvasHeight;
                }
                canvas.drawImage(this.image, this.userData.trimX, this.userData.trimY, sWidth, sHeight, dx, dy, dWidth, dHeight);
                this.$nextTick(() => {
                    this.drawEditElements();
                });
            },
            drawEditElements() {
                if (!this.image) {
                    return;
                }
                this.svg.clear();
                const bcr = this.getCanvasRect();
                this.updateBorderPos(bcr);
                // 4个边
                this.lineLeft = this.drawLine(this.borderLeft, bcr.bottom, this.borderLeft, bcr.top, 'l');
                this.lineRight = this.drawLine(this.borderRight, bcr.bottom, this.borderRight, bcr.top, 'r');
                this.lineTop = this.drawLine(bcr.left, this.borderTop, bcr.right, this.borderTop, 't');
                this.lineBottom = this.drawLine(bcr.left, this.borderBottom, bcr.right, this.borderBottom, 'b');
                // 4个交点
                this.dotLB = this.drawDot(this.borderLeft, this.borderBottom, 'lb');
                this.dotLT = this.drawDot(this.borderLeft, this.borderTop, 'lt');
                this.dotRB = this.drawDot(this.borderRight, this.borderBottom, 'rb');
                this.dotRT = this.drawDot(this.borderRight, this.borderTop, 'rt');
                // 4个边的中点
                this.dotL = this.drawDot(this.borderLeft, bcr.bottom - bcr.height / 2, 'l');
                this.dotR = this.drawDot(this.borderRight, bcr.bottom - bcr.height / 2, 'r');
                this.dotB = this.drawDot(bcr.left + bcr.width / 2, this.borderBottom, 'b');
                this.dotT = this.drawDot(bcr.left + bcr.width / 2, this.borderTop, 't');
            },
            getCanvasRect() {
                const ret = {};
                ret.top = this.$refs.canvas.offsetTop;
                ret.left = this.$refs.canvas.offsetLeft;
                ret.bottom = this.$refs.canvas.offsetTop + this.$refs.canvas.height;
                ret.right = this.$refs.canvas.offsetLeft + this.$refs.canvas.width;
                ret.width = this.$refs.canvas.width;
                ret.height = this.$refs.canvas.height;
                return ret;
            },
            updateBorderPos(bcr) {
                this.borderLeft = bcr.left + this.leftPos * (this.scale / 100);
                this.borderRight = bcr.right - this.rightPos * (this.scale / 100);
                this.borderTop = bcr.top + this.topPos * (this.scale / 100);
                this.borderBottom = bcr.bottom - this.bottomPos * (this.scale / 100);
            },
            // @ts-ignore
            drawLine(startX, startY, endX, endY, lineID) {
                const start = { x: startX, y: startY };
                const end = { x: endX, y: endY };
                const line = lineTool(this.svg, start, end, this.svgColor, 'default', this.svgCallbacks(lineID));
                if (lineID === 'l' || lineID === 'r') {
                    line.style('cursor', 'col-resize');
                }
                else if (lineID === 't' || lineID === 'b') {
                    line.style('cursor', 'row-resize');
                }
                return line;
            },
            // @ts-ignore
            drawDot(posX, posY, dotID) {
                const attr = { color: this.svgColor };
                // @ts-ignore
                const theDot = circleTool(this.svg, this.dotSize, attr, attr, this.svgCallbacks(dotID));
                if (dotID === 'l' || dotID === 'r' || dotID === 't' || dotID === 'b') {
                    theDot.style('cursor', 'pointer');
                }
                else if (dotID === 'lb' || dotID === 'rt') {
                    theDot.style('cursor', 'nesw-resize');
                }
                else if (dotID === 'rb' || dotID === 'lt') {
                    theDot.style('cursor', 'nwse-resize');
                }
                this.moveDotTo(theDot, posX, posY);
                return theDot;
            },
            // @ts-ignore
            moveDotTo(dot, posX, posY) {
                if (dot) {
                    dot.move(posX, posY);
                }
            },
            // @ts-ignore
            svgCallbacks(svgId) {
                const callbacks = {};
                // @ts-ignore
                callbacks.start = () => {
                    this.startLeftPos = this.leftPos;
                    this.startRightPos = this.rightPos;
                    this.startTopPos = this.topPos;
                    this.startBottomPos = this.bottomPos;
                };
                // @ts-ignore
                callbacks.update = (dx, dy) => {
                    this.svgElementMoved(svgId, dx, dy);
                };
                return callbacks;
            },
            // @ts-ignore
            svgElementMoved(id, dx, dy) {
                let movedX = dx / (this.scale / 100);
                let movedY = dy / (this.scale / 100);
                if (movedX > 0) {
                    movedX = Math.floor(movedX);
                }
                else {
                    movedX = Math.ceil(movedX);
                }
                if (movedY > 0) {
                    movedY = Math.floor(movedY);
                }
                else {
                    movedY = Math.ceil(movedY);
                }
                if (Math.abs(movedX) > 0) {
                    if (id.indexOf('l') >= 0) {
                        const newLeftValue = roundDouble(this.startLeftPos + movedX);
                        const width = this.userData.width || this.image.width;
                        this.leftPos = this.correctPosValue(newLeftValue, 0, roundDouble(width - this.rightPos));
                    }
                    if (id.indexOf('r') >= 0) {
                        const newRightValue = roundDouble(this.startRightPos - movedX);
                        const width = this.userData.width || this.image.width;
                        this.rightPos = this.correctPosValue(newRightValue, 0, roundDouble(width - this.leftPos));
                    }
                }
                if (Math.abs(movedY) > 0) {
                    if (id.indexOf('t') >= 0) {
                        const newTopValue = roundDouble(this.startTopPos + movedY);
                        const height = this.userData.height || this.image.height;
                        this.topPos = this.correctPosValue(newTopValue, 0, roundDouble(height - this.bottomPos));
                    }
                    if (id.indexOf('b') >= 0) {
                        const newBottomValue = roundDouble(this.startBottomPos - movedY);
                        const height = this.userData.height || this.image.height;
                        this.bottomPos = this.correctPosValue(newBottomValue, 0, roundDouble(height - this.topPos));
                    }
                }
            },
            // @ts-ignore
            correctPosValue(newValue, min, max) {
                if (newValue < min) {
                    return min;
                }
                if (newValue > max) {
                    return max;
                }
                return newValue;
            },
            checkState() {
                const leftChanged = this.leftPos !== this.userData.borderLeft;
                const rightChanged = this.rightPos !== this.userData.borderRight;
                const topChanged = this.topPos !== this.userData.borderTop;
                const bottomChanged = this.bottomPos !== this.userData.borderBottom;
                this.changed = leftChanged || rightChanged || topChanged || bottomChanged;
                // 同步数据
                this.save();
            },
            leftPosChanged() {
                if (!this.image) {
                    return;
                }
                const bcr = this.getCanvasRect();
                this.updateBorderPos(bcr);
                // move dots
                this.moveDotTo(this.dotL, this.borderLeft, bcr.bottom - bcr.height / 2);
                this.moveDotTo(this.dotLB, this.borderLeft, this.borderBottom);
                this.moveDotTo(this.dotLT, this.borderLeft, this.borderTop);
                // move line left
                if (this.lineLeft) {
                    this.lineLeft.plot(this.borderLeft, bcr.bottom, this.borderLeft, bcr.top);
                }
                this.checkState();
            },
            rightPosChanged() {
                if (!this.image) {
                    return;
                }
                const bcr = this.getCanvasRect();
                this.updateBorderPos(bcr);
                // move dots
                this.moveDotTo(this.dotR, this.borderRight, bcr.bottom - bcr.height / 2);
                this.moveDotTo(this.dotRB, this.borderRight, this.borderBottom);
                this.moveDotTo(this.dotRT, this.borderRight, this.borderTop);
                // move line left
                if (this.lineRight) {
                    this.lineRight.plot(this.borderRight, bcr.bottom, this.borderRight, bcr.top);
                }
                this.checkState();
            },
            topPosChanged() {
                if (!this.image) {
                    return;
                }
                const bcr = this.getCanvasRect();
                this.updateBorderPos(bcr);
                // move dots
                this.moveDotTo(this.dotT, bcr.left + bcr.width / 2, this.borderTop);
                this.moveDotTo(this.dotLT, this.borderLeft, this.borderTop);
                this.moveDotTo(this.dotRT, this.borderRight, this.borderTop);
                // move line top
                if (this.lineTop) {
                    this.lineTop.plot(bcr.left, this.borderTop, bcr.right, this.borderTop);
                }
                this.checkState();
            },
            bottomPosChanged() {
                if (!this.image) {
                    return;
                }
                const bcr = this.getCanvasRect();
                this.updateBorderPos(bcr);
                // move dots
                this.moveDotTo(this.dotB, bcr.left + bcr.width / 2, this.borderBottom);
                this.moveDotTo(this.dotLB, this.borderLeft, this.borderBottom);
                this.moveDotTo(this.dotRB, this.borderRight, this.borderBottom);
                // move line bottom
                if (this.lineBottom) {
                    this.lineBottom.plot(bcr.left, this.borderBottom, bcr.right, this.borderBottom);
                }
                this.checkState();
            },
            positionChange(event, key) {
                this[key] = event.target.value;
            },
            save() {
                Editor.Message.send('inspector', 'sprite-change', {
                    borderTop: this.topPos,
                    borderBottom: this.bottomPos,
                    borderLeft: this.leftPos,
                    borderRight: this.rightPos,
                });
                // 目的是给新 inspector 里的 sprite-frame 组件发送数据
                Editor.Message.broadcast('sprite-editor:changed', {
                    uuid: this.uuid,
                    userData: {
                        borderTop: this.topPos,
                        borderBottom: this.bottomPos,
                        borderLeft: this.leftPos,
                        borderRight: this.rightPos,
                    },
                });
            },
        },
    });
    if (data) {
        panel.currentKeys(data.meta);
    }
    Editor.Message.send('inspector', 'sprite-state', true);
}
exports.ready = ready;
function close() {
    Editor.Message.send('inspector', 'sprite-state', false);
    vm?.$destroy();
    vm = null;
    panel = null;
}
exports.close = close;
// @ts-ignore
function circleTool(svg, size, fill, stroke, cursor, callbacks) {
    if (typeof cursor !== 'string') {
        callbacks = cursor;
        cursor = 'default';
    }
    const group = svg
        .group()
        .style('cursor', cursor)
        .fill(fill ? fill : 'none')
        .stroke(stroke ? stroke : 'none');
    const circle = group.circle().radius(size / 2);
    let bgCircle;
    if (stroke) {
        bgCircle = group
            .circle()
            .stroke({ width: 8 })
            .fill('none')
            .style('stroke-opacity', 0)
            .radius(size / 2);
    }
    let dragging = false;
    group.style('pointer-events', 'bounding-box');
    group.on('mouseover', () => {
        if (vm && fill) {
            group.fill({ color: vm.svgColorBright });
        }
        if (vm && stroke) {
            group.stroke({ color: vm.svgColorBright });
        }
    });
    // @ts-ignore
    group.on('mouseout', (event) => {
        event.stopPropagation();
        if (!dragging) {
            if (fill) {
                group.fill(fill);
            }
            if (stroke) {
                group.stroke(stroke);
            }
        }
    });
    addMoveHandles(group, { cursor }, {
        // @ts-ignore
        start(x, y, event) {
            dragging = true;
            if (vm && fill) {
                group.fill({ color: vm.svgColorBright });
            }
            if (vm && stroke) {
                group.stroke({ color: vm.svgColorBright });
            }
            if (callbacks.start) {
                callbacks.start(x, y, event);
            }
        },
        // @ts-ignore
        update(dx, dy, event) {
            if (callbacks.update) {
                callbacks.update(dx, dy, event);
            }
        },
        // @ts-ignore
        end(event) {
            dragging = false;
            if (fill) {
                group.fill(fill);
            }
            if (stroke) {
                group.stroke(stroke);
            }
            if (callbacks.end) {
                callbacks.end(event);
            }
        },
    });
    // @ts-ignore
    group.radius = function (radius) {
        circle.radius(radius);
        // @ts-ignore
        if (bgCircle) {
            bgCircle.radius(radius);
        }
        return this;
    };
    // @ts-ignore
    group.cx = function (x) {
        return this.x(x);
    };
    // @ts-ignore
    group.cy = function (y) {
        return this.y(y);
    };
    return group;
}
// @ts-ignore
function lineTool(svg, from, to, color, cursor, callbacks) {
    const group = svg.group().style('cursor', cursor).stroke({ color });
    const line = group.line(from.x, from.y, to.x, to.y).style('stroke-width', 1);
    const bgline = group.line(from.x, from.y, to.x, to.y).style('stroke-width', 8).style('stroke-opacity', 0);
    let dragging = false;
    group.on('mouseover', () => {
        vm && group.stroke({ color: vm.svgColorBright });
    });
    group.on('mouseout', (event) => {
        event.stopPropagation();
        if (!dragging) {
            group.stroke({ color });
        }
    });
    addMoveHandles(group, { cursor }, {
        start(x, y, event) {
            dragging = true;
            vm && group.stroke({ color: vm.svgColorBright });
            if (callbacks.start) {
                callbacks.start(x, y, event);
            }
        },
        update(dx, dy, event) {
            if (callbacks.update) {
                callbacks.update(dx, dy, event);
            }
        },
        end(event) {
            dragging = false;
            group.stroke({ color });
            if (callbacks.end) {
                callbacks.end(event);
            }
        },
    });
    group.plot = function (...args) {
        line.plot(...args);
        bgline.plot(...args);
        return this;
    };
    return group;
}
// @ts-ignore
function addMoveHandles(gizmo, opts, callbacks) {
    let pressx = 0;
    let pressy = 0;
    if (arguments.length === 2) {
        callbacks = opts;
        opts = {};
    }
    function mousemoveHandle(event) {
        event.stopPropagation();
        // @ts-ignore
        const dx = event.clientX - pressx;
        // @ts-ignore
        const dy = event.clientY - pressy;
        if (callbacks.update) {
            callbacks.update.call(gizmo, dx, dy, event);
        }
    }
    function mouseupHandle(event) {
        document.removeEventListener('mousemove', mousemoveHandle);
        document.removeEventListener('mouseup', mouseupHandle);
        if (callbacks.end) {
            callbacks.end.call(gizmo, event);
        }
        event.stopPropagation();
    }
    // @ts-ignore
    gizmo.on('mousedown', (event) => {
        if (event.which === 1) {
            pressx = event.clientX;
            pressy = event.clientY;
            document.addEventListener('mousemove', mousemoveHandle);
            document.addEventListener('mouseup', mouseupHandle);
            if (callbacks.start) {
                callbacks.start.call(gizmo, event.offsetX, event.offsetY, event);
            }
        }
        event.stopPropagation();
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc3ByaXRlLWVkaXRvci9wYW5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQUViLDJCQUFrQztBQUNsQywrQkFBNEI7QUFDNUIsbUNBQStCO0FBRS9CLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUc5QixNQUFNLEdBQUcsR0FBbUIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUU1Qjs7R0FFRztBQUNILFNBQVMsV0FBVyxDQUFDLEdBQVc7SUFDNUIsT0FBTyxJQUFBLGNBQUssRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUVELElBQUksS0FBSyxHQUFRLElBQUksQ0FBQztBQUN0QixJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFFTixRQUFBLEtBQUssR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRTlELFFBQUEsUUFBUSxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLDhCQUE4QixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFakcsUUFBQSxDQUFDLEdBQUc7SUFDYixTQUFTLEVBQUUsZ0JBQWdCO0NBQzlCLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQixXQUFXLENBQUMsSUFBUztRQUNqQixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDWixJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDdkIs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U0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRXZELElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUNmLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNwQztRQUVELEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsYUFBYTtJQUNiLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDNUIsSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLENBQUMsRUFBRTtZQUNuQixNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUN2QixNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUV2QixRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ3hELFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFcEQsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFO2dCQUNqQixTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3BFO1NBQ0o7UUFDRCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByb3VuZCB9IGZyb20gJ2xvZGFzaCc7XG5cbmNvbnN0IFNWRyA9IHJlcXVpcmUoJ3N2Zy5qcycpO1xuXG5pbXBvcnQgdHlwZSB7IFZ1ZUNvbnN0cnVjdG9yIH0gZnJvbSAndnVlJztcbmNvbnN0IFZ1ZTogVnVlQ29uc3RydWN0b3IgPSByZXF1aXJlKCd2dWUvZGlzdC92dWUuanMnKTtcblZ1ZS5jb25maWcucHJvZHVjdGlvblRpcCA9IGZhbHNlO1xuVnVlLmNvbmZpZy5kZXZ0b29scyA9IGZhbHNlO1xuXG4vKipcbiAqIOS/neeVmeS4pOS9jeWwj+aVsO+8jOmBv+WFjSBkb3VibGUg57G75Z6L5a+86Ie055qE57K+5bqm6Zeu6aKY44CC5raJ5Y+KIG51bWJlciDnsbvlnovnmoTliqDlh4/kuZjpmaTmk43kvZzml7bpnIDopoHnibnliKvms6jmhI9cbiAqL1xuZnVuY3Rpb24gcm91bmREb3VibGUobnVtOiBudW1iZXIpIHtcbiAgICByZXR1cm4gcm91bmQobnVtLCAyKTtcbn1cblxubGV0IHBhbmVsOiBhbnkgPSBudWxsO1xubGV0IHZtOiBhbnkgPSBudWxsO1xuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9pbmRleC5jc3MnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljJywgJy90ZW1wbGF0ZS9zcHJpdGUtZWRpdG9yLmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0ICQgPSB7XG4gICAgY29udGFpbmVyOiAnLnNwcml0ZS1lZGl0b3InLFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgY3VycmVudEtleXMobWV0YTogYW55KSB7XG4gICAgICAgIGlmICh2bSAmJiBtZXRhKSB7XG4gICAgICAgICAgICBpZiAodm0udXVpZCAhPT0gbWV0YS51dWlkKSB7XG4gICAgICAgICAgICAgICAgdm0udXVpZCA9IG1ldGEudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5zY2FsZSA9IDEwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZtLnVzZXJEYXRhID0gbWV0YS51c2VyRGF0YTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbGlzdGVuZXJzID0ge1xuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgaWYgKHZtKSB7XG4gICAgICAgICAgICB2bS5yZXNpemUoKTtcbiAgICAgICAgICAgIHZtLnJlZnJlc2hTY2FsZVNsaWRlcigpO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkeShkYXRhOiBhbnkpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xuXG4gICAgLy8g5Yid5aeL5YyWIHZ1ZVxuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbmV3IFZ1ZSh7XG4gICAgICAgIGVsOiBwYW5lbC4kLmNvbnRhaW5lcixcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdXVpZDogbnVsbCxcbiAgICAgICAgICAgIHVzZXJEYXRhOiBudWxsLFxuXG4gICAgICAgICAgICBzdmc6IG51bGwsXG4gICAgICAgICAgICBpbWFnZTogbnVsbCxcbiAgICAgICAgICAgIHN2Z0NvbG9yOiAnIzVjNScsXG4gICAgICAgICAgICBzdmdDb2xvckJyaWdodDogJyM4ZmVmOGYnLFxuICAgICAgICAgICAgZG90U2l6ZTogNixcbiAgICAgICAgICAgIGJvcmRlckxlZnQ6IDAsXG4gICAgICAgICAgICBib3JkZXJSaWdodDogMCxcbiAgICAgICAgICAgIGJvcmRlckJvdHRvbTogMCxcbiAgICAgICAgICAgIGJvcmRlclRvcDogMCxcblxuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgICBsZWZ0UG9zOiAwLFxuICAgICAgICAgICAgcmlnaHRQb3M6IDAsXG4gICAgICAgICAgICB0b3BQb3M6IDAsXG4gICAgICAgICAgICBib3R0b21Qb3M6IDAsXG5cbiAgICAgICAgICAgIHN0YXJ0TGVmdFBvczogMCxcbiAgICAgICAgICAgIHN0YXJ0UmlnaHRQb3M6IDAsXG4gICAgICAgICAgICBzdGFydFRvcFBvczogMCxcbiAgICAgICAgICAgIHN0YXJ0Qm90dG9tUG9zOiAwLFxuXG4gICAgICAgICAgICBzY2FsZTogMTAwLFxuICAgICAgICAgICAgbWluU2NhbGU6IDUsXG4gICAgICAgICAgICBtYXhTY2FsZTogNTAwLFxuICAgICAgICAgICAgaG9yaXpvbnRhbDogJ2NlbnRlcicsXG4gICAgICAgICAgICBjaGFuZ2VkOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgIHRvcFBvc01heCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSB0aGlzLmhlaWdodCAtIHRoaXMuYm90dG9tUG9zO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbCA/IHJvdW5kRG91YmxlKHZhbCkgOiBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3R0b21Qb3NNYXgoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsID0gdGhpcy5oZWlnaHQgLSB0aGlzLnRvcFBvcztcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWwgPyByb3VuZERvdWJsZSh2YWwpIDogZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVmdFBvc01heCh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSB0aGlzLndpZHRoIC0gdGhpcy5yaWdodFBvcztcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWwgPyByb3VuZERvdWJsZSh2YWwpIDogZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmlnaHRQb3NNYXgodGhpczogYW55KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsID0gdGhpcy53aWR0aCAtIHRoaXMubGVmdFBvcztcblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWwgPyByb3VuZERvdWJsZSh2YWwpIDogZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB3YXRjaDoge1xuICAgICAgICAgICAgYXN5bmMgdXNlckRhdGEoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudXNlckRhdGEuaW1hZ2VVdWlkT3JEYXRhYmFzZVVyaSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm9wZW5TcHJpdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOmZkOWItue8qeaUvuavlOS+i1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMudXNlckRhdGEucmF3V2lkdGggfHwgdGhpcy51c2VyRGF0YS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy51c2VyRGF0YS5yYXdIZWlnaHQgfHwgdGhpcy51c2VyRGF0YS5oZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4V2lkdGggPSB3aW5kb3cuc2NyZWVuLndpZHRoICogd2luZG93LmRldmljZVBpeGVsUmF0aW8gKiAyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhIZWlnaHQgPSB3aW5kb3cuc2NyZWVuLmhlaWdodCAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICogMjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBtYXhXaWR0aCB8fCBoZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWkp+Wbvu+8jOmZkOWItue8qeaUvuavlOS+i1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5TY2FsZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heFNjYWxlID0gMjAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmFkaW9XaWR0aCA9IHBhcnNlSW50KCh0aGlzLiRyZWZzLmNhbnZhcy5wYXJlbnROb2RlLmNsaWVudFdpZHRoIC8gd2lkdGgpICogMTAwLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYWRpb0hlaWdodCA9IHBhcnNlSW50KCh0aGlzLiRyZWZzLmNhbnZhcy5wYXJlbnROb2RlLmNsaWVudEhlaWdodCAvIGhlaWdodCkgKiAxMDAsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGUgPSBNYXRoLm1pbihyYWRpb1dpZHRoLCByYWRpb0hlaWdodCkgfHwgdGhpcy5taW5TY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaFNjYWxlU2xpZGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNjYWxlKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVmdFBvcygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxlZnRQb3NDaGFuZ2VkKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmlnaHRQb3MoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yaWdodFBvc0NoYW5nZWQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3BQb3MoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b3BQb3NDaGFuZ2VkKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm90dG9tUG9zKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tUG9zQ2hhbmdlZCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbW91bnRlZCgpIHtcbiAgICAgICAgICAgIHRoaXMuc3ZnID0gU1ZHKHRoaXMuJHJlZnMuc3ZnKTtcbiAgICAgICAgICAgIHRoaXMuc3ZnLnNwb2YoKTtcblxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoU2NhbGVTbGlkZXIoKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWV0aG9kczoge1xuICAgICAgICAgICAgdChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoYGluc3BlY3Rvci5zcHJpdGVfZWRpdG9yLiR7a2V5fWApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaW1hZ2UgJiYgIXRoaXMudXNlckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gKHRoaXMudXNlckRhdGEud2lkdGggKiB0aGlzLnNjYWxlKSAvIDEwMDtcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSAodGhpcy51c2VyRGF0YS5oZWlnaHQgKiB0aGlzLnNjYWxlKSAvIDEwMDtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnVzZXJEYXRhLnJvdGF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2NhbGluZ1NpemUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogTWF0aC5jZWlsKGhlaWdodCksXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IE1hdGguY2VpbCh3aWR0aCksXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy4kcmVmcy5jYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLiRyZWZzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXNQYXJlbnQgPSB0aGlzLiRyZWZzLmNhbnZhcy5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhc1BhcmVudFdpZHRoID0gY2FudmFzUGFyZW50LmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNhbnZhc1BhcmVudFdpZHRoID4gd2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsID0gJ2NlbnRlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsID0gJ2xlZnQnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucmVwYWludCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZnJlc2hTY2FsZVNsaWRlcigpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0ICRzY2FsZSA9IHRoaXMuJHJlZnMuc2NhbGU7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICRzY2FsZS5taW4gPSB0aGlzLm1pblNjYWxlO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAkc2NhbGUubWF4ID0gdGhpcy5tYXhTY2FsZTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgJHNjYWxlLnZhbHVlID0gdGhpcy5zY2FsZTtcblxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICB0aGlzLiRyZWZzLmNvbnRlbnQub25tb3VzZXdoZWVsID0gKHdoZWVsRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlbHRhWSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3aGVlbEV2ZW50LmRlbHRhWSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhWSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgJHNjYWxlLnZhbHVlIC09IGRlbHRhWTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlID0gJHNjYWxlLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNjYWxlQ2hhbmdlKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbWFnZSB8fCAhdGhpcy51c2VyRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuJHJlZnMuc2NhbGUudmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXN5bmMgb3BlblNwcml0ZSgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy51c2VyRGF0YS53aWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMudXNlckRhdGEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMubGVmdFBvcyA9IHRoaXMudXNlckRhdGEuYm9yZGVyTGVmdDtcbiAgICAgICAgICAgICAgICB0aGlzLnJpZ2h0UG9zID0gdGhpcy51c2VyRGF0YS5ib3JkZXJSaWdodDtcbiAgICAgICAgICAgICAgICB0aGlzLnRvcFBvcyA9IHRoaXMudXNlckRhdGEuYm9yZGVyVG9wO1xuICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tUG9zID0gdGhpcy51c2VyRGF0YS5ib3JkZXJCb3R0b207XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHRoaXMudXNlckRhdGEuaW1hZ2VVdWlkT3JEYXRhYmFzZVVyaS5zcGxpdCgnQCcpWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBPYmplY3Qua2V5cyhpbmZvLmxpYnJhcnkpLmZpbmQoKGtleSkgPT4ga2V5ICE9PSAnLmpzb24nKTtcbiAgICAgICAgICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2Uuc3JjID0gaW5mby5saWJyYXJ5W2tleV0ucmVwbGFjZSgnIycsICclMjMnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlcGFpbnQoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy4kcmVmcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAvLyBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDsgLy8g5YWI5riF56m655S75biDXG5cbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXNXaWR0aCA9IHRoaXMuJHJlZnMuY2FudmFzLndpZHRoO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhc0hlaWdodCA9IHRoaXMuJHJlZnMuY2FudmFzLmhlaWdodDtcbiAgICAgICAgICAgICAgICBsZXQgc1dpZHRoO1xuICAgICAgICAgICAgICAgIGxldCBzSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGxldCBkeDtcbiAgICAgICAgICAgICAgICBsZXQgZHk7XG4gICAgICAgICAgICAgICAgbGV0IGRXaWR0aDtcbiAgICAgICAgICAgICAgICBsZXQgZEhlaWdodDtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnVzZXJEYXRhLnJvdGF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyWCA9IGNhbnZhc1dpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyWSA9IGNhbnZhc0hlaWdodCAvIDI7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLnRyYW5zbGF0ZShjZW50ZXJYLCBjZW50ZXJZKTtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLnJvdGF0ZSgoLTkwICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICAgICAgICAgICAgICBjYW52YXMudHJhbnNsYXRlKC1jZW50ZXJYLCAtY2VudGVyWSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZHggPSBjZW50ZXJYIC0gdGhpcy5fc2NhbGluZ1NpemUud2lkdGggLyAyO1xuICAgICAgICAgICAgICAgICAgICBkeSA9IGNlbnRlclkgLSB0aGlzLl9zY2FsaW5nU2l6ZS5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICAgICBzV2lkdGggPSB0aGlzLnVzZXJEYXRhLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgc0hlaWdodCA9IHRoaXMudXNlckRhdGEud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGRXaWR0aCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgZEhlaWdodCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGR4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZHkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBzV2lkdGggPSB0aGlzLnVzZXJEYXRhLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBzSGVpZ2h0ID0gdGhpcy51c2VyRGF0YS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGRXaWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICAgICAgICAgICAgICBkSGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYW52YXMuZHJhd0ltYWdlKHRoaXMuaW1hZ2UsIHRoaXMudXNlckRhdGEudHJpbVgsIHRoaXMudXNlckRhdGEudHJpbVksIHNXaWR0aCwgc0hlaWdodCwgZHgsIGR5LCBkV2lkdGgsIGRIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkcmF3RWRpdEVsZW1lbnRzKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5zdmcuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBiY3IgPSB0aGlzLmdldENhbnZhc1JlY3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUJvcmRlclBvcyhiY3IpO1xuXG4gICAgICAgICAgICAgICAgLy8gNOS4qui+uVxuICAgICAgICAgICAgICAgIHRoaXMubGluZUxlZnQgPSB0aGlzLmRyYXdMaW5lKHRoaXMuYm9yZGVyTGVmdCwgYmNyLmJvdHRvbSwgdGhpcy5ib3JkZXJMZWZ0LCBiY3IudG9wLCAnbCcpO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZVJpZ2h0ID0gdGhpcy5kcmF3TGluZSh0aGlzLmJvcmRlclJpZ2h0LCBiY3IuYm90dG9tLCB0aGlzLmJvcmRlclJpZ2h0LCBiY3IudG9wLCAncicpO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZVRvcCA9IHRoaXMuZHJhd0xpbmUoYmNyLmxlZnQsIHRoaXMuYm9yZGVyVG9wLCBiY3IucmlnaHQsIHRoaXMuYm9yZGVyVG9wLCAndCcpO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZUJvdHRvbSA9IHRoaXMuZHJhd0xpbmUoYmNyLmxlZnQsIHRoaXMuYm9yZGVyQm90dG9tLCBiY3IucmlnaHQsIHRoaXMuYm9yZGVyQm90dG9tLCAnYicpO1xuXG4gICAgICAgICAgICAgICAgLy8gNOS4quS6pOeCuVxuICAgICAgICAgICAgICAgIHRoaXMuZG90TEIgPSB0aGlzLmRyYXdEb3QodGhpcy5ib3JkZXJMZWZ0LCB0aGlzLmJvcmRlckJvdHRvbSwgJ2xiJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kb3RMVCA9IHRoaXMuZHJhd0RvdCh0aGlzLmJvcmRlckxlZnQsIHRoaXMuYm9yZGVyVG9wLCAnbHQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvdFJCID0gdGhpcy5kcmF3RG90KHRoaXMuYm9yZGVyUmlnaHQsIHRoaXMuYm9yZGVyQm90dG9tLCAncmInKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvdFJUID0gdGhpcy5kcmF3RG90KHRoaXMuYm9yZGVyUmlnaHQsIHRoaXMuYm9yZGVyVG9wLCAncnQnKTtcblxuICAgICAgICAgICAgICAgIC8vIDTkuKrovrnnmoTkuK3ngrlcbiAgICAgICAgICAgICAgICB0aGlzLmRvdEwgPSB0aGlzLmRyYXdEb3QodGhpcy5ib3JkZXJMZWZ0LCBiY3IuYm90dG9tIC0gYmNyLmhlaWdodCAvIDIsICdsJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kb3RSID0gdGhpcy5kcmF3RG90KHRoaXMuYm9yZGVyUmlnaHQsIGJjci5ib3R0b20gLSBiY3IuaGVpZ2h0IC8gMiwgJ3InKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvdEIgPSB0aGlzLmRyYXdEb3QoYmNyLmxlZnQgKyBiY3Iud2lkdGggLyAyLCB0aGlzLmJvcmRlckJvdHRvbSwgJ2InKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvdFQgPSB0aGlzLmRyYXdEb3QoYmNyLmxlZnQgKyBiY3Iud2lkdGggLyAyLCB0aGlzLmJvcmRlclRvcCwgJ3QnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDYW52YXNSZWN0KCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJldDogYW55ID0ge307XG4gICAgICAgICAgICAgICAgcmV0LnRvcCA9IHRoaXMuJHJlZnMuY2FudmFzLm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICByZXQubGVmdCA9IHRoaXMuJHJlZnMuY2FudmFzLm9mZnNldExlZnQ7XG4gICAgICAgICAgICAgICAgcmV0LmJvdHRvbSA9IHRoaXMuJHJlZnMuY2FudmFzLm9mZnNldFRvcCArIHRoaXMuJHJlZnMuY2FudmFzLmhlaWdodDtcbiAgICAgICAgICAgICAgICByZXQucmlnaHQgPSB0aGlzLiRyZWZzLmNhbnZhcy5vZmZzZXRMZWZ0ICsgdGhpcy4kcmVmcy5jYW52YXMud2lkdGg7XG4gICAgICAgICAgICAgICAgcmV0LndpZHRoID0gdGhpcy4kcmVmcy5jYW52YXMud2lkdGg7XG4gICAgICAgICAgICAgICAgcmV0LmhlaWdodCA9IHRoaXMuJHJlZnMuY2FudmFzLmhlaWdodDtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlQm9yZGVyUG9zKGJjcjogYW55KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib3JkZXJMZWZ0ID0gYmNyLmxlZnQgKyB0aGlzLmxlZnRQb3MgKiAodGhpcy5zY2FsZSAvIDEwMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ib3JkZXJSaWdodCA9IGJjci5yaWdodCAtIHRoaXMucmlnaHRQb3MgKiAodGhpcy5zY2FsZSAvIDEwMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ib3JkZXJUb3AgPSBiY3IudG9wICsgdGhpcy50b3BQb3MgKiAodGhpcy5zY2FsZSAvIDEwMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ib3JkZXJCb3R0b20gPSBiY3IuYm90dG9tIC0gdGhpcy5ib3R0b21Qb3MgKiAodGhpcy5zY2FsZSAvIDEwMCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgZHJhd0xpbmUoc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFksIGxpbmVJRCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0geyB4OiBzdGFydFgsIHk6IHN0YXJ0WSB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IHsgeDogZW5kWCwgeTogZW5kWSB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBsaW5lVG9vbCh0aGlzLnN2Zywgc3RhcnQsIGVuZCwgdGhpcy5zdmdDb2xvciwgJ2RlZmF1bHQnLCB0aGlzLnN2Z0NhbGxiYWNrcyhsaW5lSUQpKTtcbiAgICAgICAgICAgICAgICBpZiAobGluZUlEID09PSAnbCcgfHwgbGluZUlEID09PSAncicpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZS5zdHlsZSgnY3Vyc29yJywgJ2NvbC1yZXNpemUnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmVJRCA9PT0gJ3QnIHx8IGxpbmVJRCA9PT0gJ2InKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUuc3R5bGUoJ2N1cnNvcicsICdyb3ctcmVzaXplJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBsaW5lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGRyYXdEb3QocG9zWCwgcG9zWSwgZG90SUQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyID0geyBjb2xvcjogdGhpcy5zdmdDb2xvciB9O1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBjb25zdCB0aGVEb3QgPSBjaXJjbGVUb29sKHRoaXMuc3ZnLCB0aGlzLmRvdFNpemUsIGF0dHIsIGF0dHIsIHRoaXMuc3ZnQ2FsbGJhY2tzKGRvdElEKSk7XG4gICAgICAgICAgICAgICAgaWYgKGRvdElEID09PSAnbCcgfHwgZG90SUQgPT09ICdyJyB8fCBkb3RJRCA9PT0gJ3QnIHx8IGRvdElEID09PSAnYicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhlRG90LnN0eWxlKCdjdXJzb3InLCAncG9pbnRlcicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZG90SUQgPT09ICdsYicgfHwgZG90SUQgPT09ICdydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhlRG90LnN0eWxlKCdjdXJzb3InLCAnbmVzdy1yZXNpemUnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRvdElEID09PSAncmInIHx8IGRvdElEID09PSAnbHQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoZURvdC5zdHlsZSgnY3Vyc29yJywgJ253c2UtcmVzaXplJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubW92ZURvdFRvKHRoZURvdCwgcG9zWCwgcG9zWSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoZURvdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBtb3ZlRG90VG8oZG90LCBwb3NYLCBwb3NZKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvdCkge1xuICAgICAgICAgICAgICAgICAgICBkb3QubW92ZShwb3NYLCBwb3NZKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgc3ZnQ2FsbGJhY2tzKHN2Z0lkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0ge307XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zdGFydCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydExlZnRQb3MgPSB0aGlzLmxlZnRQb3M7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRSaWdodFBvcyA9IHRoaXMucmlnaHRQb3M7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRUb3BQb3MgPSB0aGlzLnRvcFBvcztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydEJvdHRvbVBvcyA9IHRoaXMuYm90dG9tUG9zO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLnVwZGF0ZSA9IChkeCwgZHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdmdFbGVtZW50TW92ZWQoc3ZnSWQsIGR4LCBkeSk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFja3M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgc3ZnRWxlbWVudE1vdmVkKGlkLCBkeCwgZHkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbW92ZWRYID0gZHggLyAodGhpcy5zY2FsZSAvIDEwMCk7XG4gICAgICAgICAgICAgICAgbGV0IG1vdmVkWSA9IGR5IC8gKHRoaXMuc2NhbGUgLyAxMDApO1xuICAgICAgICAgICAgICAgIGlmIChtb3ZlZFggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vdmVkWCA9IE1hdGguZmxvb3IobW92ZWRYKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtb3ZlZFggPSBNYXRoLmNlaWwobW92ZWRYKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobW92ZWRZID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBtb3ZlZFkgPSBNYXRoLmZsb29yKG1vdmVkWSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbW92ZWRZID0gTWF0aC5jZWlsKG1vdmVkWSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKG1vdmVkWCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZC5pbmRleE9mKCdsJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3TGVmdFZhbHVlID0gcm91bmREb3VibGUodGhpcy5zdGFydExlZnRQb3MgKyBtb3ZlZFgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLnVzZXJEYXRhLndpZHRoIHx8IHRoaXMuaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxlZnRQb3MgPSB0aGlzLmNvcnJlY3RQb3NWYWx1ZShuZXdMZWZ0VmFsdWUsIDAsIHJvdW5kRG91YmxlKHdpZHRoIC0gdGhpcy5yaWdodFBvcykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZC5pbmRleE9mKCdyJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3UmlnaHRWYWx1ZSA9IHJvdW5kRG91YmxlKHRoaXMuc3RhcnRSaWdodFBvcyAtIG1vdmVkWCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMudXNlckRhdGEud2lkdGggfHwgdGhpcy5pbWFnZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmlnaHRQb3MgPSB0aGlzLmNvcnJlY3RQb3NWYWx1ZShuZXdSaWdodFZhbHVlLCAwLCByb3VuZERvdWJsZSh3aWR0aCAtIHRoaXMubGVmdFBvcykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKG1vdmVkWSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZC5pbmRleE9mKCd0JykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3VG9wVmFsdWUgPSByb3VuZERvdWJsZSh0aGlzLnN0YXJ0VG9wUG9zICsgbW92ZWRZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMudXNlckRhdGEuaGVpZ2h0IHx8IHRoaXMuaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b3BQb3MgPSB0aGlzLmNvcnJlY3RQb3NWYWx1ZShuZXdUb3BWYWx1ZSwgMCwgcm91bmREb3VibGUoaGVpZ2h0IC0gdGhpcy5ib3R0b21Qb3MpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaWQuaW5kZXhPZignYicpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0JvdHRvbVZhbHVlID0gcm91bmREb3VibGUodGhpcy5zdGFydEJvdHRvbVBvcyAtIG1vdmVkWSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLnVzZXJEYXRhLmhlaWdodCB8fCB0aGlzLmltYWdlLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tUG9zID0gdGhpcy5jb3JyZWN0UG9zVmFsdWUobmV3Qm90dG9tVmFsdWUsIDAsIHJvdW5kRG91YmxlKGhlaWdodCAtIHRoaXMudG9wUG9zKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29ycmVjdFBvc1ZhbHVlKG5ld1ZhbHVlLCBtaW4sIG1heCkge1xuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA8IG1pbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWluO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA+IG1heCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGVja1N0YXRlKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxlZnRDaGFuZ2VkID0gdGhpcy5sZWZ0UG9zICE9PSB0aGlzLnVzZXJEYXRhLmJvcmRlckxlZnQ7XG4gICAgICAgICAgICAgICAgY29uc3QgcmlnaHRDaGFuZ2VkID0gdGhpcy5yaWdodFBvcyAhPT0gdGhpcy51c2VyRGF0YS5ib3JkZXJSaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3BDaGFuZ2VkID0gdGhpcy50b3BQb3MgIT09IHRoaXMudXNlckRhdGEuYm9yZGVyVG9wO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvdHRvbUNoYW5nZWQgPSB0aGlzLmJvdHRvbVBvcyAhPT0gdGhpcy51c2VyRGF0YS5ib3JkZXJCb3R0b207XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZWQgPSBsZWZ0Q2hhbmdlZCB8fCByaWdodENoYW5nZWQgfHwgdG9wQ2hhbmdlZCB8fCBib3R0b21DaGFuZ2VkO1xuXG4gICAgICAgICAgICAgICAgLy8g5ZCM5q2l5pWw5o2uXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVmdFBvc0NoYW5nZWQoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBiY3IgPSB0aGlzLmdldENhbnZhc1JlY3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUJvcmRlclBvcyhiY3IpO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBkb3RzXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RMLCB0aGlzLmJvcmRlckxlZnQsIGJjci5ib3R0b20gLSBiY3IuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RMQiwgdGhpcy5ib3JkZXJMZWZ0LCB0aGlzLmJvcmRlckJvdHRvbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RMVCwgdGhpcy5ib3JkZXJMZWZ0LCB0aGlzLmJvcmRlclRvcCk7XG5cbiAgICAgICAgICAgICAgICAvLyBtb3ZlIGxpbmUgbGVmdFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpbmVMZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZUxlZnQucGxvdCh0aGlzLmJvcmRlckxlZnQsIGJjci5ib3R0b20sIHRoaXMuYm9yZGVyTGVmdCwgYmNyLnRvcCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja1N0YXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmlnaHRQb3NDaGFuZ2VkKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYmNyID0gdGhpcy5nZXRDYW52YXNSZWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCb3JkZXJQb3MoYmNyKTtcblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgZG90c1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZURvdFRvKHRoaXMuZG90UiwgdGhpcy5ib3JkZXJSaWdodCwgYmNyLmJvdHRvbSAtIGJjci5oZWlnaHQgLyAyKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVEb3RUbyh0aGlzLmRvdFJCLCB0aGlzLmJvcmRlclJpZ2h0LCB0aGlzLmJvcmRlckJvdHRvbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RSVCwgdGhpcy5ib3JkZXJSaWdodCwgdGhpcy5ib3JkZXJUb3ApO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBsaW5lIGxlZnRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saW5lUmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lUmlnaHQucGxvdCh0aGlzLmJvcmRlclJpZ2h0LCBiY3IuYm90dG9tLCB0aGlzLmJvcmRlclJpZ2h0LCBiY3IudG9wKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU3RhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3BQb3NDaGFuZ2VkKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYmNyID0gdGhpcy5nZXRDYW52YXNSZWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCb3JkZXJQb3MoYmNyKTtcblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgZG90c1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZURvdFRvKHRoaXMuZG90VCwgYmNyLmxlZnQgKyBiY3Iud2lkdGggLyAyLCB0aGlzLmJvcmRlclRvcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RMVCwgdGhpcy5ib3JkZXJMZWZ0LCB0aGlzLmJvcmRlclRvcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RSVCwgdGhpcy5ib3JkZXJSaWdodCwgdGhpcy5ib3JkZXJUb3ApO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBsaW5lIHRvcFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpbmVUb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lVG9wLnBsb3QoYmNyLmxlZnQsIHRoaXMuYm9yZGVyVG9wLCBiY3IucmlnaHQsIHRoaXMuYm9yZGVyVG9wKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU3RhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3R0b21Qb3NDaGFuZ2VkKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYmNyID0gdGhpcy5nZXRDYW52YXNSZWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCb3JkZXJQb3MoYmNyKTtcblxuICAgICAgICAgICAgICAgIC8vIG1vdmUgZG90c1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZURvdFRvKHRoaXMuZG90QiwgYmNyLmxlZnQgKyBiY3Iud2lkdGggLyAyLCB0aGlzLmJvcmRlckJvdHRvbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RMQiwgdGhpcy5ib3JkZXJMZWZ0LCB0aGlzLmJvcmRlckJvdHRvbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRG90VG8odGhpcy5kb3RSQiwgdGhpcy5ib3JkZXJSaWdodCwgdGhpcy5ib3JkZXJCb3R0b20pO1xuXG4gICAgICAgICAgICAgICAgLy8gbW92ZSBsaW5lIGJvdHRvbVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxpbmVCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lQm90dG9tLnBsb3QoYmNyLmxlZnQsIHRoaXMuYm9yZGVyQm90dG9tLCBiY3IucmlnaHQsIHRoaXMuYm9yZGVyQm90dG9tKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrU3RhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3NpdGlvbkNoYW5nZShldmVudDogYW55LCBrZXk6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlKCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2luc3BlY3RvcicsICdzcHJpdGUtY2hhbmdlJywge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6IHRoaXMudG9wUG9zLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXJCb3R0b206IHRoaXMuYm90dG9tUG9zLFxuICAgICAgICAgICAgICAgICAgICBib3JkZXJMZWZ0OiB0aGlzLmxlZnRQb3MsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJpZ2h0OiB0aGlzLnJpZ2h0UG9zLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g55uu55qE5piv57uZ5pawIGluc3BlY3RvciDph4znmoQgc3ByaXRlLWZyYW1lIOe7hOS7tuWPkemAgeaVsOaNrlxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdCgnc3ByaXRlLWVkaXRvcjpjaGFuZ2VkJywge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6IHRoaXMudG9wUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQm90dG9tOiB0aGlzLmJvdHRvbVBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckxlZnQ6IHRoaXMubGVmdFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJpZ2h0OiB0aGlzLnJpZ2h0UG9zLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHBhbmVsLmN1cnJlbnRLZXlzKGRhdGEubWV0YSk7XG4gICAgfVxuXG4gICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnaW5zcGVjdG9yJywgJ3Nwcml0ZS1zdGF0ZScsIHRydWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnaW5zcGVjdG9yJywgJ3Nwcml0ZS1zdGF0ZScsIGZhbHNlKTtcbiAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG51bGw7XG4gICAgcGFuZWwgPSBudWxsO1xufVxuXG4vLyBAdHMtaWdub3JlXG5mdW5jdGlvbiBjaXJjbGVUb29sKHN2Zywgc2l6ZSwgZmlsbCwgc3Ryb2tlLCBjdXJzb3IsIGNhbGxiYWNrcykge1xuICAgIGlmICh0eXBlb2YgY3Vyc29yICE9PSAnc3RyaW5nJykge1xuICAgICAgICBjYWxsYmFja3MgPSBjdXJzb3I7XG4gICAgICAgIGN1cnNvciA9ICdkZWZhdWx0JztcbiAgICB9XG5cbiAgICBjb25zdCBncm91cCA9IHN2Z1xuICAgICAgICAuZ3JvdXAoKVxuICAgICAgICAuc3R5bGUoJ2N1cnNvcicsIGN1cnNvcilcbiAgICAgICAgLmZpbGwoZmlsbCA/IGZpbGwgOiAnbm9uZScpXG4gICAgICAgIC5zdHJva2Uoc3Ryb2tlID8gc3Ryb2tlIDogJ25vbmUnKTtcblxuICAgIGNvbnN0IGNpcmNsZSA9IGdyb3VwLmNpcmNsZSgpLnJhZGl1cyhzaXplIC8gMik7XG5cbiAgICBsZXQgYmdDaXJjbGU6IGFueTtcbiAgICBpZiAoc3Ryb2tlKSB7XG4gICAgICAgIGJnQ2lyY2xlID0gZ3JvdXBcbiAgICAgICAgICAgIC5jaXJjbGUoKVxuICAgICAgICAgICAgLnN0cm9rZSh7IHdpZHRoOiA4IH0pXG4gICAgICAgICAgICAuZmlsbCgnbm9uZScpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMClcbiAgICAgICAgICAgIC5yYWRpdXMoc2l6ZSAvIDIpO1xuICAgIH1cblxuICAgIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgZ3JvdXAuc3R5bGUoJ3BvaW50ZXItZXZlbnRzJywgJ2JvdW5kaW5nLWJveCcpO1xuXG4gICAgZ3JvdXAub24oJ21vdXNlb3ZlcicsICgpID0+IHtcbiAgICAgICAgaWYgKHZtICYmIGZpbGwpIHtcbiAgICAgICAgICAgIGdyb3VwLmZpbGwoeyBjb2xvcjogdm0uc3ZnQ29sb3JCcmlnaHQgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0gJiYgc3Ryb2tlKSB7XG4gICAgICAgICAgICBncm91cC5zdHJva2UoeyBjb2xvcjogdm0uc3ZnQ29sb3JCcmlnaHQgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBncm91cC5vbignbW91c2VvdXQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgaWYgKCFkcmFnZ2luZykge1xuICAgICAgICAgICAgaWYgKGZpbGwpIHtcbiAgICAgICAgICAgICAgICBncm91cC5maWxsKGZpbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0cm9rZSkge1xuICAgICAgICAgICAgICAgIGdyb3VwLnN0cm9rZShzdHJva2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhZGRNb3ZlSGFuZGxlcyhcbiAgICAgICAgZ3JvdXAsXG4gICAgICAgIHsgY3Vyc29yIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHN0YXJ0KHgsIHksIGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZtICYmIGZpbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZmlsbCh7IGNvbG9yOiB2bS5zdmdDb2xvckJyaWdodCB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodm0gJiYgc3Ryb2tlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnN0cm9rZSh7IGNvbG9yOiB2bS5zdmdDb2xvckJyaWdodCB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tzLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zdGFydCh4LCB5LCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdXBkYXRlKGR4LCBkeSwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tzLnVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3MudXBkYXRlKGR4LCBkeSwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGVuZChldmVudCkge1xuICAgICAgICAgICAgICAgIGRyYWdnaW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpZiAoZmlsbCkge1xuICAgICAgICAgICAgICAgICAgICBncm91cC5maWxsKGZpbGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3Ryb2tlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnN0cm9rZShzdHJva2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3MuZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5lbmQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBncm91cC5yYWRpdXMgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgICAgICAgY2lyY2xlLnJhZGl1cyhyYWRpdXMpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChiZ0NpcmNsZSkge1xuICAgICAgICAgICAgYmdDaXJjbGUucmFkaXVzKHJhZGl1cyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGdyb3VwLmN4ID0gZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gdGhpcy54KHgpO1xuICAgIH07XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZ3JvdXAuY3kgPSBmdW5jdGlvbih5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnkoeSk7XG4gICAgfTtcblxuICAgIHJldHVybiBncm91cDtcbn1cbi8vIEB0cy1pZ25vcmVcbmZ1bmN0aW9uIGxpbmVUb29sKHN2ZywgZnJvbSwgdG8sIGNvbG9yLCBjdXJzb3IsIGNhbGxiYWNrcykge1xuICAgIGNvbnN0IGdyb3VwID0gc3ZnLmdyb3VwKCkuc3R5bGUoJ2N1cnNvcicsIGN1cnNvcikuc3Ryb2tlKHsgY29sb3IgfSk7XG4gICAgY29uc3QgbGluZSA9IGdyb3VwLmxpbmUoZnJvbS54LCBmcm9tLnksIHRvLngsIHRvLnkpLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAxKTtcblxuICAgIGNvbnN0IGJnbGluZSA9IGdyb3VwLmxpbmUoZnJvbS54LCBmcm9tLnksIHRvLngsIHRvLnkpLnN0eWxlKCdzdHJva2Utd2lkdGgnLCA4KS5zdHlsZSgnc3Ryb2tlLW9wYWNpdHknLCAwKTtcblxuICAgIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuXG4gICAgZ3JvdXAub24oJ21vdXNlb3ZlcicsICgpID0+IHtcbiAgICAgICAgdm0gJiYgZ3JvdXAuc3Ryb2tlKHsgY29sb3I6IHZtLnN2Z0NvbG9yQnJpZ2h0IH0pO1xuICAgIH0pO1xuXG4gICAgZ3JvdXAub24oJ21vdXNlb3V0JywgKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBpZiAoIWRyYWdnaW5nKSB7XG4gICAgICAgICAgICBncm91cC5zdHJva2UoeyBjb2xvciB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYWRkTW92ZUhhbmRsZXMoXG4gICAgICAgIGdyb3VwLFxuICAgICAgICB7IGN1cnNvciB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzdGFydCh4OiBudW1iZXIsIHk6IG51bWJlciwgZXZlbnQ6IEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgdm0gJiYgZ3JvdXAuc3Ryb2tlKHsgY29sb3I6IHZtLnN2Z0NvbG9yQnJpZ2h0IH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3RhcnQoeCwgeSwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHVwZGF0ZShkeDogbnVtYmVyLCBkeTogbnVtYmVyLCBldmVudDogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tzLnVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3MudXBkYXRlKGR4LCBkeSwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVuZChldmVudDogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGdyb3VwLnN0cm9rZSh7IGNvbG9yIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLmVuZChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICApO1xuXG4gICAgZ3JvdXAucGxvdCA9IGZ1bmN0aW9uKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGxpbmUucGxvdCguLi5hcmdzKTtcbiAgICAgICAgYmdsaW5lLnBsb3QoLi4uYXJncyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiBncm91cDtcbn1cbi8vIEB0cy1pZ25vcmVcbmZ1bmN0aW9uIGFkZE1vdmVIYW5kbGVzKGdpem1vLCBvcHRzLCBjYWxsYmFja3MpIHtcbiAgICBsZXQgcHJlc3N4ID0gMDtcbiAgICBsZXQgcHJlc3N5ID0gMDtcblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIGNhbGxiYWNrcyA9IG9wdHM7XG4gICAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb3VzZW1vdmVIYW5kbGUoZXZlbnQ6IEV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGR4ID0gZXZlbnQuY2xpZW50WCAtIHByZXNzeDtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBkeSA9IGV2ZW50LmNsaWVudFkgLSBwcmVzc3k7XG4gICAgICAgIGlmIChjYWxsYmFja3MudXBkYXRlKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MudXBkYXRlLmNhbGwoZ2l6bW8sIGR4LCBkeSwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW91c2V1cEhhbmRsZShldmVudDogRXZlbnQpIHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlSGFuZGxlKTtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG1vdXNldXBIYW5kbGUpO1xuXG4gICAgICAgIGlmIChjYWxsYmFja3MuZW5kKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MuZW5kLmNhbGwoZ2l6bW8sIGV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBnaXptby5vbignbW91c2Vkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC53aGljaCA9PT0gMSkge1xuICAgICAgICAgICAgcHJlc3N4ID0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgIHByZXNzeSA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdXNlbW92ZUhhbmRsZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2V1cEhhbmRsZSk7XG5cbiAgICAgICAgICAgIGlmIChjYWxsYmFja3Muc3RhcnQpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3RhcnQuY2FsbChnaXptbywgZXZlbnQub2Zmc2V0WCwgZXZlbnQub2Zmc2V0WSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xufVxuIl19