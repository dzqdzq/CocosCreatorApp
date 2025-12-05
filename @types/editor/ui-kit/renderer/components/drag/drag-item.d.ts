import { Base } from '../base';
/**
 * 被拖拽的元素
 */
export declare class DragItem extends Base {
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    get draging(): boolean;
    set draging(bool: boolean);
    get type(): string;
    set type(type: string);
    get extends(): string[];
    set extends(array: string[]);
    get additional(): any;
    set additional(array: any);
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * 拖拽开始事件
     *
     * @param event
     */
    _onDragStart(event: any): void;
    /**
     * 拖拽结束事件
     */
    _onDragEnd(): void;
}
