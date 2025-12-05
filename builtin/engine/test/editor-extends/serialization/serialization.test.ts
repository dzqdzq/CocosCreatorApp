
import fs from 'fs-extra';
import ps from 'path';

describe('Serialization', () => {
    const home = ps.join(__dirname, 'shared', 'cases');
    const tests = fs.readdirSync(home).map((x) => ps.join(home, x));
    for (const test of tests) {
        describe(`${ps.basename(test, ps.extname(test))}`, () => {
            require(test);
        });
    }
});
