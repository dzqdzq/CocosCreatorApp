import { defineConfig } from "vite";
import { Plugin } from 'rollup';
import vue from '@vitejs/plugin-vue'
import { builtinModules } from 'module'
import { join, relative } from 'path';
const pkg = require('./package.json');
const outDir = 'panel-dist';
const dependencies = Object.keys(pkg.dependencies || {});
const devDependencies = Object.keys(pkg.devDependencies || {});

const inputs = [
    'panel/default/index.ts',
    'panel/l10n-label-inspector/index.ts',
    'panel/builder/index.ts'
];

const generateRollupEntries = () => {
    let inputOption = {};
    inputs.forEach((item) => {
        const key = item.replace('panel/', '').replace('.ts', '');
        (inputOption as any)[key] = join(__dirname, item);
    });
    return inputOption;
};

const virtualModule = (): Plugin => {
    return {
        name: 'virtual-module',
        resolveId: (source, importer) => {
            if (!importer) {
                console.log('找不到 importer ,source', source);
                return;
            }

            if (source === 'Wrapper') {
                return {
                    id: '../../dist/virtual-modules/Wrapper',
                    external: true,
                };
            }

            if (source === 'Builder') {
                return {
                    id: relative(join(importer, '../'), join(__dirname, 'dist/virtual-modules/Builder')).replace(/\\/g, '/'),
                    external: true,
                };
            }
            if (source === 'EventBus') {
                return {
                    id: relative(join(importer, '../'), join(__dirname, 'dist/virtual-modules/EventBus')).replace(/\\/g, '/'),
                    external: true,
                };
            }
        },
    };
}

export default defineConfig(({ mode }) => {
    // 不要排除 vue
    const external = devDependencies
        .concat(builtinModules, 'cc', 'cc/env', mode === 'production' ? [] : dependencies)
        .filter((it) => it !== 'vue');
    external.push('fs-extra');
    // 排除 electron 的库
    external.push(...['@electron/remote', 'electron']);
    /**
     * @type {import('vite').InlineConfig}
     */
    return {
        css: {
            // 将 less 植入面板，使得面板不需要每个都
            preprocessorOptions: {
                less: {
                    modifyVars: {
                        hack: `true; @import (reference) "${join(__dirname, 'panel/share/less/index.less')}"`,
                    },
                    javascriptEnabled: true,
                },
            },
        },
        plugins: [
            virtualModule(),
            vue({
                template: {
                    compilerOptions: {
                        isCustomElement: (tag) => tag.startsWith('ui-'),
                    },
                },
            }),
        ],
        build: {
            target: 'esnext',
            outDir: outDir,
            emptyOutDir: mode === 'production', // 编译前清空输出目录
            cssCodeSplit: true, // 因为是多个入口，所以 css 也应该独立
            rollupOptions: {
                external,
                input: generateRollupEntries(),
                output: {
                    dir: outDir,
                    format: 'commonjs',
                    entryFileNames: '[name].js',
                    assetFileNames: (chunkInfo) => {
                        // 如果生成的资源不再这目录,并且还是一个 css 则把这个样式放到 common.css
                        if (
                            ['builder', 'default/', 'l10n-label-inspector'].every(
                                (str) => !chunkInfo.name?.startsWith(str),
                            ) &&
                            chunkInfo.name?.endsWith('.css')
                        ) {
                            return 'share/style/common.css';
                        }
                        return '[name][extname]';
                    },
                    // 指定由于多个脚本依赖同一个脚本而自动生成的 chunk 的位置
                    chunkFileNames: (chunkInfo) => {
                        return 'share/scripts/[name].js';
                    },
                },
            },

            minify: mode === 'production',

        },
    };
})
