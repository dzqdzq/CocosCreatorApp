declare class NativeWindow {
    setSize(w: number, h: number)
    setPos(x: number, y: number)
}

declare class NativeEngineManager {
    constructor();
    init(): void;
    createWindow(): NativeWindow;
}

declare class EmbedWindow {
    setPos(x: number, y: number): void;
    setSize(w: number, h: number): void;
    updateContext(handler:number): void;// mac only
    setVisible(visible:boolean): void;
}
