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
                    const elem = parser_1.decode('<div a b="1" c=1 d=true e=0 f=false></div>');
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
                    const elem = parser_1.decode('<div><span></span></div>');
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
                    const elem = parser_1.decode('<ui-label>i18n:aaa</ui-label>');
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
                    const elem = parser_1.decode('<div>a<span>b</span>c</div>');
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
                    const elem = parser_1.decode('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
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
                    const elem1 = parser_1.decode('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    // 上一个测试以确保数据正确，这里不再检查
                    const str1 = JSON.stringify(elem1);
                    const elem2 = parser_1.decode('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>', elem1);
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
                    const elem1 = parser_1.decode('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    // 上一个测试以确保数据正确，这里不再检查
                    const elem2 = parser_1.decode('<div>a<span>b</span>c</div><div>df</div>', elem1);
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
                    const elem1 = parser_1.decode('<div>a<span>b</span>c</div><div>d<span>e</span>f</div>');
                    // 上一个测试以确保数据正确，这里不再检查
                    const elem2 = parser_1.decode('<div>a<span>b</span>c</div><div>d<span>e</span><span>e</span>f</div>', elem1);
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
                    const elem = parser_1.decode('<ui-label>i18n:aaa');
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
                    const elem = parser_1.decode('<div><ui-label>i18n:aaa</div>');
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
                    const elem = parser_1.decode('<div><ui-label>i18n:aaa</ui-label>');
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
                    const elem = parser_1.decode('<div><ui-label>i18n:aaa');
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
                    const xml = parser_1.encode(root);
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
                    const xml = parser_1.encode(root);
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
                    const xml = parser_1.encode(root);
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
                    const xml = parser_1.encode(root);
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
                    const xml = parser_1.encode(root);
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
                    const xml = parser_1.encode(root);
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
                    const xml = parser_1.encode(root);
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
                    const elem = parser_2.decode({
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
                    const elem = parser_2.decode(testJSON);
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
                    const elem = parser_2.decode(testJSON);
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
                    const elem = parser_2.decode(testJSON);
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
                    const elem = parser_2.decode({
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
                    const elem = parser_2.decode({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmFkYXB0ZXIuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2V4dGVuc2lvbi5hZGFwdGVyLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFVYixrREFBc0Q7QUFDdEQsNERBR3lDO0FBQ3pDLG9FQUVpRDtBQUlwQyxRQUFBLElBQUksR0FBZTtJQUM1QjtRQUNJLEtBQUssRUFBRSxZQUFZO1FBQ25CLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxVQUFVO2dCQUNuQixLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxlQUFTLENBQUMsNENBQTRDLENBQUMsQ0FBQztvQkFDckUsSUFDSSxJQUFJLENBQUMsR0FBRyxLQUFLLGdCQUFnQixFQUMvQjt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUNqQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDNUI7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDcEM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxLQUFLLEVBQ2hDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7cUJBQ2pDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDeEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO3FCQUMxQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUU7d0JBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUc7d0JBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUc7d0JBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU07d0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUc7d0JBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sRUFDekM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDN0I7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLFVBQVU7Z0JBQ25CLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLGVBQVMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO29CQUNuRCxJQUNJLElBQUksQ0FBQyxHQUFHLEtBQUssZ0JBQWdCLEVBQy9CO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7cUJBQ2pDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUNoQzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO3FCQUNwQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssTUFBTSxFQUM3Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQzFDO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLGVBQVMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO29CQUN4RCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLFVBQVUsRUFDckM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDcEM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQ3RDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztxQkFDM0M7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUN4Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQzFDO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLGVBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO29CQUN0RCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEtBQUssRUFDaEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDcEM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLE1BQU0sRUFDN0M7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO3FCQUMxQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksRUFDaEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO3FCQUMzQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQzNDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztxQkFDNUM7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLG9CQUFvQjtnQkFDN0IsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsZUFBUyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7b0JBQ2pGLElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSzt3QkFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUNoQzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO3FCQUNwQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssTUFBTTt3QkFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxNQUFNLEVBQzdDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDMUM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJO3dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQ2hDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztxQkFDM0M7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRzt3QkFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFDM0M7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO3FCQUM1QztnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsK0JBQStCO2dCQUN4QyxLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLEtBQUssR0FBRyxlQUFTLENBQUMsd0RBQXdELENBQUMsQ0FBQztvQkFDbEYsc0JBQXNCO29CQUN0QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQyxNQUFNLEtBQUssR0FBRyxlQUFTLENBQUMsd0RBQXdELEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3pGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ25DLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTt3QkFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDN0I7b0JBQ0QsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO3dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQzdCO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxnQ0FBZ0M7Z0JBQ3pDLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sS0FBSyxHQUFHLGVBQVMsQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO29CQUNsRixzQkFBc0I7b0JBQ3RCLE1BQU0sS0FBSyxHQUFHLGVBQVMsQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDM0UsSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFO3dCQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3FCQUM3QjtvQkFDRCxJQUNJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzNCLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUN2QyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUN6Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUMvQjtnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsZ0NBQWdDO2dCQUN6QyxLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLEtBQUssR0FBRyxlQUFTLENBQUMsd0RBQXdELENBQUMsQ0FBQztvQkFDbEYsc0JBQXNCO29CQUN0QixNQUFNLEtBQUssR0FBRyxlQUFTLENBQUMsc0VBQXNFLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3ZHLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTt3QkFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDN0I7b0JBQ0QsSUFDSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUMzQixLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDdkMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDekM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztxQkFDL0I7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLGNBQWM7Z0JBQ3ZCLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLGVBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUM3QyxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLFVBQVUsRUFDckM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDcEM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQ3RDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztxQkFDM0M7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUN4Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQzFDO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxnQkFBZ0I7Z0JBQ3pCLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLGVBQVMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO29CQUN4RCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEtBQUssRUFDaEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDM0I7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLEVBQzlCO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7cUJBQ3BDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQ2xEO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztxQkFDL0M7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLGdCQUFnQjtnQkFDekIsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsZUFBUyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7b0JBQzdELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUNoQzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMzQjtvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFDOUI7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDcEM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFDbEQ7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO3FCQUMvQztnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsZUFBUyxDQUFDLHlCQUF5QixDQUFDLENBQUM7b0JBQ2xELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUNoQzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMzQjtvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFDOUI7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDcEM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFDbEQ7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO3FCQUMvQztnQkFDTCxDQUFDO2FBQ0o7U0FDSjtLQUNKO0lBQ0Q7UUFDSSxLQUFLLEVBQUUsWUFBWTtRQUNuQixJQUFJLEVBQUU7WUFDRjtnQkFDSSxPQUFPLEVBQUUsY0FBYztnQkFDdkIsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsSUFBSSx3QkFBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ2xELE1BQU0sR0FBRyxHQUFHLGVBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUIsSUFDSSxHQUFHLEtBQUssRUFBRSxFQUNaO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQzNCO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSw2QkFBNkI7Z0JBQ3RDLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNsRCxNQUFNLEdBQUcsR0FBRyxJQUFJLHdCQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRXRCLE1BQU0sR0FBRyxHQUFHLGVBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUIsSUFDSSxHQUFHLEtBQUssYUFBYSxFQUN2Qjt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMzQjtnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsNkJBQTZCO2dCQUN0QyxLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDbEQsTUFBTSxHQUFHLEdBQUcsSUFBSSx3QkFBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN0QyxHQUFHLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFdEIsTUFBTSxHQUFHLEdBQUcsZUFBUyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM1QixJQUNJLEdBQUcsS0FBSyxtQkFBbUIsRUFDN0I7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDM0I7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLDZCQUE2QjtnQkFDdEMsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsSUFBSSx3QkFBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ2xELE1BQU0sR0FBRyxHQUFHLElBQUksd0JBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEMsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQzNCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO29CQUN0QixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUV0QixNQUFNLEdBQUcsR0FBRyxlQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVCLElBQ0ksR0FBRyxLQUFLLDJCQUEyQixFQUNyQzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMzQjtnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsNkJBQTZCO2dCQUN0QyxLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDbEQsTUFBTSxJQUFJLEdBQUcsSUFBSSx3QkFBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN2QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRXZCLE1BQU0sR0FBRyxHQUFHLGVBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUIsSUFDSSxHQUFHLEtBQUssMEJBQTBCLEVBQ3BDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQzNCO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSw2QkFBNkI7Z0JBQ3RDLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNsRCxNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUV2QixNQUFNLEdBQUcsR0FBRyxlQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVCLElBQ0ksR0FBRyxLQUFLLHNDQUFzQyxFQUNoRDt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMzQjtnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsNkJBQTZCO2dCQUN0QyxLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDbEQsTUFBTSxJQUFJLEdBQUcsSUFBSSx3QkFBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3ZCLE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO29CQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUV2QixNQUFNLEdBQUcsR0FBRyxlQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVCLElBQ0ksR0FBRyxLQUFLLHNEQUFzRCxFQUNoRTt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUMzQjtnQkFDTCxDQUFDO2FBQ0o7U0FDSjtLQUNKO0lBQ0Q7UUFDSSxLQUFLLEVBQUUsb0JBQW9CO1FBQzNCLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxRQUFRO2dCQUNqQixLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLElBQUksR0FBRyxlQUFnQixDQUFDO3dCQUMxQixJQUFJLEVBQUUsTUFBTTtxQkFDUSxDQUFDLENBQUM7b0JBQzFCLElBQ0ksSUFBSSxDQUFDLEdBQUcsS0FBSyxnQkFBZ0IsRUFDL0I7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDakM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQzVCO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7cUJBQ3BDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssU0FBUzt3QkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssTUFBTSxFQUNyRDt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUNqQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ3hDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDMUM7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEtBQUssQ0FBQyxNQUFNO2dCQUVaLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxxQkFBcUI7Z0JBQzlCLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sUUFBUSxHQUFhO3dCQUN2QixJQUFJLEVBQUUsUUFBUTt3QkFDZCxLQUFLLEVBQUUsWUFBWTtxQkFDdEIsQ0FBQztvQkFDRixNQUFNLElBQUksR0FBRyxlQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN4QyxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLFdBQVcsRUFDdEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDakM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLFVBQVU7d0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsS0FBSyxFQUN2RTt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQzFDO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxvQkFBb0I7Z0JBQzdCLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sUUFBUSxHQUFhO3dCQUN2QixJQUFJLEVBQUUsUUFBUTt3QkFDZCxJQUFJLEVBQUUsTUFBTTtxQkFDZixDQUFDO29CQUNGLE1BQU0sSUFBSSxHQUFHLGVBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hDLElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssV0FBVyxFQUN0Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUNqQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssU0FBUzt3QkFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQ3RFO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDMUM7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLDRCQUE0QjtnQkFDckMsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxRQUFRLEdBQWE7d0JBQ3ZCLElBQUksRUFBRSxRQUFRO3dCQUNkLEtBQUssRUFBRSxZQUFZO3dCQUNuQixJQUFJLEVBQUUsTUFBTTtxQkFDZixDQUFDO29CQUNGLE1BQU0sSUFBSSxHQUFHLGVBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hDLElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssV0FBVyxFQUN0Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUNqQztvQkFDRCxJQUNJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO3dCQUV0QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssVUFBVTt3QkFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxLQUFLO3dCQUVyRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssU0FBUzt3QkFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQ3RFO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztxQkFDMUM7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEtBQUssQ0FBQyxNQUFNO2dCQUVaLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxVQUFVO2dCQUNuQixLQUFLLENBQUMsTUFBTTtnQkFFWixDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsU0FBUztnQkFDbEIsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsZUFBZ0IsQ0FBQzt3QkFDMUIsSUFBSSxFQUFFLE1BQU07d0JBQ1osUUFBUSxFQUFFOzRCQUNOO2dDQUNJLElBQUksRUFBRSxNQUFNOzZCQUNRO3lCQUMzQjtxQkFDSixDQUFDLENBQUM7b0JBQ0gsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxLQUFLO3dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxlQUFlLEVBQzVEO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7cUJBQ2pDO29CQUNELElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDeEM7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO3FCQUMxQztnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsU0FBUztnQkFDbEIsS0FBSyxDQUFDLE1BQU07b0JBQ1IsTUFBTSxJQUFJLEdBQUcsZUFBZ0IsQ0FBQzt3QkFDMUIsSUFBSSxFQUFFLE1BQU07d0JBQ1osUUFBUSxFQUFFOzRCQUNOO2dDQUNJLElBQUksRUFBRSxNQUFNOzZCQUNRO3lCQUMzQjtxQkFDSixDQUFDLENBQUM7b0JBQ0gsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxLQUFLO3dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxrQkFBa0IsRUFDL0Q7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDakM7b0JBQ0QsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUN4Qzt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7cUJBQzFDO2dCQUNMLENBQUM7YUFDSjtTQUNKO0tBQ0o7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbnRlcmZhY2UgVGVzdEl0ZW0ge1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgbGlzdDoge1xuICAgICAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgICAgIGhhbmRsZTogKCkgPT4gUHJvbWlzZTxhbnk+O1xuICAgIH1bXTtcbn1cblxuaW1wb3J0IHsgVmlydHVhbEVsZW1lbnQgfSBmcm9tICcuLi9leHRlbnNpb24vZWxlbWVudCc7XG5pbXBvcnQge1xuICAgIGVuY29kZSBhcyBlbmNvZGVYTUwsXG4gICAgZGVjb2RlIGFzIGRlY29kZVhNTCxcbn0gZnJvbSAnLi4vZXh0ZW5zaW9uL2FkYXB0ZXIveG1sL3BhcnNlcic7XG5pbXBvcnQge1xuICAgIGRlY29kZSBhcyBkZWNvZGVTaW1wbGVKU09OLFxufSBmcm9tICcuLi9leHRlbnNpb24vYWRhcHRlci9zaW1wbGUtanNvbi9wYXJzZXInO1xuXG5pbXBvcnQgeyBJRWxlbWVudCB9IGZyb20gJy4uL2V4dGVuc2lvbi9hZGFwdGVyL3NpbXBsZS1qc29uL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBjb25zdCBsaXN0OiBUZXN0SXRlbVtdID0gW1xuICAgIHtcbiAgICAgICAgdGl0bGU6ICdYTUwgZGVjb2RlJyxcbiAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYIgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzxkaXYgYSBiPVwiMVwiIGM9MSBkPXRydWUgZT0wIGY9ZmFsc2U+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0udGFnICE9PSAnaW5zcGVjdG9yLXJvb3QnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmoLnoioLngrkgdGFnIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5hdHRyc1snYSddICE9PSAnJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5hdHRyc1snYiddICE9PSAnMScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2MnXSAhPT0gJzEnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydkJ10gIT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5hdHRyc1snZSddICE9PSAnMCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2YnXSAhPT0gJ2ZhbHNlJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYXR0cumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOS4pOWxgiB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdj48c3Bhbj48L3NwYW4+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0udGFnICE9PSAnaW5zcGVjdG9yLXJvb3QnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmoLnoioLngrkgdGFnIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3NwYW4nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y2V5bGC5bimIHRleHQg55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8dWktbGFiZWw+aTE4bjphYWE8L3VpLWxhYmVsPicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICd1aS1sYWJlbCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICdpMThuOmFhYSdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Lik5bGC5bimIHRleHQg55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnICE9PSAnc3BhbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICdhYydcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WNleWxgiBjaGlsZCDnmoQgdGV4dCDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRleHQgIT09ICdiJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign56ys5LqM5bGCIGNoaWxkIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuS4quS4pOWxguW4piB0ZXh0IOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kPHNwYW4+ZTwvc3Bhbj5mPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMV0udGFnICE9PSAnZGl2J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnICE9PSAnc3BhbicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMV0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3NwYW4nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnYWMnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzFdLnRleHQgIT09ICdkZidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WNleWxgiBjaGlsZCDnmoQgdGV4dCDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRleHQgIT09ICdiJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblsxXS5jaGlsZHJlblswXS50ZXh0ICE9PSAnZSdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+esrOS6jOWxgiBjaGlsZCDnmoQgdGV4dCDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrkuKrkuKTlsYLluKYgdGV4dCDnmoQgeG1s77yI5aSN55So5YWD57Sg77yM5L+d5oyB5Y6f5qC377yJJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LiK5LiA5Liq5rWL6K+V5Lul56Gu5L+d5pWw5o2u5q2j56Gu77yM6L+Z6YeM5LiN5YaN5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0cjEgPSBKU09OLnN0cmluZ2lmeShlbGVtMSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nLCBlbGVtMSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0cjIgPSBKU09OLnN0cmluZ2lmeShlbGVtMik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtMSAhPT0gZWxlbTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YWD57Sg5Ye6546w5Y+Y5YyWJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cjEgIT09IHN0cjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign57uT5p6c5Ye6546w5Y+Y5YyWJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5Liq5Lik5bGC5bimIHRleHQg55qEIHhtbO+8iOWkjeeUqOWFg+e0oO+8jOWIoOmZpOWtkOiKgueCue+8iScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMSA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kPHNwYW4+ZTwvc3Bhbj5mPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4iuS4gOS4qua1i+ivleS7peehruS/neaVsOaNruato+ehru+8jOi/memHjOS4jeWGjeajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMiA9IGRlY29kZVhNTCgnPGRpdj5hPHNwYW4+Yjwvc3Bhbj5jPC9kaXY+PGRpdj5kZjwvZGl2PicsIGVsZW0xKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xICE9PSBlbGVtMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhYPntKDlh7rnjrDlj5jljJYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtMS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0xLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbTEuY2hpbGRyZW5bMV0uY2hpbGRyZW4ubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhYPntKDmsqHmnInliKDpmaToioLngrknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrkuKrkuKTlsYLluKYgdGV4dCDnmoQgeG1s77yI5aSN55So5YWD57Sg77yM5paw5aKe5a2Q6IqC54K577yJJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPmY8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LiK5LiA5Liq5rWL6K+V5Lul56Gu5L+d5pWw5o2u5q2j56Gu77yM6L+Z6YeM5LiN5YaN5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gZGVjb2RlWE1MKCc8ZGl2PmE8c3Bhbj5iPC9zcGFuPmM8L2Rpdj48ZGl2PmQ8c3Bhbj5lPC9zcGFuPjxzcGFuPmU8L3NwYW4+ZjwvZGl2PicsIGVsZW0xKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xICE9PSBlbGVtMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhYPntKDlh7rnjrDlj5jljJYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtMS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0xLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbTEuY2hpbGRyZW5bMV0uY2hpbGRyZW4ubGVuZ3RoICE9PSAyXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhYPntKDmsqHmnInmlrDlop7oioLngrknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYLmnKrpl63lkIjnmoQgeG1sJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZWNvZGVYTUwoJzx1aS1sYWJlbD5pMThuOmFhYScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICd1aS1sYWJlbCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRleHQgIT09ICdpMThuOmFhYSdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOeahCB0ZXh0IOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5bGC5Lit6Ze05pyq6Zet5ZCI55qEIHhtbCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlWE1MKCc8ZGl2Pjx1aS1sYWJlbD5pMThuOmFhYTwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2kxOG46YWFhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIGNoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxguacq+WwvuacqumXreWQiOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdj48dWktbGFiZWw+aTE4bjphYWE8L3VpLWxhYmVsPicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAnJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ2kxOG46YWFhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g55qEIGNoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxgumDveacqumXreWQiOeahCB4bWwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVhNTCgnPGRpdj48dWktbGFiZWw+aTE4bjphYWEnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJydcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRleHQgIT09ICdpMThuOmFhYSdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOeahCBjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICB0aXRsZTogJ1hNTCBlbmNvZGUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOepuueahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1sICE9PSAnJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y2V5bGC5pegIGF0dHIg5pegIHRleHQg55qEIEVsZW1lbnQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1sICE9PSAnPGRpdj48L2Rpdj4nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDljZXlsYLmnIkgYXR0ciDml6AgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuc2V0QXR0cmlidXRlKCdhJywgJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHhtbCA9IGVuY29kZVhNTChyb290KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgeG1sICE9PSAnPGRpdiBhPVwiYVwiPjwvZGl2PidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWNleWxguaciSBhdHRyIOaciSB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICBkaXYudGV4dCA9ICdpMThuOmFhYSc7XG4gICAgICAgICAgICAgICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoZGl2KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbCAhPT0gJzxkaXYgYT1cImFcIj5pMThuOmFhYTwvZGl2PidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWkmuWxguaXoCBhdHRyIOaXoCB0ZXh0IOeahCBFbGVtZW50JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjEuYXBwZW5kQ2hpbGQoZGl2Mik7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeG1sID0gZW5jb2RlWE1MKHJvb3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bWwgIT09ICc8ZGl2PjxkaXYyPjwvZGl2Mj48L2Rpdj4nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLmnIkgYXR0ciDml6AgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjIuc2V0QXR0cmlidXRlKCdiJywgJ2InKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5hcHBlbmRDaGlsZChkaXYyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbCAhPT0gJzxkaXYgYT1cImFcIj48ZGl2MiBiPVwiYlwiPjwvZGl2Mj48L2Rpdj4nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLmnIkgYXR0ciDmnIkgdGV4dCDnmoQgRWxlbWVudCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICBkaXYxLnRleHQgPSAnaTE4bjphYWEnO1xuICAgICAgICAgICAgICAgICAgICByb290LmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYyJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjIuc2V0QXR0cmlidXRlKCdiJywgJ2InKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2Mi50ZXh0ID0gJ2kxOG46YmJiJztcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5hcHBlbmRDaGlsZChkaXYyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4bWwgPSBlbmNvZGVYTUwocm9vdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbCAhPT0gJzxkaXYgYT1cImFcIj48ZGl2MiBiPVwiYlwiPmkxOG46YmJiPC9kaXYyPmkxOG46YWFhPC9kaXY+J1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdGl0bGU6ICdTaW1wbGUgSlNPTiBkZWNvZGUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOacquefpeWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGVzdCcsXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgdW5rbm93biBhcyBJRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0udGFnICE9PSAnaW5zcGVjdG9yLXJvb3QnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmoLnoioLngrkgdGFnIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZHJlbiDop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3Vua25vd24nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgndWktdHlwZScpICE9PSAndGVzdCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6QIHByb3AnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOWPquaciSBsYWJlbCDnmoQgYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RKU09OOiBJRWxlbWVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdUZXN0QnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVNpbXBsZUpTT04odGVzdEpTT04pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWJ1dHRvbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWxhYmVsJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgIT09IHRlc3RKU09OLmxhYmVsXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5Y+q5pyJIGljb24g55qEIGJ1dHRvbicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXN0SlNPTjogSUVsZW1lbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb246ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVNpbXBsZUpTT04odGVzdEpTT04pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWJ1dHRvbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWljb24nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgndmFsdWUnKSAhPT0gdGVzdEpTT04uaWNvblxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg55qEIGNoaWxkcmVuIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+ino+aekOaciSBsYWJlbCDkuJTmnIkgaWNvbiDnmoQgYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RKU09OOiBJRWxlbWVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdUZXN0QnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb246ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVNpbXBsZUpTT04odGVzdEpTT04pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ3VpLWJ1dHRvbidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAyIHx8XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnICE9PSAndWktbGFiZWwnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgndmFsdWUnKSAhPT0gdGVzdEpTT04ubGFiZWwgfHxcblxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS50YWcgIT09ICd1aS1pY29uJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgIT09IHRlc3RKU09OLmljb25cbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOeahCBjaGlsZHJlbiDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgbGluZScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6QIHNwYWNlJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpAgdmJveCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZGVjb2RlU2ltcGxlSlNPTih7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndmJveCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3Rlc3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgdW5rbm93biBhcyBJRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCdzdHlsZScpICE9PSAnZGlzcGxheTogcm93OydcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkIOexu+Wei+mUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnmoQgY2hpbGRyZW4g6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6QIGhib3gnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlY29kZVNpbXBsZUpTT04oe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2hib3gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIHVua25vd24gYXMgSUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50YWcgIT09ICdkaXYnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSAhPT0gJ2Rpc3BsYXk6IGNvbHVtbjsnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGlsZCDnsbvlnovplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGQg55qEIGNoaWxkcmVuIOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbl07Il19