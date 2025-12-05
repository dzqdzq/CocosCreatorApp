import { Ui } from './ui.js';
import { globals } from './app-globals.js';
import { main } from './main.js';

import { ISettings } from '../../../builder/@types/public/build-result';
declare global {
    const System: any;
}

async function bootstrap(options: bootstrap.Options) {
    try {
        await bootstrapAsync(options);
    } catch (error) {
        console.error(error);
    }
}

declare namespace bootstrap {
    export interface Options {
        /**
         * 引擎模块 URL。
         */
        engineBaseUrl: string;

        devices: Record<string, {
            name: string;
            width: number;
            height: number;
            ratio?: number;
        }>;

        /**
         * Settings。
         */
        settings: ISettings;
    }
}

async function bootstrapAsync(options: bootstrap.Options) {
    const socket = await createSocket();

    const ui = new Ui({
        devices: options.devices,
        emit: (event, ...args) => {
            socket.emit(event, ...args);
        },
    });

    function installDiagnosisRoutine() {
        const errorHandle = function(error: Error) {
            globals.error = true;
            // @ts-ignore
            const eventType = [].toString.call(error, error);
            console.error(error);
            if (eventType === '[object Event]') {
                // 加载错误,显示错误页面
                // @ts-ignore
                ui.showError(`load ${error.target.src} failed`);
                error.stack && ui.showError(error.stack);
            } else {
                // @ts-ignore
                ui.showError(`${error.message} in ${error.filename}`);
                error.stack && ui.showError(error.stack);
            }
            // 注意，在返回 true 的时候，异常才不会继续向上抛出error;
            return true;
        };
        // 全局捕获错误
        window.addEventListener(
            'error',
            // @ts-ignore
            errorHandle,
            true,
        );
        window.addEventListener(
            'unhandledrejection',
            // @ts-ignore
            (error: PromiseRejectionEvent) => {
                ui.showError(`${error.type}: ${error.reason.message}`);
                ui.showError(error.reason.stack);
            },
            true,
        );
    }

    async function createSocket() {
        // @ts-ignore
        const socketIo = await import('/socket.io/socket.io.js');
        const socket = socketIo.default();
        socket.on('browser:reload', function() {
            window.location.reload();
        });
        socket.on('browser:disconnect', function() {
            window.location.reload();
        });
        return socket;
    }

    try {
        installDiagnosisRoutine();

        const engineModuleEntries: string[] = options.settings.engineModules;
        const hasPhysicsAmmo = engineModuleEntries.findIndex((entry) => entry === 'physics-ammo') >= 0;
        if (hasPhysicsAmmo) {
            // @ts-ignore
            const { default: waitForAmmoInstantiation } = await import('cce:/internal/x/cc-fu/wait-for-ammo-instantiation');
            await waitForAmmoInstantiation();
        }

        const cc = await System.import('cc');
        ui.bindEngine(cc);
        await main(ui, options);
    } catch (error: any) {
        ui.showError(error.message);
        ui.showError(error.stack);
    }
}

export { bootstrap };
