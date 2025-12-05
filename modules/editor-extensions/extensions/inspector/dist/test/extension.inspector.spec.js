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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmluc3BlY3Rvci5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rlc3QvZXh0ZW5zaW9uLmluc3BlY3Rvci5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBVWIsd0JBQXNCO0FBRXRCLGtEQUFpRDtBQUNqRCw0REFBeUQ7QUFFNUMsUUFBQSxJQUFJLEdBQWU7SUFDNUI7UUFDSSxLQUFLLEVBQUUsb0JBQW9CO1FBQzNCLElBQUksRUFBRTtZQUNGO2dCQUNJLE9BQU8sRUFBRSxNQUFNO2dCQUNmLEtBQUssQ0FBQyxNQUFNO29CQUNSLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQXVCLENBQUM7b0JBRWpGLDJCQUEyQjtvQkFDM0IsSUFBSSxDQUFDLGFBQWEsR0FBRzt3QkFDakIsTUFBTSxLQUFLLEdBQUcsSUFBQSxlQUFNLEVBQUM7O3lCQUVwQixDQUFDLENBQUM7d0JBQ0gsT0FBTyxJQUFBLG1CQUFTLEVBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVCLENBQUMsQ0FBQztvQkFFRixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRW5CLDBDQUEwQztvQkFDMUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUMxQixVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3hCLENBQUMsQ0FBQyxDQUFDO29CQUVILGtCQUFrQjtvQkFDbEIsa0NBQWtDO29CQUNsQyxPQUFPO29CQUNQLCtDQUErQztvQkFDL0MsNkNBQTZDO29CQUM3QywrREFBK0Q7b0JBQy9ELGlFQUFpRTtvQkFDakUsTUFBTTtvQkFDTix3Q0FBd0M7b0JBQ3hDLElBQUk7b0JBQ0osb0RBQW9EO29CQUVwRCxnQkFBZ0I7b0JBQ2hCLElBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFP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LEVBQUUsY0FBWSxDQUFDLENBQUMsQ0FBQzt3QkFDN0QsT0FBTyxJQUFBLG1CQUFTLEVBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVCLENBQUMsQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBRWQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO29CQUNuQiwyQkFBMkI7b0JBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBUyxLQUFxQixFQUFFLElBQVk7d0JBQ3pELE1BQU0sR0FBRyxJQUFJLENBQUM7b0JBQ2xCLENBQUMsQ0FBQztvQkFFRiwwQ0FBMEM7b0JBQzFDLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDMUIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN4QixDQUFDLENBQUMsQ0FBQztvQkFFSCxrQkFBa0I7b0JBQ2xCLGtDQUFrQztvQkFDbEMsb0RBQW9EO29CQUVwRCxnQkFBZ0I7b0JBQ2hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRXBDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM5QyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFFbEQsSUFDSSxDQUFDLE1BQU0sRUFDVDt3QkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUM5QjtnQkFDTCxDQUFDO2FBQ0o7U0FDSjtLQUNKO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW50ZXJmYWNlIFRlc3RJdGVtIHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGxpc3Q6IHtcbiAgICAgICAgbWVzc2FnZTogc3RyaW5nO1xuICAgICAgICBoYW5kbGU6ICgpID0+IFByb21pc2U8YW55PjtcbiAgICB9W107XG59XG5cbmltcG9ydCAnLi4vZXh0ZW5zaW9uJztcbmltcG9ydCB0eXBlIHsgSW5zcGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vZXh0ZW5zaW9uJztcbmltcG9ydCB7IHNlcmlhbGl6ZSB9IGZyb20gJy4uL2V4dGVuc2lvbi9lbGVtZW50JztcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gJy4uL2V4dGVuc2lvbi9hZGFwdGVyL3htbC9wYXJzZXInO1xuXG5leHBvcnQgY29uc3QgbGlzdDogVGVzdEl0ZW1bXSA9IFtcbiAgICB7XG4gICAgICAgIHRpdGxlOiAnSW5zcGVjdG9yQ29tcG9uZW50JyxcbiAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfln7rnoYDop6PmnpAnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICRyb290LmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdTVFlMRScgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICRyb290LmNoaWxkcmVuWzFdLnRhZ05hbWUgIT09ICdESVYnIHx8XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAkcm9vdC5jaGlsZHJlblsxXS5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgIT09ICdjb250ZW50JyB8fFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ0lOU1BFQ1RPUi1ST09UJ1xuICAgICAgICAgICAgICAgICAgICAvLyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ0lOU1BFQ1RPUi1ST09UJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2hpbGRyZW4g6Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g6YCa55So5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdESVYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhoXlrrnop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfop6PmnpDlpJrlsYLnu5PmnoTnmoTmlbDmja4nLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPjE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gdGVzdD1cImFcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkaW5zcGVjdG9yID0gJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlbi5sZW5ndGggIT09IDIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ0RJVicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdTUEFOJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5jaGlsZHJlblswXS5pbm5lckhUTUwgIT09ICcxJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF0uZ2V0QXR0cmlidXRlKCd0ZXN0JykgIT09ICdhJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5YaF5a656Kej5p6Q6ZSZ6K+vJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAndXBkYXRlIOaWsOWinuiKgueCueeahOaVsOaNricsXG4gICAgICAgICAgICAgICAgYXN5bmMgaGFuZGxlKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5zcGVjdG9yLWNvbXBvbmVudCcpIGFzIEluc3BlY3RvckNvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPjE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gdGVzdD1cImFcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5Liq5a6P5Lu75Yqh77yM5Zug5Li6IGluc3BlY3Rvci1jb21wb25lbnQg5YaF5pyJ5LiA5Lqb5byC5q2l5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAvLyDmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkcm9vdCA9IGVsZW0uc2hhZG93Um9vdCE7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRpbnNwZWN0b3IgPSAkcm9vdC5jaGlsZHJlblsxXS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnIkgc2hhZG93Um9vdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5zcGVjdG9yID0gZWxlbS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuLmxlbmd0aCAhPT0gMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS50YWdOYW1lICE9PSAnRElWJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF0udGFnTmFtZSAhPT0gJ1NQQU4nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdLmlubmVySFRNTCAhPT0gJzEnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzFdLnRhZ05hbWUgIT09ICdESVYnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzFdLmNoaWxkcmVuLmxlbmd0aCAhPT0gMSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblsxXS5jaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ3Rlc3QnKSAhPT0gJ2EnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhoXlrrnop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd1cGRhdGUg5Yig6Zmk6IqC54K555qE5pWw5o2uJyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4xPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHRlc3Q9XCJhXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnV1aWRzID0gWycxJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDkuKrlro/ku7vliqHvvIzlm6DkuLogaW5zcGVjdG9yLWNvbXBvbmVudCDlhoXmnInkuIDkupvlvILmraXlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIOaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRyb290ID0gZWxlbS5zaGFkb3dSb290ITtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnNwZWN0b3IuY2hpbGRyZW4ubGVuZ3RoICE9PSAxIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLnRhZ05hbWUgIT09ICdESVYnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflhoXlrrnop6PmnpDplJnor68nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfnu5Hlrprkuovku7YnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2RWxlbS5jaGlsZHJlblswXSEuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKSB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5lbWl0RXZlbnQgPSBmdW5jdGlvbih2RWxlbTogVmlydHVhbEVsZW1lbnQsIG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDkuKrlro/ku7vliqHvvIzlm6DkuLogaW5zcGVjdG9yLWNvbXBvbmVudCDlhoXmnInkuIDkupvlvILmraXlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIOaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRyb290ID0gZWxlbS5zaGFkb3dSb290ITtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAhcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuovku7bmnKrop6blj5EnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICd1cGRhdGUg5Y676Zmk57uR5a6a5LqL5Lu2JyxcbiAgICAgICAgICAgICAgICBhc3luYyBoYW5kbGUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnNwZWN0b3ItY29tcG9uZW50JykgYXMgSW5zcGVjdG9yQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdkVsZW0uY2hpbGRyZW5bMF0hLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKCkge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXVpZHMgPSBbJzEnXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnF1ZXJ5VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZFbGVtID0gZGVjb2RlKGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemUodkVsZW0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5lbWl0RXZlbnQgPSBmdW5jdGlvbih2RWxlbTogVmlydHVhbEVsZW1lbnQsIG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDkuKrlro/ku7vliqHvvIzlm6DkuLogaW5zcGVjdG9yLWNvbXBvbmVudCDlhoXmnInkuIDkupvlvILmraXlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIOaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0ICRyb290ID0gZWxlbS5zaGFkb3dSb290ITtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJGluc3BlY3RvciA9ICRyb290LmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeaciSBzaGFkb3dSb290XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRpbnNwZWN0b3IgPSBlbGVtLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgJGluc3BlY3Rvci5jaGlsZHJlblswXS5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuS4jeW6lOivpeiiq+inpuWPkScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ3VwZGF0ZSDmlrDlop7nu5Hlrprkuovku7YnLFxuICAgICAgICAgICAgICAgIGFzeW5jIGhhbmRsZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2luc3BlY3Rvci1jb21wb25lbnQnKSBhcyBJbnNwZWN0b3JDb21wb25lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDopobnm5bmlrnms5XvvIzliqvmjIHmlbDmja7nlKjkuo7mtYvor5VcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5xdWVyeVRlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2RWxlbSA9IGRlY29kZShgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKHZFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51dWlkcyA9IFsnMSddO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUg6KaG55uW5pa55rOV77yM5Yqr5oyB5pWw5o2u55So5LqO5rWL6K+VXG4gICAgICAgICAgICAgICAgICAgIGVsZW0ucXVlcnlUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdkVsZW0gPSBkZWNvZGUoYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdkVsZW0uY2hpbGRyZW5bMF0hLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKCkge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZSh2RWxlbSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGVsZW0udXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIOimhuebluaWueazle+8jOWKq+aMgeaVsOaNrueUqOS6jua1i+ivlVxuICAgICAgICAgICAgICAgICAgICBlbGVtLmVtaXRFdmVudCA9IGZ1bmN0aW9uKHZFbGVtOiBWaXJ0dWFsRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOetieW+heS4gOS4quWuj+S7u+WKoe+8jOWboOS4uiBpbnNwZWN0b3ItY29tcG9uZW50IOWGheacieS4gOS6m+W8guatpeWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXNvbHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8g5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc3QgJHJvb3QgPSBlbGVtLnNoYWRvd1Jvb3QhO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCAkaW5zcGVjdG9yID0gJHJvb3QuY2hpbGRyZW5bMV0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJIHNoYWRvd1Jvb3RcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGluc3BlY3RvciA9IGVsZW0uY2hpbGRyZW5bMF07XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICAkaW5zcGVjdG9yLmNoaWxkcmVuWzBdLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICFyZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+S6i+S7tuW6lOivpeiiq+inpuWPkScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbl07Il19