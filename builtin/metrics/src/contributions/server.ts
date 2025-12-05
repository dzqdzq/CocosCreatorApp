'use strict';

export const get: any[] = [
    {
        // see ./google-metrics-observer-v4.ts -> getHtmlUrl
        url: '/a032ffca62d9edac706b578840ab182b/index.html',
        async handle(request: any, response: any, next: any) {
            const customHeader = request.headers['x-custom-header'];
            if (customHeader && customHeader === '2c2d5f6b07c59e4a4595501a71e93b7c') {
                const indexHTML = await Editor.Message.request('metrics', 'query-google-metrics-v4-html');
                response.end(indexHTML);
            } else {
                response.status(403).send('404');
            }
        },
    },
];
