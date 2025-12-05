declare class NativeWindow {
    setSize(w: number, h: number)
    setPos(x: number, y: number)
}

declare class SceneWinodw {
    resize(rect: any);
}

declare class NativeEngineManager {
    constructor();
    /**
     * 初始化
     */
    init(): void;
    createWindow(): NativeWindow;
    setMinWindowSize(w: number, h: number): void;
}
