import type { NativeWindowManager } from './native-manager';
const isWin32 = process.platform === 'win32';
class SceneWindow {
    private _embedWindow: EmbedWindow;
    private _handler: number;
    private _hide = false;
    public name = '';
    public isPreview = false;// 预览进程
    static Nativize: NativeWindowManager | null = null;
    constructor(window: any, id: number, name: string) {
        this._embedWindow = window;
        this._handler = id;
        this.name = name;
    }

    async hide() {
        this._embedWindow.setVisible(false);
        this._hide = true;
    }

    async restore(rect: Partial<IRectLike>) {
        this._hide = false;
        this._embedWindow.setVisible(true);
        await this.resize(rect);
    }

    // redraw in Windows
    async redraw() {
        SceneWindow.Nativize?.request(this.isPreview, 'redraw');
    }

    async resize(rect: Partial<IRectLike>) {
        if (this._hide) {
            await this.restore(rect);
        }
        const handler = await SceneWindow.Nativize?.request(this.isPreview, 'resize', rect.x, rect.y, rect.w, rect.h, this.name);
        if (process.platform === 'darwin') {
            this._handler = handler;
            this._embedWindow.updateContext(this._handler);
        } else {
            // console.log('resize scene window', this.name, this.isPreview, rect);
            if (rect.x && rect.y) {
                this._embedWindow.setPos(rect.x, rect.y);
            }
            if (rect.w && rect.h) {
                this._embedWindow.setSize(rect.w, rect.h);
            }
        }
    }
}
export { SceneWindow };

