import { singleton } from 'tsyringe';
import { existsSync, realpathSync } from 'fs';
import { join, relative } from 'path';
import { MainName } from './global';
import EditorMessageService from '../EditorMessageService';

@singleton()
export default class CacheService {
    constructor(
        public editorMessageService: EditorMessageService,
    ) {}

    clear() {
        if (process.platform === 'win32' || !Editor.App.dev) {
            return;
        }
        const extensionPath = join(Editor.App.path, 'modules', 'editor-extensions', 'extensions', MainName);
        if (!existsSync(extensionPath)) return;
        try {
            const realPath = join(realpathSync(extensionPath), 'dist');
            this.deleteRequireCache(realPath);
        } catch (e) { /* eslint-disable-next-line no-empty */ }
    }

    private deleteRequireCache(dir: string) {
        console.debug(`[${MainName}] clear cache`, dir);
        for (const file in require.cache) {
            const relativePath = relative(dir, file);
            if (!relativePath.startsWith('..')) {
                delete require.cache[file];
            }
        }
    }
}
