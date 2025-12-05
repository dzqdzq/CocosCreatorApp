import glob from 'glob';

describe('测试glob', () => {
    test('123', async (): Promise<void> => new Promise((resolve) => {
        glob.glob(
            './src/{core,scene}/**/*.ts',
            {
                nodir: true,
            },
            (err, files) => {
                console.log(files);
                resolve();
            },
        );
    }));
});
