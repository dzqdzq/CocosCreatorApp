'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
/**
 * 禁止在本脚本中导入其它自定义模块，
 * 因为这些模块很可能在打包后变成加密文件，在需要在编辑器初始化后才能成功加载。
 * 为确保统一，其它模块请统一放到 launch.js 中进行延迟加载。
 */
// 禁止自动禁用 3D
electron_1.app.disableDomainBlockingFor3DAPIs();
// 忽略 chrome 的 gpu 黑名单
electron_1.app.commandLine.appendSwitch('ignore-gpu-blacklist');
electron_1.app.commandLine.appendSwitch('force_high_performance_gpu');
// disable render process reuse,Fix process.nextTick and editor ANR.
// @ts-ignore
electron_1.app.allowRendererProcessReuse = false;
// hack for nativize window
// 加上后，会导致窗口上缩放比例不对
// app.commandLine.appendSwitch('force-device-scale-factor', '1');
// 启用 WebGL2 Compute
electron_1.app.commandLine.appendSwitch('enable-webgl2-compute-context');
//todo:这段在新版的 electron（31.3.1）中，如果开启会导致 gpu 硬件加速是关闭的状态，暂时先注释掉，但是这部分代码可能会影响到原生场景，所以有可能原生场景用不了。
// 因为目前并暂时不支持原生场景，所以这段话先注释掉了，后续如果原生场景还有问题的话，在考虑如何做处理
// if (require('os').platform() === 'win32') {
//     app.commandLine.appendSwitch('use-angle', 'OpenGL');
// }
// 因为 can I use 会有警告，所以这里需要暂时隐藏警告
// @ts-ignore
process.env.BROWSERSLIST_IGNORE_OLD_DATA = true;
const _uncaughtExceptionFunc = (error) => {
    global.Editor &&
        Editor.Metrics.trackException({
            // 未捕获错误
            code: -1,
            // 错误信息
            message: error.message,
        });
    if (process.send && process.connected) {
        process.send({
            channel: 'editor-error',
            message: error.message,
            stack: error.stack,
        });
    }
    console.error(error);
};
process.on('uncaughtException', _uncaughtExceptionFunc);
/**
 * Editor.App.path 默认由 __dirname 推导，Node 会解析软链接为真实路径。
 * 使用 Electron app.getAppPath()，使路径与 .app 内 Resources/app 一致（保留软链接路径）。
 */
