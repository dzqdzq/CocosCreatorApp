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
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        return (0, element_1.serialize)(vElem);
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
                    if ($inspector.children.length !== 1 || $inspector.children[0].tagName !== 'DIV') {
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
                        const vElem = (0, parser_1.decode)(`
                        <div>
                            <span>1</span>
                        </div>
                        <div>
                            <span test="a"></span>
                        </div>
                        `);
                        return (0, element_1.serialize)(vElem);
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
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        return (0, element_1.serialize)(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = (0, parser_1.decode)(`
                        <div>
                            <span>1</span>
                        </div>
                        <div>
                            <span test="a"></span>
                        </div>
                        `);
                        return (0, element_1.serialize)(vElem);
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
                        const vElem = (0, parser_1.decode)(`
                        <div>
                            <span>1</span>
                        </div>
                        <div>
                            <span test="a"></span>
                        </div>
                        `);
                        return (0, element_1.serialize)(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        return (0, element_1.serialize)(vElem);
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
                    if ($inspector.children.length !== 1 || $inspector.children[0].tagName !== 'DIV') {
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
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        vElem.children[0].addEventListener('change', function () { });
                        return (0, element_1.serialize)(vElem);
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
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        vElem.children[0].addEventListener('change', function () { });
                        return (0, element_1.serialize)(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        return (0, element_1.serialize)(vElem);
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
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        return (0, element_1.serialize)(vElem);
                    };
                    elem.uuids = ['1'];
                    // @ts-ignore 覆盖方法，劫持数据用于测试
                    elem.queryTemplate = function () {
                        const vElem = (0, parser_1.decode)(`
                        <div></div>
                        `);
                        vElem.children[0].addEventListener('change', function () { });
                        return (0, element_1.serialize)(vElem);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmluc3BlY3Rvci5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rlc3QvZXh0ZW5zaW9uLmluc3BlY3Rvci5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBVWIsd0JBQXNCO0FBRXRCLGtEQUFpRDtBQUNqRCw0REFBeUQ7QUFFNUMsUUFBQSxJQUFJLEdBQWU7SUFDNUI7UUFDSSxLQUFLLEVBQUUsb0JBQW9CO1FBQzNCLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxNQUFNO2dCQUNmLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQXVCLENBQUM7b0JBRWpGLDJCQUEyQjtvQkFDM0IsSUFBSSxDQUFDLGFBQWEsR0FBRzt3QkFDakIsTUFBTSxLQUFLLEdBQUcsSUFBQSxlQUFNLEVBQUM7O3lCQUVwQixDQUFDLENBQUM7d0JBQ0gsT0FBTyxJQUFBLG1CQUFTLEVBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVCLENBQUMsQ0FBQztvQkFFRixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRW5CLDBDQUEwQztvQkFDMUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUMxQixVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3hCLENBQUMsQ0FBQyxDQUFDO29CQUVILGtCQUFrQjtvQkFDbEIsa0NBQWtDO29CQUNsQyxPQUFPO29CQUNQLCtDQUErQztvQkFDL0MsNkNBQTZDO29CQUM3QywrREFBK0Q7b0JBQy9ELGlFQUFpRTtvQkFDakUsTUFBTTtvQkFDTix3Q0FBd0M7b0JBQ3hDLElBQUk7b0JBQ0osb0RBQW9EO29CQUVwRCxnQkFBZ0I7b0JBQ2hCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFP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QUFDLENBQUM7d0JBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsY0FBWSxDQUFDLENBQUMsQ0FBQzt3QkFDN0QsT0FBTyxJQUFBLG1CQUFTLEVBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVCLENBQUMsQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBRWQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO29CQUNuQiwyQkFBMkI7b0JBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBUyxLQUFxQixFQUFFLElBQVk7d0JBQ3pELE1BQU0sR0FBRyxJQUFJLENBQUM7b0JBQ2xCLENBQUMsQ0FBQztvQkFFRiwwQ0FBMEM7b0JBQzFDLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDMUIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN4QixDQUFDLENBQUMsQ0FBQztvQkFFSCxrQkFBa0I7b0JBQ2xCLGtDQUFrQztvQkFDbEMsb0RBQW9EO29CQUVwRCxnQkFBZ0I7b0JBQ2hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXBDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM5QyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFFbEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0wsQ0FBQzthQUNKO1NBQ0o7S0FDSjtDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmludGVyZmFjZSBUZXN0SXRlbSB7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBsaXN0OiB7XG4gICAgICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICAgICAgaGFuZGxlOiAoKSA9PiBQcm9taXNlPGFueT47XG4gICAgfVtdO1xufVxuXG5pbXBvcnQgJy4uL2V4dGVuc2lvbic7XG5pbXBvcnQgdHlwZSB7IEluc3BlY3RvckNvbXBvbmVudCB9IGZyb20gJy4uL2V4dGVuc2lvbic7XG5pbXBvcnQgeyBzZXJpYWxpemUgfSBmcm9tICcuLi9leHRlbnNpb24vZWxlbWVudCc7XG5pbXBvcnQgeyBkZWNvZGUgfSBmcm9tICcuLi9leHRlbnNpb24vYWRhcHRlci94bWwvcGFyc2VyJztcblxuZXhwb3J0IGNvbnN0IGxpc3Q6IFRlc3RJdGVtW10gPSBbXG4gICAge1xuICAgICAgICB0aXRsZTogJ0luc3BlY3RvckNvbXBvbmVudCcsXG4gICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5Z+656GA6Kej5p6QJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAkcm9vdC5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnU1RZTEUnIHx8XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAkcm9vdC5jaGlsZHJlblsxXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgJHJvb3QuY2hpbGRyZW5bMV0uZ2V0QXR0cmlidXRlKCdjbGFzcycpICE9PSAnY29udGVudCcgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdJTlNQRUNUT1ItUk9PVCdcbiAgICAgICAgICAgICAgICAgICAgLy8gKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbS5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnSU5TUEVDVE9SLVJPT1QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIOino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOmAmueUqOa1i+ivlVxuICAgICAgICAgICAgICAgICAgICBpZiAoJGluc3BlY3Rvci5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgJGluc3BlY3Rvci5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnRElWJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhoXlrrnop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLnu5PmnoTnmoTmlbDmja4nLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPjE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gdGVzdD1cImFcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkaW5zcGVjdG9yID0gJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ0RJVicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdTUEFOJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5jaGlsZHJlblswXS5pbm5lckhUTUwgIT09ICcxJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd0ZXN0JykgIT09ICdhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YaF5a656Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAndXBkYXRlIOaWsOWinuiKgueCueeahOaVsOaNricsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5zcGVjdG9yLWNvbXBvbmVudCcpIGFzIEluc3BlY3RvckNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPjE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gdGVzdD1cImFcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5zcGVjdG9yID0gZWxlbS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ1NQQU4nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCAhPT0gJzEnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzFdLnRhZ05hbWUgIT09ICdESVYnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzFdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS5jaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ3Rlc3QnKSAhPT0gJ2EnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhoXlrrnop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd1cGRhdGUg5Yig6Zmk6IqC54K555qE5pWw5o2uJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4xPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHRlc3Q9XCJhXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDkuKrlro/ku7vliqHvvIzlm6DkuLogaW5zcGVjdG9yLWNvbXBvbmVudCDlhoXmnInkuIDkupvlvILmraXlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIOaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRyb290ID0gZWxlbS5zaGFkb3dSb290ITtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgkaW5zcGVjdG9yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fCAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdESVYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WGheWuueino+aekOmUmeivrycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+e7keWumuS6i+S7ticsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5zcGVjdG9yLWNvbXBvbmVudCcpIGFzIEluc3BlY3RvckNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZFbGVtLmNoaWxkcmVuWzBdIS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmVtaXRFdmVudCA9IGZ1bmN0aW9uKHZFbGVtOiBWaXJ0dWFsRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkaW5zcGVjdG9yID0gJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuacquinpuWPkScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3VwZGF0ZSDljrvpmaTnu5Hlrprkuovku7YnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2RWxlbS5jaGlsZHJlblswXSEuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmVtaXRFdmVudCA9IGZ1bmN0aW9uKHZFbGVtOiBWaXJ0dWFsRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkaW5zcGVjdG9yID0gJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25LiN5bqU6K+l6KKr6Kem5Y+RJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAndXBkYXRlIOaWsOWinue7keWumuS6i+S7ticsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5zcGVjdG9yLWNvbXBvbmVudCcpIGFzIEluc3BlY3RvckNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2RWxlbS5jaGlsZHJlblswXSEuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZW1pdEV2ZW50ID0gZnVuY3Rpb24odkVsZW06IFZpcnR1YWxFbGVtZW50LCBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5zcGVjdG9yID0gZWxlbS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21FdmVudCA9IG5ldyBDdXN0b21FdmVudCgnY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5LqL5Lu25bqU6K+l6KKr6Kem5Y+RJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuXTtcbiJdfQ==