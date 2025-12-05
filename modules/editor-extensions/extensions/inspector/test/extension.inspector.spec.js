'use strict';

const { list } = require('../dist/test/extension.inspector.spec');

for (const item of list) {
    describe(item.title, async () => {

        for (const subItem of item.list) {
            it(subItem.message, async () => {
                await subItem.handle();
            });
        }
    });
}
