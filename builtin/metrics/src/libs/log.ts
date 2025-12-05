import { join } from 'path';
import { appendFile, outputFile } from 'fs-extra';

function getRealTime() {
    const time = new Date();
    return time.toLocaleDateString().replace(/\//g, '-') + ' ' + time.toTimeString().slice(0, 8);
}

export class LogMgr {
    static Name = 'metrics.log';

    // 记录的 log 文件地址
    private logFile: string | undefined = undefined;
    private outputLog = false;

    public debug = false;

    public async init(outputLog = false, debug = false) {
        this.outputLog = outputLog;
        this.debug = debug;
        try {
            Editor.Project.tmpDir && (this.logFile = join(Editor.Project.tmpDir, LogMgr.Name));
            if (this.outputLog && this.logFile) {
                await outputFile(this.logFile, `Cocos Creator v${Editor.App.version}` + '\n');
            }
        } catch (error) {
            // 统计报表，错误不影响启动
            console.debug(error);
        }
    }

    /**
     * 输出日志到指定 .log 文件内
     * @param message
     * @param data
     */
    public async collectToFile(message: string, data: string | any) {
        try {
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
            }
            this.debug && console.debug(message, data);

            if (!this.outputLog || !this.logFile) return;
            const content = '----------------------------------------------------------------\n' +
                            `${getRealTime()}: ${message}:${data}\n`;
            await appendFile(this.logFile, content);
        } catch (error) {
            console.debug(error);
        }
    }

}

export const logMgr = new LogMgr();
