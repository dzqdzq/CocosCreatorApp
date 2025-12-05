import { Base } from '../base';
export declare class Button extends Base {
    /**
     * 使用第三方提供的样式显示当前的元素
     * @param {file} src
     */
    static importStyle(src: string): void;
    get pressed(): boolean;
    set pressed(bool: boolean);
    /**
     * 构造函数
     */
    constructor();
    /**
     * 插入文档流
     */
    connectedCallback(): void;
    /**
     * 移除文档流
     */
    disconnectedCallback(): void;
    /**
     * 监听的 attribute 修改
     */
    static get observedAttributes(): string[];
    /**
     * 鼠标点击事件
     * 按下鼠标的时候，向 document 绑定 up 事件，并设置 pressed 属性
     */
    _onMouseDown(): void;
    /**
     * 键盘点击事件
     * 按下回车和空格应该都需要显示点击状态
     * @param {Event} event
     */
    _onKeyDown(event: any): void;
    /**
     * 键盘点击后抬起的事件
     * 按下回车和空格抬起后都需要取消 press 状态
     * @param {Event} event
     */
    _onKeyUp(event: any): void;
}
