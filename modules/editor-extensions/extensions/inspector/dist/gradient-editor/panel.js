'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.methods = exports.$ = exports.fonts = exports.template = exports.style = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const d3 = require('d3');
const { cloneDeep } = require('lodash');
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
let cache;
function windowResize() {
    if (vm) {
        vm.resize();
    }
}
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../index.css'), 'utf8');
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static', '/template/gradient-editor.html'), 'utf8');
exports.fonts = [
    {
        name: 'inspector',
    },
];
exports.$ = {
    container: '.gradient-editor',
};
exports.methods = {
    data(data) {
        if (vm && data) {
            cache = data;
            vm.init({
                colorKeys: data.colorKeys,
                alphaKeys: data.alphaKeys,
                mode: data.mode,
            });
        }
    },
};
/**
 * 根据模式计算出需要的 stop
 *
 * @param {any[]} colors
 * @param {any[]} alphas
 * @param {number} mode
 * @returns
 */
function mergeStops(colors, alphas, mode) {
    const times = colors.concat(alphas).map((item) => item.time).sort((a, b) => a - b);
    const stops = [...new Set(times)].reduce((acc, cur) => {
        const color = colors.find((item) => !item.hide && item.time === cur) || {};
        const alpha = alphas.find((item) => !item.hide && item.time === cur) || {};
        if (color.time !== undefined || alpha.time !== undefined) {
            acc.push({ ...color, ...alpha });
        }
        return acc;
    }, []);
    // console.log('stops', stops, colors, alphas, times);
    cache.colorKeys = colors;
    cache.alphaKeys = alphas.map((item) => {
        const result = Object.assign(item);
        result.alpha = Number((item.alpha * 255).toFixed());
        return result;
    });
    cache.mode = mode;
    Editor.Message.send('inspector', 'gradient-change', cache);
    for (const [index, stop] of stops.entries()) {
        const { time, color, alpha } = stop;
        if (color === undefined) {
            stop.color = getValByType(index, time, stops, 'color', mode);
        }
        if (alpha === undefined) {
            stop.alpha = getValByType(index, time, stops, 'alpha', mode);
        }
    }
    if (mode === 1) {
        // mode fixed
        const repeatStops = [];
        for (const [index, stop] of stops.entries()) {
            const { time } = stop;
            repeatStops.push(stop);
            if (index < stops.length - 1) {
                const nextStop = stops[index + 1];
                repeatStops.push({ ...nextStop, time });
            }
        }
        return repeatStops;
    }
    else {
        // mode blend
        return stops;
    }
}
/**
 * 根据类型计算值
 *
 * @param {number} index
 * @param {number} time
 * @param {any[]} stops
 * @param {string} type
 * @param {number} mode
 * @returns
 */
function getValByType(index, time, stops, type, mode) {
    let next;
    let prev;
    for (let i = index + 1; i < stops.length; i++) {
        const stop = stops[i];
        if (stop[type] !== undefined) {
            next = stop;
            break;
        }
    }
    for (let i = index - 1; i >= 0; i--) {
        const stop = stops[i];
        if (stop[type] !== undefined) {
            prev = stop;
            break;
        }
    }
    if (!prev) {
        prev = next;
    }
    if (!next) {
        next = prev;
    }
    if (mode === 1) {
        return next[type];
    }
    if (!prev) {
        prev = { color: [255, 255, 255], time: 0 };
    }
    if (!next) {
        next = { color: [255, 255, 255], time: 1 };
    }
    let val = prev[type];
    if (prev !== next) {
        val = interpolateStopProperty(prev, next, time, type);
    }
    return val;
}
/**
 * 计算插值
 *
 * @param {*} prev
 * @param {*} next
 * @param {number} current
 * @param {string} type
 * @returns
 */
