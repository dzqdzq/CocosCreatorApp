import { Ui } from './ui.js';
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

        devices: Record<
            string,
            {
                name: string;
                width: number;
                height: number;
                ratio?: number;
            }
        >;

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

    async function createSocket() {
        const searchArr = window.location.search.substr(1).split('&');
        // @ts-ignore
        const socketIo = await import('/socket.io/socket.io.js');
        const socket = socketIo.default();
        if (searchArr.indexOf('autoReload=false') === -1) {
            socket.on('browser:reload', function() {
                window.location.reload();
            });
            socket.on('browser:close', function() {
                window.close();
            });
            socket.on('browser:disconnect', function() {
                window.location.reload();
            });
        }
        return socket;
    }

    try {
        const cc = await System.import('cc');
        ui.bindEngine(cc);
        await main(ui, options);
    } catch (error: any) {
        console.error(error);
    }
}

export { bootstrap };
