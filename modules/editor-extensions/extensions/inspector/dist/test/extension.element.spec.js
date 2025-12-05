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
                    if (elem.attrs['a1'] !== '1' ||
                        elem.attrs['a2'] !== '') {
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
                    if (elem.attrs['b1'] !== '1' ||
                        elem.attrs['b2'] !== '0') {
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
                    if (elem.attrs['c1'] !== 'true' ||
                        elem.attrs['c2'] !== 'false') {
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
                    if (elem.attrs['d1'] !== '[object Object]' ||
                        elem.attrs['d2'] !== '' ||
                        elem.attrs['d3'] !== '1,2') {
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
                    if (elem.getAttribute('d1') !== '' ||
                        elem.getAttribute('d2') !== '1' ||
                        elem.getAttribute('d3') !== 'a') {
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
                    if (result[0] !== 1 ||
                        result[1] !== 2 ||
                        result[2] !== 3 ||
                        result.length !== 3) {
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
                    if ('a1' in elem.events ||
                        'a2' in elem.events) {
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
                    if (elem.children.length !== 1 ||
                        elem.children[0] !== child1) {
                        throw new Error('插入子节点失败');
                    }
                    if (child1.getParent() !== elem) {
                        throw new Error('子节点 parent 未更新');
                    }
                    const child2 = new element_1.VirtualElement('test');
                    elem.appendChild(child2);
                    if (elem.children.length !== 2 ||
                        elem.children[1] !== child2) {
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
                    if (elem.children.length !== 1 ||
                        elem.children[0] !== child1) {
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
                    if (elem.children.length !== 2 ||
                        elem.children[0] !== child2) {
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
                    if (elem.children.length !== 1 ||
                        elem.children[0] !== child1) {
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
                    elem2.attrs = { 'test': '2' };
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
                    if (elem1.events.length !== 1 ||
                        !result) {
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
                    son22.attrs = { 'test': '2' };
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
                    if (son12.events.length !== 1 ||
                        !result) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmVsZW1lbnQuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2V4dGVuc2lvbi5lbGVtZW50LnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFVYixrREFBOEU7QUFFakUsUUFBQSxJQUFJLEdBQWU7SUFDNUI7UUFDSSxLQUFLLEVBQUUsU0FBUztRQUNoQixJQUFJLEVBQUU7WUFDRixzQkFBc0I7WUFDdEI7Z0JBQ0ksT0FBTyxFQUFFLFVBQVU7Z0JBQ25CLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLE1BQU0sRUFBRTt3QkFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztxQkFDbkM7Z0JBQ0wsQ0FBQzthQUNKO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLG9CQUFvQjtnQkFDN0IsS0FBSyxDQUFDLE1BQU07b0JBQ1IsU0FBUztvQkFDVCxNQUFNLElBQUksR0FBRyxJQUFJLHdCQUFjLENBQUMsTUFBTSxDQUFRLENBQUM7b0JBQy9DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDNUIsSUFDSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUc7d0JBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUN6Qjt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO3FCQUNsQztnQkFDTCxDQUFDO2FBQ0o7WUFDRDtnQkFDSSxPQUFPLEVBQUUsbUJBQW1CO2dCQUM1QixLQUFLLENBQUMsTUFBTTtvQkFDUixT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O0lBQ0Q7UUFDSSxLQUFLLEVBQUUsYUFBYTtRQUNwQixJQUFJLEVBQUU7WUFDRjtnQkFDSSxPQUFPLEVBQUUsZ0JBQWdCO2dCQUN6QixLQUFLLENBQUMsTUFBTTtvQkFDUixNQUFNLFVBQVUsR0FBRyx5RUFBeUUsQ0FBQztvQkFDN0YsTUFBTSxVQUFVLEdBQUcsK0VBQStFLFVBQVUsSUFBSSxDQUFDO29CQUNqSCxNQUFNLFVBQVUsR0FBRywrRUFBK0UsVUFBVSxJQUFJLENBQUM7b0JBQ2pILE1BQU0sSUFBSSxHQUFHLElBQUEscUJBQVcsRUFBQyxVQUFVLENBQUMsQ0FBQztvQkFDckMsSUFDSSxJQUFJLENBQUMsR0FBRyxLQUFLLGdCQUFnQjt3QkFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssS0FBSzt3QkFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssTUFBTTt3QkFDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRzt3QkFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQzlDO3dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQzdCO2dCQUNMLENBQUM7YUFDSjtTQUNKO0tBQ0o7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbnRlcmZhY2UgVGVzdEl0ZW0ge1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgbGlzdDoge1xuICAgICAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgICAgIGhhbmRsZTogKCkgPT4gUHJvbWlzZTxhbnk+O1xuICAgIH1bXTtcbn1cblxuaW1wb3J0IHsgVmlydHVhbEVsZW1lbnQsIHNlcmlhbGl6ZSwgZGVzZXJpYWxpemUgfSBmcm9tICcuLi9leHRlbnNpb24vZWxlbWVudCc7XG5cbmV4cG9ydCBjb25zdCBsaXN0OiBUZXN0SXRlbVtdID0gW1xuICAgIHtcbiAgICAgICAgdGl0bGU6ICdFbGVtZW50JyxcbiAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAgLy8gLS0tLSBBdHRyaWJ1dGUgLS0tLVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdUYWcg5b+F6aG75aSn5YaZJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0udGFnICE9PSAndGVzdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Lyg5YWlIFRhZyDpnIDopoHovazlpKflhpknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdzZXRBdHRyaWJ1dGUg5Lyg5YWl5a2X56ym5LiyJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnYTEnLCAnMScpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnYTInLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYXR0cnNbJ2ExJ10gIT09ICcxJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRyc1snYTInXSAhPT0gJydcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S8oOWFpeWtl+espuS4suW/hemhu+S/neaMgeWOn+WAvCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3NldEF0dHJpYnV0ZSDkvKDlhaXmlbDlrZcnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdiMScsIDEpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnYjInLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRyc1snYjEnXSAhPT0gJzEnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmF0dHJzWydiMiddICE9PSAnMCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S8oOWFpeaVsOWtl+mcgOimgei9rOaIkOWtl+espuS4sicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3NldEF0dHJpYnV0ZSDkvKDlhaXluIPlsJTlgLwnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdjMScsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnYzInLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYXR0cnNbJ2MxJ10gIT09ICd0cnVlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRyc1snYzInXSAhPT0gJ2ZhbHNlJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Lyg5YWl5biD5bCU5YC86ZyA6KaB6L2s5oiQ5a2X56ym5LiyJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDEnLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdkMicsIFtdKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnc2V0QXR0cmlidXRlIOS8oOWFpeWvueixoScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QxJywge30pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZDInLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdkMycsIFsxLCAyXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYXR0cnNbJ2QxJ10gIT09ICdbb2JqZWN0IE9iamVjdF0nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmF0dHJzWydkMiddICE9PSAnJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRyc1snZDMnXSAhPT0gJzEsMidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S8oOWFpeWvueixoemcgOimgei9rOaIkOWtl+espuS4sicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3JlbW92ZUF0dHJpYnV0ZScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QxJywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAhKCdkMScgaW4gZWxlbS5hdHRycylcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+iuvue9rumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdkMScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAnZDEnIGluIGVsZW0uYXR0cnNcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WIoOmZpOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2hhc0F0dHJpYnV0ZScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QxJywge30pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmhhc0F0dHJpYnV0ZSgnZDEnKSA9PT0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+iuvue9ruWQjuajgOafpemUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdkMScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmhhc0F0dHJpYnV0ZSgnZDEnKSA9PT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5Yig6Zmk5ZCO5qOA5p+l6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZ2V0QXR0cmlidXRlJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdkMScsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QyJywgJzEnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2QzJywgJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5nZXRBdHRyaWJ1dGUoJ2QxJykgIT09ICcnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmdldEF0dHJpYnV0ZSgnZDInKSAhPT0gJzEnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmdldEF0dHJpYnV0ZSgnZDMnKSAhPT0gJ2EnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCforr7nva7lkI7mo4Dmn6XplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyAtLS0tIEV2ZW50TGlzdGVuZXIgLS0tLVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyL2Rpc3BhdGNoJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUoLi4uYXJnczogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZGlzcGF0Y2goJ2ExJywgMSwgMiwgMyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFswXSAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0WzFdICE9PSAyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbMl0gIT09IDMgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5sZW5ndGggIT09IDNcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuS8oOWPgumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2FkZEV2ZW50TGlzdGVuZXIg5ZCM5LiA5Ye95pWw5Y+q6IO957uR5a6a5LiA5qyhJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZGlzcGF0Y2goJ2ExJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCAhPT0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25aSa5qyh6Kem5Y+RJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYWRkRXZlbnRMaXN0ZW5lciDlkIzkuovku7blpJrkuKrlh73mlbAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUxKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUyKC4uLmFyZ3M6IG51bWJlcltdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignYTEnLCBoYW5kbGUyKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5kaXNwYXRjaCgnYTEnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSAyXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7bmsqHmnInop6blj5HlrozmlbQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeW4g+WwlOWAvCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAnYTEnIGluIGVsZW0uZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeaVsOWtlycsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAnYTEnIGluIGVsZW0uZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeWtl+espuS4sicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsICdhYScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAnYTEnIGluIGVsZW0uZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuI3og73nu5HlrprpnZ7lh73mlbAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhZGRFdmVudExpc3RlbmVyIOS8oOWFpeWvueixoScsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMicsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2ExJyBpbiBlbGVtLmV2ZW50cyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2EyJyBpbiBlbGVtLmV2ZW50c1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LiN6IO957uR5a6a6Z2e5Ye95pWwJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncmVtb3ZlRXZlbnRMaXN0ZW5lciDlrZjlnKjnmoTnm5HlkKzlh73mlbAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZSguLi5hcmdzOiBudW1iZXJbXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2ExJywgaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZGlzcGF0Y2goJ2ExJywgMSwgMiwgMyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuWPjeebkeWQrOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3JlbW92ZUV2ZW50TGlzdGVuZXIg5LiN5a2Y5Zyo55qE55uR5ZCs5Ye95pWwJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0OiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUoLi4uYXJnczogbnVtYmVyW10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignYTEnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5kaXNwYXRjaCgnYTEnLCAxLCAyLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmxlbmd0aCAhPT0gM1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25Y+N55uR5ZCs6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncmVtb3ZlQWxsRXZlbnRMaXN0ZW5lcicsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZSguLi5hcmdzOiBudW1iZXJbXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdhMScsIGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlQWxsRXZlbnRMaXN0ZW5lcignYTEnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5kaXNwYXRjaCgnYTEnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSAwXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7blj43nm5HlkKzplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyAtLS0tIGNoaWxkIC0tLS1cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYXBwZW5kQ2hpbGQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQxID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGNoaWxkMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdICE9PSBjaGlsZDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aPkuWFpeWtkOiKgueCueWksei0pScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkMS5nZXRQYXJlbnQoKSAhPT0gZWxlbVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K5IHBhcmVudCDmnKrmm7TmlrAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChjaGlsZDIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblsxXSAhPT0gY2hpbGQyXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmj5LlhaXnrKzkuozkuKrlrZDoioLngrnlpLHotKUnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZDIuZ2V0UGFyZW50KCkgIT09IGVsZW1cbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCuSBwYXJlbnQg5pyq5pu05pawJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnYXBwZW5kQ2hpbGQg5ZCM5LiA6IqC54K55Y+q6IO95o+S5YWl5LiA5qyhJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQxKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChjaGlsZDEpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXSAhPT0gY2hpbGQxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflrZDoioLngrnooqvph43lpI3mt7vliqAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdpbnNlcnRDaGlsZCDkuIDkuKrlrZDoioLngrknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5pbnNlcnRDaGlsZChjaGlsZDEsIDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuLmxlbmd0aCAhPT0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K55o+S5YWl5aSx6LSlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnaW5zZXJ0Q2hpbGQg5LiA5Liq5bey57uP5a2Y5Zyo55qE5a2Q6IqC54K5JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe7lei/h+ivreazleajgOafpVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChjaGlsZDEpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGNoaWxkMik7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uaW5zZXJ0Q2hpbGQoY2hpbGQyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0gIT09IGNoaWxkMlxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K55o+S5YWl5aSx6LSlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncmVtb3ZlQ2hpbGQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQxID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGNoaWxkMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlQ2hpbGQoY2hpbGQxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WtkOiKgueCueWIoOmZpOWksei0pScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkMS5nZXRQYXJlbnQoKSAhPT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K5IHBhcmVudCDmsqHmnInnp7vpmaQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdyZW1vdmVDaGlsZCDnp7vpmaTkuI3lrZjlnKjnmoToioLngrknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGQyID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGNoaWxkMSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlQ2hpbGQoY2hpbGQyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0gIT09IGNoaWxkMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K55Yig6Zmk6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQxLmdldFBhcmVudCgpICE9PSBlbGVtXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflrZDoioLngrkgcGFyZW50IOiiq+W8guW4uOenu+mZpCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3F1ZXJ5Q2hpbGRyZW5CeVRhZycsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnu5Xov4for63ms5Xmo4Dmn6VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgndGVzdCcpIGFzIGFueTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24xID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKHNvbjEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFuZHNvbjExID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFuZHNvbjEyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBzb24xLmFwcGVuZENoaWxkKGdyYW5kc29uMTEpO1xuICAgICAgICAgICAgICAgICAgICBzb24xLmFwcGVuZENoaWxkKGdyYW5kc29uMTIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoc29uMik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW5kc29uMjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW5kc29uMjIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2EnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHNvbjEuYXBwZW5kQ2hpbGQoZ3JhbmRzb24yMSk7XG4gICAgICAgICAgICAgICAgICAgIHNvbjEuYXBwZW5kQ2hpbGQoZ3JhbmRzb24yMik7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gZWxlbS5xdWVyeUNoaWxkcmVuQnlUYWcoJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1swXSAhPT0gc29uMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1sxXSAhPT0gc29uMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1syXSAhPT0gZ3JhbmRzb24xMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1szXSAhPT0gZ3JhbmRzb24xMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1s0XSAhPT0gZ3JhbmRzb24yMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1s1XSAhPT0gZ3JhbmRzb24yMlxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5a2Q6IqC54K56aG65bqP5byC5bi4Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncXVlcnlDaGlsZEJ5SUQnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29uMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnYScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChzb24xKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbmRzb24xMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnYScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbmRzb24xMiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnYScpIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgc29uMS5hcHBlbmRDaGlsZChncmFuZHNvbjExKTtcbiAgICAgICAgICAgICAgICAgICAgc29uMS5hcHBlbmRDaGlsZChncmFuZHNvbjEyKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24yID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKHNvbjIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFuZHNvbjIxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFuZHNvbjIyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdhJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBzb24xLmFwcGVuZENoaWxkKGdyYW5kc29uMjEpO1xuICAgICAgICAgICAgICAgICAgICBzb24xLmFwcGVuZENoaWxkKGdyYW5kc29uMjIpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZWxlbS5xdWVyeUNoaWxkQnlJRChncmFuZHNvbjEyLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSBncmFuZHNvbjEyXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflrZDoioLngrnlvILluLgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhcHBseSDln7rmnKzlsZ7mgKcnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gbmV3IFZpcnR1YWxFbGVtZW50KCd0ZXN0JykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtMS5hZGRFdmVudExpc3RlbmVyKCdhJywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0xLmFkZEV2ZW50TGlzdGVuZXIoJ2InLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ3Rlc3QnKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLnRleHQgPSAnMic7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmF0dHJzID0geyd0ZXN0JzogJzInfTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBiaW5kRXZlbnQoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmFkZEV2ZW50TGlzdGVuZXIoJ3Rlc3QnLCBiaW5kRXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gZWxlbTEuaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0xLmFwcGx5KGVsZW0yKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTEuZGlzcGF0Y2goJ3Rlc3QnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtMS5pZCAhPT0gaWRcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lEIOmcgOimgeS/neaMgeWOn+acieeahOWAvO+8jOS4jeiDveWPmOWMlicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0xLnRleHQgIT09ICcyJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGV4dCDmsqHmnInlupTnlKgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtMS5hdHRyc1sndGVzdCddICE9PSAnMidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2F0dHJzIOayoeacieW6lOeUqCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0xLmV2ZW50cy5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2V2ZW50cyDmsqHmnInlupTnlKgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhcHBseSDmlrDlop7oioLngrknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gbmV3IFZpcnR1YWxFbGVtZW50KCdlbGVtJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24xMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnc29uJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtMS5hcHBlbmRDaGlsZChzb24xMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2VsZW0nKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjIxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdzb24nKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjIyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdzb24nKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmFwcGVuZENoaWxkKHNvbjIxKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTIuYXBwZW5kQ2hpbGQoc29uMjIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNvbjIyLnRleHQgPSAnMic7XG4gICAgICAgICAgICAgICAgICAgIHNvbjIyLmF0dHJzID0geyd0ZXN0JzogJzInfTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBiaW5kRXZlbnQoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNvbjIyLmFkZEV2ZW50TGlzdGVuZXIoJ3Rlc3QnLCBiaW5kRXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgZWxlbTEuYXBwbHkoZWxlbTIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24xMiA9IGVsZW0xLmNoaWxkcmVuWzFdO1xuICAgICAgICAgICAgICAgICAgICBzb24xMi5kaXNwYXRjaCgndGVzdCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvbjEyLnRleHQgIT09ICcyJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGV4dCDmsqHmnInlupTnlKgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBzb24xMi5hdHRyc1sndGVzdCddICE9PSAnMidcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2F0dHJzIOayoeacieW6lOeUqCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvbjEyLmV2ZW50cy5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2V2ZW50cyDmsqHmnInlupTnlKgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdhcHBseSDliKDpmaToioLngrknLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57uV6L+H6K+t5rOV5qOA5p+lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0xID0gbmV3IFZpcnR1YWxFbGVtZW50KCdlbGVtJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb24xMSA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnc29uJykgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBlbGVtMS5hcHBlbmRDaGlsZChzb24xMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbTIgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2VsZW0nKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjIxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdzb24nKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbjIyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdzb24nKSBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmFwcGVuZENoaWxkKHNvbjIxKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbTIuYXBwZW5kQ2hpbGQoc29uMjIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGVsZW0yLmFwcGx5KGVsZW0xKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5rKh5pyJ5Yig6Zmk6IqC54K5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgdGl0bGU6ICdTZXJpYWxpemUnLFxuICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluS4gOS4quepuuWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290U3RyaW5nID0gYHtcImlkXCI6JHtlbGVtLmlkfSxcInRhZ1wiOlwiaW5zcGVjdG9yLXJvb3RcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbXX1gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNlcmlhbGl6ZShlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSByb290U3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfluo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfluo/liJfljJbkuIDkuKogZGl2IOeahOWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdlN0cmluZyA9IGB7XCJpZFwiOiR7ZGl2LmlkfSxcInRhZ1wiOlwiZGl2XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6W119YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFN0cmluZyA9IGB7XCJpZFwiOiR7ZWxlbS5pZH0sXCJ0YWdcIjpcImluc3BlY3Rvci1yb290XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6WyR7ZGl2U3RyaW5nfV19YDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBzZXJpYWxpemUoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCAhPT0gcm9vdFN0cmluZ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5bqP5YiX5YyW6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5bqP5YiX5YyW5LiA5Liq5bimIGF0dHJzIOeahCBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2EnLCAnYScpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdlN0cmluZyA9IGB7XCJpZFwiOiR7ZGl2LmlkfSxcInRhZ1wiOlwiZGl2XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e1wiYVwiOlwiYVwifSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbXX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290U3RyaW5nID0gYHtcImlkXCI6JHtlbGVtLmlkfSxcInRhZ1wiOlwiaW5zcGVjdG9yLXJvb3RcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXZTdHJpbmd9XX1gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNlcmlhbGl6ZShlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSByb290U3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfluo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfluo/liJfljJbkuIDkuKrluKYgdGV4dCDnmoQgZGl2IOeahOWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYudGV4dCA9ICd0ZXh0JztcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXZTdHJpbmcgPSBge1wiaWRcIjoke2Rpdi5pZH0sXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwidGV4dFwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbXX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290U3RyaW5nID0gYHtcImlkXCI6JHtlbGVtLmlkfSxcInRhZ1wiOlwiaW5zcGVjdG9yLXJvb3RcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXZTdHJpbmd9XX1gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNlcmlhbGl6ZShlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSByb290U3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfluo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfluo/liJfljJbkuIDkuKrluKYgZXZlbnRzIOeahCBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hZGRFdmVudExpc3RlbmVyKCdhJywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2U3RyaW5nID0gYHtcImlkXCI6JHtkaXYuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltcImFcIl0sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdlN0cmluZ31dfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgIT09IHJvb3RTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluS4gOS4quW4piBhdHRycy90ZXh0L2V2ZW50cyDnmoQgZGl2IOeahOWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBkaXYudGV4dCA9ICd0ZXh0JztcbiAgICAgICAgICAgICAgICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnYScsICdhJyk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hZGRFdmVudExpc3RlbmVyKCdhJywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2U3RyaW5nID0gYHtcImlkXCI6JHtkaXYuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcInRleHRcIixcImF0dHJzXCI6e1wiYVwiOlwiYVwifSxcImV2ZW50c1wiOltcImFcIl0sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdlN0cmluZ31dfWA7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gc2VyaWFsaXplKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgIT09IHJvb3RTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+W6j+WIl+WMlumUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+W6j+WIl+WMluWkmuS4qiBkaXYg55qE5YWD57SgJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2luc3BlY3Rvci1yb290Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjEgPSBuZXcgVmlydHVhbEVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYxKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChkaXYyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MVN0cmluZyA9IGB7XCJpZFwiOiR7ZGl2MS5pZH0sXCJ0YWdcIjpcImRpdlwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjJTdHJpbmcgPSBge1wiaWRcIjoke2RpdjIuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbXX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290U3RyaW5nID0gYHtcImlkXCI6JHtlbGVtLmlkfSxcInRhZ1wiOlwiaW5zcGVjdG9yLXJvb3RcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXYxU3RyaW5nfSwke2RpdjJTdHJpbmd9XX1gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNlcmlhbGl6ZShlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSByb290U3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfluo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfluo/liJfljJblpJrlsYIgZGl2IOeahOWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxID0gbmV3IFZpcnR1YWxFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGl2MiA9IG5ldyBWaXJ0dWFsRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kQ2hpbGQoZGl2MSk7XG4gICAgICAgICAgICAgICAgICAgIGRpdjEuYXBwZW5kQ2hpbGQoZGl2Mik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjJTdHJpbmcgPSBge1wiaWRcIjoke2RpdjIuaWR9LFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcIlwiLFwiYXR0cnNcIjp7fSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbXX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYxU3RyaW5nID0gYHtcImlkXCI6JHtkaXYxLmlkfSxcInRhZ1wiOlwiZGl2XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6WyR7ZGl2MlN0cmluZ31dfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTdHJpbmcgPSBge1wiaWRcIjoke2VsZW0uaWR9LFwidGFnXCI6XCJpbnNwZWN0b3Itcm9vdFwiLFwidGV4dFwiOlwiXCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOlske2RpdjFTdHJpbmd9XX1gO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHNlcmlhbGl6ZShlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICE9PSByb290U3RyaW5nXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfluo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICB0aXRsZTogJ0Rlc2VyaWFsaXplJyxcbiAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICflj43luo/liJfljJblpJrlsYIgZGl2IOeahOWFg+e0oCcsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXYyU3RyaW5nID0gYHtcImlkXCI6MyxcInRhZ1wiOlwiZGl2XCIsXCJ0ZXh0XCI6XCJ0ZXh0XCIsXCJhdHRyc1wiOnt9LFwiZXZlbnRzXCI6W10sXCJjaGlsZHJlblwiOltdfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpdjFTdHJpbmcgPSBge1wiaWRcIjoyLFwidGFnXCI6XCJkaXZcIixcInRleHRcIjpcInRleHRcIixcImF0dHJzXCI6e1wiYVwiOlwiYVwifSxcImV2ZW50c1wiOltdLFwiY2hpbGRyZW5cIjpbJHtkaXYyU3RyaW5nfV19YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFN0cmluZyA9IGB7XCJpZFwiOjEsXCJ0YWdcIjpcImluc3BlY3Rvci1yb290XCIsXCJ0ZXh0XCI6XCJcIixcImF0dHJzXCI6e30sXCJldmVudHNcIjpbXSxcImNoaWxkcmVuXCI6WyR7ZGl2MVN0cmluZ31dfWA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkZXNlcmlhbGl6ZShyb290U3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS50YWcgIT09ICdpbnNwZWN0b3Itcm9vdCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZyAhPT0gJ2RpdicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ3RleHQnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLmF0dHJzWydhJ10gIT09ICdhJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGV4dCAhPT0gJ3RleHQnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflj43luo/liJfljJbplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG5dOyJdfQ==