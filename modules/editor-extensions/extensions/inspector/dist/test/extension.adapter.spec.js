'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const element_1 = require("../extension/element");
const parser_1 = require("../extension/adapter/xml/parser");
const parser_2 = require("../extension/adapter/simple-json/parser");
exports.list = [
    {
        title: 'XML decode',
        list: [
            {
                message: '解析单层 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div a b="1" c=1 d=true e=0 f=false></div>');
                    if (elem.tag !== 'inspector-root') {
                        throw new Error('根节点 tag 错误');
                    }
                    if (elem.children.length !== 1) {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].tag !== 'div') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 0) {
                        throw new Error('child 的 children 错误');
                    }
                    if (elem.children[0].attrs['a'] !== '' ||
                        elem.children[0].attrs['b'] !== '1' ||
                        elem.children[0].attrs['c'] !== '1' ||
                        elem.children[0].attrs['d'] !== 'true' ||
                        elem.children[0].attrs['e'] !== '0' ||
                        elem.children[0].attrs['f'] !== 'false') {
                        throw new Error('attr错误');
                    }
                },
            },
            {
                message: '解析两层 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div><span></span></div>');
                    if (elem.tag !== 'inspector-root') {
                        throw new Error('根节点 tag 错误');
                    }
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'div') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 || elem.children[0].children[0].tag !== 'span') {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析单层带 text 的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<ui-label>i18n:aaa</ui-label>');
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'ui-label') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children.length !== 1 || elem.children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 text 解析错误');
                    }
                    if (elem.children[0].children.length !== 0) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析两层带 text 的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div>a<span>b</span>c</div>');
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'div') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 || elem.children[0].children[0].tag !== 'span') {
                        throw new Error('child 的 children 错误');
                    }
                    if (elem.children[0].text !== 'ac') {
                        throw new Error('单层 child 的 text 解析错误');
                    }
                    if (elem.children[0].children[0].text !== 'b') {
                        throw new Error('第二层 child 的 text 解析错误');
                    }
                },
            },
            {
                message: '解析多个两层带 text 的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    if (elem.children.length !== 2 || elem.children[0].tag !== 'div' || elem.children[1].tag !== 'div') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].tag !== 'span' ||
                        elem.children[1].children.length !== 1 ||
                        elem.children[1].children[0].tag !== 'span') {
                        throw new Error('child 的 children 错误');
                    }
                    if (elem.children[0].text !== 'ac' || elem.children[1].text !== 'df') {
                        throw new Error('单层 child 的 text 解析错误');
                    }
                    if (elem.children[0].children[0].text !== 'b' || elem.children[1].children[0].text !== 'e') {
                        throw new Error('第二层 child 的 text 解析错误');
                    }
                },
            },
            {
                message: '解析多个两层带 text 的 xml（复用元素，保持原样）',
                async handle() {
                    const elem1 = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    // 上一个测试以确保数据正确，这里不再检查
                    const str1 = JSON.stringify(elem1);
                    const elem2 = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>', elem1);
                    const str2 = JSON.stringify(elem2);
                    if (elem1 !== elem2) {
                        throw new Error('元素出现变化');
                    }
                    if (str1 !== str2) {
                        throw new Error('结果出现变化');
                    }
                },
            },
            {
                message: '解析多个两层带 text 的 xml（复用元素，删除子节点）',
                async handle() {
                    const elem1 = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    // 上一个测试以确保数据正确，这里不再检查
                    const elem2 = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>df</div>', elem1);
                    if (elem1 !== elem2) {
                        throw new Error('元素出现变化');
                    }
                    if (elem1.children.length !== 2 || elem1.children[0].children.length !== 1 || elem1.children[1].children.length !== 0) {
                        throw new Error('元素没有删除节点');
                    }
                },
            },
            {
                message: '解析多个两层带 text 的 xml（复用元素，新增子节点）',
                async handle() {
                    const elem1 = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    // 上一个测试以确保数据正确，这里不再检查
                    const elem2 = (0, parser_1.decode)('<div>a<span>b</span>c</div><div>d<span>e</span><span>e</span>f</div>', elem1);
                    if (elem1 !== elem2) {
                        throw new Error('元素出现变化');
                    }
                    if (elem1.children.length !== 2 || elem1.children[0].children.length !== 1 || elem1.children[1].children.length !== 2) {
                        throw new Error('元素没有新增节点');
                    }
                },
            },
            {
                message: '解析单层未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<ui-label>i18n:aaa');
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'ui-label') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children.length !== 1 || elem.children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 text 解析错误');
                    }
                    if (elem.children[0].children.length !== 0) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析多层中间未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div><ui-label>i18n:aaa</div>');
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'div') {
                        throw new Error('解析错误');
                    }
                    if (elem.children.length !== 1 || elem.children[0].text !== '') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 || elem.children[0].children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 children 解析错误');
                    }
                },
            },
            {
                message: '解析多层末尾未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div><ui-label>i18n:aaa</ui-label>');
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'div') {
                        throw new Error('解析错误');
                    }
                    if (elem.children.length !== 1 || elem.children[0].text !== '') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 || elem.children[0].children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 children 解析错误');
                    }
                },
            },
            {
                message: '解析多层都未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div><ui-label>i18n:aaa');
                    if (elem.children.length !== 1 || elem.children[0].tag !== 'div') {
                        throw new Error('解析错误');
                    }
                    if (elem.children.length !== 1 || elem.children[0].text !== '') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 || elem.children[0].children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 children 解析错误');
                    }
                },
            },
        ],
    },
    {
        title: 'XML encode',
        list: [
            {
                message: '解析空的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '') {
                        throw new Error('解析错误');
                    }
                },
            },
            {
                message: '解析单层无 attr 无 text 的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    root.appendChild(div);
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '<div></div>') {
                        throw new Error('解析错误');
                    }
                },
            },
            {
                message: '解析单层有 attr 无 text 的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    div.setAttribute('a', 'a');
                    root.appendChild(div);
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '<div a="a"></div>') {
                        throw new Error('解析错误');
                    }
                },
            },
            {
                message: '解析单层有 attr 有 text 的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    div.setAttribute('a', 'a');
                    div.text = 'i18n:aaa';
                    root.appendChild(div);
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '<div a="a">i18n:aaa</div>') {
                        throw new Error('解析错误');
                    }
                },
            },
            {
                message: '解析多层无 attr 无 text 的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const div1 = new element_1.VirtualElement('div');
                    root.appendChild(div1);
                    const div2 = new element_1.VirtualElement('div2');
                    div1.appendChild(div2);
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '<div><div2></div2></div>') {
                        throw new Error('解析错误');
                    }
                },
            },
            {
                message: '解析多层有 attr 无 text 的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const div1 = new element_1.VirtualElement('div');
                    div1.setAttribute('a', 'a');
                    root.appendChild(div1);
                    const div2 = new element_1.VirtualElement('div2');
                    div2.setAttribute('b', 'b');
                    div1.appendChild(div2);
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '<div a="a"><div2 b="b"></div2></div>') {
                        throw new Error('解析错误');
                    }
                },
            },
            {
                message: '解析多层有 attr 有 text 的 Element',
                async handle() {
                    const root = new element_1.VirtualElement('inspector-root');
                    const div1 = new element_1.VirtualElement('div');
                    div1.setAttribute('a', 'a');
                    div1.text = 'i18n:aaa';
                    root.appendChild(div1);
                    const div2 = new element_1.VirtualElement('div2');
                    div2.setAttribute('b', 'b');
                    div2.text = 'i18n:bbb';
                    div1.appendChild(div2);
                    const xml = (0, parser_1.encode)(root);
                    if (xml !== '<div a="a"><div2 b="b">i18n:bbb</div2>i18n:aaa</div>') {
                        throw new Error('解析错误');
                    }
                },
            },
        ],
    },
    {
        title: 'Simple JSON decode',
        list: [
            {
                message: '解析未知元素',
                async handle() {
                    const elem = (0, parser_2.decode)({
                        type: 'test',
                    });
                    if (elem.tag !== 'inspector-root') {
                        throw new Error('根节点 tag 错误');
                    }
                    if (elem.children.length !== 1) {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].tag !== 'unknown' || elem.children[0].getAttribute('ui-type') !== 'test') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 0) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析 prop',
                async handle() { },
            },
            {
                message: '解析只有 label 的 button',
                async handle() {
                    const testJSON = {
                        type: 'button',
                        label: 'TestButton',
                    };
                    const elem = (0, parser_2.decode)(testJSON);
                    if (elem.children[0].tag !== 'ui-button') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].tag !== 'ui-label' ||
                        elem.children[0].children[0].getAttribute('value') !== testJSON.label) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析只有 icon 的 button',
                async handle() {
                    const testJSON = {
                        type: 'button',
                        icon: 'test',
                    };
                    const elem = (0, parser_2.decode)(testJSON);
                    if (elem.children[0].tag !== 'ui-button') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].tag !== 'ui-icon' ||
                        elem.children[0].children[0].getAttribute('value') !== testJSON.icon) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析有 label 且有 icon 的 button',
                async handle() {
                    const testJSON = {
                        type: 'button',
                        label: 'TestButton',
                        icon: 'test',
                    };
                    const elem = (0, parser_2.decode)(testJSON);
                    if (elem.children[0].tag !== 'ui-button') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 2 ||
                        elem.children[0].children[0].tag !== 'ui-label' ||
                        elem.children[0].children[0].getAttribute('value') !== testJSON.label ||
                        elem.children[0].children[1].tag !== 'ui-icon' ||
                        elem.children[0].children[1].getAttribute('value') !== testJSON.icon) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析 line',
                async handle() { },
            },
            {
                message: '解析 space',
                async handle() { },
            },
            {
                message: '解析 vbox',
                async handle() {
                    const elem = (0, parser_2.decode)({
                        type: 'vbox',
                        children: [
                            {
                                type: 'test',
                            },
                        ],
                    });
                    if (elem.children[0].tag !== 'div' || elem.children[0].getAttribute('style') !== 'display: row;') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 1) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析 hbox',
                async handle() {
                    const elem = (0, parser_2.decode)({
                        type: 'hbox',
                        children: [
                            {
                                type: 'test',
                            },
                        ],
                    });
                    if (elem.children[0].tag !== 'div' || elem.children[0].getAttribute('style') !== 'display: column;') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 1) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
        ],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmFkYXB0ZXIuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2V4dGVuc2lvbi5hZGFwdGVyLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFVYixrREFBc0Q7QUFDdEQsNERBQTJGO0FBQzNGLG9FQUFxRjtBQUl4RSxRQUFBLElBQUksR0FBZTtJQUM1QjtRQUNJLEtBQUssRUFBRSxZQUFZO1FBQ25CLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxVQUFVO2dCQUNuQixLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxJQUFBLGVBQVMsRUFBQyw0Q0FBNEMsQ0FBQyxDQUFDO29CQUNyRSxJQUFJLElBQUksQ0FBQyxHQUFHLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDbEMsQ0FBQztvQkFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUM3QixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNyQyxDQUFDO29CQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUFFLENBQUM7d0JBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2xDLENBQUM7b0JBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcs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QU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsU0FBUztnQkFDbEIsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFnQixFQUFDO3dCQUMxQixJQUFJLEVBQUUsTUFBTTt3QkFDWixRQUFRLEVBQUU7NEJBQ047Z0NBQ0ksSUFBSSxFQUFFLE1BQU07NkJBQ1E7eUJBQzNCO3FCQUNKLENBQUMsQ0FBQztvQkFDSCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO3dCQUNsRyxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNsQyxDQUFDO29CQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7b0JBQzNDLENBQUM7Z0JBQ0wsQ0FBQzthQUNKO1NBQ0o7S0FDSjtDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmludGVyZmFjZSBUZXN0SXRlbSB7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBsaXN0OiB7XG4gICAgICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICAgICAgaGFuZGxlOiAoKSA9PiBQcm9taXNlPGFueT47XG4gICAgfVtdO1xufVxuXG5pbXBvcnQgeyBWaXJ0dWFsRWxlbWVudCB9IGZyb20gJy4uL2V4dGVuc2lvbi9lbGVtZW50JztcbmltcG9ydCB7IGVuY29kZSBhcyBlbmNvZGVYTUwsIGRlY29kZSBhcyBkZWNvZGVYTUwgfSBmcm9tICcuLi9leHRlbnNpb24vYWRhcHRlci94bWwvcGFyc2VyJztcbmltcG9ydCB7IGRlY29kZSBhcyBkZWNvZGVTaW1wbGVKU09OIH0gZnJvbSAnLi4vZXh0ZW5zaW9uL2FkYXB0ZXIvc2ltcGxlLWpzb24vcGFyc2VyJztcblxuaW1wb3J0IHsgSUVsZW1lbnQgfSBmcm9tICcuLi9leHRlbnNpb24vYWRhcHRlci9zaW1wbGUtanNvbi9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY29uc3QgbGlzdDogVGVzdEl0ZW1bXSA9IFtcbiAgICB7XG4gICAgICAgIHRpdGxlOiAnWE1MIGRlY29kZScsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y2V5bGCIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2IGEgYj1cIjFcIiBjPTEgZD10cnVlIGU9MCBmPWZhbHNlPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS50YWcgIT09ICdpbnNwZWN0b3Itcm9vdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5qC56IqC54K5IHRhZyDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnsbvlnovplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg55qEIGNoaWxkcmVuIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2EnXSAhPT0gJycgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2InXSAhPT0gJzEnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydjJ10gIT09ICcxJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5hdHRyc1snZCddICE9PSAndHJ1ZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2UnXSAhPT0gJzAnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydmJ10gIT09ICdmYWxzZSdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2F0dHLplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDkuKTlsYIgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzxkaXY+PHNwYW4+PC9zcGFuPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS50YWcgIT09ICdpbnNwZWN0b3Itcm9vdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5qC56IqC54K5IHRhZyDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3NwYW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYLluKYgdGV4dCDnmoQgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzx1aS1sYWJlbD5pMThuOmFhYTwvdWktbGFiZWw+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWxhYmVsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnaTE4bjphYWEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Lik5bGC5bimIHRleHQg55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8IGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICdzcGFuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2FjJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfljZXlsYIgY2hpbGQg55qEIHRleHQg6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+esrOS6jOWxgiBjaGlsZCDnmoQgdGV4dCDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrkuKrkuKTlsYLluKYgdGV4dCDnmoQgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzxkaXY+YTxzcGFuPmI8L3NwYW4+YzwvZGl2PjxkaXY+ZDxzcGFuPmU8L3NwYW4+ZjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHwgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnIHx8IGVsZW0uY2hpbGRyZW5bMV0udGFnICE9PSAnZGl2Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICdzcGFuJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0udGFnICE9PSAnc3BhbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnYWMnIHx8IGVsZW0uY2hpbGRyZW5bMV0udGV4dCAhPT0gJ2RmJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfljZXlsYIgY2hpbGQg55qEIHRleHQg6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2InIHx8IGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+esrOS6jOWxgiBjaGlsZCDnmoQgdGV4dCDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrkuKrkuKTlsYLluKYgdGV4dCDnmoQgeG1s77yI5aSN55So5YWD57Sg77yM5L+d5oyB5Y6f5qC377yJJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LiK5LiA5Liq5rWL6K+V5Lul56Gu5L+d5pWw5o2u5q2j56Gu77yM6L+Z6YeM5LiN5YaN5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0cjEgPSBKU09OLnN0cmluZ2lmeShlbGVtMSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nLCBlbGVtMSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0cjIgPSBKU09OLnN0cmluZ2lmeShlbGVtMik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtMSAhPT0gZWxlbTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YWD57Sg5Ye6546w5Y+Y5YyWJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cjEgIT09IHN0cjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign57uT5p6c5Ye6546w5Y+Y5YyWJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5Liq5Lik5bGC5bimIHRleHQg55qEIHhtbO+8iOWkjeeUqOWFg+e0oO+8jOWIoOmZpOWtkOiKgueCue+8iScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMSA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kPHNwYW4+ZTwvc3Bhbj5mPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4iuS4gOS4qua1i+ivleS7peehruS/neaVsOaNruato+ehru+8jOi/memHjOS4jeWGjeajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMiA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kZjwvZGl2PicsIGVsZW0xKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xICE9PSBlbGVtMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhYPntKDlh7rnjrDlj5jljJYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbTEuY2hpbGRyZW4ubGVuZ3RoICE9PSAyIHx8IGVsZW0xLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtMS5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YWD57Sg5rKh5pyJ5Yig6Zmk6IqC54K5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5Liq5Lik5bGC5bimIHRleHQg55qEIHhtbO+8iOWkjeeUqOWFg+e0oO+8jOaWsOWinuWtkOiKgueCue+8iScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMSA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kPHNwYW4+ZTwvc3Bhbj5mPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4iuS4gOS4qua1i+ivleS7peehruS/neaVsOaNruato+ehru+8jOi/memHjOS4jeWGjeajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMiA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kPHNwYW4+ZTwvc3Bhbj48c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nLCBlbGVtMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtMSAhPT0gZWxlbTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YWD57Sg5Ye6546w5Y+Y5YyWJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fCBlbGVtMS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbTEuY2hpbGRyZW5bMV0uY2hpbGRyZW4ubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WFg+e0oOayoeacieaWsOWinuiKgueCuScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWNleWxguacqumXreWQiOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPHVpLWxhYmVsPmkxOG46YWFhJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWxhYmVsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnaTE4bjphYWEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5bGC5Lit6Ze05pyq6Zet5ZCI55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2Pjx1aS1sYWJlbD5pMThuOmFhYTwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRleHQgIT09ICdpMThuOmFhYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIGNoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxguacq+WwvuacqumXreWQiOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdj48dWktbGFiZWw+aTE4bjphYWE8L3VpLWxhYmVsPicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRleHQgIT09ICdpMThuOmFhYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIGNoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxgumDveacqumXreWQiOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdj48dWktbGFiZWw+aTE4bjphYWEnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8IGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50ZXh0ICE9PSAnaTE4bjphYWEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOeahCBjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICB0aXRsZTogJ1hNTCBlbmNvZGUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOepuueahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhtbCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y2V5bGC5pegIGF0dHIg5pegIHRleHQg55qEIEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhtbCAhPT0gJzxkaXY+PC9kaXY+Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYLmnIkgYXR0ciDml6AgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuc2V0QXR0cmlidXRlKCdhJywgJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhtbCAhPT0gJzxkaXYgYT1cImFcIj48L2Rpdj4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWNleWxguaciSBhdHRyIOaciSB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICBkaXYudGV4dCA9ICdpMThuOmFhYSc7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoZGl2KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4bWwgIT09ICc8ZGl2IGE9XCJhXCI+aTE4bjphYWE8L2Rpdj4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxguaXoCBhdHRyIOaXoCB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjEuYXBwZW5kQ2hpbGQoZGl2Mik7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeG1sID0gZW5jb2RlWE1MKHJvb3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeG1sICE9PSAnPGRpdj48ZGl2Mj48L2RpdjI+PC9kaXY+Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLmnIkgYXR0ciDml6AgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjIuc2V0QXR0cmlidXRlKCdiJywgJ2InKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5hcHBlbmRDaGlsZChkaXYyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4bWwgIT09ICc8ZGl2IGE9XCJhXCI+PGRpdjIgYj1cImJcIj48L2RpdjI+PC9kaXY+Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLmnIkgYXR0ciDmnIkgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICBkaXYxLnRleHQgPSAnaTE4bjphYWEnO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjIuc2V0QXR0cmlidXRlKCdiJywgJ2InKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2Mi50ZXh0ID0gJ2kxOG46YmJiJztcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5hcHBlbmRDaGlsZChkaXYyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4bWwgIT09ICc8ZGl2IGE9XCJhXCI+PGRpdjIgYj1cImJcIj5pMThuOmJiYjwvZGl2Mj5pMThuOmFhYTwvZGl2PicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdGl0bGU6ICdTaW1wbGUgSlNPTiBkZWNvZGUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOacquefpeWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGVzdCcsXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgdW5rbm93biBhcyBJRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLnRhZyAhPT0gJ2luc3BlY3Rvci1yb290Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmoLnoioLngrkgdGFnIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICd1bmtub3duJyB8fCBlbGVtLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgndWktdHlwZScpICE9PSAndGVzdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgcHJvcCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge30sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlj6rmnIkgbGFiZWwg55qEIGJ1dHRvbicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXN0SlNPTjogSUVsZW1lbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVGVzdEJ1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVTaW1wbGVKU09OKHRlc3RKU09OKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktYnV0dG9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnsbvlnovplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICd1aS1sYWJlbCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpICE9PSB0ZXN0SlNPTi5sYWJlbFxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg55qEIGNoaWxkcmVuIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWPquaciSBpY29uIOeahCBidXR0b24nLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVzdEpTT046IElFbGVtZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uOiAndGVzdCcsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVTaW1wbGVKU09OKHRlc3RKU09OKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktYnV0dG9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnsbvlnovplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICd1aS1pY29uJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgIT09IHRlc3RKU09OLmljb25cbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDmnIkgbGFiZWwg5LiU5pyJIGljb24g55qEIGJ1dHRvbicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXN0SlNPTjogSUVsZW1lbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVGVzdEJ1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uOiAndGVzdCcsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVTaW1wbGVKU09OKHRlc3RKU09OKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktYnV0dG9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnsbvlnovplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICd1aS1sYWJlbCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpICE9PSB0ZXN0SlNPTi5sYWJlbCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS50YWcgIT09ICd1aS1pY29uJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgIT09IHRlc3RKU09OLmljb25cbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgbGluZScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge30sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgc3BhY2UnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHt9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6QIHZib3gnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVNpbXBsZUpTT04oe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3Zib3gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIHVua25vd24gYXMgSUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2JyB8fCBlbGVtLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSAhPT0gJ2Rpc3BsYXk6IHJvdzsnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6QIGhib3gnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVNpbXBsZUpTT04oe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2hib3gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIHVua25vd24gYXMgSUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2JyB8fCBlbGVtLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSAhPT0gJ2Rpc3BsYXk6IGNvbHVtbjsnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuXTtcbiJdfQ==