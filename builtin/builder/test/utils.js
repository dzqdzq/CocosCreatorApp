const { createReadStream } = require('fs');
const { existsSync } = require('fs');
async function analyzeLogFile(path) {
    const result = {
        warning: [],
        error: [],
    };
    try {
        if (!existsSync(path)) {
            console.error(`构建日志 ${path} 未正常生成！`);
        } else {
            console.log('开始分析构建日志...');
            await readline(path, (line) => {
                if (line.includes('- warn:')) {
                    result.warning.push(line);
                } else if (line.includes('- error:')) {
                    result.error.push(line);
                }
            });
            console.log(`分析构建日志 ${path} 完成...,warn: ${result.warning.length}, error: ${result.error.length}`);
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}

function readline(path, handler) {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: createReadStream(path),
        });
        rl.on('line', (line) => {
            handler(line);
        });
        rl.on('close', () => {
            resolve();
        });
    });
}
/**
 * 判断某个文件是否是压缩过的
 * @param {*} path
 */
function isCompressAndExist(path) {
    if (!existsSync(path)) {
        return false;
    }
    const str = existsSync(path, 'utf-8');
    return !/\r\n/.test(str);
}

module.exports = { analyzeLogFile, isCompressAndExist };