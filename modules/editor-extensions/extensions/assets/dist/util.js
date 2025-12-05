"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFile = exports.getPackageFileExtend = exports.getFileTree = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const plist_1 = require("plist");
async function getFileTree(filePath, root) {
    if (!(0, fs_extra_1.existsSync)(filePath))
        return [];
    const names = await (0, fs_extra_1.readdir)(filePath);
    const list = await Promise.all(names.map(async (name) => {
        const _path = (0, path_1.join)(filePath, name);
        let isDirectory = false;
        try {
            // 有一些特殊文件无法识别，比如快捷图标
            isDirectory = (0, fs_extra_1.statSync)(_path).isDirectory();
        }
        catch (error) {
            return undefined;
        }
        if (name.startsWith('.'))
            return undefined;
        const data = {
            detail: {
                value: name,
            },
            showArrow: false,
            isDirectory,
            filePath: _path,
            root: root,
        };
        if (isDirectory) {
            const children = (await getFileTree((0, path_1.join)(filePath, name), root)) ?? [];
            data.children = children;
            data.showArrow = !!children?.length;
        }
        return data;
    }));
    return list.filter(v => v !== undefined);
}
exports.getFileTree = getFileTree;
async function getPackageFileExtend(filePath) {
    const dirname = (0, path_1.basename)(filePath);
    const trees = await getFileTree(filePath, filePath);
    return {
        detail: {
            value: dirname,
        },
        showArrow: true,
        isDirectory: true,
        filePath: filePath,
        children: trees,
    };
}
exports.getPackageFileExtend = getPackageFileExtend;
async function getCodeEditor() {
    let appPath = '';
    // 优先偏好设置里的默认脚本编辑器
    const scriptEditorInfo = await Editor.Message.request('program', 'query-program-info', 'scriptEditor');
    if (scriptEditorInfo?.path) {
        appPath = scriptEditorInfo.path;
    }
    else {
        try {
            // 通过 vscode 注册的协议，获取 vscode 应用程序所在路径
            const protocol = await electron_1.app.getApplicationInfoForProtocol('vscode://');
            // vscode 默认的协议名称和应用程序的名称
            if (protocol.name === 'Visual Studio Code') {
                appPath = protocol.path;
            }
        }
        catch (error) {
            // 未安装 vscode 或没有注册协议或修改了协议信息
            // app.getApplicationInfoForProtocol() 接口没获取到协议，会报错，但不需要展示报错信息
        }
    }
    return appPath;
}
function openAssetWithProgram(file, program, args) {
    args = args || [];
    let cmd = '';
    if (process.platform === 'darwin') {
        cmd = 'open';
        if (program.endsWith('.app')) {
            program = (0, path_1.join)(program, '/Contents/MacOS/');
            const plistObj = (0, plist_1.parse)((0, fs_extra_1.readFileSync)((0, path_1.join)(program, '../Info.plist'), 'utf8'));
            program = (0, path_1.join)(program, plistObj.CFBundleExecutable);
        }
        if (args) {
            args.unshift('-a', program);
        }
        else {
            args = ['-a', program, file];
        }
    }
    else if (process.platform === 'win32') {
        cmd = program;
        if (!args?.length) {
            args = [file];
        }
    }
    const child = (0, child_process_1.spawn)(cmd, args, {
        detached: true,
        stdio: 'ignore',
    });
    child.unref();
}
async function openFile(filePath, root) {
    const app = await getCodeEditor();
    openAssetWithProgram(filePath, app, [root, filePath]); // Editor.Project.path
}
exports.openFile = openFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtCQUFzQztBQUN0Qyx1Q0FBdUU7QUFDdkUsdUNBQStCO0FBQy9CLGlEQUFzQztBQUN0QyxpQ0FBOEI7QUFFdkIsS0FBSyxVQUFVLFdBQVcsQ0FBQyxRQUFnQixFQUFFLElBQVk7SUFDNUQsSUFBSSxDQUFDLElBQUEscUJBQVUsRUFBQyxRQUFRLENBQUM7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNyQyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsa0JBQU8sRUFBQyxRQUFRLENBQUMsQ0FBQztJQUN0QyxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBWSxFQUFFLEVBQUU7UUFDNUQsTUFBTSxLQUFLLEdBQUcsSUFBQSxXQUFJLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25DLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN4QixJQUFJO1lBQ0EscUJBQXFCO1lBQ3JCLFdBQVcsR0FBRyxJQUFBLG1CQUFRLEVBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDL0M7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUFFLE9BQU8sU0FBUyxDQUFDO1FBQzNDLE1BQU0sSUFBSSxHQUFRO1lBQ2QsTUFBTSxFQUFFO2dCQUNKLEtBQUssRUFBRSxJQUFJO2FBQ2Q7WUFDRCxTQUFTLEVBQUUsS0FBSztZQUNoQixXQUFXO1lBQ1gsUUFBUSxFQUFFLEtBQUs7WUFDZixJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUM7UUFDRixJQUFJLFdBQVcsRUFBRTtZQUNiLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBTSxXQUFXLENBQUMsSUFBQSxXQUFJLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUM7U0FDdkM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUE5QkQsa0NBOEJDO0FBRU0sS0FBSyxVQUFVLG9CQUFvQixDQUFDLFFBQWdCO0lBQ3ZELE1BQU0sT0FBTyxHQUFHLElBQUEsZUFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLE1BQU0sS0FBSyxHQUFHLE1BQU0sV0FBVyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCxPQUFPO1FBQ0gsTUFBTSxFQUFFO1lBQ0osS0FBSyxFQUFFLE9BQU87U0FDakI7UUFDRCxTQUFTLEVBQUUsSUFBSTtRQUNmLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFFBQVEsRUFBRSxLQUFLO0tBQ2xCLENBQUM7QUFDTixDQUFDO0FBWkQsb0RBWUM7QUFFRCxLQUFLLFVBQVUsYUFBYTtJQUN4QixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsa0JBQWtCO0lBQ2xCLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDdkcsSUFBSSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUU7UUFDeEIsT0FBTyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQztLQUNuQztTQUFNO1FBQ0gsSUFBSTtZQUNBLHFDQUFxQztZQUNyQyxNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0RSx5QkFBeUI7WUFDekIsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLG9CQUFvQixFQUFFO2dCQUN4QyxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQzthQUMzQjtTQUNKO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWiw2QkFBNkI7WUFDN0IsOERBQThEO1NBQ2pFO0tBQ0o7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsT0FBZSxFQUFFLElBQWU7SUFDeEUsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDbEIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUMvQixHQUFHLEdBQUcsTUFBTSxDQUFDO1FBRWIsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzFCLE9BQU8sR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBUSxJQUFBLGFBQUssRUFBQyxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbEYsT0FBTyxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUN4RDtRQUVELElBQUksSUFBSSxFQUFFO1lBQ04sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDL0I7YUFBTTtZQUNILElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDaEM7S0FDSjtTQUFNLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUU7UUFDckMsR0FBRyxHQUFHLE9BQU8sQ0FBQztRQUVkLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO1lBQ2YsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakI7S0FDSjtJQUVELE1BQU0sS0FBSyxHQUFHLElBQUEscUJBQUssRUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO1FBQzNCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsS0FBSyxFQUFFLFFBQVE7S0FDbEIsQ0FBQyxDQUFDO0lBQ0gsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2xCLENBQUM7QUFFTSxLQUFLLFVBQVUsUUFBUSxDQUFDLFFBQWdCLEVBQUUsSUFBWTtJQUN6RCxNQUFNLEdBQUcsR0FBRyxNQUFNLGFBQWEsRUFBRSxDQUFDO0lBQ2xDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQjtBQUNqRixDQUFDO0FBSEQsNEJBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luLCBiYXNlbmFtZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcmVhZGRpciwgc3RhdFN5bmMsIGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGFwcCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ3BsaXN0JztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEZpbGVUcmVlKGZpbGVQYXRoOiBzdHJpbmcsIHJvb3Q6IHN0cmluZykge1xuICAgIGlmICghZXhpc3RzU3luYyhmaWxlUGF0aCkpIHJldHVybiBbXTtcbiAgICBjb25zdCBuYW1lcyA9IGF3YWl0IHJlYWRkaXIoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBQcm9taXNlLmFsbChuYW1lcy5tYXAoYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBfcGF0aCA9IGpvaW4oZmlsZVBhdGgsIG5hbWUpO1xuICAgICAgICBsZXQgaXNEaXJlY3RvcnkgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOacieS4gOS6m+eJueauiuaWh+S7tuaXoOazleivhuWIq++8jOavlOWmguW/q+aNt+Wbvuagh1xuICAgICAgICAgICAgaXNEaXJlY3RvcnkgPSBzdGF0U3luYyhfcGF0aCkuaXNEaXJlY3RvcnkoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUuc3RhcnRzV2l0aCgnLicpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBkYXRhOiBhbnkgPSB7XG4gICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93QXJyb3c6IGZhbHNlLCAvLyDmmK/lkKbmmL7npLrnrq3lpLRcbiAgICAgICAgICAgIGlzRGlyZWN0b3J5LCAvLyDnlKjmnaXmmL7npLrmlofku7blpLnlm77moIdcbiAgICAgICAgICAgIGZpbGVQYXRoOiBfcGF0aCwgLy8g5paH5Lu25Zyw5Z2A77yM5pa55L6/5omT5byAXG4gICAgICAgICAgICByb290OiByb290LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gKGF3YWl0IGdldEZpbGVUcmVlKGpvaW4oZmlsZVBhdGgsIG5hbWUpLCByb290KSkgPz8gW107XG4gICAgICAgICAgICBkYXRhLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgICAgICBkYXRhLnNob3dBcnJvdyA9ICEhY2hpbGRyZW4/Lmxlbmd0aDtcbiAgICAgICAgfSBcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSkpO1xuICAgIHJldHVybiBsaXN0LmZpbHRlcih2ID0+IHYgIT09IHVuZGVmaW5lZCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQYWNrYWdlRmlsZUV4dGVuZChmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGlybmFtZSA9IGJhc2VuYW1lKGZpbGVQYXRoKTtcbiAgICBjb25zdCB0cmVlcyA9IGF3YWl0IGdldEZpbGVUcmVlKGZpbGVQYXRoLCBmaWxlUGF0aCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICB2YWx1ZTogZGlybmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2hvd0Fycm93OiB0cnVlLFxuICAgICAgICBpc0RpcmVjdG9yeTogdHJ1ZSxcbiAgICAgICAgZmlsZVBhdGg6IGZpbGVQYXRoLFxuICAgICAgICBjaGlsZHJlbjogdHJlZXMsXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29kZUVkaXRvcigpIHtcbiAgICBsZXQgYXBwUGF0aCA9ICcnO1xuICAgIC8vIOS8mOWFiOWBj+Wlveiuvue9rumHjOeahOm7mOiupOiEmuacrOe8lui+keWZqFxuICAgIGNvbnN0IHNjcmlwdEVkaXRvckluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcm9ncmFtJywgJ3F1ZXJ5LXByb2dyYW0taW5mbycsICdzY3JpcHRFZGl0b3InKTtcbiAgICBpZiAoc2NyaXB0RWRpdG9ySW5mbz8ucGF0aCkge1xuICAgICAgICBhcHBQYXRoID0gc2NyaXB0RWRpdG9ySW5mby5wYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDpgJrov4cgdnNjb2RlIOazqOWGjOeahOWNj+iuru+8jOiOt+WPliB2c2NvZGUg5bqU55So56iL5bqP5omA5Zyo6Lev5b6EXG4gICAgICAgICAgICBjb25zdCBwcm90b2NvbCA9IGF3YWl0IGFwcC5nZXRBcHBsaWNhdGlvbkluZm9Gb3JQcm90b2NvbCgndnNjb2RlOi8vJyk7XG4gICAgICAgICAgICAvLyB2c2NvZGUg6buY6K6k55qE5Y2P6K6u5ZCN56ew5ZKM5bqU55So56iL5bqP55qE5ZCN56ewXG4gICAgICAgICAgICBpZiAocHJvdG9jb2wubmFtZSA9PT0gJ1Zpc3VhbCBTdHVkaW8gQ29kZScpIHtcbiAgICAgICAgICAgICAgICBhcHBQYXRoID0gcHJvdG9jb2wucGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIOacquWuieijhSB2c2NvZGUg5oiW5rKh5pyJ5rOo5YaM5Y2P6K6u5oiW5L+u5pS55LqG5Y2P6K6u5L+h5oGvXG4gICAgICAgICAgICAvLyBhcHAuZ2V0QXBwbGljYXRpb25JbmZvRm9yUHJvdG9jb2woKSDmjqXlj6PmsqHojrflj5bliLDljY/orq7vvIzkvJrmiqXplJnvvIzkvYbkuI3pnIDopoHlsZXnpLrmiqXplJnkv6Hmga9cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXBwUGF0aDtcbn1cblxuZnVuY3Rpb24gb3BlbkFzc2V0V2l0aFByb2dyYW0oZmlsZTogc3RyaW5nLCBwcm9ncmFtOiBzdHJpbmcsIGFyZ3M/OiBzdHJpbmdbXSkge1xuICAgIGFyZ3MgPSBhcmdzIHx8IFtdO1xuICAgIGxldCBjbWQgPSAnJztcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgY21kID0gJ29wZW4nO1xuICAgICAgICBcbiAgICAgICAgaWYgKHByb2dyYW0uZW5kc1dpdGgoJy5hcHAnKSkge1xuICAgICAgICAgICAgcHJvZ3JhbSA9IGpvaW4ocHJvZ3JhbSwgJy9Db250ZW50cy9NYWNPUy8nKTtcbiAgICAgICAgICAgIGNvbnN0IHBsaXN0T2JqOiBhbnkgPSBwYXJzZShyZWFkRmlsZVN5bmMoam9pbihwcm9ncmFtLCAnLi4vSW5mby5wbGlzdCcpLCAndXRmOCcpKTtcbiAgICAgICAgICAgIHByb2dyYW0gPSBqb2luKHByb2dyYW0sIHBsaXN0T2JqLkNGQnVuZGxlRXhlY3V0YWJsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXJncykge1xuICAgICAgICAgICAgYXJncy51bnNoaWZ0KCctYScsIHByb2dyYW0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJncyA9IFsnLWEnLCBwcm9ncmFtLCBmaWxlXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICBjbWQgPSBwcm9ncmFtO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcmdzPy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGFyZ3MgPSBbZmlsZV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjaGlsZCA9IHNwYXduKGNtZCwgYXJncywge1xuICAgICAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICAgICAgc3RkaW86ICdpZ25vcmUnLFxuICAgIH0pO1xuICAgIGNoaWxkLnVucmVmKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcGVuRmlsZShmaWxlUGF0aDogc3RyaW5nLCByb290OiBzdHJpbmcpIHtcbiAgICBjb25zdCBhcHAgPSBhd2FpdCBnZXRDb2RlRWRpdG9yKCk7XG4gICAgb3BlbkFzc2V0V2l0aFByb2dyYW0oZmlsZVBhdGgsIGFwcCwgW3Jvb3QsIGZpbGVQYXRoXSk7IC8vIEVkaXRvci5Qcm9qZWN0LnBhdGhcbn0iXX0=