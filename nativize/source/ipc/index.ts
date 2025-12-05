// import { sendToChannel } from '@base/electron-base-ipc';
// use id to manager callback,id is odd number;
const id = 1;

class NativizeIpc {

    constructor() {
 
    }
    
    // 只需要发送数据使用send
    send(isPreview = false, method: string, ...args: any[]) {
        Editor.Message.send('scene', 'native-scene', isPreview, method, ...args);
    }

    // 需求回调数据时使用request
    async request(isPreview = false, method: string, ...args: any[]): Promise<any> {
        return await Editor.Message.request('scene', 'native-scene', isPreview, method, ...args);
    }

    on(type: string, callback: Function) {

    }

}

export default new NativizeIpc();

