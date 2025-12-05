"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPackageByFolderPath = exports.importPackageSymlink = exports.importPackageFolder = exports.importPackage = exports.ImportPackageErrorMessage = void 0;
const child_process_1 = require("child_process");
// @ts-ignore
const fix_path_1 = __importDefault(require("fix-path"));
const fs_extra_1 = __importStar(require("fs-extra"));
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
    (0, fix_path_1.default)();
    // @ts-ignore
    const child = (0, child_process_1.spawn)('unzip', ['-n', src, '-d', dist]);
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
    const child = (0, child_process_1.spawn)(path_1.default.join(Editor.App.path, '../tools/unzip.exe'), ['-n', src, '-d', dist]);
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
 * 针对已放入extension文件夹的扩展实现注册与导入
 * @param extensionPath
 * @returns
 */
async function importPackageByFolderPath(extensionPath) {
    try {
        // 如果插件不存在，则无需执行
        if (!(await (0, fs_extra_1.pathExists)(extensionPath)))
            return;
        const packageContext = await detectPackage(extensionPath);
        if (packageContext == null) {
            // TODO: define a custom Error
            const error = new Error(exports.ImportPackageErrorMessage.cannotFindPackageJson);
            error.path = extensionPath;
            throw error;
        }
        await Editor.Package.register(extensionPath);
        await Editor.Package.enable(extensionPath);
    }
    catch (err) {
        console.error(err);
    }
}
exports.importPackageByFolderPath = importPackageByFolderPath;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3B1YmxpYy9pbXBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBc0M7QUFFdEMsYUFBYTtBQUNiLHdEQUErQjtBQUMvQixxREFBMEM7QUFDMUMsZ0RBQTBCO0FBZWIsUUFBQSx5QkFBeUIsR0FBRztJQUNyQyxXQUFXLEVBQUUsY0FBYztJQUMzQixjQUFjLEVBQUUsaUJBQWlCO0lBQ2pDLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLHFCQUFxQixFQUFFLDBCQUEwQjtDQUMzQyxDQUFDO0FBMEJYLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxJQUFZLEVBQUUsR0FBWSxFQUFFLEVBQUU7SUFDcEQsSUFBSSxDQUFDLGtCQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLHFCQUFxQixJQUFJLEdBQUcsQ0FBQyxDQUFDO0tBQ3hEO0FBQ0wsQ0FBQyxDQUFDO0FBRUY7O0dBRUc7QUFDSCxNQUFNLGFBQWEsR0FBRyxVQUFTLEdBQVcsRUFBRSxJQUFZLEVBQUUsT0FBMkI7SUFDakYsTUFBTSxJQUFJLEdBQUcsY0FBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxrQkFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixJQUFBLGtCQUFPLEdBQUUsQ0FBQztJQUNWLGFBQWE7SUFDYixNQUFNLEtBQUssR0FBRyxJQUFBLHFCQUFLLEVBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUV0RCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFFakIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFB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QWMsQ0FBQyxDQUFDO0lBRWxFLElBQUksa0JBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7UUFDaEMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFNLGtCQUFFLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzlELE9BQU87WUFDSCxXQUFXO1lBQ1gsZUFBZTtZQUNmLGFBQWEsRUFBRSxZQUFZO1lBQzNCLE1BQU0sRUFBRSxLQUFLO1NBQ2hCLENBQUM7S0FDTDtJQUVELGlCQUFpQjtJQUNqQixNQUFNLElBQUksR0FBRyxNQUFNLGtCQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzVDLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxFQUFFO1FBQ3JCLE1BQU0sbUJBQW1CLEdBQUcsY0FBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUQsTUFBTSxxQkFBcUIsR0FBRyxjQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRS9FLElBQUksQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFO1lBQ3ZDLFNBQVM7U0FDWjtRQUVELE1BQU0sV0FBVyxHQUFHLENBQUMsTUFBTSxrQkFBRSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRXBFLE9BQU87WUFDSCxXQUFXO1lBQ1gsZUFBZSxFQUFFLHFCQUFxQjtZQUN0QyxhQUFhLEVBQUUsbUJBQW1CO1lBQ2xDLE1BQU0sRUFBRSxJQUFJO1NBQ2YsQ0FBQztLQUNMO0lBRUQsT0FBTyxTQUFTLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCBmaXhQYXRoIGZyb20gJ2ZpeC1wYXRoJztcbmltcG9ydCBmcywgeyBwYXRoRXhpc3RzIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IF9fcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHsgUGFja2FnZUluZm8gfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1wb3J0UGFja2FnZU9wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIOmAmuefpeaXtuaYvuekuueahOaJqeWxleWMheeahOWQjeWtl++8jOS4jiBwYWNrYWdlSnNvbi5uYW1lIOWPr+iDveacieWMuuWIq1xuICAgICAqL1xuICAgIGV4dGVuc2lvbkRpc3BsYXlOYW1lPzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIOS4jeivoumXruebtOaOpeW8uuWItuimhuebluS7peWJjeeahOaPkuS7tlxuICAgICAqL1xuICAgIGZvcmNlSW1wb3J0PzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UgPSB7XG4gICAgaW52YWxpZFBhdGg6ICdpbnZhbGlkIHBhdGgnLFxuICAgIGRlY29tcHJlc3NGYWlsOiAnZGVjb21wcmVzcyBmYWlsJyxcbiAgICBjYW5jZWw6ICdjYW5jZWwnLFxuICAgIGNhbm5vdEZpbmRQYWNrYWdlSnNvbjogJ2Nhbm5vdCBmaW5kIHBhY2thZ2UuanNvbicsXG59IGFzIGNvbnN0O1xuXG50eXBlIFByb2plY3RJbXBvcnRUeXBlID0gUGFja2FnZUluZm9bJ3R5cGUnXTtcbnR5cGUgUGFja2FnZUluc3RhbGxDb250ZXh0ID0gUmVxdWlyZWQ8SW1wb3J0UGFja2FnZU9wdGlvbnM+ICYge1xuICAgIHR5cGU6IFByb2plY3RJbXBvcnRUeXBlIHwgc3RyaW5nOyAvLyAncHJvamVjdCcgYW5kID8/P1xuXG4gICAgLyoqXG4gICAgICog5o+S5Lu25a2Y5Zyo55qE5paH5Lu25aS577yIemlwIOWMheino+WOi+WQjueahOS4tOaXtuebruW9leOAgeaPkuS7tuaJgOWcqOaWh+S7tuWkue+8iVxuICAgICAqL1xuICAgIGV4dGVuc2lvbkZvbGRlcjogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIOeUqOaIt+mAieaLqeeahOi3r+W+hCh6aXAsIGZvbGRlcilcbiAgICAgKi9cbiAgICBzZWxlY3RlZFBhdGg6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIOWBmuS4gOS6m+a4heeQhuW3peS9nCjkuLTml7bmlofku7YpXG4gICAgICovXG4gICAgY2xlYW51cD86IChwYWNrYWdlRm9sZGVyOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD47XG5cbiAgICAvKipcbiAgICAgKiDlpITnkIbmupDmj5Lku7bmlofku7blpLnliLDnm67moIflronoo4Xmlofku7blpLnnmoTpgLvovpFcbiAgICAgKi9cbiAgICBwcm9jZXNzb3IocGFja2FnZUZvbGRlcjogc3RyaW5nLCBkaXN0OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufTtcblxuY29uc3QgdGhyb3dJZk5vdEV4aXN0cyA9IChwYXRoOiBzdHJpbmcsIG1zZz86IHN0cmluZykgPT4ge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnID8/IGBwYXRoIG5vdCBleGlzdHM6IFwiJHtwYXRofVwiYCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBtYWMg5LiK55qE6Kej5Y6L5pa55rOVXG4gKi9cbmNvbnN0IHVuemlwT2ZEYXJ3aW4gPSBmdW5jdGlvbihzcmM6IHN0cmluZywgZGlzdDogc3RyaW5nLCBvbkVycm9yOiAoZXJyOiBhbnkpID0+IHZvaWQpIHtcbiAgICBjb25zdCBwYXRoID0gX19wYXRoLmRpcm5hbWUoZGlzdCk7XG4gICAgZnMuZW5zdXJlRGlyU3luYyhwYXRoKTtcbiAgICBmaXhQYXRoKCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oJ3VuemlwJywgWyctbicsIHNyYywgJy1kJywgZGlzdF0pO1xuXG4gICAgbGV0IGVyclRleHQgPSAnJztcblxuICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgICAgZXJyVGV4dCArPSBkYXRhO1xuICAgIH0pO1xuICAgIGxldCB0ZXh0ID0gJyc7XG5cbiAgICBjaGlsZC5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRleHQgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbignZXJyb3InLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJUZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJUZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29kZSA9PSAwIOa1i+ivlemAmui/h++8jOWFtuS9meeahOS4uuaWh+S7tuaciemXrumimFxuICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuZGVjb21wcmVzc0ZhaWwnKSk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnJvcik7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIHdpbmRvd3Mg5LiK55qE6Kej5Y6L5pa55rOVXG4gKiBAcGFyYW0gc3JjXG4gKiBAcGFyYW0gZGlzdFxuICogQHBhcmFtIG9uRXJyb3JcbiAqL1xuY29uc3QgdW56aXBPZldpbjMyID0gZnVuY3Rpb24oc3JjOiBzdHJpbmcsIGRpc3Q6IHN0cmluZywgb25FcnJvcjogKGVycjogYW55KSA9PiB2b2lkKSB7XG4gICAgY29uc3QgcGF0aCA9IF9fcGF0aC5kaXJuYW1lKGRpc3QpO1xuICAgIGZzLmVuc3VyZURpclN5bmMocGF0aCk7XG5cbiAgICBjb25zdCBjaGlsZCA9IHNwYXduKF9fcGF0aC5qb2luKEVkaXRvci5BcHAucGF0aCwgJy4uL3Rvb2xzL3VuemlwLmV4ZScpLCBbJy1uJywgc3JjLCAnLWQnLCBkaXN0XSk7XG5cbiAgICBsZXQgZXJyVGV4dCA9ICcnO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjaGlsZC5zdGRlcnIub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGVyclRleHQgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBsZXQgdGV4dCA9ICcnO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjaGlsZC5zdGRvdXQub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRleHQgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbignZXJyb3InLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcnJUZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZXJyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgb25FcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKCdjbG9zZScsIChjb2RlOiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbZXh0ZW5zaW9uXSAke3RleHR9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVyclRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2V4dGVuc2lvbl0gJHtlcnJUZXh0fWApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvZGUgPT0gMCDmtYvor5XpgJrov4fvvIzlhbbkvZnnmoTkuLrmlofku7bmnInpl67pophcbiAgICAgICAgbGV0IGVycm9yID0gbnVsbDtcbiAgICAgICAgaWYgKGNvZGUgIT09IDApIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmRlY29tcHJlc3NGYWlsJykpO1xuICAgICAgICB9XG4gICAgICAgIG9uRXJyb3IoZXJyb3IpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiDlr7zlhaXkuIDkuKrmj5Lku7bljovnvKnljIXliLDnvJbovpHlmajlhoXvvIzlubbms6jlhozov5nkuKrmj5Lku7ZcbiAqIOacieWPr+iDveS8muWHuueOsOS7peS4i+mUmeivrzpcbiAqIEBlcnJvciAnaW52YWxpZCBwYXRoJ++8jOW9k+i3r+W+hOS4jeWvueaXtlxuICogQGVycm9yICdkZWNvbXByZXNzIGZhaWwnLCDop6PljovlpLHotKXml7ZcbiAqIEBlcnJvciAnY2FuY2VsJyzlr7zlhaXooqvlj5bmtohcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcGFyYW0gemlwRmlsZVxuICogQHBhcmFtIG9wdGlvbnMuZXh0ZW5zaW9uRGlzcGxheU5hbWUg6YCa55+l5pe25pi+56S655qE5omp5bGV5YyF55qE5ZCN5a2XXG4gKiBAcGFyYW0gb3B0aW9ucy5mb3JjZUltcG9ydCDkuI3or6Lpl67nm7TmjqXlvLrliLbopobnm5bku6XliY3nmoTmj5Lku7ZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydFBhY2thZ2UoXG4gICAgdHlwZSA9ICdwcm9qZWN0JyxcbiAgICB6aXBGaWxlOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IEltcG9ydFBhY2thZ2VPcHRpb25zLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBfZXh0ZW5zaW9uTmFtZSA9IG9wdGlvbnM/LmV4dGVuc2lvbkRpc3BsYXlOYW1lIHx8IF9fcGF0aC5iYXNlbmFtZSh6aXBGaWxlLCAnLnppcCcpO1xuICAgIGNvbnN0IF9mb3JjZUltcG9ydCA9IG9wdGlvbnM/LmZvcmNlSW1wb3J0O1xuICAgIGNvbnN0IHJvb3RQYXRoID0gdHlwZSA9PT0gJ3Byb2plY3QnID8gRWRpdG9yLlByb2plY3QucGF0aCA6IEVkaXRvci5BcHAuaG9tZTtcbiAgICBjb25zdCBwa2dQYXRoID0gX19wYXRoLmpvaW4ocm9vdFBhdGgsICcuL2V4dGVuc2lvbnMnKTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGtnUGF0aCkpIHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyKHBrZ1BhdGgpO1xuICAgIH1cblxuICAgIGlmICghemlwRmlsZSB8fCB6aXBGaWxlID09PSBwa2dQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwYXRoJyk7XG4gICAgfVxuXG4gICAgbGV0IHVuemlwOiBGdW5jdGlvbjtcblxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIHVuemlwID0gdW56aXBPZldpbjMyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuemlwID0gdW56aXBPZkRhcndpbjtcbiAgICB9XG4gICAgY29uc3QgdGVtcERpciA9IEVkaXRvci5BcHAudGVtcDtcbiAgICAvLyBGSVhNRTog5piv5ZCm5a2Y5Zyo5paH5Lu25aS55ZCN56ew6L+H6ZW/55qE6Zeu6aKY77yf5Y+v5Lul6ICD6JmR55Sf5oiQ5LiA5LiqIGhhc2gg6KGo56S655qE5paH5Lu25aS55ZCN56ewXG4gICAgY29uc3QgdGVtcCA9IF9fcGF0aC5qb2luKHRlbXBEaXIsIGBleHRlbnNpb25fJHtfZXh0ZW5zaW9uTmFtZX1fJHtEYXRlLm5vdygpfWApO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RhcnREZWNvbXByZXNzVGFza0lEOiBudW1iZXIgPSBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmRlY29tcHJlc3NpbmdOb3cnLCB7IGV4dGVuc2lvbk5hbWU6IF9leHRlbnNpb25OYW1lIH0pLFxuICAgICAgICAgICAgdHlwZTogJ2xvZycsXG4gICAgICAgICAgICBzb3VyY2U6ICdleHRlbnNpb24nLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdW56aXAoemlwRmlsZSwgdGVtcCwgKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIEVkaXRvci5UYXNrLnJlbW92ZU5vdGljZShzdGFydERlY29tcHJlc3NUYXNrSUQpO1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuZGVjb21wcmVzc1N1Y2Nlc3MnLCB7IGV4dGVuc2lvbk5hbWU6IF9leHRlbnNpb25OYW1lIH0pLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5pbXBvcnRpbmdOb3cnLCB7IGV4dGVuc2lvbk5hbWU6IF9leHRlbnNpb25OYW1lIH0pLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdkZWNvbXByZXNzIGZhaWwnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0UGFja2FnZVRlbXBsYXRlKHtcbiAgICAgICAgZm9yY2VJbXBvcnQ6IF9mb3JjZUltcG9ydCA/PyBmYWxzZSxcbiAgICAgICAgZXh0ZW5zaW9uRGlzcGxheU5hbWU6IF9leHRlbnNpb25OYW1lLFxuICAgICAgICBleHRlbnNpb25Gb2xkZXI6IHRlbXAsXG4gICAgICAgIHNlbGVjdGVkUGF0aDogemlwRmlsZSxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgYXN5bmMgcHJvY2Vzc29yKHBhY2thZ2VGb2xkZXIsIGRpc3QpIHtcbiAgICAgICAgICAgIGF3YWl0IGZzLm1vdmUocGFja2FnZUZvbGRlciwgZGlzdCwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFudXA6IGFzeW5jIChwYWNrYWdlRm9sZGVyKSA9PiB7XG4gICAgICAgICAgICAvLyDlronoo4UgemlwIOaXtiBwYWNrYWdlRm9sZGVyIOW6lOivpeaYryB6aXAg6Kej5Y6L5Ye655qE5Li05pe25paH5Lu25aS5XG4gICAgICAgICAgICAvLyBwcm9jZXNzb3Ig55qE5aSE55CG5pa55byP5pivIG1vdmXvvIzlpoLmnpzlhoXpg6jmlofku7blpLnlm6DmhI/lpJbmnKrooqvnp7votbDvvIzov5nph4zkvJrmiorlroPliKDpmaRcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VGb2xkZXIpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlKHBhY2thZ2VGb2xkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgZnMucmVtb3ZlKHRlbXApO1xuICAgICAgICB9LFxuICAgIH0pO1xufVxuXG4vKipcbiAqIOS7peaWh+S7tuWkueWkjeWItueahOaWueW8j+WvvOWFpeaPkuS7tlxuICogQHBhcmFtIHR5cGVcbiAqIEBwYXJhbSBmb2xkZXJQYXRoXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydFBhY2thZ2VGb2xkZXIodHlwZTogc3RyaW5nLCBmb2xkZXJQYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBJbXBvcnRQYWNrYWdlT3B0aW9ucykge1xuICAgIHRocm93SWZOb3RFeGlzdHMoZm9sZGVyUGF0aCwgYFBhY2thZ2UgaW1wb3J0IGZhaWxlZDogaW52YWxpZCBwYWNrYWdlIGZvbGRlciBcIiR7Zm9sZGVyUGF0aH1cImApO1xuXG4gICAgY29uc3QgZGlzdCA9IGF3YWl0IGltcG9ydFBhY2thZ2VUZW1wbGF0ZSh7XG4gICAgICAgIGZvcmNlSW1wb3J0OiBvcHRpb25zPy5mb3JjZUltcG9ydCA/PyBmYWxzZSxcblxuICAgICAgICAvLyDnlKjkuo7lsZXnpLrnmoTlkI3np7DvvIzmsqHmnInnmoTor53lsLHnlKjmlofku7blpLnlkI3np7Dku6Pmm79cbiAgICAgICAgZXh0ZW5zaW9uRGlzcGxheU5hbWU6IG9wdGlvbnM/LmV4dGVuc2lvbkRpc3BsYXlOYW1lID8/IF9fcGF0aC5iYXNlbmFtZShmb2xkZXJQYXRoKSxcblxuICAgICAgICB0eXBlLFxuICAgICAgICBleHRlbnNpb25Gb2xkZXI6IGZvbGRlclBhdGgsXG4gICAgICAgIHNlbGVjdGVkUGF0aDogZm9sZGVyUGF0aCxcblxuICAgICAgICBhc3luYyBwcm9jZXNzb3IocGFja2FnZUZvbGRlciwgZGlzdCkge1xuICAgICAgICAgICAgLy8g5a6J6KOF5paH5Lu25aS544CC55u05o6l5aSN5Yi25Yiw55uu5qCH5L2N572u77yM5LiN56e76Zmk5Y6f5paH5Lu25aS5XG4gICAgICAgICAgICBhd2FpdCBmcy5jb3B5KHBhY2thZ2VGb2xkZXIsIGRpc3QpO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRpc3Q7XG59XG5cbi8qKlxuICog5bCG5o+S5Lu25paH5Lu25aS55Lul6L2v6ZO+5o6l55qE5pa55byP5a+85YWl77yM6YCC55So5LqO5pys5Zyw5byA5Y+R6LCD6K+VXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnRQYWNrYWdlU3ltbGluayh0eXBlOiBzdHJpbmcsIGZvbGRlclBhdGg6IHN0cmluZywgb3B0aW9ucz86IEltcG9ydFBhY2thZ2VPcHRpb25zKSB7XG4gICAgdGhyb3dJZk5vdEV4aXN0cyhmb2xkZXJQYXRoLCBgUGFja2FnZSBpbXBvcnQgZmFpbGVkOiBpbnZhbGlkIHBhY2thZ2UgZm9sZGVyIFwiJHtmb2xkZXJQYXRofVwiYCk7XG4gICAgcmV0dXJuIGltcG9ydFBhY2thZ2VUZW1wbGF0ZSh7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGV4dGVuc2lvbkRpc3BsYXlOYW1lOiBvcHRpb25zPy5leHRlbnNpb25EaXNwbGF5TmFtZSA/PyBfX3BhdGguYmFzZW5hbWUoZm9sZGVyUGF0aCksXG4gICAgICAgIGZvcmNlSW1wb3J0OiBvcHRpb25zPy5mb3JjZUltcG9ydCA/PyBmYWxzZSxcbiAgICAgICAgZXh0ZW5zaW9uRm9sZGVyOiBmb2xkZXJQYXRoLFxuICAgICAgICBzZWxlY3RlZFBhdGg6IGZvbGRlclBhdGgsXG4gICAgICAgIGFzeW5jIHByb2Nlc3NvcihwYWNrYWdlRm9sZGVyLCBkaXN0KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBkaXIgb3IganVuY3Rpb24gP1xuICAgICAgICAgICAgLy8gb24gd2luZG93cywgaXQgbmVlZHMgYWRtaW5pc3RyYXRvciByb2xlIHRvIGNyZWF0ZSBkaXIgc3ltbGlua1xuICAgICAgICAgICAgYXdhaXQgZnMuc3ltbGluayhwYWNrYWdlRm9sZGVyLCBkaXN0LCAnanVuY3Rpb24nKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuLyoqXG4gKiDpkojlr7nlt7LmlL7lhaVleHRlbnNpb27mlofku7blpLnnmoTmianlsZXlrp7njrDms6jlhozkuI7lr7zlhaVcbiAqIEBwYXJhbSBleHRlbnNpb25QYXRoIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRQYWNrYWdlQnlGb2xkZXJQYXRoKGV4dGVuc2lvblBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIOWmguaenOaPkuS7tuS4jeWtmOWcqO+8jOWImeaXoOmcgOaJp+ihjFxuICAgICAgICBpZiAoIShhd2FpdCBwYXRoRXhpc3RzKGV4dGVuc2lvblBhdGgpKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHBhY2thZ2VDb250ZXh0ID0gYXdhaXQgZGV0ZWN0UGFja2FnZShleHRlbnNpb25QYXRoKTtcblxuICAgICAgICBpZiAocGFja2FnZUNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gVE9ETzogZGVmaW5lIGEgY3VzdG9tIEVycm9yXG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihJbXBvcnRQYWNrYWdlRXJyb3JNZXNzYWdlLmNhbm5vdEZpbmRQYWNrYWdlSnNvbik7XG4gICAgICAgICAgICAoZXJyb3IgYXMgYW55KS5wYXRoID0gZXh0ZW5zaW9uUGF0aDtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoZXh0ZW5zaW9uUGF0aCk7XG4gICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmVuYWJsZShleHRlbnNpb25QYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDlr7zlhaXpgLvovpHnm7jlhbPnmoTmqKHmnb/mlrnms5XjgIJcbiAqIOWQjue7remcgOaxguWPmOabtOaXtuWPr+S7peWinuWKoOabtOWkmuWPguaVsO+8jOaIluiAheWwhuaVtOS4quaooeadv+aWueazleaLhuaVo+aIkOWkmuS4quWwj+WHveaVsO+8jOiuqeWQhOS4quiwg+eUqOWFpeWPo+iHquW3seWOu+e7hOWQiOiwg+eUqFxuICovXG5hc3luYyBmdW5jdGlvbiBpbXBvcnRQYWNrYWdlVGVtcGxhdGUob3B0aW9uczogUGFja2FnZUluc3RhbGxDb250ZXh0KSB7XG4gICAgY29uc3Qge1xuICAgICAgICAvL1xuICAgICAgICBleHRlbnNpb25EaXNwbGF5TmFtZTogX2V4dGVuc2lvbk5hbWUsXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGV4dGVuc2lvbkZvbGRlcjogZXh0ZW5zaW9uRm9sZGVyLFxuICAgICAgICBzZWxlY3RlZFBhdGgsXG4gICAgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgX2ZvcmNlSW1wb3J0ID0gb3B0aW9ucy5mb3JjZUltcG9ydDtcbiAgICBjb25zdCByb290UGF0aCA9IHR5cGUgPT09ICdwcm9qZWN0JyA/IEVkaXRvci5Qcm9qZWN0LnBhdGggOiBFZGl0b3IuQXBwLmhvbWU7XG4gICAgY29uc3QgcGtnUGF0aCA9IF9fcGF0aC5qb2luKHJvb3RQYXRoLCAnLi9leHRlbnNpb25zJyk7XG5cbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGtnUGF0aCkpIHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyKHBrZ1BhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpcm1SZWluc3RhbGwgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmIChfZm9yY2VJbXBvcnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cuaW5mbyhcbiAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnJlaW5zdGFsbCcsIHsgZXh0ZW5zaW9uTmFtZTogX2V4dGVuc2lvbk5hbWUgfSksXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYnV0dG9uczogW0VkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LmNvbmZpcm0nKSwgRWRpdG9yLkkxOG4udCgnZXh0ZW5zaW9uLm1lbnUuY2FuY2VsJyldLFxuICAgICAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiByZXN1bHQucmVzcG9uc2UgIT09IDE7XG4gICAgfTtcblxuICAgIGNvbnN0IHBhY2thZ2VDb250ZXh0ID0gYXdhaXQgZGV0ZWN0UGFja2FnZShleHRlbnNpb25Gb2xkZXIpO1xuXG4gICAgaWYgKHBhY2thZ2VDb250ZXh0ID09IG51bGwpIHtcbiAgICAgICAgLy8gVE9ETzogZGVmaW5lIGEgY3VzdG9tIEVycm9yXG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKEltcG9ydFBhY2thZ2VFcnJvck1lc3NhZ2UuY2Fubm90RmluZFBhY2thZ2VKc29uKTtcbiAgICAgICAgKGVycm9yIGFzIGFueSkucGF0aCA9IGV4dGVuc2lvbkZvbGRlcjtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgLy8g5a2Q5paH5Lu25aS56YeM5qOA5rWL5Yiw55qE5omp5bGV5YyF77yM5qC85byP5LiN5q2j56Gu77yM5pi+56S65LiA5LiqIHdhcm5pbmcg5o+Q56S6XG4gICAgaWYgKHBhY2thZ2VDb250ZXh0Lm5lc3RlZCkge1xuICAgICAgICBFZGl0b3IuVGFzay5hZGROb3RpY2Uoe1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2V4dGVuc2lvbi5tZW51LnppcERpcmVjdG9yeVdhcm5UaXRsZScsIHsgZXh0ZW5zaW9uTmFtZTogX2V4dGVuc2lvbk5hbWUgfSksXG4gICAgICAgICAgICBtZXNzYWdlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS56aXBEaXJlY3RvcnlXYXJuQ29udGVudCcpLFxuICAgICAgICAgICAgdHlwZTogJ3dhcm4nLFxuICAgICAgICAgICAgc291cmNlOiAnZXh0ZW5zaW9uJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3QgPSBfX3BhdGguam9pbihwa2dQYXRoLCBwYWNrYWdlQ29udGV4dC5wYWNrYWdlTmFtZSk7XG4gICAgY29uc3QgcGFja2FnZUZvbGRlciA9IHBhY2thZ2VDb250ZXh0LnBhY2thZ2VGb2xkZXI7XG5cbiAgICAvLyDnm67moIfnm67lvZXlt7Lnu4/lrZjlnKjvvIzliKTmlq3lt7Lnu4/lronoo4Xkuobnm7jlkIzmj5Lku7bvvIzlvLnlh7ropobnm5bmj5DnpLrvvIzlkIzml7blgZrmm7/mjaLnmoTliY3nva7lt6XkvZxcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhkaXN0KSkge1xuICAgICAgICBpZiAoIShhd2FpdCBjb25maXJtUmVpbnN0YWxsKCkpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2xlYW51cCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IG9wdGlvbnMuY2xlYW51cChwYWNrYWdlRm9sZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2FuY2VsJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmRpc2FibGUoZGlzdCwgeyByZXBsYWNlbWVudDogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihkaXN0KTtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAndHJhc2gtaXRlbScsIGRpc3QpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoZGlzdCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKGRpc3QpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZXJyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgb3B0aW9ucy5wcm9jZXNzb3IocGFja2FnZUZvbGRlciwgZGlzdCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNsZWFudXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgb3B0aW9ucy5jbGVhbnVwKHBhY2thZ2VGb2xkZXIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdleHRlbnNpb24ubWVudS5pbXBvcnRTdWNjZXNzJyksXG4gICAgICAgIG1lc3NhZ2U6IF9leHRlbnNpb25OYW1lLFxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgIHNvdXJjZTogJ2V4dGVuc2lvbicsXG4gICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgfSk7XG4gICAgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoZGlzdCk7XG4gICAgcmV0dXJuIGRpc3Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdFBhY2thZ2Uob3JpZ2luRm9sZGVyOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBfX3BhdGguam9pbihvcmlnaW5Gb2xkZXIsICdwYWNrYWdlLmpzb24nKTtcblxuICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSAoYXdhaXQgZnMucmVhZEpzb24ocGFja2FnZUpzb25QYXRoKSkubmFtZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lLFxuICAgICAgICAgICAgcGFja2FnZUpzb25QYXRoLFxuICAgICAgICAgICAgcGFja2FnZUZvbGRlcjogb3JpZ2luRm9sZGVyLFxuICAgICAgICAgICAgbmVzdGVkOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDkuLrkuoblhbzlrrnmgKfvvIzlpJrmo4DmtYvkuIDlsYLmlofku7blpLlcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgZnMucmVhZGRpcihvcmlnaW5Gb2xkZXIpO1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBsaXN0KSB7XG4gICAgICAgIGNvbnN0IG5lc3RlZFBhY2thZ2VGb2xkZXIgPSBfX3BhdGguam9pbihvcmlnaW5Gb2xkZXIsIG5hbWUpO1xuICAgICAgICBjb25zdCBuZXN0ZWRQYWNrYWdlSnNvblBhdGggPSBfX3BhdGguam9pbihuZXN0ZWRQYWNrYWdlRm9sZGVyLCAncGFja2FnZS5qc29uJyk7XG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKG5lc3RlZFBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSAoYXdhaXQgZnMucmVhZEpzb24obmVzdGVkUGFja2FnZUpzb25QYXRoKSkubmFtZTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICAgICAgICBwYWNrYWdlSnNvblBhdGg6IG5lc3RlZFBhY2thZ2VKc29uUGF0aCxcbiAgICAgICAgICAgIHBhY2thZ2VGb2xkZXI6IG5lc3RlZFBhY2thZ2VGb2xkZXIsXG4gICAgICAgICAgICBuZXN0ZWQ6IHRydWUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdfQ==