// @ts-expect-error
import * as cc from 'cc';

function replaceExtension(task: cc.AssetManager.Task, done: Function) {
    task.output = task.input;
    (async () => {
        for (let i = 0; i < task.input.length; i++) {
            const item = task.input[i] as cc.AssetManager.RequestItem;
            if (!item.uuid || item.isNative) { continue; }
            try {
                const extension = await queryExtension(item.uuid);
                if (extension) {
                    item.ext = extension;
                    item.url = item.url.replace('.json', extension);
                }
            } catch (err) {
                continue;
            }
        }
    })().then(() => {
        done(null);
    }).catch((reason) => {
        done(reason);
    });
}
cc.assetManager.pipeline.insert(replaceExtension, 1);
cc.assetManager.fetchPipeline.insert(replaceExtension, 1);

const cache: {[uuid: string]: string | null} = {};
const resolveMap: { [uuid: string]: Function[] } = {};

async function queryExtension(uuid: string): Promise<string> {
    if (uuid in cache) {
        if (cache[uuid] !== null) {
            return cache[uuid] as string;
        }
        return new Promise((resolve) => {
            resolveMap[uuid] = resolveMap[uuid] || [];
            resolveMap[uuid].push(resolve);
        });
    }
    cache[uuid] = null;
    try {
        const response = await fetch(`/query-extname/${uuid}`);
        const text = await response.text();
        cache[uuid] = text;
        if (resolveMap[uuid]) {
            resolveMap[uuid].forEach(func => func(text));
            resolveMap[uuid] = [];
        }
        return text;
    } catch (error) {
        console.error(error);
        cache[uuid] = '';
        return '';
    }
}