function interpolateStopProperty(prev, next, current, type) {
    const { time: start } = prev;
    const { time: end } = next;
    const total = end - start;
    const delta = current - start;
    const ratio = delta / total;
    const left = 1 - ratio;
    if (type === 'color') {
        return [0, 1, 2].map((key) => Math.round(prev.color[key] * left + next.color[key] * ratio));
    }
    else {
        return Math.round(prev.alpha * 100 * left + next.alpha * 100 * ratio) / 100;
    }
}
function ready() {
    // @ts-ignore
    panel = this;
    vm?.$destroy();
    vm = new Vue({
        el: panel.$.container,
        data: {
            enumList: [{
                    name: 'Blend',
                    value: 0,
                }, {
                    name: 'Fixed',
                    value: 1,
                }],
            gradient: {
                mode: 0,
                alphaKeys: [{ time: 0, alpha: 0, hide: false }, { time: 1, alpha: 1, hide: false }],
                colorKeys: [
                    {
                        time: 0.5, color: [249, 49, 83], hide: false,
                    }, {
                        time: 1, color: [255, 255, 255], hide: false,
                    },
                ],
            },
            margin: {
                top: 15,
                bottom: 15,
                left: 5,
                right: 5,
            },
            config: {
                anchorWidth: 10,
                anchorHeight: 15,
                width: 0,
                height: 75,
                defaultColor: [255, 255, 255],
                defaultAlpha: 1,
                colorLength: 8,
                alphaLength: 8,
            },
            selectedItem: null,
        },
        methods: {
            init(data) {
                data.colorKeys.map((item) => item.type = 'color');
                data.alphaKeys.map((item) => {
                    item.type = 'alpha';
                    item.alpha = (item.alpha / 255);
                });
                this.gradient = data;
                this.selectedItem = null;
                this.resize();
            },
            /**
             * 根据 type 获取对应的数据
             *
             * @param {*} this
             * @param {string} type
             * @returns
             */
            getVal(type) {
                if (this.selectedItem) {
                    switch (type) {
                        case 'color':
                            return JSON.stringify([...this.selectedItem.color, 255]);
                        case 'time':
                            return `${(this.selectedItem.time * 100).toFixed()}`;
                        case 'alpha':
                            return `${(this.selectedItem.alpha * 255).toFixed()}`;
                        default:
                            return this.selectedItem[type];
                    }
                }
            },
            /**
             * 根据 type 更新数据
             *
             * @param {*} this
             * @param {string} type
             * @param {*} event
             */
            confirm(type, event) {
                const { value } = event.target;
                this.update({ operation: 'assign', data: { value, type } });
            },
            getAnchors() {
                const { gradient: { alphaKeys, colorKeys } } = this;
                const colors = colorKeys.map((item, index) => {
                    return { ...item, index };
                });
                const alphas = alphaKeys.map((item, index) => {
                    return { ...item, index };
                });
                return colors.concat(alphas).sort((a, b) => {
                    if (a.time === b.time) {
                        if (a.active) {
                            return true;
                        }
                        if (b.active) {
                            return false;
                        }
                    }
                    return a.time - b.time;
                });
            },
            getStops() {
                const { gradient: { alphaKeys, colorKeys, mode } } = this;
                const colors = cloneDeep(colorKeys).sort((a, b) => {
                    if (a.time === b.time) {
                        if (a.active) {
                            return false;
                        }
                        if (b.active) {
                            return true;
                        }
                    }
                    return a.time - b.time;
                });
                const alphas = cloneDeep(alphaKeys).sort((a, b) => {
                    if (a.time === b.time) {
                        if (a.active) {
                            return false;
                        }
                        if (b.active) {
                            return true;
                        }
                    }
                    return a.time - b.time;
                });
                return mergeStops(colors, alphas, mode);
            },
            /**
             * 绘制渐变
             *
             * @param {*} this
             * @param {string} type
             * @param {number} index
             */
            drawStops(type, index) {
                const stops = this.getStops(type, index);
                const gradient = this._grad.selectAll('stop')
                    .data(stops, (d, i) => {
                    const { color, alpha, time } = d;
                    return `${time}${alpha}${color}${i}`;
                });
                gradient.exit().remove();
                gradient.enter().append('stop')
                    .merge(gradient)
                    .attr('offset', (d) => {
                    return d.time * 100 + '%';
                })
                    .style('stop-color', (d) => d3.rgb(...d.color))
                    .style('stop-opacity', (d) => d.alpha !== undefined ? d.alpha : 1);
            },
            /**
             * 绘制控制点
             *
             * @param {*} this
             * @param {string} [tag]
             */
            drawAnchors(tag) {
                const anchors = this.getAnchors();
                const { config: { width }, margin } = this;
                const rectWidth = width - margin.left - margin.right;
                const self = this;
                const paths = this._svg.selectAll('path')
                    .data(anchors, (d, index) => {
                    const { color, alpha, time, type } = d;
                    return `${type}${time}${alpha}${color}${index}`;
                });
                paths.exit().remove();
                let enable = false;
                paths.enter()
                    .append('path')
                    .merge(paths)
                    .attr('class', (d) => {
                    return ['hide', 'add', 'active'].filter((key) => d[key]).concat(['anchor']).join(' ');
                })
                    .attr('index', (d) => {
                    return d.index;
                })
                    .attr('type', (d) => {
                    return d.type;
                })
                    .attr('d', (d) => {
                    return this.drawAnchor(d);
                })
                    .attr('transform', (d) => {
                    return `translate(${d.time * rectWidth}, 0)`;
                })
                    .attr('fill', (d) => {
                    if (d.type === 'color') {
                        return d3.rgb(...d.color);
                    }
                    return d3.rgb(...Array.from({ length: 3 }, () => d.alpha * 255));
                }).order().call(d3.drag().filter(['dragstart', 'drag'])
                    .on('start', function () {
                    const anchor = d3.select(this);
                    const data = anchor.datum();
                    self.update({ data, operation: 'active' });
                })
                    .on('drag', function () {
                    if (d3.event.dx || d3.event.dy) {
                        enable = true;
                        self.update({ operation: 'move' });
                    }
                })
                    .on('end', function () {
                    if (enable) {
                        enable = false;
                        self.update({ operation: 'drop' });
                    }
                }));
            },
            /**
             * 根据操作类型更新
             *
             * @param {*} this
             * @param options
             * data?: any, operation: string,
             * @returns
             */
            update(options) {
                const { config: { width, height }, margin } = this;
                const { data, operation } = options;
                switch (operation) {
                    case 'active': {
                        // 取消选中
                        this.gradient.colorKeys.map((item) => { item.active = false; });
                        this.gradient.alphaKeys.map((item) => { item.active = false; });
                        const { type, index } = data;
                        const group = this.gradient[`${type}Keys`];
                        const item = group[index];
                        item.active = true;
                        this.selectedItem = item;
                        this.drawAnchors();
                        break;
                    }
                    case 'move': {
                        const { type, index } = this._svg.select('.anchor.active').datum();
                        const group = this.gradient[`${type}Keys`];
                        const item = group[index];
                        const [x, y] = d3.mouse(this._svg.node());
                        const hide = type === 'color' ? (y < height - margin.bottom || y > height)
                            : (y > margin.top || y < 0);
                        const ratio = Math.round((x - margin.left)
                            / (width - margin.left - margin.right) * 100) / 100;
                        const time = Math.max(Math.min(ratio, 1), 0);
                        item.time = time;
                        if (item.hide && hide) {
                            return;
                        }
                        item.hide = group.length > 1 && hide;
                        this.drawAnchors();
                        this.drawStops();
                        break;
                    }
                    case 'drop': {
                        const { type, index } = this._svg.select('.anchor.active').datum();
                        const group = this.gradient[`${type}Keys`];
                        const item = group[index];
                        const [x, y] = d3.mouse(this._svg.node());
                        const hide = type === 'color' ? (y < height - margin.bottom || y > height)
                            : (y > margin.top || y < 0);
                        const ratio = Math.round((x - margin.left)
                            / (width - margin.left - margin.right) * 100) / 100;
                        const time = Math.max(Math.min(ratio, 1), 0);
                        item.time = time;
                        item.hide = group.length > 1 && hide;
                        if (item.hide) {
                            group.splice(index, 1);
                            this.selectedItem = null;
                        }
                        else {
                            const uniqueItems = [...new Set(group.map((item) => item.time))];
                            if (group.length > uniqueItems.length) {
                                let repeatItemIndex;
                                for (const [i, o] of group.entries()) {
                                    if (o.time === time && i !== index) {
                                        repeatItemIndex = i;
                                        break;
                                    }
                                }
                                group.splice(repeatItemIndex, 1);
                            }
                        }
                        this.drawAnchors();
                        this.drawStops();
                        break;
                    }
                    case 'create': {
                        const [x, y] = d3.mouse(this._svg.node());
                        if (y > margin.top && y < height - margin.bottom) {
                            return false;
                        }
                        const type = y > margin.top ? 'color' : 'alpha';
                        const group = this.gradient[`${type}Keys`];
                        const index = group.length;
                        if (index >= this.config[`${type}Length`]) {
                            return false;
                        }
                        const ratio = Math.round((x - margin.left)
                            / (width - margin.left - margin.right) * 100) / 100;
                        const time = Math.max(Math.min(ratio, 1), 0);
                        const val = type === 'color' ? [...this.config.defaultColor] : this.config.defaultAlpha;
                        const data = { time, type, [type]: val, index };
                        group.push(data);
                        this.drawStops();
                        this.update({ data, operation: 'active' });
                        return true;
                    }
                    case 'assign': {
                        const { type, value } = data;
                        if (type === 'mode') {
                            this.gradient.mode = parseInt(value, 10);
                            return this.drawStops();
                        }
                        if (this.selectedItem) {
                            switch (type) {
                                case 'time': {
                                    this.selectedItem.time = value / 100;
                                    break;
                                }
                                case 'alpha': {
                                    this.selectedItem.alpha = Math.floor(value * 100 / 255) / 100;
                                    break;
                                }
                                case 'color': {
                                    this.selectedItem.color = value.slice(0, -1);
                                    break;
                                }
                                default:
                                    break;
                            }
                            this.drawAnchors();
                            this.drawStops();
                        }
                        break;
                    }
                    default:
                        break;
                }
            },
            resize() {
                const self = this;
                const el = this.$el.querySelector('.gradient');
                this.config.width = el.clientWidth;
                const { config: { width, height }, margin, } = this;
                const rectWidth = width - margin.left - margin.right;
                const rectHeight = height - margin.top - margin.bottom;
                if (!this._svg) {
                    this._svg = d3.select(el).append('svg')
                        .attr('width', width)
                        .attr('height', height);
                    this._grad = this._svg.append('defs')
                        .append('linearGradient')
                        .attr('id', 'grad')
                        .attr('x1', '0')
                        .attr('x2', '100%')
                        .attr('y1', '0')
                        .attr('y2', 0);
                    this._rect = this._svg.append('rect')
                        .attr('class', 'canvas')
                        .attr('x', margin.left)
                        .attr('y', margin.top)
                        .attr('width', rectWidth)
                        .attr('height', rectHeight)
                        .attr('fill', 'url(#grad)');
                }
                else {
                    this._svg.attr('width', width);
                    this._rect.attr('width', rectWidth)
                        .attr('height', rectHeight)
                        .attr('fill', 'url(#grad)');
                }
                let enable = false;
                this._svg.call(d3.drag()
                    .on('start', function () {
                    enable = self.update({ operation: 'create' });
                })
                    .on('drag', function () {
                    if (enable) {
                        self.update({ operation: 'move' });
                    }
                })
                    .on('end', function () {
                    if (enable) {
                        enable = false;
                        self.update({ operation: 'drop' });
                    }
                }));
                this.drawStops();
                this.drawAnchors();
            },
            drawAnchor(item) {
                const { margin, config: { height, anchorWidth, anchorHeight } } = this;
                const { type } = item;
                const isDown = type === 'color';
                const x = margin.left;
                const y = isDown ? height - margin.bottom : margin.top;
                const t = isDown ? 1 : -1;
                return `M${x} ${y}
                    L${x - anchorWidth / 2} ${y + anchorHeight / 3 * t}
                    ${x - anchorWidth / 2} ${y + anchorHeight * t}
                    ${x + anchorWidth / 2} ${y + anchorHeight * t}
                    ${x + anchorWidth / 2} ${y + anchorHeight / 3 * t}z`;
            },
        },
    });
    // 由于窗口是 simple 模式，resize 需要绑在 window 上
    window.addEventListener('resize', windowResize);
    Editor.Message.send('inspector', 'gradient-state', true);
}
exports.ready = ready;
function close() {
    window.removeEventListener('resize', windowResize);
    vm?.$destroy();
    vm = null;
    panel = null;
    Editor.Message.send('inspector', 'gradient-state', false);
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZ3JhZGllbnQtZWRpdG9yL3BhbmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWIsMkJBQWtDO0FBQ2xDLCtCQUE0QjtBQUU1QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUd4QyxNQUFNLEdBQUcsR0FBbUIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUU1QixJQUFJLEtBQUssR0FBUSxJQUFJLENBQUM7QUFDdEIsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBQ25CLElBQUksS0FBVSxDQUFDO0FBRWYsU0FBUyxZQUFZO0lBQ2pCLElBQUksRUFBRSxFQUFFO1FBQ0osRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQ2Y7QUFDTCxDQUFDO0FBRVksUUFBQSxLQUFLLEdBQUcsSUFBQSxpQkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUU5RCxRQUFBLFFBQVEsR0FBRyxJQUFBLGlCQUFZLEVBQ2hDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLENBQUMsRUFDakUsTUFBTSxDQUNULENBQUM7QUFFVyxRQUFBLEtBQUssR0FBRztJQUNqQjtRQUNJLElBQUksRUFBRSxXQUFXO0tBQ3BCO0NBQ0osQ0FBQztBQUVXLFFBQUEsQ0FBQyxHQUFHO0lBQ2IsU0FBUyxFQUFFLGtCQUFrQjtDQUNoQyxDQUFDO0FBRVcsUUFBQSxPQUFPLEdB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c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuXG5jb25zdCBkMyA9IHJlcXVpcmUoJ2QzJyk7XG5jb25zdCB7IGNsb25lRGVlcCB9ID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmltcG9ydCB0eXBlIHsgVnVlQ29uc3RydWN0b3IgfSBmcm9tICd2dWUnO1xuY29uc3QgVnVlOiBWdWVDb25zdHJ1Y3RvciA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmxldCBwYW5lbDogYW55ID0gbnVsbDtcbmxldCB2bTogYW55ID0gbnVsbDtcbmxldCBjYWNoZTogYW55O1xuXG5mdW5jdGlvbiB3aW5kb3dSZXNpemUoKXtcbiAgICBpZiAodm0pIHtcbiAgICAgICAgdm0ucmVzaXplKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9pbmRleC5jc3MnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKFxuICAgIGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljJywgJy90ZW1wbGF0ZS9ncmFkaWVudC1lZGl0b3IuaHRtbCcpLFxuICAgICd1dGY4Jyxcbik7XG5cbmV4cG9ydCBjb25zdCBmb250cyA9IFtcbiAgICB7XG4gICAgICAgIG5hbWU6ICdpbnNwZWN0b3InLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgJCA9IHsgXG4gICAgY29udGFpbmVyOiAnLmdyYWRpZW50LWVkaXRvcicsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBkYXRhKGRhdGE6IGFueSkge1xuICAgICAgICBpZiAodm0gJiYgZGF0YSkge1xuICAgICAgICAgICAgY2FjaGUgPSBkYXRhO1xuICAgICAgICAgICAgdm0uaW5pdCh7XG4gICAgICAgICAgICAgICAgY29sb3JLZXlzOiBkYXRhLmNvbG9yS2V5cyxcbiAgICAgICAgICAgICAgICBhbHBoYUtleXM6IGRhdGEuYWxwaGFLZXlzLFxuICAgICAgICAgICAgICAgIG1vZGU6IGRhdGEubW9kZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbi8qKlxuICog5qC55o2u5qih5byP6K6h566X5Ye66ZyA6KaB55qEIHN0b3BcbiAqXG4gKiBAcGFyYW0ge2FueVtdfSBjb2xvcnNcbiAqIEBwYXJhbSB7YW55W119IGFscGhhc1xuICogQHBhcmFtIHtudW1iZXJ9IG1vZGVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIG1lcmdlU3RvcHMoY29sb3JzOiBhbnlbXSwgYWxwaGFzOiBhbnlbXSwgbW9kZTogbnVtYmVyKSB7XG4gICAgY29uc3QgdGltZXMgPSBjb2xvcnMuY29uY2F0KGFscGhhcykubWFwKChpdGVtOiBhbnkpID0+IGl0ZW0udGltZSkuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgIGNvbnN0IHN0b3BzID0gWy4uLm5ldyBTZXQodGltZXMpXS5yZWR1Y2UoKGFjYzogYW55W10sIGN1cjogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbG9yID0gY29sb3JzLmZpbmQoKGl0ZW06IGFueSkgPT4gIWl0ZW0uaGlkZSAmJiBpdGVtLnRpbWUgPT09IGN1cikgfHwge307XG4gICAgICAgIGNvbnN0IGFscGhhID0gYWxwaGFzLmZpbmQoKGl0ZW06IGFueSkgPT4gIWl0ZW0uaGlkZSAmJiBpdGVtLnRpbWUgPT09IGN1cikgfHwge307XG4gICAgICAgIGlmIChjb2xvci50aW1lICE9PSB1bmRlZmluZWQgfHwgYWxwaGEudGltZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhY2MucHVzaCh7IC4uLmNvbG9yLCAuLi5hbHBoYSB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIFtdKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCdzdG9wcycsIHN0b3BzLCBjb2xvcnMsIGFscGhhcywgdGltZXMpO1xuICAgIGNhY2hlLmNvbG9yS2V5cyA9IGNvbG9ycztcbiAgICBjYWNoZS5hbHBoYUtleXMgPSBhbHBoYXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IE9iamVjdC5hc3NpZ24oaXRlbSk7XG4gICAgICAgIHJlc3VsdC5hbHBoYSA9IE51bWJlcigoaXRlbS5hbHBoYSAqIDI1NSkudG9GaXhlZCgpKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIGNhY2hlLm1vZGUgPSBtb2RlO1xuICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2luc3BlY3RvcicsICdncmFkaWVudC1jaGFuZ2UnLCBjYWNoZSk7XG5cbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgc3RvcF0gb2Ygc3RvcHMuZW50cmllcygpKSB7XG4gICAgICAgIGNvbnN0IHsgdGltZSwgY29sb3IsIGFscGhhIH0gPSBzdG9wO1xuICAgICAgICBpZiAoY29sb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc3RvcC5jb2xvciA9IGdldFZhbEJ5VHlwZShpbmRleCwgdGltZSwgc3RvcHMsICdjb2xvcicsIG1vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbHBoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzdG9wLmFscGhhID0gZ2V0VmFsQnlUeXBlKGluZGV4LCB0aW1lLCBzdG9wcywgJ2FscGhhJywgbW9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1vZGUgPT09IDEpIHtcbiAgICAgICAgLy8gbW9kZSBmaXhlZFxuICAgICAgICBjb25zdCByZXBlYXRTdG9wcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IFtpbmRleCwgc3RvcF0gb2Ygc3RvcHMuZW50cmllcygpKSB7XG4gICAgICAgICAgICBjb25zdCB7IHRpbWUgfSA9IHN0b3A7XG4gICAgICAgICAgICByZXBlYXRTdG9wcy5wdXNoKHN0b3ApO1xuICAgICAgICAgICAgaWYgKGluZGV4IDwgc3RvcHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRTdG9wID0gc3RvcHNbaW5kZXggKyAxXTtcbiAgICAgICAgICAgICAgICByZXBlYXRTdG9wcy5wdXNoKHsgLi4ubmV4dFN0b3AsIHRpbWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcGVhdFN0b3BzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG1vZGUgYmxlbmRcbiAgICAgICAgcmV0dXJuIHN0b3BzO1xuICAgIH1cbn1cblxuLyoqXG4gKiDmoLnmja7nsbvlnovorqHnrpflgLxcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lXG4gKiBAcGFyYW0ge2FueVtdfSBzdG9wc1xuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBtb2RlXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBnZXRWYWxCeVR5cGUoaW5kZXg6IG51bWJlciwgdGltZTogbnVtYmVyLCBzdG9wczogYW55W10sIHR5cGU6IHN0cmluZywgbW9kZTogbnVtYmVyKSB7XG4gICAgbGV0IG5leHQ6IGFueTtcbiAgICBsZXQgcHJldjogYW55O1xuICAgIGZvciAobGV0IGkgPSBpbmRleCArIDE7IGkgPCBzdG9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzdG9wID0gc3RvcHNbaV07XG4gICAgICAgIGlmIChzdG9wW3R5cGVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG5leHQgPSBzdG9wO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgY29uc3Qgc3RvcCA9IHN0b3BzW2ldO1xuICAgICAgICBpZiAoc3RvcFt0eXBlXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBwcmV2ID0gc3RvcDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFwcmV2KSB7XG4gICAgICAgIHByZXYgPSBuZXh0O1xuICAgIH1cbiAgICBpZiAoIW5leHQpIHtcbiAgICAgICAgbmV4dCA9IHByZXY7XG4gICAgfVxuICAgIGlmIChtb2RlID09PSAxKSB7XG4gICAgICAgIHJldHVybiBuZXh0W3R5cGVdO1xuICAgIH1cblxuICAgIGlmICghcHJldikge1xuICAgICAgICBwcmV2ID0geyBjb2xvcjogWzI1NSwgMjU1LCAyNTVdLCB0aW1lOiAwIH07XG4gICAgfVxuXG4gICAgaWYgKCFuZXh0KSB7XG4gICAgICAgIG5leHQgPSB7IGNvbG9yOiBbMjU1LCAyNTUsIDI1NV0sIHRpbWU6IDEgfTtcbiAgICB9XG5cbiAgICBsZXQgdmFsID0gcHJldlt0eXBlXTtcbiAgICBpZiAocHJldiAhPT0gbmV4dCkge1xuICAgICAgICB2YWwgPSBpbnRlcnBvbGF0ZVN0b3BQcm9wZXJ0eShwcmV2LCBuZXh0LCB0aW1lLCB0eXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIOiuoeeul+aPkuWAvFxuICpcbiAqIEBwYXJhbSB7Kn0gcHJldlxuICogQHBhcmFtIHsqfSBuZXh0XG4gKiBAcGFyYW0ge251bWJlcn0gY3VycmVudFxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIGludGVycG9sYXRlU3RvcFByb3BlcnR5KHByZXY6IGFueSwgbmV4dDogYW55LCBjdXJyZW50OiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IHsgdGltZTogc3RhcnQgfSA9IHByZXY7XG4gICAgY29uc3QgeyB0aW1lOiBlbmQgfSA9IG5leHQ7XG4gICAgY29uc3QgdG90YWwgPSBlbmQgLSBzdGFydDtcbiAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnQgLSBzdGFydDtcbiAgICBjb25zdCByYXRpbyA9IGRlbHRhIC8gdG90YWw7XG4gICAgY29uc3QgbGVmdCA9IDEgLSByYXRpbztcbiAgICBpZiAodHlwZSA9PT0gJ2NvbG9yJykge1xuICAgICAgICByZXR1cm4gWzAsIDEsIDJdLm1hcCgoa2V5OiBudW1iZXIpID0+IE1hdGgucm91bmQoXG4gICAgICAgICAgICBwcmV2LmNvbG9yW2tleV0gKiBsZWZ0ICsgbmV4dC5jb2xvcltrZXldICogcmF0aW8sXG4gICAgICAgICkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHByZXYuYWxwaGEgKiAxMDAgKiBsZWZ0ICsgbmV4dC5hbHBoYSAqIDEwMCAqIHJhdGlvKSAvIDEwMDtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xuXG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBuZXcgVnVlKHtcbiAgICAgICAgZWw6IHBhbmVsLiQuY29udGFpbmVyLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBlbnVtTGlzdDogW3tcbiAgICAgICAgICAgICAgICBuYW1lOiAnQmxlbmQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdGaXhlZCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDEsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIGdyYWRpZW50OiB7XG4gICAgICAgICAgICAgICAgbW9kZTogMCxcbiAgICAgICAgICAgICAgICBhbHBoYUtleXM6IFt7IHRpbWU6IDAsIGFscGhhOiAwLCBoaWRlOiBmYWxzZSB9LCB7IHRpbWU6IDEsIGFscGhhOiAxLCBoaWRlOiBmYWxzZSB9XSxcbiAgICAgICAgICAgICAgICBjb2xvcktleXM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogMC41LCBjb2xvcjogWzI0OSwgNDksIDgzXSwgaGlkZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IDEsIGNvbG9yOiBbMjU1LCAyNTUsIDI1NV0sIGhpZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWFyZ2luOiB7XG4gICAgICAgICAgICAgICAgdG9wOiAxNSxcbiAgICAgICAgICAgICAgICBib3R0b206IDE1LFxuICAgICAgICAgICAgICAgIGxlZnQ6IDUsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IDUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgYW5jaG9yV2lkdGg6IDEwLFxuICAgICAgICAgICAgICAgIGFuY2hvckhlaWdodDogMTUsXG4gICAgICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiA3NSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0Q29sb3I6IFsyNTUsIDI1NSwgMjU1XSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0QWxwaGE6IDEsXG4gICAgICAgICAgICAgICAgY29sb3JMZW5ndGg6IDgsXG4gICAgICAgICAgICAgICAgYWxwaGFMZW5ndGg6IDgsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VsZWN0ZWRJdGVtOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgICBtZXRob2RzOiB7XG4gICAgICAgICAgICBpbml0KHRoaXM6IGFueSwgZGF0YTogeyBjb2xvcktleXM6IGFueVtdLCBhbHBoYUtleXM6IGFueVtdLCBtb2RlOiBudW1iZXIgfSkge1xuICAgICAgICAgICAgICAgIGRhdGEuY29sb3JLZXlzLm1hcCgoaXRlbTogYW55KSA9PiBpdGVtLnR5cGUgPSAnY29sb3InKTtcbiAgICAgICAgICAgICAgICBkYXRhLmFscGhhS2V5cy5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnR5cGUgPSAnYWxwaGEnO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmFscGhhID0gKGl0ZW0uYWxwaGEgLyAyNTUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JhZGllbnQgPSBkYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5qC55o2uIHR5cGUg6I635Y+W5a+55bqU55qE5pWw5o2uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHsqfSB0aGlzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICAgICAgICAgICAgICogQHJldHVybnNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0VmFsKHRoaXM6IGFueSwgdHlwZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRJdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShbLi4udGhpcy5zZWxlY3RlZEl0ZW0uY29sb3IsIDI1NV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGltZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAkeyh0aGlzLnNlbGVjdGVkSXRlbS50aW1lICogMTAwKS50b0ZpeGVkKCl9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2FscGhhJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7KHRoaXMuc2VsZWN0ZWRJdGVtLmFscGhhICogMjU1KS50b0ZpeGVkKCl9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRJdGVtW3R5cGVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog5qC55o2uIHR5cGUg5pu05paw5pWw5o2uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHsqfSB0aGlzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICAgICAgICAgICAgICogQHBhcmFtIHsqfSBldmVudFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25maXJtKHRoaXM6IGFueSwgdHlwZTogc3RyaW5nLCBldmVudDogYW55KSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB7IHZhbHVlIH0gPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoeyBvcGVyYXRpb246ICdhc3NpZ24nLCBkYXRhOiB7IHZhbHVlLCB0eXBlIH0gfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QW5jaG9ycyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGdyYWRpZW50OiB7IGFscGhhS2V5cywgY29sb3JLZXlzIH0gfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JzID0gY29sb3JLZXlzLm1hcCgoaXRlbTogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLml0ZW0sIGluZGV4IH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxwaGFzID0gYWxwaGFLZXlzLm1hcCgoaXRlbTogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLml0ZW0sIGluZGV4IH07XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JzLmNvbmNhdChhbHBoYXMpLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPT09IGIudGltZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYi5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEudGltZSAtIGIudGltZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9wcyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGdyYWRpZW50OiB7IGFscGhhS2V5cywgY29sb3JLZXlzLCBtb2RlIH0gfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3JzID0gY2xvbmVEZWVwKGNvbG9yS2V5cykuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEudGltZSA9PT0gYi50aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYi5hY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS50aW1lIC0gYi50aW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFscGhhcyA9IGNsb25lRGVlcChhbHBoYUtleXMpLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPT09IGIudGltZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGIuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEudGltZSAtIGIudGltZTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBtZXJnZVN0b3BzKGNvbG9ycywgYWxwaGFzLCBtb2RlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe7mOWItua4kOWPmFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Kn0gdGhpc1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmF3U3RvcHModGhpczogYW55LCB0eXBlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdG9wcyA9IHRoaXMuZ2V0U3RvcHModHlwZSwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gdGhpcy5fZ3JhZC5zZWxlY3RBbGwoJ3N0b3AnKVxuICAgICAgICAgICAgICAgICAgICAuZGF0YShzdG9wcywgKGQ6IGFueSwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGNvbG9yLCBhbHBoYSwgdGltZSB9ID0gZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHt0aW1lfSR7YWxwaGF9JHtjb2xvcn0ke2l9YDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuZXhpdCgpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuZW50ZXIoKS5hcHBlbmQoJ3N0b3AnKVxuICAgICAgICAgICAgICAgICAgICAubWVyZ2UoZ3JhZGllbnQpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdvZmZzZXQnLCAoZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC50aW1lICogMTAwICsgJyUnO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ3N0b3AtY29sb3InLCAoZDogYW55KSA9PiBkMy5yZ2IoLi4uZC5jb2xvcikpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgnc3RvcC1vcGFjaXR5JywgKGQ6IGFueSkgPT4gZC5hbHBoYSAhPT0gdW5kZWZpbmVkID8gZC5hbHBoYSA6IDEpO1xuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnu5jliLbmjqfliLbngrlcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0geyp9IHRoaXNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdGFnXVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkcmF3QW5jaG9ycyh0aGlzOiBhbnksIHRhZz86IHN0cmluZykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuY2hvcnMgPSB0aGlzLmdldEFuY2hvcnMoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGNvbmZpZzogeyB3aWR0aCB9LCBtYXJnaW4gfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVjdFdpZHRoID0gd2lkdGggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gdGhpcy5fc3ZnLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgICAgICAgICAgICAgICAgIC5kYXRhKGFuY2hvcnMsIChkOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgY29sb3IsIGFscGhhLCB0aW1lLCB0eXBlIH0gPSBkO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke3R5cGV9JHt0aW1lfSR7YWxwaGF9JHtjb2xvcn0ke2luZGV4fWA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcGF0aHMuZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIGxldCBlbmFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYXRocy5lbnRlcigpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgICAgICAgICAgICAubWVyZ2UocGF0aHMpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIChkOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbJ2hpZGUnLCAnYWRkJywgJ2FjdGl2ZSddLmZpbHRlcigoa2V5OiBzdHJpbmcpID0+IGRba2V5XSkuY29uY2F0KFsnYW5jaG9yJ10pLmpvaW4oJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2luZGV4JywgKGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd0eXBlJywgKGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQudHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2QnLCAoZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kcmF3QW5jaG9yKGQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgKGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGB0cmFuc2xhdGUoJHtkLnRpbWUgKiByZWN0V2lkdGh9LCAwKWA7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgKGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQudHlwZSA9PT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkMy5yZ2IoLi4uZC5jb2xvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDMucmdiKC4uLkFycmF5LmZyb20oeyBsZW5ndGg6IDMgfSwgKCkgPT4gZC5hbHBoYSAqIDI1NSkpO1xuICAgICAgICAgICAgICAgICAgICB9KS5vcmRlcigpLmNhbGwoXG4gICAgICAgICAgICAgICAgICAgICAgICBkMy5kcmFnKCkuZmlsdGVyKFsnZHJhZ3N0YXJ0JywgJ2RyYWcnXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ3N0YXJ0JywgZnVuY3Rpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuY2hvciA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGFuY2hvci5kYXR1bSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZSh7IGRhdGEsIG9wZXJhdGlvbjogJ2FjdGl2ZScgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmR4IHx8IGQzLmV2ZW50LmR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGUoeyBvcGVyYXRpb246ICdtb3ZlJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ2VuZCcsIGZ1bmN0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlKHsgb3BlcmF0aW9uOiAnZHJvcCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOagueaNruaTjeS9nOexu+Wei+abtOaWsFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Kn0gdGhpc1xuICAgICAgICAgICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgICAgICAgICAqIGRhdGE/OiBhbnksIG9wZXJhdGlvbjogc3RyaW5nLFxuICAgICAgICAgICAgICogQHJldHVybnNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlKHRoaXM6IGFueSwgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGRhdGE/OiBhbnksIG9wZXJhdGlvbjogc3RyaW5nLFxuICAgICAgICAgICAgfSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgY29uZmlnOiB7IHdpZHRoLCBoZWlnaHQgfSwgbWFyZ2luIH0gPSB0aGlzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgb3BlcmF0aW9uIH0gPSBvcHRpb25zO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYWN0aXZlJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y+W5raI6YCJ5LitXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyYWRpZW50LmNvbG9yS2V5cy5tYXAoKGl0ZW06IGFueSkgPT4geyBpdGVtLmFjdGl2ZSA9IGZhbHNlOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JhZGllbnQuYWxwaGFLZXlzLm1hcCgoaXRlbTogYW55KSA9PiB7IGl0ZW0uYWN0aXZlID0gZmFsc2U7IH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHR5cGUsIGluZGV4IH0gPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyYWRpZW50W2Ake3R5cGV9S2V5c2BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IGdyb3VwW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0FuY2hvcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21vdmUnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHR5cGUsIGluZGV4IH0gPSB0aGlzLl9zdmcuc2VsZWN0KCcuYW5jaG9yLmFjdGl2ZScpLmRhdHVtKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cCA9IHRoaXMuZ3JhZGllbnRbYCR7dHlwZX1LZXlzYF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gZ3JvdXBbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW3gsIHldID0gZDMubW91c2UodGhpcy5fc3ZnLm5vZGUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoaWRlID0gdHlwZSA9PT0gJ2NvbG9yJyA/ICh5IDwgaGVpZ2h0IC0gbWFyZ2luLmJvdHRvbSB8fCB5ID4gaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogKHkgPiBtYXJnaW4udG9wIHx8IHkgPCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoeCAtIG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8gKHdpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQpICogMTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWUgPSBNYXRoLm1heChNYXRoLm1pbihyYXRpbywgMSksIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS50aW1lID0gdGltZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaGlkZSAmJiBoaWRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmhpZGUgPSBncm91cC5sZW5ndGggPiAxICYmIGhpZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdBbmNob3JzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdG9wcygpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkcm9wJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyB0eXBlLCBpbmRleCB9ID0gdGhpcy5fc3ZnLnNlbGVjdCgnLmFuY2hvci5hY3RpdmUnKS5kYXR1bSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyYWRpZW50W2Ake3R5cGV9S2V5c2BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IGdyb3VwW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFt4LCB5XSA9IGQzLm1vdXNlKHRoaXMuX3N2Zy5ub2RlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGlkZSA9IHR5cGUgPT09ICdjb2xvcicgPyAoeSA8IGhlaWdodCAtIG1hcmdpbi5ib3R0b20gfHwgeSA+IGhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICh5ID4gbWFyZ2luLnRvcCB8fCB5IDwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHggLSBtYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvICh3aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0KSAqIDEwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICkgLyAxMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lID0gTWF0aC5tYXgoTWF0aC5taW4ocmF0aW8sIDEpLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGltZSA9IHRpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmhpZGUgPSBncm91cC5sZW5ndGggPiAxICYmIGhpZGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmhpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdW5pcXVlSXRlbXMgPSBbLi4ubmV3IFNldChncm91cC5tYXAoKGl0ZW06IGFueSkgPT4gaXRlbS50aW1lKSldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChncm91cC5sZW5ndGggPiB1bmlxdWVJdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcGVhdEl0ZW1JbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbaSwgb10gb2YgZ3JvdXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoby50aW1lID09PSB0aW1lICYmIGkgIT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0SXRlbUluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cC5zcGxpY2UocmVwZWF0SXRlbUluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0FuY2hvcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0b3BzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlICdjcmVhdGUnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbeCwgeV0gPSBkMy5tb3VzZSh0aGlzLl9zdmcubm9kZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh5ID4gbWFyZ2luLnRvcCAmJiB5IDwgaGVpZ2h0IC0gbWFyZ2luLmJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB5ID4gbWFyZ2luLnRvcCA/ICdjb2xvcicgOiAnYWxwaGEnO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyYWRpZW50W2Ake3R5cGV9S2V5c2BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBncm91cC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gdGhpcy5jb25maWdbYCR7dHlwZX1MZW5ndGhgXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh4IC0gbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyAod2lkdGggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCkgKiAxMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICApIC8gMTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGltZSA9IE1hdGgubWF4KE1hdGgubWluKHJhdGlvLCAxKSwgMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHR5cGUgPT09ICdjb2xvcicgPyBbLi4udGhpcy5jb25maWcuZGVmYXVsdENvbG9yXSA6IHRoaXMuY29uZmlnLmRlZmF1bHRBbHBoYTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7IHRpbWUsIHR5cGUsIFt0eXBlXTogdmFsLCBpbmRleCB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cC5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RvcHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKHsgZGF0YSwgb3BlcmF0aW9uOiAnYWN0aXZlJyB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjYXNlICdhc3NpZ24nOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHR5cGUsIHZhbHVlIH0gPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdtb2RlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JhZGllbnQubW9kZSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZHJhd1N0b3BzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGltZSc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtLnRpbWUgPSB2YWx1ZSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2FscGhhJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0uYWxwaGEgPSBNYXRoLmZsb29yKHZhbHVlICogMTAwIC8gMjU1KSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEl0ZW0uY29sb3IgPSB2YWx1ZS5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0FuY2hvcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdG9wcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2l6ZSh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IHRoaXMuJGVsLnF1ZXJ5U2VsZWN0b3IoJy5ncmFkaWVudCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLndpZHRoID0gZWwuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHsgd2lkdGgsIGhlaWdodCB9LCBtYXJnaW4sXG4gICAgICAgICAgICAgICAgfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVjdFdpZHRoID0gd2lkdGggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCByZWN0SGVpZ2h0ID0gaGVpZ2h0IC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3N2Zykge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N2ZyA9IGQzLnNlbGVjdChlbCkuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ncmFkID0gdGhpcy5fc3ZnLmFwcGVuZCgnZGVmcycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCdsaW5lYXJHcmFkaWVudCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaWQnLCAnZ3JhZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigneDEnLCAnMCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigneDInLCAnMTAwJScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigneTEnLCAnMCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigneTInLCAwKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWN0ID0gdGhpcy5fc3ZnLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnY2FudmFzJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCd4JywgbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigneScsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCByZWN0V2lkdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgcmVjdEhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ3VybCgjZ3JhZCknKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N2Zy5hdHRyKCd3aWR0aCcsIHdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVjdC5hdHRyKCd3aWR0aCcsIHJlY3RXaWR0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCByZWN0SGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAndXJsKCNncmFkKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZW5hYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3ZnLmNhbGwoXG4gICAgICAgICAgICAgICAgICAgIGQzLmRyYWcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdzdGFydCcsIGZ1bmN0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZSA9IHNlbGYudXBkYXRlKHsgb3BlcmF0aW9uOiAnY3JlYXRlJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAub24oJ2RyYWcnLCBmdW5jdGlvbih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlKHsgb3BlcmF0aW9uOiAnbW92ZScgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbignZW5kJywgZnVuY3Rpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGUoeyBvcGVyYXRpb246ICdkcm9wJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RvcHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdBbmNob3JzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHJhd0FuY2hvcih0aGlzOiBhbnksIGl0ZW06IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgbWFyZ2luLCBjb25maWc6IHsgaGVpZ2h0LCBhbmNob3JXaWR0aCwgYW5jaG9ySGVpZ2h0IH0gfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgeyB0eXBlIH0gPSBpdGVtO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzRG93biA9IHR5cGUgPT09ICdjb2xvcic7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IG1hcmdpbi5sZWZ0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSBpc0Rvd24gPyBoZWlnaHQgLSBtYXJnaW4uYm90dG9tIDogbWFyZ2luLnRvcDtcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gaXNEb3duID8gMSA6IC0xO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGBNJHt4fSAke3l9XG4gICAgICAgICAgICAgICAgICAgIEwke3ggLSBhbmNob3JXaWR0aCAvIDJ9ICR7eSArIGFuY2hvckhlaWdodCAvIDMgKiB0fVxuICAgICAgICAgICAgICAgICAgICAke3ggLSBhbmNob3JXaWR0aCAvIDJ9ICR7eSArIGFuY2hvckhlaWdodCAqIHR9XG4gICAgICAgICAgICAgICAgICAgICR7eCArIGFuY2hvcldpZHRoIC8gMn0gJHt5ICsgYW5jaG9ySGVpZ2h0ICogdH1cbiAgICAgICAgICAgICAgICAgICAgJHt4ICsgYW5jaG9yV2lkdGggLyAyfSAke3kgKyBhbmNob3JIZWlnaHQgLyAzICogdH16YDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyDnlLHkuo7nqpflj6PmmK8gc2ltcGxlIOaooeW8j++8jHJlc2l6ZSDpnIDopoHnu5HlnKggd2luZG93IOS4ilxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB3aW5kb3dSZXNpemUpO1xuXG4gICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnaW5zcGVjdG9yJywgJ2dyYWRpZW50LXN0YXRlJywgdHJ1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgd2luZG93UmVzaXplKTtcbiAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG51bGw7XG4gICAgcGFuZWwgPSBudWxsO1xuXG4gICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnaW5zcGVjdG9yJywgJ2dyYWRpZW50LXN0YXRlJywgZmFsc2UpO1xufVxuIl19