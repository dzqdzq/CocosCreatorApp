"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildTemplate = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const global_1 = require("../../../share/global");
const platforms_options_1 = require("../../../share/platforms-options");
class BuildTemplate {
    constructor(platform, taskName, config) {
        this._buildTemplateDirs = [];
        this.map = {};
        this._versionUser = '';
        this.config = config;
        const { buildTemplateDir } = global_1.BuildGlobalInfo;
        // 初始化不同层级的构建模板地址，按照使用优先级从大到小排布
        const commonDir = (0, path_1.join)(buildTemplateDir, 'common');
        // Temp 原生平台由于构建模式的特殊性，通用的模板地址是固定 native
        const platformDir = (0, path_1.join)(buildTemplateDir, platforms_options_1.NATIVE_PLATFORM.includes(platform) ? 'native' : platform);
        const taskDir = (0, path_1.join)(buildTemplateDir, taskName);
        if ((0, fs_extra_1.existsSync)(taskDir)) {
            this._buildTemplateDirs.push(taskDir);
        }
        if ((0, fs_extra_1.existsSync)(platformDir)) {
            this._buildTemplateDirs.push(platformDir);
        }
        if ((0, fs_extra_1.existsSync)(commonDir)) {
            this._buildTemplateDirs.push(commonDir);
        }
        const internalTemplate = {
            'application': 'application.ejs',
        };
        Object.keys(internalTemplate).forEach((name) => {
            this.initUrl(internalTemplate[name], name);
        });
        // 初始化缓存版本号
        this._initVersion(platform);
    }
    query(name) {
        var _a;
        return (_a = this.map[name]) === null || _a === void 0 ? void 0 : _a.path;
    }
    async _initVersion(platform) {
        if (!this.config) {
            return;
        }
        try {
            // 默认构建模板需要有版本号
            const templateVersionJson = (0, path_1.join)(Build.buildTemplateDir, 'templates-version.json');
            // 用户模板版本号
            if ((0, fs_extra_1.existsSync)(templateVersionJson)) {
                this._versionUser = (await (0, fs_extra_1.readJSON)(templateVersionJson))[platform];
            }
            this._versionUser = this._versionUser || '1.0.0';
            // 用户构建模板版本小于默认构建模板版本，警告建议更新
            if (Editor.Utils.Parse.compareVersion(this.config.version, this._versionUser)) {
                console.warn(Editor.I18n.t('builder.tips.templateVersionWarning', {
                    version: this._versionUser,
                    internalConfig: this.config.version,
                    platform,
                }));
            }
        }
        catch (error) {
            console.debug(error);
        }
    }
    findFile(relativeUrl) {
        for (let i = 0; i < this._buildTemplateDirs.length; i++) {
            const dir = this._buildTemplateDirs[i];
            const path = (0, path_1.join)(dir, relativeUrl);
            if ((0, fs_extra_1.existsSync)(path)) {
                return path;
            }
        }
        return;
    }
    initUrl(relativeUrl, name) {
        const path = this.findFile(relativeUrl);
        name = name || (0, path_1.basename)(relativeUrl);
        if (path) {
            this.map[name] = {
                path,
                url: relativeUrl,
            };
            return path;
        }
    }
    async copyTo(dest) {
        // 按照优先级拷贝构建模板
        for (let index = (this._buildTemplateDirs.length - 1); index >= 0; index--) {
            const dir = this._buildTemplateDirs[index];
            await (0, fs_extra_1.copy)(dir, dest);
        }
        // 移除已经被处理的一些特殊的文件夹
        await Promise.all(Object.values(this.map).map((info) => {
            return (0, fs_extra_1.remove)((0, path_1.join)(dest, info.url));
        }));
    }
}
exports.BuildTemplate = BuildTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtdGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2Uvd29ya2VyL2J1aWxkZXIvbWFuYWdlci9idWlsZC10ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBOEQ7QUFDOUQsK0JBQXNDO0FBRXRDLGtEQUF3RDtBQUN4RCx3RUFBbUU7QUFFbkUsTUFBYSxhQUFhO0lBU3RCLFlBQVksUUFBa0IsRUFBRSxRQUFnQixFQUFFLE1BQTRCO1FBUjlFLHVCQUFrQixHQUFhLEVBQUUsQ0FBQztRQUNsQyxRQUFHLEdBR0UsRUFBRSxDQUFDO1FBQ1IsaUJBQVksR0FBRyxFQUFFLENBQUM7UUFJZCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyx3QkFBZSxDQUFDO1FBQzdDLCtCQUErQjtRQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRCx3Q0FBd0M7UUFDeEMsTUFBTSxXQUFXLEdBQUcsSUFBQSxXQUFJLEVBQUMsZ0JBQWdCLEVBQUUsbUNBQWUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFFLENBQUM7UUFDdEcsTUFBTSxPQUFPLEdBQUcsSUFBQSxXQUFJLEVBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDakQsSUFBSSxJQUFBLHFCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUU7WUFDckIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN6QztRQUNELElBQUksSUFBQSxxQkFBVSxFQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FD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VzthQUNuQixDQUFDO1lBQ0YsT0FBTyxJQUFJLENBQUM7U0FDZjtJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVk7UUFDckIsY0FBYztRQUNkLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDeEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLE1BQU0sSUFBQSxlQUFJLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsbUJBQW1CO1FBQ25CLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNuRCxPQUFPLElBQUEsaUJBQU0sRUFBQyxJQUFBLFdBQUksRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNSLENBQUM7Q0FDSjtBQXBHRCxzQ0FvR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGlzdHNTeW5jLCBjb3B5LCByZW1vdmUsIHJlYWRKU09OIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJ1aWxkVGVtcGxhdGVDb25maWcsIFBsYXRmb3JtIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBCdWlsZEdsb2JhbEluZm8gfSBmcm9tICcuLi8uLi8uLi9zaGFyZS9nbG9iYWwnO1xuaW1wb3J0IHsgTkFUSVZFX1BMQVRGT1JNIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmUvcGxhdGZvcm1zLW9wdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgQnVpbGRUZW1wbGF0ZSB7XG4gICAgX2J1aWxkVGVtcGxhdGVEaXJzOiBzdHJpbmdbXSA9IFtdO1xuICAgIG1hcDogUmVjb3JkPHN0cmluZywge1xuICAgICAgICB1cmw6IHN0cmluZztcbiAgICAgICAgcGF0aDogc3RyaW5nO1xuICAgIH0+ID0ge307XG4gICAgX3ZlcnNpb25Vc2VyID0gJyc7XG4gICAgY29uZmlnPzogQnVpbGRUZW1wbGF0ZUNvbmZpZztcblxuICAgIGNvbnN0cnVjdG9yKHBsYXRmb3JtOiBQbGF0Zm9ybSwgdGFza05hbWU6IHN0cmluZywgY29uZmlnPzogQnVpbGRUZW1wbGF0ZUNvbmZpZyApIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIGNvbnN0IHsgYnVpbGRUZW1wbGF0ZURpciB9ID0gQnVpbGRHbG9iYWxJbmZvO1xuICAgICAgICAvLyDliJ3lp4vljJbkuI3lkIzlsYLnuqfnmoTmnoTlu7rmqKHmnb/lnLDlnYDvvIzmjInnhafkvb/nlKjkvJjlhYjnuqfku47lpKfliLDlsI/mjpLluINcbiAgICAgICAgY29uc3QgY29tbW9uRGlyID0gam9pbihidWlsZFRlbXBsYXRlRGlyLCAnY29tbW9uJyk7XG4gICAgICAgIC8vIFRlbXAg5Y6f55Sf5bmz5Y+w55Sx5LqO5p6E5bu65qih5byP55qE54m55q6K5oCn77yM6YCa55So55qE5qih5p2/5Zyw5Z2A5piv5Zu65a6aIG5hdGl2ZVxuICAgICAgICBjb25zdCBwbGF0Zm9ybURpciA9IGpvaW4oYnVpbGRUZW1wbGF0ZURpciwgTkFUSVZFX1BMQVRGT1JNLmluY2x1ZGVzKHBsYXRmb3JtKSA/ICduYXRpdmUnIDogcGxhdGZvcm0gKTtcbiAgICAgICAgY29uc3QgdGFza0RpciA9IGpvaW4oYnVpbGRUZW1wbGF0ZURpciwgdGFza05hbWUpO1xuICAgICAgICBpZiAoZXhpc3RzU3luYyh0YXNrRGlyKSkge1xuICAgICAgICAgICAgdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnMucHVzaCh0YXNrRGlyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhpc3RzU3luYyhwbGF0Zm9ybURpcikpIHtcbiAgICAgICAgICAgIHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLnB1c2gocGxhdGZvcm1EaXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChleGlzdHNTeW5jKGNvbW1vbkRpcikpIHtcbiAgICAgICAgICAgIHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzLnB1c2goY29tbW9uRGlyKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnRlcm5hbFRlbXBsYXRlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uJzogJ2FwcGxpY2F0aW9uLmVqcycsXG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5rZXlzKGludGVybmFsVGVtcGxhdGUpLmZvckVhY2goKG5hbWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5pdFVybChpbnRlcm5hbFRlbXBsYXRlW25hbWVdLCBuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5Yid5aeL5YyW57yT5a2Y54mI5pys5Y+3XG4gICAgICAgIHRoaXMuX2luaXRWZXJzaW9uKHBsYXRmb3JtKTtcbiAgICB9XG5cbiAgICBxdWVyeShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwW25hbWVdPy5wYXRoO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2luaXRWZXJzaW9uKHBsYXRmb3JtOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDpu5jorqTmnoTlu7rmqKHmnb/pnIDopoHmnInniYjmnKzlj7dcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlVmVyc2lvbkpzb24gPSBqb2luKEJ1aWxkLmJ1aWxkVGVtcGxhdGVEaXIsICd0ZW1wbGF0ZXMtdmVyc2lvbi5qc29uJyk7XG4gICAgICAgICAgICAvLyDnlKjmiLfmqKHmnb/niYjmnKzlj7dcbiAgICAgICAgICAgIGlmIChleGlzdHNTeW5jKHRlbXBsYXRlVmVyc2lvbkpzb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmVyc2lvblVzZXIgPSAoYXdhaXQgcmVhZEpTT04odGVtcGxhdGVWZXJzaW9uSnNvbikpW3BsYXRmb3JtXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZlcnNpb25Vc2VyID0gdGhpcy5fdmVyc2lvblVzZXIgfHwgJzEuMC4wJztcbiAgICAgICAgICAgIC8vIOeUqOaIt+aehOW7uuaooeadv+eJiOacrOWwj+S6jum7mOiupOaehOW7uuaooeadv+eJiOacrO+8jOitpuWRiuW7uuiuruabtOaWsFxuICAgICAgICAgICAgaWYgKEVkaXRvci5VdGlscy5QYXJzZS5jb21wYXJlVmVyc2lvbih0aGlzLmNvbmZpZy52ZXJzaW9uLCB0aGlzLl92ZXJzaW9uVXNlcikpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oRWRpdG9yLkkxOG4udCgnYnVpbGRlci50aXBzLnRlbXBsYXRlVmVyc2lvbldhcm5pbmcnLCB7XG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHRoaXMuX3ZlcnNpb25Vc2VyLFxuICAgICAgICAgICAgICAgICAgICBpbnRlcm5hbENvbmZpZzogdGhpcy5jb25maWcudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmaW5kRmlsZShyZWxhdGl2ZVVybDogc3RyaW5nKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRpciA9IHRoaXMuX2J1aWxkVGVtcGxhdGVEaXJzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGpvaW4oZGlyLCByZWxhdGl2ZVVybCk7XG4gICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpbml0VXJsKHJlbGF0aXZlVXJsOiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZmluZEZpbGUocmVsYXRpdmVVcmwpO1xuICAgICAgICBuYW1lID0gbmFtZSB8fCBiYXNlbmFtZShyZWxhdGl2ZVVybCk7XG4gICAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgICAgICB0aGlzLm1hcFtuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIHVybDogcmVsYXRpdmVVcmwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjb3B5VG8oZGVzdDogc3RyaW5nKSB7XG4gICAgICAgIC8vIOaMieeFp+S8mOWFiOe6p+aLt+i0neaehOW7uuaooeadv1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9ICh0aGlzLl9idWlsZFRlbXBsYXRlRGlycy5sZW5ndGggLSAxKTsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgICAgICAgY29uc3QgZGlyID0gdGhpcy5fYnVpbGRUZW1wbGF0ZURpcnNbaW5kZXhdO1xuICAgICAgICAgICAgYXdhaXQgY29weShkaXIsIGRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIC8vIOenu+mZpOW3sue7j+iiq+WkhOeQhueahOS4gOS6m+eJueauiueahOaWh+S7tuWkuVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChPYmplY3QudmFsdWVzKHRoaXMubWFwKS5tYXAoKGluZm8pID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZW1vdmUoam9pbihkZXN0LCBpbmZvLnVybCkpO1xuICAgICAgICB9KSk7XG4gICAgfVxufVxuIl19