function patchAppPathToBundleRoot() {
    const { App } = require('@editor/creator/dist/app');
    const bundleAppPath = electron_1.app.getAppPath();
    Object.defineProperty(App, 'path', {
        get() {
            return bundleAppPath;
        },
        configurable: true,
    });
    console.debug(`[launch] Editor.App.path -> ${bundleAppPath}`);
}
(async function () {
    patchAppPathToBundleRoot();
    // 初始化 Editor
    // 在这个过程中，会加载每个模块，并且监听一些初始化事件
    // Editor 这个全局对象应该避免在编辑器内部使用
    const creator = require('@editor/creator');
    // 开始编辑器启动流程
    try {
        const { initSentry } = require('./sentry');
        // 初始化 sentry
        await initSentry();
    }
    catch (error) {
        console.debug(error);
    }
    await creator.init({
        env: {
            LAYOUT: (0, path_1.join)(__dirname, './../../static/layout-native.json'),
        },
    });
    const { initUserInfo } = require('./sentry');
    await initUserInfo();
    const appModulePath = (0, path_1.join)(__dirname, 'node_modules');
    await creator.registerFindModulePath((args) => {
        switch (args[0]) {
            case '@electron/remote':
            case 'cc': {
                args[1].splice(0, 0, appModulePath);
            }
        }
        return args;
    });
    const { launch } = require('./launch');
    await launch();
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLHVDQUErQjtBQUMvQiwrQkFBNEI7QUFFNUI7Ozs7R0FJRztBQUVILFlBQVk7QUFDWixjQUFHLENBQUMsOEJBQThCLEVBQUUsQ0FBQztBQUNyQyxzQkFBc0I7QUFDdEIsY0FBRyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUNyRCxjQUFHLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBQzNELG9FQUFvRTtBQUNwRSxhQUFhO0FBQ2IsY0FBRyxDQUFDLHlCQUF5QixHQUFHLEtBQUssQ0FBQztBQUV0QywyQkFBMkI7QUFDM0IsbUJBQW1CO0FBQ25CLGtFQUFrRTtBQUVsRSxvQkFBb0I7QUFDcEIsY0FBRyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUU5RCw2RkFBNkY7QUFDN0Ysb0RBQW9EO0FBQ3BELDhDQUE4QztBQUM5QywyREFBMkQ7QUFDM0QsSUFBSTtBQUVKLGlDQUFpQztBQUNqQyxhQUFhO0FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUM7QUFFaEQsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLEtBQVksRUFBRSxFQUFFO0lBQzVDLE1BQU0sQ0FBQyxNQUFNO1FBQ1QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDMUIsUUFBUTtZQUNSLElBQUksRUFBRSxDQUFDLENBQUM7WUFDUixPQUFPO1lBQ1AsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3pCLENBQUMsQ0FBQztJQUNQLElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1FBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDVCxPQUFPLEVBQUUsY0FBYztZQUN2QixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDdEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO1NBQ3JCLENBQUMsQ0FBQztLQUNOO0lBQ0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUM7QUFDRixPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLHNCQUFzQixDQUFDLENBQUM7QUFFeEQ7OztHQUdHO0FBQ0gsU0FBUyx3QkFBd0I7SUFDN0IsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sYUFBYSxHQUFHLGNBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUN2QyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUU7UUFDL0IsR0FBRztZQUNDLE9BQU8sYUFBYSxDQUFDO1FBQ3pCLENBQUM7UUFDRCxZQUFZLEVBQUUsSUFBSTtLQUNyQixDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFRCxDQUFDLEtBQUs7SUFDRix3QkFBd0IsRUFBRSxDQUFDO0lBRTNCLGFBQWE7SUFDYiw2QkFBNkI7SUFDN0IsNEJBQTRCO0lBQzVCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzNDLFlBQVk7SUFDWixJQUFJO1FBQ0EsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxhQUFhO1FBQ2IsTUFBTSxVQUFVLEVBQUUsQ0FBQztLQUN0QjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4QjtJQUNELE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQztRQUNmLEdBQUcsRUFBRTtZQUNELE1BQU0sRUFBRSxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsbUNBQW1DLENBQUM7U0FDL0Q7S0FDSixDQUFDLENBQUM7SUFFSCxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzdDLE1BQU0sWUFBWSxFQUFFLENBQUM7SUFFckIsTUFBTSxhQUFhLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUMsSUFBVyxFQUFFLEVBQUU7UUFDakQsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDYixLQUFLLGtCQUFrQixDQUFDO1lBQ3hCLEtBQUssSUFBSSxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQ3ZDO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdkMsTUFBTSxNQUFNLEVBQUUsQ0FBQztBQUNuQixDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBhcHAgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5cbi8qKlxuICog56aB5q2i5Zyo5pys6ISa5pys5Lit5a+85YWl5YW25a6D6Ieq5a6a5LmJ5qih5Z2X77yMXG4gKiDlm6DkuLrov5nkupvmqKHlnZflvojlj6/og73lnKjmiZPljIXlkI7lj5jmiJDliqDlr4bmlofku7bvvIzlnKjpnIDopoHlnKjnvJbovpHlmajliJ3lp4vljJblkI7miY3og73miJDlip/liqDovb3jgIJcbiAqIOS4uuehruS/nee7n+S4gO+8jOWFtuWug+aooeWdl+ivt+e7n+S4gOaUvuWIsCBsYXVuY2guanMg5Lit6L+b6KGM5bu26L+f5Yqg6L2944CCXG4gKi9cblxuLy8g56aB5q2i6Ieq5Yqo56aB55SoIDNEXG5hcHAuZGlzYWJsZURvbWFpbkJsb2NraW5nRm9yM0RBUElzKCk7XG4vLyDlv73nlaUgY2hyb21lIOeahCBncHUg6buR5ZCN5Y2VXG5hcHAuY29tbWFuZExpbmUuYXBwZW5kU3dpdGNoKCdpZ25vcmUtZ3B1LWJsYWNrbGlzdCcpO1xuYXBwLmNvbW1hbmRMaW5lLmFwcGVuZFN3aXRjaCgnZm9yY2VfaGlnaF9wZXJmb3JtYW5jZV9ncHUnKTtcbi8vIGRpc2FibGUgcmVuZGVyIHByb2Nlc3MgcmV1c2UsRml4IHByb2Nlc3MubmV4dFRpY2sgYW5kIGVkaXRvciBBTlIuXG4vLyBAdHMtaWdub3JlXG5hcHAuYWxsb3dSZW5kZXJlclByb2Nlc3NSZXVzZSA9IGZhbHNlO1xuXG4vLyBoYWNrIGZvciBuYXRpdml6ZSB3aW5kb3dcbi8vIOWKoOS4iuWQju+8jOS8muWvvOiHtOeql+WPo+S4iue8qeaUvuavlOS+i+S4jeWvuVxuLy8gYXBwLmNvbW1hbmRMaW5lLmFwcGVuZFN3aXRjaCgnZm9yY2UtZGV2aWNlLXNjYWxlLWZhY3RvcicsICcxJyk7XG5cbi8vIOWQr+eUqCBXZWJHTDIgQ29tcHV0ZVxuYXBwLmNvbW1hbmRMaW5lLmFwcGVuZFN3aXRjaCgnZW5hYmxlLXdlYmdsMi1jb21wdXRlLWNvbnRleHQnKTtcblxuLy90b2RvOui/meauteWcqOaWsOeJiOeahCBlbGVjdHJvbu+8iDMxLjMuMe+8ieS4re+8jOWmguaenOW8gOWQr+S8muWvvOiHtCBncHUg56Gs5Lu25Yqg6YCf5piv5YWz6Zet55qE54q25oCB77yM5pqC5pe25YWI5rOo6YeK5o6J77yM5L2G5piv6L+Z6YOo5YiG5Luj56CB5Y+v6IO95Lya5b2x5ZON5Yiw5Y6f55Sf5Zy65pmv77yM5omA5Lul5pyJ5Y+v6IO95Y6f55Sf5Zy65pmv55So5LiN5LqG44CCXG4vLyDlm6DkuLrnm67liY3lubbmmoLml7bkuI3mlK/mjIHljp/nlJ/lnLrmma/vvIzmiYDku6Xov5nmrrXor53lhYjms6jph4rmjonkuobvvIzlkI7nu63lpoLmnpzljp/nlJ/lnLrmma/ov5jmnInpl67popjnmoTor53vvIzlnKjogIPomZHlpoLkvZXlgZrlpITnkIZcbi8vIGlmIChyZXF1aXJlKCdvcycpLnBsYXRmb3JtKCkgPT09ICd3aW4zMicpIHtcbi8vICAgICBhcHAuY29tbWFuZExpbmUuYXBwZW5kU3dpdGNoKCd1c2UtYW5nbGUnLCAnT3BlbkdMJyk7XG4vLyB9XG5cbi8vIOWboOS4uiBjYW4gSSB1c2Ug5Lya5pyJ6K2m5ZGK77yM5omA5Lul6L+Z6YeM6ZyA6KaB5pqC5pe26ZqQ6JeP6K2m5ZGKXG4vLyBAdHMtaWdub3JlXG5wcm9jZXNzLmVudi5CUk9XU0VSU0xJU1RfSUdOT1JFX09MRF9EQVRBID0gdHJ1ZTtcblxuY29uc3QgX3VuY2F1Z2h0RXhjZXB0aW9uRnVuYyA9IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICBnbG9iYWwuRWRpdG9yICYmXG4gICAgICAgIEVkaXRvci5NZXRyaWNzLnRyYWNrRXhjZXB0aW9uKHtcbiAgICAgICAgICAgIC8vIOacquaNleiOt+mUmeivr1xuICAgICAgICAgICAgY29kZTogLTEsXG4gICAgICAgICAgICAvLyDplJnor6/kv6Hmga9cbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIH0pO1xuICAgIGlmIChwcm9jZXNzLnNlbmQgJiYgcHJvY2Vzcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgcHJvY2Vzcy5zZW5kKHtcbiAgICAgICAgICAgIGNoYW5uZWw6ICdlZGl0b3ItZXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgIHN0YWNrOiBlcnJvci5zdGFjayxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xufTtcbnByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgX3VuY2F1Z2h0RXhjZXB0aW9uRnVuYyk7XG5cbi8qKlxuICogRWRpdG9yLkFwcC5wYXRoIOm7mOiupOeUsSBfX2Rpcm5hbWUg5o6o5a+877yMTm9kZSDkvJrop6PmnpDova/pk77mjqXkuLrnnJ/lrp7ot6/lvoTjgIJcbiAqIOS9v+eUqCBFbGVjdHJvbiBhcHAuZ2V0QXBwUGF0aCgp77yM5L2/6Lev5b6E5LiOIC5hcHAg5YaFIFJlc291cmNlcy9hcHAg5LiA6Ie077yI5L+d55WZ6L2v6ZO+5o6l6Lev5b6E77yJ44CCXG4gKi9cbmZ1bmN0aW9uIHBhdGNoQXBwUGF0aFRvQnVuZGxlUm9vdCgpOiB2b2lkIHtcbiAgICBjb25zdCB7IEFwcCB9ID0gcmVxdWlyZSgnQGVkaXRvci9jcmVhdG9yL2Rpc3QvYXBwJyk7XG4gICAgY29uc3QgYnVuZGxlQXBwUGF0aCA9IGFwcC5nZXRBcHBQYXRoKCk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFwcCwgJ3BhdGgnLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiBidW5kbGVBcHBQYXRoO1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgfSk7XG4gICAgY29uc29sZS5kZWJ1ZyhgW2xhdW5jaF0gRWRpdG9yLkFwcC5wYXRoIC0+ICR7YnVuZGxlQXBwUGF0aH1gKTtcbn1cblxuKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIHBhdGNoQXBwUGF0aFRvQnVuZGxlUm9vdCgpO1xuXG4gICAgLy8g5Yid5aeL5YyWIEVkaXRvclxuICAgIC8vIOWcqOi/meS4qui/h+eoi+S4re+8jOS8muWKoOi9veavj+S4quaooeWdl++8jOW5tuS4lOebkeWQrOS4gOS6m+WIneWni+WMluS6i+S7tlxuICAgIC8vIEVkaXRvciDov5nkuKrlhajlsYDlr7nosaHlupTor6Xpgb/lhY3lnKjnvJbovpHlmajlhoXpg6jkvb/nlKhcbiAgICBjb25zdCBjcmVhdG9yID0gcmVxdWlyZSgnQGVkaXRvci9jcmVhdG9yJyk7XG4gICAgLy8g5byA5aeL57yW6L6R5Zmo5ZCv5Yqo5rWB56iLXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBpbml0U2VudHJ5IH0gPSByZXF1aXJlKCcuL3NlbnRyeScpO1xuICAgICAgICAvLyDliJ3lp4vljJYgc2VudHJ5XG4gICAgICAgIGF3YWl0IGluaXRTZW50cnkoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmRlYnVnKGVycm9yKTtcbiAgICB9XG4gICAgYXdhaXQgY3JlYXRvci5pbml0KHtcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgICBMQVlPVVQ6IGpvaW4oX19kaXJuYW1lLCAnLi8uLi8uLi9zdGF0aWMvbGF5b3V0LW5hdGl2ZS5qc29uJyksXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCB7IGluaXRVc2VySW5mbyB9ID0gcmVxdWlyZSgnLi9zZW50cnknKTtcbiAgICBhd2FpdCBpbml0VXNlckluZm8oKTtcblxuICAgIGNvbnN0IGFwcE1vZHVsZVBhdGggPSBqb2luKF9fZGlybmFtZSwgJ25vZGVfbW9kdWxlcycpO1xuICAgIGF3YWl0IGNyZWF0b3IucmVnaXN0ZXJGaW5kTW9kdWxlUGF0aCgoYXJnczogYW55W10pID0+IHtcbiAgICAgICAgc3dpdGNoIChhcmdzWzBdKSB7XG4gICAgICAgICAgICBjYXNlICdAZWxlY3Ryb24vcmVtb3RlJzpcbiAgICAgICAgICAgIGNhc2UgJ2NjJzoge1xuICAgICAgICAgICAgICAgIGFyZ3NbMV0uc3BsaWNlKDAsIDAsIGFwcE1vZHVsZVBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcmdzO1xuICAgIH0pO1xuXG4gICAgY29uc3QgeyBsYXVuY2ggfSA9IHJlcXVpcmUoJy4vbGF1bmNoJyk7XG4gICAgYXdhaXQgbGF1bmNoKCk7XG59KSgpO1xuIl19