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
    const temp = path_1.default.join(tempDir, `extension_${_extensionName}_temp`);
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
            if (fs_extra_1.default.existsSync(packageFolder)) {
                await fs_extra_1.default.remove(packageFolder);
            }
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
            await options.cleanup(packageFolder);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3B1YmxpYy9pbXBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaURBQXNDO0FBRXRDLGFBQWE7QUFDYix3REFBK0I7QUFDL0Isd0RBQTBCO0FBQzFCLGdEQUEwQjtBQWViLFFBQUEseUJBQXlCLEdBQUc7SUFDckMsV0FBVyxFQUFFLGNBQWM7SUFDM0IsY0FBYyxFQUFFLGlCQUFpQjtJQUNqQyxNQUFNLEVBQUUsUUFBUTtJQUNoQixxQkFBcUIsRUFBRSwwQkFBMEI7Q0FDM0MsQ0FBQztBQTBCWCxNQUFNLGdCQUFnQixHQUFHLENBQUMsSUFBWSxFQUFFLEdBQVksRUFBRSxFQUFFO0lBQ3BELElBQUksQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxxQkFBcUIsSUFBSSxHQUFHLENBQUMsQ0FBQztLQUN4RDtBQUNMLENBQUMsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBTSxhQUFhLEdBQUcsVUFBUyxHQUFXLEVBQUUsSUFBWSxFQUFFLE9BQTJCO0lBQ2pGLE1BQU0sSUFBSSxHQUFHLGNBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsa0JBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsa0JBQU8sRUFBRSxDQUFDO0lBQ1YsYUFBYTtJQUNiLE1BQU0sS0FBSyxHQUFHLHFCQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUV0RCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFFakIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUU7UUFDckMsT0FBTyxJQUFJLElBQUks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ImltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBmaXhQYXRoIGZyb20gJ2ZpeC1wYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgX19wYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBQYWNrYWdlSW5mbyB9IGZyb20gJy4vaW50ZXJmYWNlJztcblxuZXhwb3J0IGludGVyZmFjZSBJbXBvcnRQYWNrYWdlT3B0aW9ucyB7XG4gICAgLyoqXG4gICAgICog6YCa55+l5pe25pi+56S655qE5omp5bGV5YyF55qE5ZCN5a2X77yM5LiOIHBhY2thZ2VKc29uLm5hbWUg5Y+v6IO95pyJ5Yy65YirXG4gICAgICovXG4gICAgZXh0ZW5zaW9uRGlzcGxheU5hbWU/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICog5LiN6K+i6Zeu55u05o6l5by65Yi26KaG55uW5Lul5YmN55qE5o+S5Lu2XG4gICAgICovXG4gICAgZm9yY2VJbXBvcnQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZSA9IHtcbiAgICBpbnZhbGlkUGF0aDogJ2ludmFsaWQgcGF0aCcsXG4gICAgZGVjb21wcmVzc0ZhaWw6ICdkZWNvbXByZXNzIGZhaWwnLFxuICAgIGNhbmNlbDogJ2NhbmNlbCcsXG4gICAgY2Fubm90RmluZFBhY2thZ2VKc29uOiAnY2Fubm90IGZpbmQgcGFja2FnZS5qc29uJyxcbn0gYXMgY29uc3Q7XG5cbnR5cGUgUHJvamVjdEltcG9ydFR5cGUgPSBQYWNrYWdlSW5mb1sndHlwZSddO1xudHlwZSBQYWNrYWdlSW5zdGFsbENvbnRleHQgPSBSZXF1aXJlZDxJbXBvcnRQYWNrYWdlT3B0aW9ucz4gJiB7XG4gICAgdHlwZTogUHJvamVjdEltcG9ydFR5cGUgfCBzdHJpbmc7IC8vICdwcm9qZWN0JyBhbmQgPz8/XG5cbiAgICAvKipcbiAgICAgKiDmj5Lku7blrZjlnKjnmoTmlofku7blpLnvvIh6aXAg5YyF6Kej5Y6L5ZCO55qE5Li05pe255uu5b2V44CB5o+S5Lu25omA5Zyo5paH5Lu25aS577yJXG4gICAgICovXG4gICAgZXh0ZW5zaW9uRm9sZGVyOiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICog55So5oi36YCJ5oup55qE6Lev5b6EKHppcCwgZm9sZGVyKVxuICAgICAqL1xuICAgIHNlbGVjdGVkUGF0aDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICog5YGa5LiA5Lqb5riF55CG5bel5L2cKOS4tOaXtuaWh+S7tilcbiAgICAgKi9cbiAgICBjbGVhbnVwPzogKHBhY2thZ2VGb2xkZXI6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcblxuICAgIC8qKlxuICAgICAqIOWkhOeQhua6kOaPkuS7tuaWh+S7tuWkueWIsOebruagh+WuieijheaWh+S7tuWkueeahOmAu+i+kVxuICAgICAqL1xuICAgIHByb2Nlc3NvcihwYWNrYWdlRm9sZGVyOiBzdHJpbmcsIGRpc3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59O1xuXG5jb25zdCB0aHJvd0lmTm90RXhpc3RzID0gKHBhdGg6IHN0cmluZywgbXNnPzogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cgPz8gYHBhdGggbm90IGV4aXN0czogXCIke3BhdGh9XCJgKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIG1hYyDkuIrnmoTop6Pljovmlrnms5VcbiAqL1xuY29uc3QgdW56aXBPZkRhcndpbiA9IGZ1bmN0aW9uKHNyYzogc3RyaW5nLCBkaXN0OiBzdHJpbmcsIG9uRXJyb3I6IChlcnI6IGFueSkgPT4gdm9pZCkge1xuICAgIGNvbnN0IHBhdGggPSBfX3BhdGguZGlybmFtZShkaXN0KTtcbiAgICBmcy5lbnN1cmVEaXJTeW5jKHBhdGgpO1xuICAgIGZpeFBhdGgoKTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgY2hpbGQgPSBzcGF3bigndW56aXAnLCBbJy1uJywgc3JjLCAnLWQnLCBkaXN0XSk7XG5cbiAgICBsZXQgZXJyVGV4dCA9ICcnO1xuXG4gICAgY2hpbGQuc3RkZXJyLm9uKCdkYXRhJywgKGRhdGE6IHN0cmluZykgPT4ge1xuICAgICAgICBlcnJUZXh0ICs9IGRhdGE7XG4gICAgfSk7XG4gICAgbGV0IHRleHQgPSAnJztcblxuICAgIGNoaWxkLnN0ZG91dC5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGV4dCArPSBkYXRhO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKCdlcnJvcicsIChlcnI6IGFueSkgPT4ge1xuICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyclRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBvbkVycm9yKGVycik7XG4gICAgfSk7XG4gICAgY2hpbGQub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyclRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb2RlID09IDAg5rWL6K+V6YCa6L+H77yM5YW25L2Z55qE5Li65paH5Lu25pyJ6Zeu6aKYXG4gICAgICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgICAgIGlmIChjb2RlICE9PSAwKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5kZWNvbXByZXNzRmFpbCcpKTtcbiAgICAgICAgfVxuICAgICAgICBvbkVycm9yKGVycm9yKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogd2luZG93cyDkuIrnmoTop6Pljovmlrnms5VcbiAqIEBwYXJhbSBzcmNcbiAqIEBwYXJhbSBkaXN0XG4gKiBAcGFyYW0gb25FcnJvclxuICovXG5jb25zdCB1bnppcE9mV2luMzIgPSBmdW5jdGlvbihzcmM6IHN0cmluZywgZGlzdDogc3RyaW5nLCBvbkVycm9yOiAoZXJyOiBhbnkpID0+IHZvaWQpIHtcbiAgICBjb25zdCBwYXRoID0gX19wYXRoLmRpcm5hbWUoZGlzdCk7XG4gICAgZnMuZW5zdXJlRGlyU3luYyhwYXRoKTtcblxuICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oX19wYXRoLmpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnLi4vdG9vbHMvdW56aXAuZXhlJyksIFsnLW4nLCBzcmMsICctZCcsIGRpc3RdKTtcblxuICAgIGxldCBlcnJUZXh0ID0gJyc7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgICAgZXJyVGV4dCArPSBkYXRhO1xuICAgIH0pO1xuICAgIGxldCB0ZXh0ID0gJyc7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNoaWxkLnN0ZG91dC5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGV4dCArPSBkYXRhO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKCdlcnJvcicsIChlcnI6IGFueSkgPT4ge1xuICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyclRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnJUZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBvbkVycm9yKGVycik7XG4gICAgfSk7XG4gICAgY2hpbGQub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtleHRlbnNpb25dICR7dGV4dH1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXJyVGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZXh0ZW5zaW9uXSAke2VyclRleHR9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29kZSA9PSAwIOa1i+ivlemAmui/h++8jOWFtuS9meeahOS4uuaWh+S7tuaciemXrumimFxuICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuZGVjb21wcmVzc0ZhaWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnJvcik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIOWvvOWFpeS4gOS4quaPkuS7tuWOi+e8qeWMheWIsOe8lui+keWZqOWGhe+8jOW5tuazqOWGjOi/meS4quaPkuS7tlxuICog5pyJ5Y+v6IO95Lya5Ye6546w5Lul5LiL6ZSZ6K+vOlxuICogQGVycm9yICdpbnZhbGlkIHBhdGgn77yM5b2T6Lev5b6E5LiN5a+55pe2XG4gKiBAZXJyb3IgJ2RlY29tcHJlc3MgZmFpbCcsIOino+WOi+Wksei0peaXtlxuICogQGVycm9yICdjYW5jZWwnLOWvvOWFpeiiq+WPlua2iFxuICogQHBhcmFtIHR5cGVcbiAqIEBwYXJhbSB6aXBGaWxlXG4gKiBAcGFyYW0gb3B0aW9ucy5leHRlbnNpb25EaXNwbGF5TmFtZSDpgJrnn6Xml7bmmL7npLrnmoTmianlsZXljIXnmoTlkI3lrZdcbiAqIEBwYXJhbSBvcHRpb25zLmZvcmNlSW1wb3J0IOS4jeivoumXruebtOaOpeW8uuWItuimhuebluS7peWJjeeahOaPkuS7tlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0UGFja2FnZShcbiAgICB0eXBlID0gJ3Byb2plY3QnLFxuICAgIHppcEZpbGU6IHN0cmluZyxcbiAgICBvcHRpb25zPzogSW1wb3J0UGFja2FnZU9wdGlvbnMsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IF9leHRlbnNpb25OYW1lID0gb3B0aW9ucz8uZXh0ZW5zaW9uRGlzcGxheU5hbWUgfHwgX19wYXRoLmJhc2VuYW1lKHppcEZpbGUsICcuemlwJyk7XG4gICAgY29uc3QgX2ZvcmNlSW1wb3J0ID0gb3B0aW9ucz8uZm9yY2VJbXBvcnQ7XG4gICAgY29uc3Qgcm9vdFBhdGggPSB0eXBlID09PSAncHJvamVjdCcgPyBFZGl0b3IuUHJvamVjdC5wYXRoIDogRWRpdG9yLkFwcC5ob21lO1xuICAgIGNvbnN0IHBrZ1BhdGggPSBfX3BhdGguam9pbihyb290UGF0aCwgJy4vZXh0ZW5zaW9ucycpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwa2dQYXRoKSkge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXIocGtnUGF0aCk7XG4gICAgfVxuXG4gICAgaWYgKCF6aXBGaWxlIHx8IHppcEZpbGUgPT09IHBrZ1BhdGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHBhdGgnKTtcbiAgICB9XG5cbiAgICBsZXQgdW56aXA6IEZ1bmN0aW9uO1xuXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgICAgdW56aXAgPSB1bnppcE9mV2luMzI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW56aXAgPSB1bnppcE9mRGFyd2luO1xuICAgIH1cbiAgICBjb25zdCB0ZW1wRGlyID0gRWRpdG9yLkFwcC50ZW1wO1xuICAgIGNvbnN0IHRlbXAgPSBfX3BhdGguam9pbih0ZW1wRGlyLCBgZXh0ZW5zaW9uXyR7X2V4dGVuc2lvbk5hbWV9X3RlbXBgKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0RGVjb21wcmVzc1Rhc2tJRDogbnVtYmVyID0gRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5kZWNvbXByZXNzaW5nTm93JywgeyBleHRlbnNpb25OYW1lOiBfZXh0ZW5zaW9uTmFtZSB9KSxcbiAgICAgICAgICAgIHR5cGU6ICdsb2cnLFxuICAgICAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHVuemlwKHppcEZpbGUsIHRlbXAsIChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuVGFzay5yZW1vdmVOb3RpY2Uoc3RhcnREZWNvbXByZXNzVGFza0lEKTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmRlY29tcHJlc3NTdWNjZXNzJywgeyBleHRlbnNpb25OYW1lOiBfZXh0ZW5zaW9uTmFtZSB9KSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuaW1wb3J0aW5nTm93JywgeyBleHRlbnNpb25OYW1lOiBfZXh0ZW5zaW9uTmFtZSB9KSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6ICdleHRlbnNpb24nLFxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiA1MDAwLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZGVjb21wcmVzcyBmYWlsJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGltcG9ydFBhY2thZ2VUZW1wbGF0ZSh7XG4gICAgICAgIGZvcmNlSW1wb3J0OiBfZm9yY2VJbXBvcnQgPz8gZmFsc2UsXG4gICAgICAgIGV4dGVuc2lvbkRpc3BsYXlOYW1lOiBfZXh0ZW5zaW9uTmFtZSxcbiAgICAgICAgZXh0ZW5zaW9uRm9sZGVyOiB0ZW1wLFxuICAgICAgICBzZWxlY3RlZFBhdGg6IHppcEZpbGUsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGFzeW5jIHByb2Nlc3NvcihwYWNrYWdlRm9sZGVyLCBkaXN0KSB7XG4gICAgICAgICAgICBhd2FpdCBmcy5tb3ZlKHBhY2thZ2VGb2xkZXIsIGRpc3QsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICAgICAgICB9LFxuICAgICAgICBjbGVhbnVwOiBhc3luYyAocGFja2FnZUZvbGRlcikgPT4ge1xuICAgICAgICAgICAgLy8g5a6J6KOFIHppcCDml7YgcGFja2FnZUZvbGRlciDlupTor6XmmK8gemlwIOino+WOi+WHuueahOS4tOaXtuaWh+S7tuWkuVxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGFja2FnZUZvbGRlcikpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmcy5yZW1vdmUocGFja2FnZUZvbGRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSk7XG59XG5cbi8qKlxuICog5Lul5paH5Lu25aS55aSN5Yi255qE5pa55byP5a+85YWl5o+S5Lu2XG4gKiBAcGFyYW0gdHlwZVxuICogQHBhcmFtIGZvbGRlclBhdGhcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0UGFja2FnZUZvbGRlcih0eXBlOiBzdHJpbmcsIGZvbGRlclBhdGg6IHN0cmluZywgb3B0aW9ucz86IEltcG9ydFBhY2thZ2VPcHRpb25zKSB7XG4gICAgdGhyb3dJZk5vdEV4aXN0cyhmb2xkZXJQYXRoLCBgUGFja2FnZSBpbXBvcnQgZmFpbGVkOiBpbnZhbGlkIHBhY2thZ2UgZm9sZGVyIFwiJHtmb2xkZXJQYXRofVwiYCk7XG5cbiAgICBjb25zdCBkaXN0ID0gYXdhaXQgaW1wb3J0UGFja2FnZVRlbXBsYXRlKHtcbiAgICAgICAgZm9yY2VJbXBvcnQ6IG9wdGlvbnM/LmZvcmNlSW1wb3J0ID8/IGZhbHNlLFxuXG4gICAgICAgIC8vIOeUqOS6juWxleekuueahOWQjeensO+8jOayoeacieeahOivneWwseeUqOaWh+S7tuWkueWQjeensOS7o+abv1xuICAgICAgICBleHRlbnNpb25EaXNwbGF5TmFtZTogb3B0aW9ucz8uZXh0ZW5zaW9uRGlzcGxheU5hbWUgPz8gX19wYXRoLmJhc2VuYW1lKGZvbGRlclBhdGgpLFxuXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGV4dGVuc2lvbkZvbGRlcjogZm9sZGVyUGF0aCxcbiAgICAgICAgc2VsZWN0ZWRQYXRoOiBmb2xkZXJQYXRoLFxuXG4gICAgICAgIGFzeW5jIHByb2Nlc3NvcihwYWNrYWdlRm9sZGVyLCBkaXN0KSB7XG4gICAgICAgICAgICAvLyDlronoo4Xmlofku7blpLnjgILnm7TmjqXlpI3liLbliLDnm67moIfkvY3nva7vvIzkuI3np7vpmaTljp/mlofku7blpLlcbiAgICAgICAgICAgIGF3YWl0IGZzLmNvcHkocGFja2FnZUZvbGRlciwgZGlzdCk7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGlzdDtcbn1cblxuLyoqXG4gKiDlsIbmj5Lku7bmlofku7blpLnku6Xova/pk77mjqXnmoTmlrnlvI/lr7zlhaXvvIzpgILnlKjkuo7mnKzlnLDlvIDlj5HosIPor5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydFBhY2thZ2VTeW1saW5rKHR5cGU6IHN0cmluZywgZm9sZGVyUGF0aDogc3RyaW5nLCBvcHRpb25zPzogSW1wb3J0UGFja2FnZU9wdGlvbnMpIHtcbiAgICB0aHJvd0lmTm90RXhpc3RzKGZvbGRlclBhdGgsIGBQYWNrYWdlIGltcG9ydCBmYWlsZWQ6IGludmFsaWQgcGFja2FnZSBmb2xkZXIgXCIke2ZvbGRlclBhdGh9XCJgKTtcbiAgICByZXR1cm4gaW1wb3J0UGFja2FnZVRlbXBsYXRlKHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgZXh0ZW5zaW9uRGlzcGxheU5hbWU6IG9wdGlvbnM/LmV4dGVuc2lvbkRpc3BsYXlOYW1lID8/IF9fcGF0aC5iYXNlbmFtZShmb2xkZXJQYXRoKSxcbiAgICAgICAgZm9yY2VJbXBvcnQ6IG9wdGlvbnM/LmZvcmNlSW1wb3J0ID8/IGZhbHNlLFxuICAgICAgICBleHRlbnNpb25Gb2xkZXI6IGZvbGRlclBhdGgsXG4gICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcbiAgICAgICAgYXN5bmMgcHJvY2Vzc29yKHBhY2thZ2VGb2xkZXIsIGRpc3QpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGRpciBvciBqdW5jdGlvbiA/XG4gICAgICAgICAgICAvLyBvbiB3aW5kb3dzLCBpdCBuZWVkcyBhZG1pbmlzdHJhdG9yIHJvbGUgdG8gY3JlYXRlIGRpciBzeW1saW5rXG4gICAgICAgICAgICBhd2FpdCBmcy5zeW1saW5rKHBhY2thZ2VGb2xkZXIsIGRpc3QsICdqdW5jdGlvbicpO1xuICAgICAgICB9LFxuICAgIH0pO1xufVxuXG4vKipcbiAqIOWvvOWFpemAu+i+keebuOWFs+eahOaooeadv+aWueazleOAglxuICog5ZCO57ut6ZyA5rGC5Y+Y5pu05pe25Y+v5Lul5aKe5Yqg5pu05aSa5Y+C5pWw77yM5oiW6ICF5bCG5pW05Liq5qih5p2/5pa55rOV5ouG5pWj5oiQ5aSa5Liq5bCP5Ye95pWw77yM6K6p5ZCE5Liq6LCD55So5YWl5Y+j6Ieq5bex5Y6757uE5ZCI6LCD55SoXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGltcG9ydFBhY2thZ2VUZW1wbGF0ZShvcHRpb25zOiBQYWNrYWdlSW5zdGFsbENvbnRleHQpIHtcbiAgICBjb25zdCB7XG4gICAgICAgIC8vXG4gICAgICAgIGV4dGVuc2lvbkRpc3BsYXlOYW1lOiBfZXh0ZW5zaW9uTmFtZSxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgZXh0ZW5zaW9uRm9sZGVyOiBleHRlbnNpb25Gb2xkZXIsXG4gICAgICAgIHNlbGVjdGVkUGF0aCxcbiAgICB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBfZm9yY2VJbXBvcnQgPSBvcHRpb25zLmZvcmNlSW1wb3J0O1xuICAgIGNvbnN0IHJvb3RQYXRoID0gdHlwZSA9PT0gJ3Byb2plY3QnID8gRWRpdG9yLlByb2plY3QucGF0aCA6IEVkaXRvci5BcHAuaG9tZTtcbiAgICBjb25zdCBwa2dQYXRoID0gX19wYXRoLmpvaW4ocm9vdFBhdGgsICcuL2V4dGVuc2lvbnMnKTtcblxuICAgIGlmICghZnMuZXhpc3RzU3luYyhwa2dQYXRoKSkge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXIocGtnUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlybVJlaW5zdGFsbCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKF9mb3JjZUltcG9ydCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5pbmZvKFxuICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUucmVpbnN0YWxsJywgeyBleHRlbnNpb25OYW1lOiBfZXh0ZW5zaW9uTmFtZSB9KSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuY29uZmlybScpLCBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5jYW5jZWwnKV0sXG4gICAgICAgICAgICAgICAgY2FuY2VsOiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZXNwb25zZSAhPT0gMTtcbiAgICB9O1xuXG4gICAgY29uc3QgcGFja2FnZUNvbnRleHQgPSBhd2FpdCBkZXRlY3RQYWNrYWdlKGV4dGVuc2lvbkZvbGRlcik7XG5cbiAgICBpZiAocGFja2FnZUNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgICAvLyBUT0RPOiBkZWZpbmUgYSBjdXN0b20gRXJyb3JcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoSW1wb3J0UGFja2FnZUVycm9yTWVzc2FnZS5jYW5ub3RGaW5kUGFja2FnZUpzb24pO1xuICAgICAgICAoZXJyb3IgYXMgYW55KS5wYXRoID0gZXh0ZW5zaW9uRm9sZGVyO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICAvLyDlrZDmlofku7blpLnph4zmo4DmtYvliLDnmoTmianlsZXljIXvvIzmoLzlvI/kuI3mraPnoa7vvIzmmL7npLrkuIDkuKogd2FybmluZyDmj5DnpLpcbiAgICBpZiAocGFja2FnZUNvbnRleHQubmVzdGVkKSB7XG4gICAgICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuemlwRGlyZWN0b3J5V2FyblRpdGxlJywgeyBleHRlbnNpb25OYW1lOiBfZXh0ZW5zaW9uTmFtZSB9KSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnppcERpcmVjdG9yeVdhcm5Db250ZW50JyksXG4gICAgICAgICAgICB0eXBlOiAnd2FybicsXG4gICAgICAgICAgICBzb3VyY2U6ICdleHRlbnNpb24nLFxuICAgICAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgZGlzdCA9IF9fcGF0aC5qb2luKHBrZ1BhdGgsIHBhY2thZ2VDb250ZXh0LnBhY2thZ2VOYW1lKTtcbiAgICBjb25zdCBwYWNrYWdlRm9sZGVyID0gcGFja2FnZUNvbnRleHQucGFja2FnZUZvbGRlcjtcblxuICAgIC8vIOebruagh+ebruW9leW3sue7j+WtmOWcqO+8jOWIpOaWreW3sue7j+WuieijheS6huebuOWQjOaPkuS7tu+8jOW8ueWHuuimhuebluaPkOekuu+8jOWQjOaXtuWBmuabv+aNoueahOWJjee9ruW3peS9nFxuICAgIGlmIChmcy5leGlzdHNTeW5jKGRpc3QpKSB7XG4gICAgICAgIGlmICghKGF3YWl0IGNvbmZpcm1SZWluc3RhbGwoKSkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jbGVhbnVwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgb3B0aW9ucy5jbGVhbnVwKHBhY2thZ2VGb2xkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5jZWwnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZGlzYWJsZShkaXN0LCB7IHJlcGxhY2VtZW50OiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS51bnJlZ2lzdGVyKGRpc3QpO1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2V4dGVuc2lvbicsICd0cmFzaC1pdGVtJywgZGlzdCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5yZWdpc3RlcihkaXN0KTtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5lbmFibGUoZGlzdCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBvcHRpb25zLnByb2Nlc3NvcihwYWNrYWdlRm9sZGVyLCBkaXN0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2xlYW51cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgYXdhaXQgb3B0aW9ucy5jbGVhbnVwKHBhY2thZ2VGb2xkZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmltcG9ydFN1Y2Nlc3MnKSxcbiAgICAgICAgbWVzc2FnZTogX2V4dGVuc2lvbk5hbWUsXG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICB9KTtcbiAgICBFZGl0b3IuUGFja2FnZS5yZWdpc3RlcihkaXN0KTtcbiAgICByZXR1cm4gZGlzdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZGV0ZWN0UGFja2FnZShvcmlnaW5Gb2xkZXI6IHN0cmluZykge1xuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IF9fcGF0aC5qb2luKG9yaWdpbkZvbGRlciwgJ3BhY2thZ2UuanNvbicpO1xuXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocGFja2FnZUpzb25QYXRoKSkge1xuICAgICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IChhd2FpdCBmcy5yZWFkSnNvbihwYWNrYWdlSnNvblBhdGgpKS5uYW1lO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICAgICAgICBwYWNrYWdlSnNvblBhdGgsXG4gICAgICAgICAgICBwYWNrYWdlRm9sZGVyOiBvcmlnaW5Gb2xkZXIsXG4gICAgICAgICAgICBuZXN0ZWQ6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOS4uuS6huWFvOWuueaAp++8jOWkmuajgOa1i+S4gOWxguaWh+S7tuWkuVxuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBmcy5yZWFkZGlyKG9yaWdpbkZvbGRlcik7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIGxpc3QpIHtcbiAgICAgICAgY29uc3QgbmVzdGVkUGFja2FnZUZvbGRlciA9IF9fcGF0aC5qb2luKG9yaWdpbkZvbGRlciwgbmFtZSk7XG4gICAgICAgIGNvbnN0IG5lc3RlZFBhY2thZ2VKc29uUGF0aCA9IF9fcGF0aC5qb2luKG5lc3RlZFBhY2thZ2VGb2xkZXIsICdwYWNrYWdlLmpzb24nKTtcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobmVzdGVkUGFja2FnZUpzb25QYXRoKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IChhd2FpdCBmcy5yZWFkSnNvbihuZXN0ZWRQYWNrYWdlSnNvblBhdGgpKS5uYW1lO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYWNrYWdlTmFtZSxcbiAgICAgICAgICAgIHBhY2thZ2VKc29uUGF0aDogbmVzdGVkUGFja2FnZUpzb25QYXRoLFxuICAgICAgICAgICAgcGFja2FnZUZvbGRlcjogbmVzdGVkUGFja2FnZUZvbGRlcixcbiAgICAgICAgICAgIG5lc3RlZDogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIl19