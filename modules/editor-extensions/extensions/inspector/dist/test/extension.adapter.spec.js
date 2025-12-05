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
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'div') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].tag !== 'span') {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析单层带 text 的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<ui-label>i18n:aaa</ui-label>');
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'ui-label') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children.length !== 1 ||
                        elem.children[0].text !== 'i18n:aaa') {
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
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'div') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].tag !== 'span') {
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
                    if (elem.children.length !== 2 ||
                        elem.children[0].tag !== 'div' ||
                        elem.children[1].tag !== 'div') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].tag !== 'span' ||
                        elem.children[1].children.length !== 1 ||
                        elem.children[1].children[0].tag !== 'span') {
                        throw new Error('child 的 children 错误');
                    }
                    if (elem.children[0].text !== 'ac' ||
                        elem.children[1].text !== 'df') {
                        throw new Error('单层 child 的 text 解析错误');
                    }
                    if (elem.children[0].children[0].text !== 'b' ||
                        elem.children[1].children[0].text !== 'e') {
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
                    if (elem1.children.length !== 2 ||
                        elem1.children[0].children.length !== 1 ||
                        elem1.children[1].children.length !== 0) {
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
                    if (elem1.children.length !== 2 ||
                        elem1.children[0].children.length !== 1 ||
                        elem1.children[1].children.length !== 2) {
                        throw new Error('元素没有新增节点');
                    }
                },
            },
            {
                message: '解析单层未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<ui-label>i18n:aaa');
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'ui-label') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children.length !== 1 ||
                        elem.children[0].text !== 'i18n:aaa') {
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
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'div') {
                        throw new Error('解析错误');
                    }
                    if (elem.children.length !== 1 ||
                        elem.children[0].text !== '') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 children 解析错误');
                    }
                },
            },
            {
                message: '解析多层末尾未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div><ui-label>i18n:aaa</ui-label>');
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'div') {
                        throw new Error('解析错误');
                    }
                    if (elem.children.length !== 1 ||
                        elem.children[0].text !== '') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].text !== 'i18n:aaa') {
                        throw new Error('children 的 children 解析错误');
                    }
                },
            },
            {
                message: '解析多层都未闭合的 xml',
                async handle() {
                    const elem = (0, parser_1.decode)('<div><ui-label>i18n:aaa');
                    if (elem.children.length !== 1 ||
                        elem.children[0].tag !== 'div') {
                        throw new Error('解析错误');
                    }
                    if (elem.children.length !== 1 ||
                        elem.children[0].text !== '') {
                        throw new Error('children 解析错误');
                    }
                    if (elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].text !== 'i18n:aaa') {
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
                    if (elem.children[0].tag !== 'unknown' ||
                        elem.children[0].getAttribute('ui-type') !== 'test') {
                        throw new Error('child 类型错误');
                    }
                    if (elem.children[0].children.length !== 0) {
                        throw new Error('child 的 children 错误');
                    }
                },
            },
            {
                message: '解析 prop',
                async handle() {
                },
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
                async handle() {
                },
            },
            {
                message: '解析 space',
                async handle() {
                },
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
                    if (elem.children[0].tag !== 'div' ||
                        elem.children[0].getAttribute('style') !== 'display: row;') {
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
                    if (elem.children[0].tag !== 'div' ||
                        elem.children[0].getAttribute('style') !== 'display: column;') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmFkYXB0ZXIuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2V4dGVuc2lvbi5hZGFwdGVyLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFVYixrREFBc0Q7QUFDdEQsNERBR3lDO0FBQ3pDLG9FQUVpRDtBQUlwQyxRQUFBLElBQUksR0FBZTtJQUM1QjtRQUNJLEtBQUssRUFBRSxZQUFZO1FBQ25CLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxVQUFVO2dCQUNuQixLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxJQUFBLGVBQVMsRUFBQyw0Q0FBNEMsQ0FBQyxDQUFDO29CQUNyRSxJQUNJLElBQUksQ0FBQyxHQUFHLEtBQUssZ0JBQWdCLEVBQy9CO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7cUJBQ2pDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUM1Qjt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO3FCQUNwQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEtBQUssRUFDaEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDakM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUN4Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQzFDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRTt3QkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FB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O3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDMUM7Z0JBQ0wsQ0FBQzthQUNKO1NBQ0o7S0FDSjtDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmludGVyZmFjZSBUZXN0SXRlbSB7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBsaXN0OiB7XG4gICAgICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICAgICAgaGFuZGxlOiAoKSA9PiBQcm9taXNlPGFueT47XG4gICAgfVtdO1xufVxuXG5pbXBvcnQgeyBWaXJ0dWFsRWxlbWVudCB9IGZyb20gJy4uL2V4dGVuc2lvbi9lbGVtZW50JztcbmltcG9ydCB7XG4gICAgZW5jb2RlIGFzIGVuY29kZVhNTCxcbiAgICBkZWNvZGUgYXMgZGVjb2RlWE1MLFxufSBmcm9tICcuLi9leHRlbnNpb24vYWRhcHRlci94bWwvcGFyc2VyJztcbmltcG9ydCB7XG4gICAgZGVjb2RlIGFzIGRlY29kZVNpbXBsZUpTT04sXG59IGZyb20gJy4uL2V4dGVuc2lvbi9hZGFwdGVyL3NpbXBsZS1qc29uL3BhcnNlcic7XG5cbmltcG9ydCB7IElFbGVtZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9uL2FkYXB0ZXIvc2ltcGxlLWpzb24vaW50ZXJmYWNlJztcblxuZXhwb3J0IGNvbnN0IGxpc3Q6IFRlc3RJdGVtW10gPSBbXG4gICAge1xuICAgICAgICB0aXRsZTogJ1hNTCBkZWNvZGUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWNleWxgiB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdiBhIGI9XCIxXCIgYz0xIGQ9dHJ1ZSBlPTAgZj1mYWxzZT48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS50YWcgIT09ICdpbnNwZWN0b3Itcm9vdCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+agueiKgueCuSB0YWcg6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydhJ10gIT09ICcnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydiJ10gIT09ICcxJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5hdHRyc1snYyddICE9PSAnMScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2QnXSAhPT0gJ3RydWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydlJ10gIT09ICcwJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5hdHRyc1snZiddICE9PSAnZmFsc2UnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhdHRy6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Lik5bGCIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2PjxzcGFuPjwvc3Bhbj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS50YWcgIT09ICdpbnNwZWN0b3Itcm9vdCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+agueiKgueCuSB0YWcg6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnICE9PSAnc3BhbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYLluKYgdGV4dCDnmoQgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzx1aS1sYWJlbD5pMThuOmFhYTwvdWktbGFiZWw+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWxhYmVsJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2kxOG46YWFhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIHRleHQg6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDkuKTlsYLluKYgdGV4dCDnmoQgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzxkaXY+YTxzcGFuPmI8L3NwYW4+YzwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICdzcGFuJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg55qEIGNoaWxkcmVuIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2FjJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Y2V5bGCIGNoaWxkIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2InXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfnrKzkuozlsYIgY2hpbGQg55qEIHRleHQg6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5Liq5Lik5bGC5bimIHRleHQg55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblsxXS50YWcgIT09ICdkaXYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICdzcGFuJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0udGFnICE9PSAnc3BhbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICdhYycgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMV0udGV4dCAhPT0gJ2RmJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Y2V5bGCIGNoaWxkIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2InIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdLnRleHQgIT09ICdlJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign56ys5LqM5bGCIGNoaWxkIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuS4quS4pOWxguW4piB0ZXh0IOeahCB4bWzvvIjlpI3nlKjlhYPntKDvvIzkv53mjIHljp/moLfvvIknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTEgPSBkZWNvZGVYTUwoJzxkaXY+YTxzcGFuPmI8L3NwYW4+YzwvZGl2PjxkaXY+ZDxzcGFuPmU8L3NwYW4+ZjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICAvLyDkuIrkuIDkuKrmtYvor5Xku6Xnoa7kv53mlbDmja7mraPnoa7vvIzov5nph4zkuI3lho3mo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RyMSA9IEpTT04uc3RyaW5naWZ5KGVsZW0xKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTIgPSBkZWNvZGVYTUwoJzxkaXY+YTxzcGFuPmI8L3NwYW4+YzwvZGl2PjxkaXY+ZDxzcGFuPmU8L3NwYW4+ZjwvZGl2PicsIGVsZW0xKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RyMiA9IEpTT04uc3RyaW5naWZ5KGVsZW0yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xICE9PSBlbGVtMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhYPntKDlh7rnjrDlj5jljJYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyMSAhPT0gc3RyMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfnu5Pmnpzlh7rnjrDlj5jljJYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrkuKrkuKTlsYLluKYgdGV4dCDnmoQgeG1s77yI5aSN55So5YWD57Sg77yM5Yig6Zmk5a2Q6IqC54K577yJJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LiK5LiA5Liq5rWL6K+V5Lul56Gu5L+d5pWw5o2u5q2j56Gu77yM6L+Z6YeM5LiN5YaN5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmRmPC9kaXY+JywgZWxlbTEpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbTEgIT09IGVsZW0yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WFg+e0oOWHuueOsOWPmOWMlicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0xLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbTEuY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtMS5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WFg+e0oOayoeacieWIoOmZpOiKgueCuScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuS4quS4pOWxguW4piB0ZXh0IOeahCB4bWzvvIjlpI3nlKjlhYPntKDvvIzmlrDlop7lrZDoioLngrnvvIknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTEgPSBkZWNvZGVYTUwoJzxkaXY+YTxzcGFuPmI8L3NwYW4+YzwvZGl2PjxkaXY+ZDxzcGFuPmU8L3NwYW4+ZjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICAvLyDkuIrkuIDkuKrmtYvor5Xku6Xnoa7kv53mlbDmja7mraPnoa7vvIzov5nph4zkuI3lho3mo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTIgPSBkZWNvZGVYTUwoJzxkaXY+YTxzcGFuPmI8L3NwYW4+YzwvZGl2PjxkaXY+ZDxzcGFuPmU8L3NwYW4+PHNwYW4+ZTwvc3Bhbj5mPC9kaXY+JywgZWxlbTEpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbTEgIT09IGVsZW0yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WFg+e0oOWHuueOsOWPmOWMlicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0xLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbTEuY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtMS5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDJcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WFg+e0oOayoeacieaWsOWinuiKgueCuScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWNleWxguacqumXreWQiOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPHVpLWxhYmVsPmkxOG46YWFhJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWxhYmVsJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2kxOG46YWFhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIHRleHQg6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLkuK3pl7TmnKrpl63lkIjnmoQgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzxkaXY+PHVpLWxhYmVsPmkxOG46YWFhPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICcnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50ZXh0ICE9PSAnaTE4bjphYWEnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDnmoQgY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5bGC5pyr5bC+5pyq6Zet5ZCI55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2Pjx1aS1sYWJlbD5pMThuOmFhYTwvdWktbGFiZWw+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICcnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50ZXh0ICE9PSAnaTE4bjphYWEnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDnmoQgY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5bGC6YO95pyq6Zet5ZCI55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2Pjx1aS1sYWJlbD5pMThuOmFhYScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2kxOG46YWFhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIGNoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHRpdGxlOiAnWE1MIGVuY29kZScsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q56m655qEIEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeG1sID0gZW5jb2RlWE1MKHJvb3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwgIT09ICcnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYLml6AgYXR0ciDml6AgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeG1sID0gZW5jb2RlWE1MKHJvb3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwgIT09ICc8ZGl2PjwvZGl2PidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWNleWxguaciSBhdHRyIOaXoCB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeG1sID0gZW5jb2RlWE1MKHJvb3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwgIT09ICc8ZGl2IGE9XCJhXCI+PC9kaXY+J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y2V5bGC5pyJIGF0dHIg5pyJIHRleHQg55qEIEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnYScsICdhJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi50ZXh0ID0gJ2kxOG46YWFhJztcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1sICE9PSAnPGRpdiBhPVwiYVwiPmkxOG46YWFhPC9kaXY+J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5bGC5pegIGF0dHIg5pegIHRleHQg55qEIEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoZGl2MSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdjInKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5hcHBlbmRDaGlsZChkaXYyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbCAhPT0gJzxkaXY+PGRpdjI+PC9kaXYyPjwvZGl2PidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxguaciSBhdHRyIOaXoCB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYxLnNldEF0dHJpYnV0ZSgnYScsICdhJyk7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoZGl2MSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdjInKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2Mi5zZXRBdHRyaWJ1dGUoJ2InLCAnYicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYxLmFwcGVuZENoaWxkKGRpdjIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1sICE9PSAnPGRpdiBhPVwiYVwiPjxkaXYyIGI9XCJiXCI+PC9kaXYyPjwvZGl2PidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxguaciSBhdHRyIOaciSB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYxLnNldEF0dHJpYnV0ZSgnYScsICdhJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjEudGV4dCA9ICdpMThuOmFhYSc7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoZGl2MSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdjInKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2Mi5zZXRBdHRyaWJ1dGUoJ2InLCAnYicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYyLnRleHQgPSAnaTE4bjpiYmInO1xuICAgICAgICAgICAgICAgICAgICBkaXYxLmFwcGVuZENoaWxkKGRpdjIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1sICE9PSAnPGRpdiBhPVwiYVwiPjxkaXYyIGI9XCJiXCI+aTE4bjpiYmI8L2RpdjI+aTE4bjphYWE8L2Rpdj4nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICB0aXRsZTogJ1NpbXBsZSBKU09OIGRlY29kZScsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5pyq55+l5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVTaW1wbGVKU09OKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgfSBhcyB1bmtub3duIGFzIElFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS50YWcgIT09ICdpbnNwZWN0b3Itcm9vdCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+agueiKgueCuSB0YWcg6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndW5rbm93bicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd1aS10eXBlJykgIT09ICd0ZXN0J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgcHJvcCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y+q5pyJIGxhYmVsIOeahCBidXR0b24nLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVzdEpTT046IElFbGVtZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1Rlc3RCdXR0b24nLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih0ZXN0SlNPTik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktbGFiZWwnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgndmFsdWUnKSAhPT0gdGVzdEpTT04ubGFiZWxcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlj6rmnIkgaWNvbiDnmoQgYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RKU09OOiBJRWxlbWVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbjogJ3Rlc3QnLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih0ZXN0SlNPTik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktaWNvbicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpICE9PSB0ZXN0SlNPTi5pY29uXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5pyJIGxhYmVsIOS4lOaciSBpY29uIOeahCBidXR0b24nLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVzdEpTT046IElFbGVtZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1Rlc3RCdXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbjogJ3Rlc3QnLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih0ZXN0SlNPTik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcblxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWcgIT09ICd1aS1sYWJlbCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpICE9PSB0ZXN0SlNPTi5sYWJlbCB8fFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzFdLnRhZyAhPT0gJ3VpLWljb24nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzFdLmdldEF0dHJpYnV0ZSgndmFsdWUnKSAhPT0gdGVzdEpTT04uaWNvblxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg55qEIGNoaWxkcmVuIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekCBsaW5lJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgc3BhY2UnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekCB2Ym94JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVTaW1wbGVKU09OKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2Ym94JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyB1bmtub3duIGFzIElFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgIT09ICdkaXNwbGF5OiByb3c7J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg57G75Z6L6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgaGJveCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaGJveCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3Rlc3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgdW5rbm93biBhcyBJRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCdzdHlsZScpICE9PSAnZGlzcGxheTogY29sdW1uOydcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuXTsiXX0=