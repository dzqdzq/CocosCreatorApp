'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
require("../extension");
const element_1 = require("../extension/element");
const parser_1 = require("../extension/adapter/xml/parser");
exports.list = [
    {
        title: 'InspectorComponent',
        list: [
            {
                message: '基础解析',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // if (
                    //     $root.children[0].tagName !== 'STYLE' ||
                    //     $root.children[1].tagName !== 'DIV' ||
                    //     $root.children[1].getAttribute('class') !== 'content' ||
                    //     $root.children[1].children[0].tagName !== 'INSPECTOR-ROOT'
                    // ) {
                    //     throw new Error('children 解析错误');
                    // }
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    if (elem.children[0].tagName !== 'INSPECTOR-ROOT') {
                        throw new Error('children 解析错误');
                    }
                    const $inspector = elem.children[0];
                    // 通用测试
                    if ($inspector.children.length !== 1 ||
                        $inspector.children[0].tagName !== 'DIV') {
                        throw new Error('内容解析错误');
                    }
                },
            },
            {
                message: '解析多层结构的数据',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div>
                            <span>1</span>
                        </div>
                        <div>
                            <span test="a"></span>
                        </div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    const $inspector = elem.children[0];
                    if ($inspector.children.length !== 2 ||
                        $inspector.children[0].tagName !== 'DIV' ||
                        $inspector.children[0].children.length !== 1 ||
                        $inspector.children[0].children[0].tagName !== 'SPAN' ||
                        $inspector.children[0].children[0].innerHTML !== '1' ||
                        $inspector.children[1].tagName !== 'DIV' ||
                        $inspector.children[1].children.length !== 1 ||
                        $inspector.children[1].children[0].getAttribute('test') !== 'a') {
                        throw new Error('内容解析错误');
                    }
                },
            },
            {
                message: 'update 新增节点的数据',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div>
                            <span>1</span>
                        </div>
                        <div>
                            <span test="a"></span>
                        </div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.update();
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    const $inspector = elem.children[0];
                    if ($inspector.children.length !== 2 ||
                        $inspector.children[0].tagName !== 'DIV' ||
                        $inspector.children[0].children.length !== 1 ||
                        $inspector.children[0].children[0].tagName !== 'SPAN' ||
                        $inspector.children[0].children[0].innerHTML !== '1' ||
                        $inspector.children[1].tagName !== 'DIV' ||
                        $inspector.children[1].children.length !== 1 ||
                        $inspector.children[1].children[0].getAttribute('test') !== 'a') {
                        throw new Error('内容解析错误');
                    }
                },
            },
            {
                message: 'update 删除节点的数据',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div>
                            <span>1</span>
                        </div>
                        <div>
                            <span test="a"></span>
                        </div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.update();
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    const $inspector = elem.children[0];
                    if ($inspector.children.length !== 1 ||
                        $inspector.children[0].tagName !== 'DIV') {
                        throw new Error('内容解析错误');
                    }
                },
            },
            {
                message: '绑定事件',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        vElem.children[0].addEventListener('change', function () { });
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    let result = false;
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.emitEvent = function (vElem, name) {
                        result = true;
                    };
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    const $inspector = elem.children[0];
                    const customEvent = new CustomEvent('change');
                    $inspector.children[0].dispatchEvent(customEvent);
                    if (!result) {
                        throw new Error('事件未触发');
                    }
                },
            },
            {
                message: 'update 去除绑定事件',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        vElem.children[0].addEventListener('change', function () { });
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.update();
                    let result = false;
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.emitEvent = function (vElem, name) {
                        result = true;
                    };
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    const $inspector = elem.children[0];
                    const customEvent = new CustomEvent('change');
                    $inspector.children[0].dispatchEvent(customEvent);
                    if (result) {
                        throw new Error('事件不应该被触发');
                    }
                },
            },
            {
                message: 'update 新增绑定事件',
                async handle() {
                    const elem = document.createElement('inspector-component');
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        return element_1.serialize(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = parser_1.decode(`
                        <div></div>
                        `);
                        vElem.children[0].addEventListener('change', function () { });
                        return element_1.serialize(vElem);
                    };
                    elem.update();
                    let result = false;
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.emitEvent = function (vElem, name) {
                        result = true;
                    };
                    // 等待一个宏任务，因为 inspector-component 内有一些异步处理
                    await new Promise((resolve) => {
                        setTimeout(resolve);
                    });
                    // // 有 shadowRoot
                    // const $root = elem.shadowRoot!;
                    // const $inspector = $root.children[1].children[0];
                    // 没有 shadowRoot
                    const $inspector = elem.children[0];
                    const customEvent = new CustomEvent('change');
                    $inspector.children[0].dispatchEvent(customEvent);
                    if (!result) {
                        throw new Error('事件应该被触发');
                    }
                },
            },
        ],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmluc3BlY3Rvci5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rlc3QvZXh0ZW5zaW9uLmluc3BlY3Rvci5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBVWIsd0JBQXNCO0FBRXRCLGtEQUFpRDtBQUNqRCw0REFBeUQ7QUFFNUMsUUFBQSxJQUFJLEdBQWU7SUFDNUI7UUFDSSxLQUFLLEVBQUUsb0JBQW9CO1FBQzNCLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxNQUFNO2dCQUNmLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQXVCLENBQUM7b0JBRWpGLDJCQUEyQjtvQkFDM0IsSUFBSSxDQUFDLGFBQWEsR0FBRzt3QkFDakIsTUFBTSxLQUFLLEdBQUcsZUFBTSxDQUFDOzt5QkFFcEIsQ0FBQyxDQUFDO3dCQUNILE9BQU8sbUJBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDNUIsQ0FBQyxDQUFDO29CQUVGLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFbkIsMENBQTBDO29CQUMxQyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7d0JBQzFCLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDeEIsQ0FBQyxDQUFDLENBQUM7b0JBRUgsa0JBQWtCO29CQUNsQixrQ0FBa0M7b0JBQ2xDLE9BQU87b0JBQ1AsK0NBQStDO29CQUMvQyw2Q0FBNkM7b0JBQzdDLCtEQUErRDtvQkFDL0QsaUVBQWlFO29CQUNqRSxNQUFNO29CQUNOLHdDQUF3QztvQkFDeEMsSUFBSTtvQkFDSixvREFBb0Q7b0JBRXBELGdCQUFnQjtvQkFDaEIsSUFDSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxnQkFB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RSxDQUFDO29CQUVkLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztvQkFDbkIsMkJBQTJCO29CQUMzQixJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVMsS0FBcUIsRUFBRSxJQUFZO3dCQUN6RCxNQUFNLEdBQUcsSUFBSSxDQUFDO29CQUNsQixDQUFDLENBQUM7b0JBRUYsMENBQTBDO29CQUMxQyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7d0JBQzFCLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDeEIsQ0FBQyxDQUFDLENBQUM7b0JBRUgsa0JBQWtCO29CQUNsQixrQ0FBa0M7b0JBQ2xDLG9EQUFvRDtvQkFFcEQsZ0JBQWdCO29CQUNoQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBRWxELElBQ0ksQ0FBQyxNQUFNLEVBQ1Q7d0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDOUI7Z0JBQ0wsQ0FBQzthQUNKO1NBQ0o7S0FDSjtDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmludGVyZmFjZSBUZXN0SXRlbSB7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBsaXN0OiB7XG4gICAgICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICAgICAgaGFuZGxlOiAoKSA9PiBQcm9taXNlPGFueT47XG4gICAgfVtdO1xufVxuXG5pbXBvcnQgJy4uL2V4dGVuc2lvbic7XG5pbXBvcnQgdHlwZSB7IEluc3BlY3RvckNvbXBvbmVudCB9IGZyb20gJy4uL2V4dGVuc2lvbic7XG5pbXBvcnQgeyBzZXJpYWxpemUgfSBmcm9tICcuLi9leHRlbnNpb24vZWxlbWVudCc7XG5pbXBvcnQgeyBkZWNvZGUgfSBmcm9tICcuLi9leHRlbnNpb24vYWRhcHRlci94bWwvcGFyc2VyJztcblxuZXhwb3J0IGNvbnN0IGxpc3Q6IFRlc3RJdGVtW10gPSBbXG4gICAge1xuICAgICAgICB0aXRsZTogJ0luc3BlY3RvckNvbXBvbmVudCcsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5Z+656GA6Kej5p6QJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAkcm9vdC5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnU1RZTEUnIHx8XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAkcm9vdC5jaGlsZHJlblsxXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgJHJvb3QuY2hpbGRyZW5bMV0uZ2V0QXR0cmlidXRlKCdjbGFzcycpICE9PSAnY29udGVudCcgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdJTlNQRUNUT1ItUk9PVCdcbiAgICAgICAgICAgICAgICAgICAgLy8gKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdJTlNQRUNUT1ItUk9PVCdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOmAmueUqOa1i+ivlVxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnRElWJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YaF5a656Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6Kej5p6Q5aSa5bGC57uT5p6E55qE5pWw5o2uJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4xPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHRlc3Q9XCJhXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXVpZHMgPSBbJzEnXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDkuKrlro/ku7vliqHvvIzlm6DkuLogaW5zcGVjdG9yLWNvbXBvbmVudCDlhoXmnInkuIDkupvlvILmraXlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIOaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRyb290ID0gZWxlbS5zaGFkb3dSb290ITtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW4ubGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdESVYnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnU1BBTicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0uaW5uZXJIVE1MICE9PSAnMScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMV0udGFnTmFtZSAhPT0gJ0RJVicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMV0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdLmdldEF0dHJpYnV0ZSgndGVzdCcpICE9PSAnYSdcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WGheWuueino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3VwZGF0ZSDmlrDlop7oioLngrnnmoTmlbDmja4nLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4xPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHRlc3Q9XCJhXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkaW5zcGVjdG9yID0gJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ0RJVicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdTUEFOJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5jaGlsZHJlblswXS5pbm5lckhUTUwgIT09ICcxJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd0ZXN0JykgIT09ICdhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YaF5a656Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAndXBkYXRlIOWIoOmZpOiKgueCueeahOaVsOaNricsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5zcGVjdG9yLWNvbXBvbmVudCcpIGFzIEluc3BlY3RvckNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+MTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiB0ZXN0PVwiYVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5zcGVjdG9yID0gZWxlbS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnRElWJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YaF5a656Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn57uR5a6a5LqL5Lu2JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdkVsZW0uY2hpbGRyZW5bMF0hLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKCkge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXVpZHMgPSBbJzEnXTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZW1pdEV2ZW50ID0gZnVuY3Rpb24odkVsZW06IFZpcnR1YWxFbGVtZW50LCBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5zcGVjdG9yID0gZWxlbS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21FdmVudCA9IG5ldyBDdXN0b21FdmVudCgnY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgIXJlc3VsdFxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25pyq6Kem5Y+RJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAndXBkYXRlIOWOu+mZpOe7keWumuS6i+S7ticsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5zcGVjdG9yLWNvbXBvbmVudCcpIGFzIEluc3BlY3RvckNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZFbGVtLmNoaWxkcmVuWzBdIS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZW1pdEV2ZW50ID0gZnVuY3Rpb24odkVsZW06IFZpcnR1YWxFbGVtZW50LCBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5zcGVjdG9yID0gZWxlbS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21FdmVudCA9IG5ldyBDdXN0b21FdmVudCgnY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7bkuI3lupTor6Xooqvop6blj5EnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd1cGRhdGUg5paw5aKe57uR5a6a5LqL5Lu2JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXVpZHMgPSBbJzEnXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZFbGVtLmNoaWxkcmVuWzBdIS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5lbWl0RXZlbnQgPSBmdW5jdGlvbih2RWxlbTogVmlydHVhbEVsZW1lbnQsIG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDkuKrlro/ku7vliqHvvIzlm6DkuLogaW5zcGVjdG9yLWNvbXBvbmVudCDlhoXmnInkuIDkupvlvILmraXlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIOaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRyb290ID0gZWxlbS5zaGFkb3dSb290ITtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7blupTor6Xooqvop6blj5EnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG5dOyJdfQ==