'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const element_1 = require("../extension/element");
exports.list = [
    {
        title: 'Element',
        list: [
            // ---- Attribute ----
            {
                message: 'Tag 必须大写',
                async handle() {
                    const elem = new element_1.VirtualElement('test');
                    if (elem.tag !== 'test') {
                        throw new Error('传入 Tag 需要转大写');
                    }
                },
            },
            {
                message: 'setAttribute 传入字符串',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('a1', '1');
                    elem.setAttribute('a2', '');
                    if (elem.attrs['a1'] !== '1' || elem.attrs['a2'] !== '') {
                        throw new Error('传入字符串必须保持原值');
                    }
                },
            },
            {
                message: 'setAttribute 传入数字',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('b1', 1);
                    elem.setAttribute('b2', 0);
                    if (elem.attrs['b1'] !== '1' || elem.attrs['b2'] !== '0') {
                        throw new Error('传入数字需要转成字符串');
                    }
                },
            },
            {
                message: 'setAttribute 传入布尔值',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('c1', true);
                    elem.setAttribute('c2', false);
                    if (elem.attrs['c1'] !== 'true' || elem.attrs['c2'] !== 'false') {
                        throw new Error('传入布尔值需要转成字符串');
                    }
                    elem.setAttribute('d1', {});
                    elem.setAttribute('d2', []);
                },
            },
            {
                message: 'setAttribute 传入对象',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('d1', {});
                    elem.setAttribute('d2', []);
                    elem.setAttribute('d3', [1, 2]);
                    if (elem.attrs['d1'] !== '[object Object]' || elem.attrs['d2'] !== '' || elem.attrs['d3'] !== '1,2') {
                        throw new Error('传入对象需要转成字符串');
                    }
                },
            },
            {
                message: 'removeAttribute',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('d1', {});
                    if (!('d1' in elem.attrs)) {
                        throw new Error('设置错误');
                    }
                    elem.removeAttribute('d1');
                    if ('d1' in elem.attrs) {
                        throw new Error('删除错误');
                    }
                },
            },
            {
                message: 'hasAttribute',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('d1', {});
                    if (elem.hasAttribute('d1') === false) {
                        throw new Error('设置后检查错误');
                    }
                    elem.removeAttribute('d1');
                    if (elem.hasAttribute('d1') === true) {
                        throw new Error('删除后检查错误');
                    }
                },
            },
            {
                message: 'getAttribute',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.setAttribute('d1', '');
                    elem.setAttribute('d2', '1');
                    elem.setAttribute('d3', 'a');
                    if (elem.getAttribute('d1') !== '' || elem.getAttribute('d2') !== '1' || elem.getAttribute('d3') !== 'a') {
                        throw new Error('设置后检查错误');
                    }
                },
            },
            // ---- EventListener ----
            {
                message: 'addEventListener/dispatch',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    let result = [];
                    function handle(...args) {
                        result = args;
                    }
                    elem.addEventListener('a1', handle);
                    elem.dispatch('a1', 1, 2, 3);
                    if (result[0] !== 1 || result[1] !== 2 || result[2] !== 3 || result.length !== 3) {
                        throw new Error('事件传参错误');
                    }
                },
            },
            {
                message: 'addEventListener 同一函数只能绑定一次',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    let result = 0;
                    function handle(...args) {
                        result++;
                    }
                    elem.addEventListener('a1', handle);
                    elem.addEventListener('a1', handle);
                    elem.dispatch('a1');
                    if (result !== 1) {
                        throw new Error('事件多次触发');
                    }
                },
            },
            {
                message: 'addEventListener 同事件多个函数',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    let result = 0;
                    function handle1(...args) {
                        result++;
                    }
                    function handle2(...args) {
                        result++;
                    }
                    elem.addEventListener('a1', handle1);
                    elem.addEventListener('a1', handle2);
                    elem.dispatch('a1');
                    if (result !== 2) {
                        throw new Error('事件没有触发完整');
                    }
                },
            },
            {
                message: 'addEventListener 传入布尔值',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.addEventListener('a1', true);
                    if ('a1' in elem.events) {
                        throw new Error('不能绑定非函数');
                    }
                },
            },
            {
                message: 'addEventListener 传入数字',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.addEventListener('a1', 0);
                    if ('a1' in elem.events) {
                        throw new Error('不能绑定非函数');
                    }
                },
            },
            {
                message: 'addEventListener 传入字符串',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.addEventListener('a1', 'aa');
                    if ('a1' in elem.events) {
                        throw new Error('不能绑定非函数');
                    }
                },
            },
            {
                message: 'addEventListener 传入对象',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    elem.addEventListener('a1', {});
                    elem.addEventListener('a2', []);
                    if ('a1' in elem.events || 'a2' in elem.events) {
                        throw new Error('不能绑定非函数');
                    }
                },
            },
            {
                message: 'removeEventListener 存在的监听函数',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    let result = [];
                    function handle(...args) {
                        result = args;
                    }
                    elem.addEventListener('a1', handle);
                    elem.removeEventListener('a1', handle);
                    elem.dispatch('a1', 1, 2, 3);
                    if (result.length !== 0) {
                        throw new Error('事件反监听错误');
                    }
                },
            },
            {
                message: 'removeEventListener 不存在的监听函数',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    let result = [];
                    function handle(...args) {
                        result = args;
                    }
                    elem.addEventListener('a1', handle);
                    elem.removeEventListener('a1', function () { });
                    elem.dispatch('a1', 1, 2, 3);
                    if (result.length !== 3) {
                        throw new Error('事件反监听错误');
                    }
                },
            },
            {
                message: 'removeAllEventListener',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    let result = 0;
                    function handle(...args) {
                        result++;
                    }
                    elem.addEventListener('a1', handle);
                    elem.removeAllEventListener('a1');
                    elem.dispatch('a1');
                    if (result !== 0) {
                        throw new Error('事件反监听错误');
                    }
                },
            },
            // ---- child ----
            {
                message: 'appendChild',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const child1 = new element_1.VirtualElement('test');
                    elem.appendChild(child1);
                    if (elem.children.length !== 1 || elem.children[0] !== child1) {
                        throw new Error('插入子节点失败');
                    }
                    if (child1.getParent() !== elem) {
                        throw new Error('子节点 parent 未更新');
                    }
                    const child2 = new element_1.VirtualElement('test');
                    elem.appendChild(child2);
                    if (elem.children.length !== 2 || elem.children[1] !== child2) {
                        throw new Error('插入第二个子节点失败');
                    }
                    if (child2.getParent() !== elem) {
                        throw new Error('子节点 parent 未更新');
                    }
                },
            },
            {
                message: 'appendChild 同一节点只能插入一次',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const child1 = new element_1.VirtualElement('test');
                    elem.appendChild(child1);
                    elem.appendChild(child1);
                    if (elem.children.length !== 1 || elem.children[0] !== child1) {
                        throw new Error('子节点被重复添加');
                    }
                },
            },
            {
                message: 'insertChild 一个子节点',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const child1 = new element_1.VirtualElement('test');
                    elem.insertChild(child1, 0);
                    if (elem.children.length !== 1) {
                        throw new Error('子节点插入失败');
                    }
                },
            },
            {
                message: 'insertChild 一个已经存在的子节点',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const child1 = new element_1.VirtualElement('test');
                    const child2 = new element_1.VirtualElement('test');
                    elem.appendChild(child1);
                    elem.appendChild(child2);
                    elem.insertChild(child2, 0);
                    if (elem.children.length !== 2 || elem.children[0] !== child2) {
                        throw new Error('子节点插入失败');
                    }
                },
            },
            {
                message: 'removeChild',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const child1 = new element_1.VirtualElement('test');
                    elem.appendChild(child1);
                    elem.removeChild(child1);
                    if (elem.children.length !== 0) {
                        throw new Error('子节点删除失败');
                    }
                    if (child1.getParent() !== null) {
                        throw new Error('子节点 parent 没有移除');
                    }
                },
            },
            {
                message: 'removeChild 移除不存在的节点',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const child1 = new element_1.VirtualElement('test');
                    const child2 = new element_1.VirtualElement('test');
                    elem.appendChild(child1);
                    elem.removeChild(child2);
                    if (elem.children.length !== 1 || elem.children[0] !== child1) {
                        throw new Error('子节点删除错误');
                    }
                    if (child1.getParent() !== elem) {
                        throw new Error('子节点 parent 被异常移除');
                    }
                },
            },
            {
                message: 'queryChildrenByTag',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const son1 = new element_1.VirtualElement('a');
                    elem.appendChild(son1);
                    const grandson11 = new element_1.VirtualElement('a');
                    const grandson12 = new element_1.VirtualElement('a');
                    son1.appendChild(grandson11);
                    son1.appendChild(grandson12);
                    const son2 = new element_1.VirtualElement('a');
                    elem.appendChild(son2);
                    const grandson21 = new element_1.VirtualElement('a');
                    const grandson22 = new element_1.VirtualElement('a');
                    son1.appendChild(grandson21);
                    son1.appendChild(grandson22);
                    const results = elem.queryChildrenByTag('a');
                    if (results[0] !== son1 ||
                        results[1] !== son2 ||
                        results[2] !== grandson11 ||
                        results[3] !== grandson12 ||
                        results[4] !== grandson21 ||
                        results[5] !== grandson22) {
                        throw new Error('子节点顺序异常');
                    }
                },
            },
            {
                message: 'queryChildByID',
                async handle() {
                    // 绕过语法检查
                    const elem = new element_1.VirtualElement('test');
                    const son1 = new element_1.VirtualElement('a');
                    elem.appendChild(son1);
                    const grandson11 = new element_1.VirtualElement('a');
                    const grandson12 = new element_1.VirtualElement('a');
                    son1.appendChild(grandson11);
                    son1.appendChild(grandson12);
                    const son2 = new element_1.VirtualElement('a');
                    elem.appendChild(son2);
                    const grandson21 = new element_1.VirtualElement('a');
                    const grandson22 = new element_1.VirtualElement('a');
                    son1.appendChild(grandson21);
                    son1.appendChild(grandson22);
                    const result = elem.queryChildByID(grandson12.id);
                    if (result !== grandson12) {
                        throw new Error('子节点异常');
                    }
                },
            },
            {
                message: 'apply 基本属性',
                async handle() {
                    // 绕过语法检查
                    const elem1 = new element_1.VirtualElement('test');
                    elem1.addEventListener('a', function () { });
                    elem1.addEventListener('b', function () { });
                    const elem2 = new element_1.VirtualElement('test');
                    elem2.text = '2';
                    elem2.attrs = { test: '2' };
                    let result = false;
                    function bindEvent() {
                        result = true;
                    }
                    elem2.addEventListener('test', bindEvent);
                    const id = elem1.id;
                    elem1.apply(elem2);
                    elem1.dispatch('test');
                    if (elem1.id !== id) {
                        throw new Error('ID 需要保持原有的值，不能变化');
                    }
                    if (elem1.text !== '2') {
                        throw new Error('text 没有应用');
                    }
                    if (elem1.attrs['test'] !== '2') {
                        throw new Error('attrs 没有应用');
                    }
                    if (elem1.events.length !== 1 || !result) {
                        throw new Error('events 没有应用');
                    }
                },
            },
            {
                message: 'apply 新增节点',
                async handle() {
                    // 绕过语法检查
                    const elem1 = new element_1.VirtualElement('elem');
                    const son11 = new element_1.VirtualElement('son');
                    elem1.appendChild(son11);
                    const elem2 = new element_1.VirtualElement('elem');
                    const son21 = new element_1.VirtualElement('son');
                    const son22 = new element_1.VirtualElement('son');
                    elem2.appendChild(son21);
                    elem2.appendChild(son22);
                    son22.text = '2';
                    son22.attrs = { test: '2' };
                    let result = false;
                    function bindEvent() {
                        result = true;
                    }
                    son22.addEventListener('test', bindEvent);
                    elem1.apply(elem2);
                    const son12 = elem1.children[1];
                    son12.dispatch('test');
                    if (son12.text !== '2') {
                        throw new Error('text 没有应用');
                    }
                    if (son12.attrs['test'] !== '2') {
                        throw new Error('attrs 没有应用');
                    }
                    if (son12.events.length !== 1 || !result) {
                        throw new Error('events 没有应用');
                    }
                },
            },
            {
                message: 'apply 删除节点',
                async handle() {
                    // 绕过语法检查
                    const elem1 = new element_1.VirtualElement('elem');
                    const son11 = new element_1.VirtualElement('son');
                    elem1.appendChild(son11);
                    const elem2 = new element_1.VirtualElement('elem');
                    const son21 = new element_1.VirtualElement('son');
                    const son22 = new element_1.VirtualElement('son');
                    elem2.appendChild(son21);
                    elem2.appendChild(son22);
                    elem2.apply(elem1);
                    if (elem2.children.length !== 1) {
                        throw new Error('没有删除节点');
                    }
                },
            },
        ],
    },
    {
        title: 'Serialize',
        list: [
            {
                message: '序列化一个空元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化一个 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    elem.appendChild(div);
                    const divString = `{"id":${div.id},"tag":"div","text":"","attrs":{},"events":[],"children":[]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${divString}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化一个带 attrs 的 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    div.setAttribute('a', 'a');
                    elem.appendChild(div);
                    const divString = `{"id":${div.id},"tag":"div","text":"","attrs":{"a":"a"},"events":[],"children":[]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${divString}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化一个带 text 的 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    div.text = 'text';
                    elem.appendChild(div);
                    const divString = `{"id":${div.id},"tag":"div","text":"text","attrs":{},"events":[],"children":[]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${divString}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化一个带 events 的 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    div.addEventListener('a', function () { });
                    elem.appendChild(div);
                    const divString = `{"id":${div.id},"tag":"div","text":"","attrs":{},"events":["a"],"children":[]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${divString}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化一个带 attrs/text/events 的 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div = new element_1.VirtualElement('div');
                    div.text = 'text';
                    div.setAttribute('a', 'a');
                    div.addEventListener('a', function () { });
                    elem.appendChild(div);
                    const divString = `{"id":${div.id},"tag":"div","text":"text","attrs":{"a":"a"},"events":["a"],"children":[]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${divString}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化多个 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div1 = new element_1.VirtualElement('div');
                    const div2 = new element_1.VirtualElement('div');
                    elem.appendChild(div1);
                    elem.appendChild(div2);
                    const div1String = `{"id":${div1.id},"tag":"div","text":"","attrs":{},"events":[],"children":[]}`;
                    const div2String = `{"id":${div2.id},"tag":"div","text":"","attrs":{},"events":[],"children":[]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${div1String},${div2String}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
            {
                message: '序列化多层 div 的元素',
                async handle() {
                    const elem = new element_1.VirtualElement('inspector-root');
                    const div1 = new element_1.VirtualElement('div');
                    const div2 = new element_1.VirtualElement('div');
                    elem.appendChild(div1);
                    div1.appendChild(div2);
                    const div2String = `{"id":${div2.id},"tag":"div","text":"","attrs":{},"events":[],"children":[]}`;
                    const div1String = `{"id":${div1.id},"tag":"div","text":"","attrs":{},"events":[],"children":[${div2String}]}`;
                    const rootString = `{"id":${elem.id},"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${div1String}]}`;
                    const result = (0, element_1.serialize)(elem);
                    if (result !== rootString) {
                        throw new Error('序列化错误');
                    }
                },
            },
        ],
    },
    {
        title: 'Deserialize',
        list: [
            {
                message: '反序列化多层 div 的元素',
                async handle() {
                    const div2String = `{"id":3,"tag":"div","text":"text","attrs":{},"events":[],"children":[]}`;
                    const div1String = `{"id":2,"tag":"div","text":"text","attrs":{"a":"a"},"events":[],"children":[${div2String}]}`;
                    const rootString = `{"id":1,"tag":"inspector-root","text":"","attrs":{},"events":[],"children":[${div1String}]}`;
                    const elem = (0, element_1.deserialize)(rootString);
                    if (elem.tag !== 'inspector-root' ||
                        elem.children.length !== 1 ||
                        elem.children[0].tag !== 'div' ||
                        elem.children[0].text !== 'text' ||
                        elem.children[0].attrs['a'] !== 'a' ||
                        elem.children[0].children.length !== 1 ||
                        elem.children[0].children[0].text !== 'text') {
                        throw new Error('反序列化错误');
                    }
                },
            },
        ],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmVsZW1lbnQuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2V4dGVuc2lvbi5lbGVtZW50LnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFVYixrREFBOEU7QUFFakUsUUFBQSxJQUFJLEdBQWU7SUFDNUI7UUFDSSxLQUFLLEVBQUUsU0FBUztRQUNoQixJQUFJLEVBQUU7WUFDRixzQkFBc0I7WUFDdEI7Z0JBQ0ksT0FBTyxFQUFFLFVBQVU7Z0JBQ25CLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFDO3dCQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUNwQyxDQUFDO2dCQUNMLENBQUM7YUFDSjtZQUNEO2dCQUNJLE9BQU8sRUFBRSxvQkFBb0I7Z0JBQzdCLEtBQUssQ0FBQyxNQUFNO29CQUNSLFNBQVM7b0JBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSx3QkFBYyxDQUFDLE1BQU0sQ0FBUSxDQUFDO29CQUMvQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzVCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQzt3QkFDdEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDbkMsQ0FBQztnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsbUJBQW1CO2dCQUM1QixLQUFL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Q0FBQyxJQUFJLEtBQUssTUFBTTt3QkFDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRzt3QkFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQzlDLENBQUM7d0JBQ0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUIsQ0FBQztnQkFDTCxDQUFDO2FBQ0o7U0FDSjtLQUNKO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW50ZXJmYWNlIFRlc3RJdGVtIHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGxpc3Q6IHtcbiAgICAgICAgbWVzc2FnZTogc3RyaW5nO1xuICAgICAgICBoYW5kbGU6ICgpID0+IFByb21pc2U8YW55PjtcbiAgICB9W107XG59XG5cbmltcG9ydCB7IFZpcnR1YWxFbGVtZW50LCBzZXJpYWxpemUsIGRlc2VyaWFsaXplIH0gZnJvbSAnLi4vZXh0ZW5zaW9uL2VsZW1lbnQnO1xuXG5leHBvcnQgY29uc3QgbGlzdDogVGVzdEl0ZW1bXSA9IFtcbiAgICB7XG4gICAgICAgIHRpdGxlOiAnRWxlbWVudCcsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIC8vIC0tLS0gQXR0cmlidXRlIC0tLS1cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVGFnIOW/hemhu+Wkp+WGmScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLnRhZyAhPT0gJ3Rlc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S8oOWFpSBUYWcg6ZyA6KaB6L2s5aSn5YaZJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnc2V0QXR0cmlidXRlIOS8oOWFpeWtl+espuS4sicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2ExJywgJzEnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2EyJywgJycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5hdHRyc1snYTEnXSAhPT0gJzEnIHx8IGVsZW0uYXR0cnNbJ2EyJ10gIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S8oOWFpeWtl+espuS4suW/hemhu+S/neaMgeWOn+WAvCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3NldEF0dHJpYnV0ZSDkvKDlhaXmlbDlrZcnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdiMScsIDEpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnYjInLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uYXR0cnNbJ2IxJ10gIT09ICcxJyB8fCBlbGVtLmF0dHJzWydiMiddICE9PSAnMCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Lyg5YWl5pWw5a2X6ZyA6KaB6L2s5oiQ5a2X56ym5LiyJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnc2V0QXR0cmlidXRlIOS8oOWFpeW4g+WwlOWAvCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2MxJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdjMicsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uYXR0cnNbJ2MxJ10gIT09ICd0cnVlJyB8fCBlbGVtLmF0dHJzWydjMiddICE9PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S8oOWFpeW4g+WwlOWAvOmcgOimgei9rOaIkOWtl+espuS4sicpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QxJywge30pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDInLCBbXSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3NldEF0dHJpYnV0ZSDkvKDlhaXlr7nosaEnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdkMScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QyJywgW10pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDMnLCBbMSwgMl0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5hdHRyc1snZDEnXSAhPT0gJ1tvYmplY3QgT2JqZWN0XScgfHwgZWxlbS5hdHRyc1snZDInXSAhPT0gJycgfHwgZWxlbS5hdHRyc1snZDMnXSAhPT0gJzEsMicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Lyg5YWl5a+56LGh6ZyA6KaB6L2s5oiQ5a2X56ym5LiyJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncmVtb3ZlQXR0cmlidXRlJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDEnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKCdkMScgaW4gZWxlbS5hdHRycykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6K6+572u6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2QxJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgnZDEnIGluIGVsZW0uYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Yig6Zmk6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnaGFzQXR0cmlidXRlJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDEnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmhhc0F0dHJpYnV0ZSgnZDEnKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign6K6+572u5ZCO5qOA5p+l6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2QxJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmhhc0F0dHJpYnV0ZSgnZDEnKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfliKDpmaTlkI7mo4Dmn6XplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdnZXRBdHRyaWJ1dGUnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QxJywgJycpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDInLCAnMScpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDMnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5nZXRBdHRyaWJ1dGUoJ2QxJykgIT09ICcnIHx8IGVsZW0uZ2V0QXR0cmlidXRlKCdkMicpICE9PSAnMScgfHwgZWxlbS5nZXRBdHRyaWJ1dGUoJ2QzJykgIT09ICdhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCforr7nva7lkI7mo4Dmn6XplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyAtLS0tIEV2ZW50TGlzdGVuZXIgLS0tLVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyL2Rpc3BhdGNoJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUoLi4uYXJnczogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZGlzcGF0Y2goJ2ExJywgMSwgMiwgMyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRbMF0gIT09IDEgfHwgcmVzdWx0WzFdICE9PSAyIHx8IHJlc3VsdFsyXSAhPT0gMyB8fCByZXN1bHQubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuS8oOWPgumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2FkZEV2ZW50TGlzdGVuZXIg5ZCM5LiA5Ye95pWw5Y+q6IO957uR5a6a5LiA5qyhJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZGlzcGF0Y2goJ2ExJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25aSa5qyh6Kem5Y+RJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYWRkRXZlbnRMaXN0ZW5lciDlkIzkuovku7blpJrkuKrlh73mlbAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUxKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUyKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignYTEnLCBoYW5kbGUyKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5kaXNwYXRjaCgnYTEnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7bmsqHmnInop6blj5HlrozmlbQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeW4g+WwlOWAvCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ2ExJyBpbiBlbGVtLmV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeaVsOWtlycsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ2ExJyBpbiBlbGVtLmV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeWtl+espuS4sicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsICdhYScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ2ExJyBpbiBlbGVtLmV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeWvueixoScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMicsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCdhMScgaW4gZWxlbS5ldmVudHMgfHwgJ2EyJyBpbiBlbGVtLmV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdyZW1vdmVFdmVudExpc3RlbmVyIOWtmOWcqOeahOebkeWQrOWHveaVsCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignYTEnLCBoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5kaXNwYXRjaCgnYTEnLCAxLCAyLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25Y+N55uR5ZCs6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncmVtb3ZlRXZlbnRMaXN0ZW5lciDkuI3lrZjlnKjnmoTnm5HlkKzlh73mlbAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZSguLi5hcmdzOiBudW1iZXJbXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdhMScsIGZ1bmN0aW9uKCkge30pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmRpc3BhdGNoKCdhMScsIDEsIDIsIDMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCAhPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7blj43nm5HlkKzplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdyZW1vdmVBbGxFdmVudExpc3RlbmVyJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5yZW1vdmVBbGxFdmVudExpc3RlbmVyKCdhMScpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmRpc3BhdGNoKCdhMScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuWPjeebkeWQrOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIC0tLS0gY2hpbGQgLS0tLVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhcHBlbmRDaGlsZCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8IGVsZW0uY2hpbGRyZW5bMF0gIT09IGNoaWxkMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmj5LlhaXlrZDoioLngrnlpLHotKUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQxLmdldFBhcmVudCgpICE9PSBlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCuSBwYXJlbnQg5pyq5pu05pawJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAyIHx8IGVsZW0uY2hpbGRyZW5bMV0gIT09IGNoaWxkMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmj5LlhaXnrKzkuozkuKrlrZDoioLngrnlpLHotKUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQyLmdldFBhcmVudCgpICE9PSBlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCuSBwYXJlbnQg5pyq5pu05pawJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYXBwZW5kQ2hpbGQg5ZCM5LiA6IqC54K55Y+q6IO95o+S5YWl5LiA5qyhJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQxKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChjaGlsZDEpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgZWxlbS5jaGlsZHJlblswXSAhPT0gY2hpbGQxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCueiiq+mHjeWkjea3u+WKoCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2luc2VydENoaWxkIOS4gOS4quWtkOiKgueCuScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQxID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmluc2VydENoaWxkKGNoaWxkMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflrZDoioLngrnmj5LlhaXlpLHotKUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdpbnNlcnRDaGlsZCDkuIDkuKrlt7Lnu4/lrZjlnKjnmoTlrZDoioLngrknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQyID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGNoaWxkMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQyKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5pbnNlcnRDaGlsZChjaGlsZDIsIDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHwgZWxlbS5jaGlsZHJlblswXSAhPT0gY2hpbGQyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCueaPkuWFpeWksei0pScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3JlbW92ZUNoaWxkJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChjaGlsZDEpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnJlbW92ZUNoaWxkKGNoaWxkMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflrZDoioLngrnliKDpmaTlpLHotKUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQxLmdldFBhcmVudCgpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCuSBwYXJlbnQg5rKh5pyJ56e76ZmkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncmVtb3ZlQ2hpbGQg56e76Zmk5LiN5a2Y5Zyo55qE6IqC54K5JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChjaGlsZDEpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnJlbW92ZUNoaWxkKGNoaWxkMik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCBlbGVtLmNoaWxkcmVuWzBdICE9PSBjaGlsZDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K55Yig6Zmk6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkMS5nZXRQYXJlbnQoKSAhPT0gZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflrZDoioLngrkgcGFyZW50IOiiq+W8guW4uOenu+mZpCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3F1ZXJ5Q2hpbGRyZW5CeVRhZycsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24xID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKHNvbjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFuZHNvbjExID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFuZHNvbjEyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBzb24xLmFwcGVuZENoaWxkKGdyYW5kc29uMTEpO1xuICAgICAgICAgICAgICAgICAgICBzb24xLmFwcGVuZENoaWxkKGdyYW5kc29uMTIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoc29uMik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW5kc29uMjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW5kc29uMjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHNvbjEuYXBwZW5kQ2hpbGQoZ3JhbmRzb24yMSk7XG4gICAgICAgICAgICAgICAgICAgIHNvbjEuYXBwZW5kQ2hpbGQoZ3JhbmRzb24yMik7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGVsZW0ucXVlcnlDaGlsZHJlbkJ5VGFnKCdhJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbMF0gIT09IHNvbjEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbMV0gIT09IHNvbjIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbMl0gIT09IGdyYW5kc29uMTEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbM10gIT09IGdyYW5kc29uMTIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbNF0gIT09IGdyYW5kc29uMjEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbNV0gIT09IGdyYW5kc29uMjJcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCuemhuuW6j+W8guW4uCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3F1ZXJ5Q2hpbGRCeUlEJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoc29uMSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW5kc29uMTEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW5kc29uMTIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHNvbjEuYXBwZW5kQ2hpbGQoZ3JhbmRzb24xMSk7XG4gICAgICAgICAgICAgICAgICAgIHNvbjEuYXBwZW5kQ2hpbGQoZ3JhbmRzb24xMik7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29uMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnYScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChzb24yKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbmRzb24yMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnYScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbmRzb24yMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnYScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgc29uMS5hcHBlbmRDaGlsZChncmFuZHNvbjIxKTtcbiAgICAgICAgICAgICAgICAgICAgc29uMS5hcHBlbmRDaGlsZChncmFuZHNvbjIyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBlbGVtLnF1ZXJ5Q2hpbGRCeUlEKGdyYW5kc29uMTIuaWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSBncmFuZHNvbjEyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCueW8guW4uCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2FwcGx5IOWfuuacrOWxnuaApycsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0xLmFkZEV2ZW50TGlzdGVuZXIoJ2EnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTEuYWRkRXZlbnRMaXN0ZW5lcignYicsIGZ1bmN0aW9uKCkge30pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTIudGV4dCA9ICcyJztcbiAgICAgICAgICAgICAgICAgICAgZWxlbTIuYXR0cnMgPSB7IHRlc3Q6ICcyJyB9O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGJpbmRFdmVudCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbTIuYWRkRXZlbnRMaXN0ZW5lcigndGVzdCcsIGJpbmRFdmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaWQgPSBlbGVtMS5pZDtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTEuYXBwbHkoZWxlbTIpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtMS5kaXNwYXRjaCgndGVzdCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtMS5pZCAhPT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSUQg6ZyA6KaB5L+d5oyB5Y6f5pyJ55qE5YC877yM5LiN6IO95Y+Y5YyWJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xLnRleHQgIT09ICcyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZXh0IOayoeacieW6lOeUqCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtMS5hdHRyc1sndGVzdCddICE9PSAnMicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYXR0cnMg5rKh5pyJ5bqU55SoJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0xLmV2ZW50cy5sZW5ndGggIT09IDEgfHwgIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdldmVudHMg5rKh5pyJ5bqU55SoJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYXBwbHkg5paw5aKe6IqC54K5JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZWxlbScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29uMTEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3NvbicpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTEuYXBwZW5kQ2hpbGQoc29uMTEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gbmV3IFZpcnR1YWxFbGVtZW50KCdlbGVtJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24yMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnc29uJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24yMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnc29uJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtMi5hcHBlbmRDaGlsZChzb24yMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmFwcGVuZENoaWxkKHNvbjIyKTtcblxuICAgICAgICAgICAgICAgICAgICBzb24yMi50ZXh0ID0gJzInO1xuICAgICAgICAgICAgICAgICAgICBzb24yMi5hdHRycyA9IHsgdGVzdDogJzInIH07XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gYmluZEV2ZW50KCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzb24yMi5hZGRFdmVudExpc3RlbmVyKCd0ZXN0JywgYmluZEV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICBlbGVtMS5hcHBseShlbGVtMik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjEyID0gZWxlbTEuY2hpbGRyZW5bMV07XG4gICAgICAgICAgICAgICAgICAgIHNvbjEyLmRpc3BhdGNoKCd0ZXN0Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvbjEyLnRleHQgIT09ICcyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZXh0IOayoeacieW6lOeUqCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb24xMi5hdHRyc1sndGVzdCddICE9PSAnMicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYXR0cnMg5rKh5pyJ5bqU55SoJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvbjEyLmV2ZW50cy5sZW5ndGggIT09IDEgfHwgIXJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdldmVudHMg5rKh5pyJ5bqU55SoJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYXBwbHkg5Yig6Zmk6IqC54K5JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZWxlbScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29uMTEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3NvbicpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTEuYXBwZW5kQ2hpbGQoc29uMTEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0yID0gbmV3IFZpcnR1YWxFbGVtZW50KCdlbGVtJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24yMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnc29uJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24yMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnc29uJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtMi5hcHBlbmRDaGlsZChzb24yMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmFwcGVuZENoaWxkKHNvbjIyKTtcblxuICAgICAgICAgICAgICAgICAgICBlbGVtMi5hcHBseShlbGVtMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmsqHmnInliKDpmaToioLngrknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICB0aXRsZTogJ1NlcmlhbGl6ZScsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5bqP5YiX5YyW5LiA5Liq56m65YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSByb290U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluS4gOS4qiBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2U3RyaW5nID0gYHtcImlkXCI6JHtkaXYuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbXX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290U3RyaW5nID0gYHtcImlkXCI6JHtlbGVtLmlkfSxcInRhZ1wiOlwiaW5zcGVjdG9yLXJvb3RcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXZTdHJpbmd9XX1gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNlcmlhbGl6ZShlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gcm9vdFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfluo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfluo/liJfljJbkuIDkuKrluKYgYXR0cnMg55qEIGRpdiDnmoTlhYPntKAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnYScsICdhJyk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2U3RyaW5nID0gYHtcImlkXCI6JHtkaXYuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7XCJhXCI6XCJhXCJ9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdlN0cmluZ31dfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSByb290U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluS4gOS4quW4piB0ZXh0IOeahCBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi50ZXh0ID0gJ3RleHQnO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdlN0cmluZyA9IGB7XCJpZFwiOiR7ZGl2LmlkfSxcInRhZ1wiOlwiZGl2XCIsXCJ0ZXh0XCI6XCJ0ZXh0XCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdlN0cmluZ31dfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSByb290U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluS4gOS4quW4piBldmVudHMg55qEIGRpdiDnmoTlhYPntKAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIoJ2EnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXZTdHJpbmcgPSBge1wiaWRcIjoke2Rpdi5pZH0sXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W1wiYVwiXSxcImNoaWxkcmVuXCI6W119YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFN0cmluZyA9IGB7XCJpZFwiOiR7ZWxlbS5pZH0sXCJ0YWdcIjpcImluc3BlY3Rvci1yb290XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6WyR7ZGl2U3RyaW5nfV19YDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBzZXJpYWxpemUoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHJvb3RTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5bqP5YiX5YyW6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5bqP5YiX5YyW5LiA5Liq5bimIGF0dHJzL3RleHQvZXZlbnRzIOeahCBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi50ZXh0ID0gJ3RleHQnO1xuICAgICAgICAgICAgICAgICAgICBkaXYuc2V0QXR0cmlidXRlKCdhJywgJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFkZEV2ZW50TGlzdGVuZXIoJ2EnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXZTdHJpbmcgPSBge1wiaWRcIjoke2Rpdi5pZH0sXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwidGV4dFwiLFwiYXR0cnNcIjp7XCJhXCI6XCJhXCJ9LFwiZXZlbnRzXCI6W1wiYVwiXSxcImNoaWxkcmVuXCI6W119YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFN0cmluZyA9IGB7XCJpZFwiOiR7ZWxlbS5pZH0sXCJ0YWdcIjpcImluc3BlY3Rvci1yb290XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6WyR7ZGl2U3RyaW5nfV19YDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBzZXJpYWxpemUoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHJvb3RTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5bqP5YiX5YyW6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5bqP5YiX5YyW5aSa5LiqIGRpdiDnmoTlhYPntKAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnaW5zcGVjdG9yLXJvb3QnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGRpdjEpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGRpdjIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxU3RyaW5nID0gYHtcImlkXCI6JHtkaXYxLmlkfSxcInRhZ1wiOlwiZGl2XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6W119YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MlN0cmluZyA9IGB7XCJpZFwiOiR7ZGl2Mi5pZH0sXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdjFTdHJpbmd9LCR7ZGl2MlN0cmluZ31dfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSByb290U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluWkmuWxgiBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYxKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2MS5hcHBlbmRDaGlsZChkaXYyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MlN0cmluZyA9IGB7XCJpZFwiOiR7ZGl2Mi5pZH0sXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjFTdHJpbmcgPSBge1wiaWRcIjoke2RpdjEuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXYyU3RyaW5nfV19YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFN0cmluZyA9IGB7XCJpZFwiOiR7ZWxlbS5pZH0sXCJ0YWdcIjpcImluc3BlY3Rvci1yb290XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6WyR7ZGl2MVN0cmluZ31dfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSByb290U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIHRpdGxlOiAnRGVzZXJpYWxpemUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+WPjeW6j+WIl+WMluWkmuWxgiBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjJTdHJpbmcgPSBge1wiaWRcIjozLFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcInRleHRcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6W119YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MVN0cmluZyA9IGB7XCJpZFwiOjIsXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwidGV4dFwiLFwiYXR0cnNcIjp7XCJhXCI6XCJhXCJ9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdjJTdHJpbmd9XX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290U3RyaW5nID0gYHtcImlkXCI6MSxcInRhZ1wiOlwiaW5zcGVjdG9yLXJvb3RcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXYxU3RyaW5nfV19YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRlc2VyaWFsaXplKHJvb3RTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnRhZyAhPT0gJ2luc3BlY3Rvci1yb290JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnICE9PSAnZGl2JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS50ZXh0ICE9PSAndGV4dCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uYXR0cnNbJ2EnXSAhPT0gJ2EnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlblswXS50ZXh0ICE9PSAndGV4dCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WPjeW6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbl07XG4iXX0=