export interface WindowEventCallBack {
    resize: Function | null,
    move: Function | null,
    focus: Function | null,
    close: Function | null,
    blur: Function | null,
    connect: Function | null,
}

export interface PacketFormat {
    id?: number,
    type: String,
    data: object,
}
