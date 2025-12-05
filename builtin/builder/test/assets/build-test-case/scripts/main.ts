import { _decorator, Component, Node, CCObject } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Main")
export class Main extends Component {
    /* class member could be defined like this */
    // dummy = '';

    /* use `property` decorator if your want the member to be serializable */
    // @property
    // serializableDummy = 0;

    start() {
        // Your initialization goes here.
        // 微信平台加载子包
        if (window['wx']) {
            cc.loader.downloader.loadSubpackage('packages', (err: Error) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('load subPackages(packages) success!');
            });
        }

        // 测试加载资源
        cc.loader.loadRes('brdfLUT/spriteFrame', cc.SpriteFrame, (err: Error, assets) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('load spriteFrame success', assets);
        });
    }

    // update (deltaTime: number) {
    //     // Your update function goes here.
    // }
}
