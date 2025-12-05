let Nativize: any;
class SceneWindow {
    JSBWindow: any
    windowID: any;
    constructor(window: any, id: number) {
        this.JSBWindow = window;
        this.windowID = id;
    }

    resize(rect: any) {
        if (process.platform === 'darwin') {
            if (!Nativize) {
                Nativize = require('./native-manager').Nativize;
            }
            Nativize.request({
                type: 'resize',
                data: {
                    x: rect.x,
                    y: rect.y,
                    w: rect.w,
                    h: rect.h,
                    windowID: this.windowID,
                },
            }).then((response: any) => {
                this.windowID = response.data.windowID;
                console.log('updateContext', this.windowID, response.data.windowID);
                this.JSBWindow.updateContext(this.windowID);
            });
        } else {
            if (rect.x && rect.y) {
                this.JSBWindow.setPos(rect.x, rect.y);
            }
            if (rect.w && rect.h) {
                this.JSBWindow.setSize(rect.w, rect.h);
            }
        }
    }
}
module.exports = SceneWindow;
