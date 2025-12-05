"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPackageSymlink = exports.importPackageFolder = exports.importPackage = exports.ImportPackageErrorMessage = void 0;
const child_process_1 = require("child_process");
// @ts-ignore
const fix_path_1 = __importDefault(require("fix-path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
exports.ImportPackageErrorMessage = {
    invalidPath: 'invalid path',
    decompressFail: 'decompress fail',
    cancel: 'cancel',
    cannotFindPackageJson: 'cannot find package.json',
};
const throwIfNotExists = (path, msg) => {
    if (!fs_extra_1.default.existsSync(path)) {
        throw new Error(msg ?? `path not exists: "${path}"`);
    }
};
/**
 * mac 上的解压方法
 */
const unzipOfDarwin = function (src, dist, onError) {
    const path = path_1.default.dirname(dist);
    fs_extra_1.default.ensureDirSync(path);
    fix_path_1.default();
    // @ts-ignore
    const child = child_process_1.spawn('unzip', ['-n', src, '-d', dist]);
    let errText = '';
    child.stderr.on('data', (data) => {
        errText += data;
    });
    let text = '';
    child.stdout.on('data', (data) => {
        text += data;
    });
    child.on('error', (err) => {
        if (text) {
            console.log(text);
        }
        if (errText) {
            console.warn(errText);
        }
        onError(err);
    });
    child.on('close', (code) => {
        if (text) {
            console.log(text);
        }
        if (errText) {
            console.warn(errText);
        }
        // code == 0 测试通过，其余的为文件有问题
        let error = null;
        if (code !== 0) {
            error = new Error(Editor.I18n.t('extension.menu.decompressFail'));
        }
        onError(error);
    });
};
/**
 * windows 上的解压方法
 * @param src
 * @param dist
 * @param onError
 */
const unzipOfWin32 = function (src, dist, onError) {
    const path = path_1.default.dirname(dist);
    fs_extra_1.default.ensureDirSync(path);
    const child = child_process_1.spawn(path_1.default.join(Editor.App.path, '../tools/unzip.exe'), ['-n', src, '-d', dist]);
    let errText = '';
    // @ts-ignore
    child.stderr.on('data', (data) => {
        errText += data;
    });
    let text = '';
    // @ts-ignore
    child.stdout.on('data', (data) => {
        text += data;
    });
    child.on('error', (err) => {
        if (text) {
            console.log(text);
        }
        if (errText) {
            console.warn(errText);
        }
        onError(err);
    });
    child.on('close', (code) => {
        if (text) {
            console.log(`[extension] ${text}`);
        }
        if (errText) {
            console.warn(`[extension] ${errText}`);
        }
        // code == 0 测试通过，其余的为文件有问题
        let error = null;
        if (code !== 0) {
            error = new Error(Editor.I18n.t('extension.menu.decompressFail'));
        }
        onError(error);
    });
};
/**
 * 导入一个插件压缩包到编辑器内，并注册这个插件
 * 有可能会出现以下错误:
 * @error 'invalid path'，当路径不对时
 * @error 'decompress fail', 解压失败时
 * @error 'cancel',导入被取消
 * @param type
 * @param zipFile
 * @param options.extensionDisplayName 通知时显示的扩展包的名字
 * @param options.forceImport 不询问直接强制覆盖以前的插件
 */
async function importPackage(type = 'project', zipFile, options) {
    const _extensionName = options?.extensionDisplayName || path_1.default.basename(zipFile, '.zip');
    const _forceImport = options?.forceImport;
    const rootPath = type === 'project' ? Editor.Project.path : Editor.App.home;
    const pkgPath = path_1.default.join(rootPath, './extensions');
    if (!fs_extra_1.default.existsSync(pkgPath)) {
        await fs_extra_1.default.ensureDir(pkgPath);
    }
    if (!zipFile || zipFile === pkgPath) {
        throw new Error('invalid path');
    }
    let unzip;
    if (process.platform === 'win32') {
        unzip = unzipOfWin32;
    }
    else {
        unzip = unzipOfDarwin;
    }
    const tempDir = Editor.App.temp;
    // FIXME: 是否存在文件夹名称过长的问题？可以考虑生成一个 hash 表示的文件夹名称
    const temp = path_1.default.join(tempDir, `extension_${_extensionName}_${Date.now()}`);
    try {
        const startDecompressTaskID = Editor.Task.addNotice({
            title: Editor.I18n.t('extension.menu.decompressingNow', { extensionName: _extensionName }),
            type: 'log',
            source: 'extension',
        });
        await new Promise((resolve, reject) => {
            unzip(zipFile, temp, (error) => {
                Editor.Task.removeNotice(startDecompressTaskID);
                if (error) {
                    console.error(error);
                    return reject(error.message);
                }
                resolve(null);
                Editor.Task.addNotice({
                    title: Editor.I18n.t('extension.menu.decompressSuccess', { extensionName: _extensionName }),
                    message: Editor.I18n.t('extension.menu.importingNow', { extensionName: _extensionName }),
                    type: 'success',
                    source: 'extension',
                    timeout: 5000,
                });
            });
        });
    }
    catch (error) {
        throw new Error('decompress fail');
    }
    return importPackageTemplate({
        forceImport: _forceImport ?? false,
        extensionDisplayName: _extensionName,
        extensionFolder: temp,
        selectedPath: zipFile,
        type: type,
        async processor(packageFolder, dist) {
            await fs_extra_1.default.move(packageFolder, dist, { overwrite: true });
        },
        cleanup: async (packageFolder) => {
            // 安装 zip 时 packageFolder 应该是 zip 解压出的临时文件夹
            // processor 的处理方式是 move，如果内部文件夹因意外未被移走，这里会把它删除
            if (fs_extra_1.default.existsSync(packageFolder)) {
                await fs_extra_1.default.remove(packageFolder);
            }
            await fs_extra_1.default.remove(temp);
        },
    });
}
exports.importPackage = importPackage;
/**
 * 以文件夹复制的方式导入插件
 * @param type
 * @param folderPath
 * @param options
 * @returns
 */
async function importPackageFolder(type, folderPath, options) {
    throwIfNotExists(folderPath, `Package import failed: invalid package folder "${folderPath}"`);
    const dist = await importPackageTemplate({
        forceImport: options?.forceImport ?? false,
        // 用于展示的名称，没有的话就用文件夹名称代替
        extensionDisplayName: options?.extensionDisplayName ?? path_1.default.basename(folderPath),
        type,
        extensionFolder: folderPath,
        selectedPath: folderPath,
        async processor(packageFolder, dist) {
            // 安装文件夹。直接复制到目标位置，不移除原文件夹
            await fs_extra_1.default.copy(packageFolder, dist);
        },
    });
    return dist;
}
exports.importPackageFolder = importPackageFolder;
/**
 * 将插件文件夹以软链接的方式导入，适用于本地开发调试
 */
function importPackageSymlink(type, folderPath, options) {
    throwIfNotExists(folderPath, `Package import failed: invalid package folder "${folderPath}"`);
    return importPackageTemplate({
        type,
        extensionDisplayName: options?.extensionDisplayName ?? path_1.default.basename(folderPath),
        forceImport: options?.forceImport ?? false,
        extensionFolder: folderPath,
        selectedPath: folderPath,
        async processor(packageFolder, dist) {
            // TODO: dir or junction ?
            // on windows, it needs administrator role to create dir symlink
            await fs_extra_1.default.symlink(packageFolder, dist, 'junction');
        },
    });
}
exports.importPackageSymlink = importPackageSymlink;
/**
 * 导入逻辑相关的模板方法。
 * 后续需求变更时可以增加更多参数，或者将整个模板方法拆散成多个小函数，让各个调用入口自己去组合调用
 */
async function importPackageTemplate(options) {
    const { 
    //
    extensionDisplayName: _extensionName, type, extensionFolder: extensionFolder, selectedPath, } = options;
    const _forceImport = options.forceImport;
    const rootPath = type === 'project' ? Editor.Project.path : Editor.App.home;
    const pkgPath = path_1.default.join(rootPath, './extensions');
    if (!fs_extra_1.default.existsSync(pkgPath)) {
        await fs_extra_1.default.ensureDir(pkgPath);
    }
    const confirmReinstall = async () => {
        if (_forceImport) {
            return true;
        }
        const result = await Editor.Dialog.info(Editor.I18n.t('extension.menu.reinstall', { extensionName: _extensionName }), {
            buttons: [Editor.I18n.t('extension.menu.confirm'), Editor.I18n.t('extension.menu.cancel')],
            cancel: 1,
        });
        return result.response !== 1;
    };
    const packageContext = await detectPackage(extensionFolder);
    if (packageContext == null) {
        // TODO: define a custom Error
        const error = new Error(exports.ImportPackageErrorMessage.cannotFindPackageJson);
        error.path = extensionFolder;
        throw error;
    }
    // 子文件夹里检测到的扩展包，格式不正确，显示一个 warning 提示
    if (packageContext.nested) {
        Editor.Task.addNotice({
            title: Editor.I18n.t('extension.menu.zipDirectoryWarnTitle', { extensionName: _extensionName }),
            message: Editor.I18n.t('extension.menu.zipDirectoryWarnContent'),
            type: 'warn',
            source: 'extension',
            timeout: 5000,
        });
    }
    const dist = path_1.default.join(pkgPath, packageContext.packageName);
    const packageFolder = packageContext.packageFolder;
    // 目标目录已经存在，判断已经安装了相同插件，弹出覆盖提示，同时做替换的前置工作
    if (fs_extra_1.default.existsSync(dist)) {
        if (!(await confirmReinstall())) {
            if (typeof options.cleanup === 'function') {
                await options.cleanup(packageFolder);
            }
            throw new Error('cancel');
        }
        else {
            try {
                await Editor.Package.disable(dist, { replacement: false });
                await Editor.Package.unregister(dist);
                await Editor.Message.request('extension', 'trash-item', dist);
            }
            catch (err) {
                await Editor.Package.register(dist);
                await Editor.Package.enable(dist);
                if (typeof err === 'string') {
                    throw new Error(err);
                }
                throw err;
            }
        }
    }
    try {
        await options.processor(packageFolder, dist);
    }
    finally {
        if (typeof options.cleanup === 'function') {
            try {
                await options.cleanup(packageFolder);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    Editor.Task.addNotice({
        title: Editor.I18n.t('extension.menu.importSuccess'),
        message: _extensionName,
        type: 'success',
        source: 'extension',
        timeout: 5000,
    });
    Editor.Package.register(dist);
    return dist;
}
async function detectPackage(originFolder) {
    const packageJsonPath = path_1.default.join(originFolder, 'package.json');
    if (fs_extra_1.default.existsSync(packageJsonPath)) {
        const packageName = (await fs_extra_1.default.readJson(packageJsonPath)).name;
        return {
            packageName,
            packageJsonPath,
            packageFolder: originFolder,
            nested: false,
        };
    }
    // 为了兼容性，多检测一层文件夹
    const list = await fs_extra_1.default.readdir(originFolder);
    for (const name of list) {
        const nestedPackageFolder = path_1.default.join(originFolder, name);
        const nestedPackageJsonPath = path_1.default.join(nestedPackageFolder, 'package.json');
        if (!fs_extra_1.default.existsSync(nestedPackageJsonPath)) {
            continue;
        }
        const packageName = (await fs_extra_1.default.readJson(nestedPackageJsonPath)).name;
        return {
            packageName,
            packageJsonPath: nestedPackageJsonPath,
            packageFolder: nestedPackageFolder,
            nested: true,
        };
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3B1YmxpYy9pbXBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaURBQXNDO0FBRXRDLGFBQWE7QUFDYix3REFBK0I7QUFDL0Isd0RBQTBCO0FBQzFCLGdEQUEwQjtBQWViLFFBQUEseUJBQXlCLEdBQUc7SUFDckMsV0FBVyxFQUFFLGNBQWM7SUFDM0IsY0FBYyxFQUFFLGlCQUFpQjtJQUNqQyxNQUFNLEVBQUUsUUFBUTtJQUNoQixxQkFBcUIsRUFBRSwwQkFBMEI7Q0FDM0MsQ0FBQztBQTBCWCxNQUFNLGdCQUFnQixHQUFHLENBQUMsSUFBWSxFQUFFLEdBQVksRUFBRSxFQUFFO0lBQ3BELElBQUksQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxxQkFBcUIsSUFBSSxHQUFHLENBQUMsQ0FBQztLQUN4RDtBQUNMLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBTSxhQUFhLEdBQUcsVUFBUyxHQUFXLEVBQUUsSUFBWSxFQUFFLE9BQTJCO0lBQ2pGLE1BQU0sSUFBSSxHQUFHLGNBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsa0JBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsa0JBQU8sRUFBRSxDQUFDO0lBQ1YsYUFBYTtJQUNiLE1BQU0sS0FBSyxHQUFHLHFCQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUV0RCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFFakIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7UUFDckMsT0FBTyxJQUFJLElBQUks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QXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUVwRSxPQUFPO1lBQ0gsV0FBVztZQUNYLGVBQWUsRUFBRSxxQkFBcUI7WUFDdEMsYUFBYSxFQUFFLG1CQUFtQjtZQUNsQyxNQUFNLEVBQUUsSUFBSTtTQUNmLENBQUM7S0FDTDtJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgc2hlbGwgfSBmcm9tICdlbGVjdHJvbic7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgZml4UGF0aCBmcm9tICdmaXgtcGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IF9fcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHsgUGFja2FnZUluZm8gfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1wb3J0UGFja2FnZU9wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIOmAmuefpeaXtuaYvuekuueahOaJqeWxleWMheeahOWQjeWtl++8jOS4jiBwYWNrYWdlSnNvbi5uYW1lIOWPr+iDveacieWMuuWIq1xuICAgICAqL1xuICAgIGV4dGVuc2lvbkRpc3BsYXlOYW1lPzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIOS4jeivoumXruebtOaOpeW8uuWItuimhuebluS7peWJjeeahOaPkuS7tlxuICAgICAqL1xuICAgIGZvcmNlSW1wb3J0PzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UgPSB7XG4gICAgaW52YWxpZFBhdGg6ICdpbnZhbGlkIHBhdGgnLFxuICAgIGRlY29tcHJlc3NGYWlsOiAnZGVjb21wcmVzcyBmYWlsJyxcbiAgICBjYW5jZWw6ICdjYW5jZWwnLFxuICAgIGNhbm5vdEZpbmRQYWNrYWdlSnNvbjogJ2Nhbm5vdCBmaW5kIHBhY2thZ2UuanNvbicsXG59IGFzIGNvbnN0O1xuXG50eXBlIFByb2plY3RJbXBvcnRUeXBlID0gUGFja2FnZUluZm9bJ3R5cGUnXTtcbnR5cGUgUGFja2FnZUluc3RhbGxDb250ZXh0ID0gUmVxdWlyZWQ8SW1wb3J0UGFja2FnZU9wdGlvbnM+ICYge1xuICAgIHR5cGU6IFByb2plY3RJbXBvcnRUeXBlIHwgc3RyaW5nOyAvLyAncHJvamVjdCcgYW5kID8/P1xuXG4gICAgLyoqXG4gICAgICog5o+S5Lu25a2Y5Zyo55qE5paH5Lu25aS577yIemlwIOWMheino+WOi+WQjueahOS4tOaXtuebruW9leOAgeaPkuS7tuaJgOWcqOaWh+S7tuWkue+8iVxuICAgICAqL1xuICAgIGV4dGVuc2lvbkZvbGRlcjogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIOeUqOaIt+mAieaLqeeahOi3r+W+hCh6aXAsIGZvbGRlcilcbiAgICAgKi9cbiAgICBzZWxlY3RlZFBhdGg6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIOWBmuS4gOS6m+a4heeQhuW3peS9nCjkuLTml7bmlofku7YpXG4gICAgICovXG4gICAgY2xlYW51cD86IChwYWNrYWdlRm9sZGVyOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG5cbiAgICAvKipcbiAgICAgKiDlpITnkIbmupDmj5Lku7bmlofku7blpLnliLDnm67moIflronoo4Xmlofku7blpLnnmoTpgLvovpFcbiAgICAgKi9cbiAgICBwcm9jZXNzb3IocGFja2FnZUZvbGRlcjogc3RyaW5nLCBkaXN0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufTtcblxuY29uc3QgdGhyb3dJZk5vdEV4aXN0cyA9IChwYXRoOiBzdHJpbmcsIG1zZz86IHN0cmluZykgPT4ge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnID8/IGBwYXRoIG5vdCBleGlzdHM6IFwiJHtwYXRofVwiYCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBtYWMg5LiK55qE6Kej5Y6L5pa55rOVXG4gKi9cbmNvbnN0IHVuemlwT2ZEYXJ3aW4gPSBmdW5jdGlvbihzcmM6IHN0cmluZywgZGlzdDogc3RyaW5nLCBvbkVycm9yOiAoZXJyOiBhbnkpID0+IHZvaWQpIHtcbiAgICBjb25zdCBwYXRoID0gX19wYXRoLmRpcm5hbWUoZGlzdCk7XG4gICAgZnMuZW5zdXJlRGlyU3luYyhwYXRoKTtcbiAgICBmaXhQYXRoKCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oJ3VuemlwJywgWyctbicsIHNyYywgJy1kJywgZGlzdF0pO1xuXG4gICAgbGV0IGVyclRleHQgPSAnJztcblxuICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgICAgZXJyVGV4dCArPSBkYXRhO1xuICAgIH0pO1xuICAgIGxldCB0ZXh0ID0gJyc7XG5cbiAgICBjaGlsZC5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRleHQgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbignZXJyb3InLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJUZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJUZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29kZSA9PSAwIOa1i+ivlemAmui/h++8jOWFtuS9meeahOS4uuaWh+S7tuaciemXrumimFxuICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuZGVjb21wcmVzc0ZhaWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnJvcik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIHdpbmRvd3Mg5LiK55qE6Kej5Y6L5pa55rOVXG4gKiBAcGFyYW0gc3JjXG4gKiBAcGFyYW0gZGlzdFxuICogQHBhcmFtIG9uRXJyb3JcbiAqL1xuY29uc3QgdW56aXBPZldpbjMyID0gZnVuY3Rpb24oc3JjOiBzdHJpbmcsIGRpc3Q6IHN0cmluZywgb25FcnJvcjogKGVycjogYW55KSA9PiB2b2lkKSB7XG4gICAgY29uc3QgcGF0aCA9IF9fcGF0aC5kaXJuYW1lKGRpc3QpO1xuICAgIGZzLmVuc3VyZURpclN5bmMocGF0aCk7XG5cbiAgICBjb25zdCBjaGlsZCA9IHNwYXduKF9fcGF0aC5qb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL3VuemlwLmV4ZScpLCBbJy1uJywgc3JjLCAnLWQnLCBkaXN0XSk7XG5cbiAgICBsZXQgZXJyVGV4dCA9ICcnO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjaGlsZC5zdGRlcnIub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGVyclRleHQgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBsZXQgdGV4dCA9ICcnO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjaGlsZC5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRleHQgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbignZXJyb3InLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJUZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbZXh0ZW5zaW9uXSAke3RleHR9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyclRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4dGVuc2lvbl0gJHtlcnJUZXh0fWApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvZGUgPT0gMCDmtYvor5XpgJrov4fvvIzlhbbkvZnnmoTkuLrmlofku7bmnInpl67pophcbiAgICAgICAgbGV0IGVycm9yID0gbnVsbDtcbiAgICAgICAgaWYgKGNvZGUgIT09IDApIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmRlY29tcHJlc3NGYWlsJykpO1xuICAgICAgICB9XG4gICAgICAgIG9uRXJyb3IoZXJyb3IpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiDlr7zlhaXkuIDkuKrmj5Lku7bljovnvKnljIXliLDnvJbovpHlmajlhoXvvIzlubbms6jlhozov5nkuKrmj5Lku7ZcbiAqIOacieWPr+iDveS8muWHuueOsOS7peS4i+mUmeivrzpcbiAqIEBlcnJvciAnaW52YWxpZCBwYXRoJ++8jOW9k+i3r+W+hOS4jeWvueaXtlxuICogQGVycm9yICdkZWNvbXByZXNzIGZhaWwnLCDop6PljovlpLHotKXml7ZcbiAqIEBlcnJvciAnY2FuY2VsJyzlr7zlhaXooqvlj5bmtohcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcGFyYW0gemlwRmlsZVxuICogQHBhcmFtIG9wdGlvbnMuZXh0ZW5zaW9uRGlzcGxheU5hbWUg6YCa55+l5pe25pi+56S655qE5omp5bGV5YyF55qE5ZCN5a2XXG4gKiBAcGFyYW0gb3B0aW9ucy5mb3JjZUltcG9ydCDkuI3or6Lpl67nm7TmjqXlvLrliLbopobnm5bku6XliY3nmoTmj5Lku7ZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydFBhY2thZ2UoXG4gICAgdHlwZSA9ICdwcm9qZWN0JyxcbiAgICB6aXBGaWxlOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IEltcG9ydFBhY2thZ2VPcHRpb25zLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBfZXh0ZW5zaW9uTmFtZSA9IG9wdGlvbnM/LmV4dGVuc2lvbkRpc3BsYXlOYW1lIHx8IF9fcGF0aC5iYXNlbmFtZSh6aXBGaWxlLCAnLnppcCcpO1xuICAgIGNvbnN0IF9mb3JjZUltcG9ydCA9IG9wdGlvbnM/LmZvcmNlSW1wb3J0O1xuICAgIGNvbnN0IHJvb3RQYXRoID0gdHlwZSA9PT0gJ3Byb2plY3QnID8gRWRpdG9yLlByb2plY3QucGF0aCA6IEVkaXRvci5BcHAuaG9tZTtcbiAgICBjb25zdCBwa2dQYXRoID0gX19wYXRoLmpvaW4ocm9vdFBhdGgsICcuL2V4dGVuc2lvbnMnKTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGtnUGF0aCkpIHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyKHBrZ1BhdGgpO1xuICAgIH1cblxuICAgIGlmICghemlwRmlsZSB8fCB6aXBGaWxlID09PSBwa2dQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwYXRoJyk7XG4gICAgfVxuXG4gICAgbGV0IHVuemlwOiBGdW5jdGlvbjtcblxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIHVuemlwID0gdW56aXBPZldpbjMyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuemlwID0gdW56aXBPZkRhcndpbjtcbiAgICB9XG4gICAgY29uc3QgdGVtcERpciA9IEVkaXRvci5BcHAudGVtcDtcbiAgICAvLyBGSVhNRTog5piv5ZCm5a2Y5Zyo5paH5Lu25aS55ZCN56ew6L+H6ZW/55qE6Zeu6aKY77yf5Y+v5Lul6ICD6JmR55Sf5oiQ5LiA5LiqIGhhc2gg6KGo56S655qE5paH5Lu25aS55ZCN56ewXG4gICAgY29uc3QgdGVtcCA9IF9fcGF0aC5qb2luKHRlbXBEaXIsIGBleHRlbnNpb25fJHtfZXh0ZW5zaW9uTmFtZX1fJHtEYXRlLm5vdygpfWApO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RhcnREZWNvbXByZXNzVGFza0lEOiBudW1iZXIgPSBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmRlY29tcHJlc3NpbmdOb3cnLCB7IGV4dGVuc2lvbk5hbWU6IF9leHRlbnNpb25OYW1lIH0pLFxuICAgICAgICAgICAgdHlwZTogJ2xvZycsXG4gICAgICAgICAgICBzb3VyY2U6ICdleHRlbnNpb24nLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdW56aXAoemlwRmlsZSwgdGVtcCwgKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIEVkaXRvci5UYXNrLnJlbW92ZU5vdGljZShzdGFydERlY29tcHJlc3NUYXNrSUQpO1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuZGVjb21wcmVzc1N1Y2Nlc3MnLCB7IGV4dGVuc2lvbk5hbWU6IF9leHRlbnNpb25OYW1lIH0pLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5pbXBvcnRpbmdOb3cnLCB7IGV4dGVuc2lvbk5hbWU6IF9leHRlbnNpb25OYW1lIH0pLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdkZWNvbXByZXNzIGZhaWwnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0UGFja2FnZVRlbXBsYXRlKHtcbiAgICAgICAgZm9yY2VJbXBvcnQ6IF9mb3JjZUltcG9ydCA/PyBmYWxzZSxcbiAgICAgICAgZXh0ZW5zaW9uRGlzcGxheU5hbWU6IF9leHRlbnNpb25OYW1lLFxuICAgICAgICBleHRlbnNpb25Gb2xkZXI6IHRlbXAsXG4gICAgICAgIHNlbGVjdGVkUGF0aDogemlwRmlsZSxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgYXN5bmMgcHJvY2Vzc29yKHBhY2thZ2VGb2xkZXIsIGRpc3QpIHtcbiAgICAgICAgICAgIGF3YWl0IGZzLm1vdmUocGFja2FnZUZvbGRlciwgZGlzdCwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFudXA6IGFzeW5jIChwYWNrYWdlRm9sZGVyKSA9PiB7XG4gICAgICAgICAgICAvLyDlronoo4UgemlwIOaXtiBwYWNrYWdlRm9sZGVyIOW6lOivpeaYryB6aXAg6Kej5Y6L5Ye655qE5Li05pe25paH5Lu25aS5XG4gICAgICAgICAgICAvLyBwcm9jZXNzb3Ig55qE5aSE55CG5pa55byP5pivIG1vdmXvvIzlpoLmnpzlhoXpg6jmlofku7blpLnlm6DmhI/lpJbmnKrooqvnp7votbDvvIzov5nph4zkvJrmiorlroPliKDpmaRcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VGb2xkZXIpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlKHBhY2thZ2VGb2xkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlKHRlbXApO1xuICAgICAgICB9LFxuICAgIH0pO1xufVxuXG4vKipcbiAqIOS7peaWh+S7tuWkueWkjeWItueahOaWueW8j+WvvOWFpeaPkuS7tlxuICogQHBhcmFtIHR5cGVcbiAqIEBwYXJhbSBmb2xkZXJQYXRoXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydFBhY2thZ2VGb2xkZXIodHlwZTogc3RyaW5nLCBmb2xkZXJQYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBJbXBvcnRQYWNrYWdlT3B0aW9ucykge1xuICAgIHRocm93SWZOb3RFeGlzdHMoZm9sZGVyUGF0aCwgYFBhY2thZ2UgaW1wb3J0IGZhaWxlZDogaW52YWxpZCBwYWNrYWdlIGZvbGRlciBcIiR7Zm9sZGVyUGF0aH1cImApO1xuXG4gICAgY29uc3QgZGlzdCA9IGF3YWl0IGltcG9ydFBhY2thZ2VUZW1wbGF0ZSh7XG4gICAgICAgIGZvcmNlSW1wb3J0OiBvcHRpb25zPy5mb3JjZUltcG9ydCA/PyBmYWxzZSxcblxuICAgICAgICAvLyDnlKjkuo7lsZXnpLrnmoTlkI3np7DvvIzmsqHmnInnmoTor53lsLHnlKjmlofku7blpLnlkI3np7Dku6Pmm79cbiAgICAgICAgZXh0ZW5zaW9uRGlzcGxheU5hbWU6IG9wdGlvbnM/LmV4dGVuc2lvbkRpc3BsYXlOYW1lID8/IF9fcGF0aC5iYXNlbmFtZShmb2xkZXJQYXRoKSxcblxuICAgICAgICB0eXBlLFxuICAgICAgICBleHRlbnNpb25Gb2xkZXI6IGZvbGRlclBhdGgsXG4gICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcblxuICAgICAgICBhc3luYyBwcm9jZXNzb3IocGFja2FnZUZvbGRlciwgZGlzdCkge1xuICAgICAgICAgICAgLy8g5a6J6KOF5paH5Lu25aS544CC55u05o6l5aSN5Yi25Yiw55uu5qCH5L2N572u77yM5LiN56e76Zmk5Y6f5paH5Lu25aS5XG4gICAgICAgICAgICBhd2FpdCBmcy5jb3B5KHBhY2thZ2VGb2xkZXIsIGRpc3QpO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRpc3Q7XG59XG5cbi8qKlxuICog5bCG5o+S5Lu25paH5Lu25aS55Lul6L2v6ZO+5o6l55qE5pa55byP5a+85YWl77yM6YCC55So5LqO5pys5Zyw5byA5Y+R6LCD6K+VXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnRQYWNrYWdlU3ltbGluayh0eXBlOiBzdHJpbmcsIGZvbGRlclBhdGg6IHN0cmluZywgb3B0aW9ucz86IEltcG9ydFBhY2thZ2VPcHRpb25zKSB7XG4gICAgdGhyb3dJZk5vdEV4aXN0cyhmb2xkZXJQYXRoLCBgUGFja2FnZSBpbXBvcnQgZmFpbGVkOiBpbnZhbGlkIHBhY2thZ2UgZm9sZGVyIFwiJHtmb2xkZXJQYXRofVwiYCk7XG4gICAgcmV0dXJuIGltcG9ydFBhY2thZ2VUZW1wbGF0ZSh7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGV4dGVuc2lvbkRpc3BsYXlOYW1lOiBvcHRpb25zPy5leHRlbnNpb25EaXNwbGF5TmFtZSA/PyBfX3BhdGguYmFzZW5hbWUoZm9sZGVyUGF0aCksXG4gICAgICAgIGZvcmNlSW1wb3J0OiBvcHRpb25zPy5mb3JjZUltcG9ydCA/PyBmYWxzZSxcbiAgICAgICAgZXh0ZW5zaW9uRm9sZGVyOiBmb2xkZXJQYXRoLFxuICAgICAgICBzZWxlY3RlZFBhdGg6IGZvbGRlclBhdGgsXG4gICAgICAgIGFzeW5jIHByb2Nlc3NvcihwYWNrYWdlRm9sZGVyLCBkaXN0KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBkaXIgb3IganVuY3Rpb24gP1xuICAgICAgICAgICAgLy8gb24gd2luZG93cywgaXQgbmVlZHMgYWRtaW5pc3RyYXRvciByb2xlIHRvIGNyZWF0ZSBkaXIgc3ltbGlua1xuICAgICAgICAgICAgYXdhaXQgZnMuc3ltbGluayhwYWNrYWdlRm9sZGVyLCBkaXN0LCAnanVuY3Rpb24nKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuLyoqXG4gKiDlr7zlhaXpgLvovpHnm7jlhbPnmoTmqKHmnb/mlrnms5XjgIJcbiAqIOWQjue7remcgOaxguWPmOabtOaXtuWPr+S7peWinuWKoOabtOWkmuWPguaVsO+8jOaIluiAheWwhuaVtOS4quaooeadv+aWueazleaLhuaVo+aIkOWkmuS4quWwj+WHveaVsO+8jOiuqeWQhOS4quiwg+eUqOWFpeWPo+iHquW3seWOu+e7hOWQiOiwg+eUqFxuICovXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRQYWNrYWdlVGVtcGxhdGUob3B0aW9uczogUGFja2FnZUluc3RhbGxDb250ZXh0KSB7XG4gICAgY29uc3Qge1xuICAgICAgICAvL1xuICAgICAgICBleHRlbnNpb25EaXNwbGF5TmFtZTogX2V4dGVuc2lvbk5hbWUsXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGV4dGVuc2lvbkZvbGRlcjogZXh0ZW5zaW9uRm9sZGVyLFxuICAgICAgICBzZWxlY3RlZFBhdGgsXG4gICAgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgX2ZvcmNlSW1wb3J0ID0gb3B0aW9ucy5mb3JjZUltcG9ydDtcbiAgICBjb25zdCByb290UGF0aCA9IHR5cGUgPT09ICdwcm9qZWN0JyA/IEVkaXRvci5Qcm9qZWN0LnBhdGggOiBFZGl0b3IuQXBwLmhvbWU7XG4gICAgY29uc3QgcGtnUGF0aCA9IF9fcGF0aC5qb2luKHJvb3RQYXRoLCAnLi9leHRlbnNpb25zJyk7XG5cbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGtnUGF0aCkpIHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyKHBrZ1BhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpcm1SZWluc3RhbGwgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmIChfZm9yY2VJbXBvcnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbyhcbiAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnJlaW5zdGFsbCcsIHsgZXh0ZW5zaW9uTmFtZTogX2V4dGVuc2lvbk5hbWUgfSksXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnV0dG9uczogW0VkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmNvbmZpcm0nKSwgRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiByZXN1bHQucmVzcG9uc2UgIT09IDE7XG4gICAgfTtcblxuICAgIGNvbnN0IHBhY2thZ2VDb250ZXh0ID0gYXdhaXQgZGV0ZWN0UGFja2FnZShleHRlbnNpb25Gb2xkZXIpO1xuXG4gICAgaWYgKHBhY2thZ2VDb250ZXh0ID09IG51bGwpIHtcbiAgICAgICAgLy8gVE9ETzogZGVmaW5lIGEgY3VzdG9tIEVycm9yXG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2Fubm90RmluZFBhY2thZ2VKc29uKTtcbiAgICAgICAgKGVycm9yIGFzIGFueSkucGF0aCA9IGV4dGVuc2lvbkZvbGRlcjtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgLy8g5a2Q5paH5Lu25aS56YeM5qOA5rWL5Yiw55qE5omp5bGV5YyF77yM5qC85byP5LiN5q2j56Gu77yM5pi+56S65LiA5LiqIHdhcm5pbmcg5o+Q56S6XG4gICAgaWYgKHBhY2thZ2VDb250ZXh0Lm5lc3RlZCkge1xuICAgICAgICBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnppcERpcmVjdG9yeVdhcm5UaXRsZScsIHsgZXh0ZW5zaW9uTmFtZTogX2V4dGVuc2lvbk5hbWUgfSksXG4gICAgICAgICAgICBtZXNzYWdlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS56aXBEaXJlY3RvcnlXYXJuQ29udGVudCcpLFxuICAgICAgICAgICAgdHlwZTogJ3dhcm4nLFxuICAgICAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3QgPSBfX3BhdGguam9pbihwa2dQYXRoLCBwYWNrYWdlQ29udGV4dC5wYWNrYWdlTmFtZSk7XG4gICAgY29uc3QgcGFja2FnZUZvbGRlciA9IHBhY2thZ2VDb250ZXh0LnBhY2thZ2VGb2xkZXI7XG5cbiAgICAvLyDnm67moIfnm67lvZXlt7Lnu4/lrZjlnKjvvIzliKTmlq3lt7Lnu4/lronoo4Xkuobnm7jlkIzmj5Lku7bvvIzlvLnlh7ropobnm5bmj5DnpLrvvIzlkIzml7blgZrmm7/mjaLnmoTliY3nva7lt6XkvZxcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhkaXN0KSkge1xuICAgICAgICBpZiAoIShhd2FpdCBjb25maXJtUmVpbnN0YWxsKCkpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2xlYW51cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IG9wdGlvbnMuY2xlYW51cChwYWNrYWdlRm9sZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2FuY2VsJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmRpc2FibGUoZGlzdCwgeyByZXBsYWNlbWVudDogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihkaXN0KTtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAndHJhc2gtaXRlbScsIGRpc3QpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoZGlzdCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKGRpc3QpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZXJyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgb3B0aW9ucy5wcm9jZXNzb3IocGFja2FnZUZvbGRlciwgZGlzdCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNsZWFudXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgb3B0aW9ucy5jbGVhbnVwKHBhY2thZ2VGb2xkZXIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5pbXBvcnRTdWNjZXNzJyksXG4gICAgICAgIG1lc3NhZ2U6IF9leHRlbnNpb25OYW1lLFxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgfSk7XG4gICAgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoZGlzdCk7XG4gICAgcmV0dXJuIGRpc3Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdFBhY2thZ2Uob3JpZ2luRm9sZGVyOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBfX3BhdGguam9pbihvcmlnaW5Gb2xkZXIsICdwYWNrYWdlLmpzb24nKTtcblxuICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSAoYXdhaXQgZnMucmVhZEpzb24ocGFja2FnZUpzb25QYXRoKSkubmFtZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lLFxuICAgICAgICAgICAgcGFja2FnZUpzb25QYXRoLFxuICAgICAgICAgICAgcGFja2FnZUZvbGRlcjogb3JpZ2luRm9sZGVyLFxuICAgICAgICAgICAgbmVzdGVkOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDkuLrkuoblhbzlrrnmgKfvvIzlpJrmo4DmtYvkuIDlsYLmlofku7blpLlcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgZnMucmVhZGRpcihvcmlnaW5Gb2xkZXIpO1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBsaXN0KSB7XG4gICAgICAgIGNvbnN0IG5lc3RlZFBhY2thZ2VGb2xkZXIgPSBfX3BhdGguam9pbihvcmlnaW5Gb2xkZXIsIG5hbWUpO1xuICAgICAgICBjb25zdCBuZXN0ZWRQYWNrYWdlSnNvblBhdGggPSBfX3BhdGguam9pbihuZXN0ZWRQYWNrYWdlRm9sZGVyLCAncGFja2FnZS5qc29uJyk7XG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG5lc3RlZFBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSAoYXdhaXQgZnMucmVhZEpzb24obmVzdGVkUGFja2FnZUpzb25QYXRoKSkubmFtZTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICAgICAgICBwYWNrYWdlSnNvblBhdGg6IG5lc3RlZFBhY2thZ2VKc29uUGF0aCxcbiAgICAgICAgICAgIHBhY2thZ2VGb2xkZXI6IG5lc3RlZFBhY2thZ2VGb2xkZXIsXG4gICAgICAgICAgICBuZXN0ZWQ6IHRydWUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdfQ==