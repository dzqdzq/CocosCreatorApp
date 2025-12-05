import { spawnSync } from 'child_process';
import { join } from 'path';

const winCmd = {
    git: 'git',
    npm: 'npm.cmd',
    tsc: 'tsc.cmd',
    lessc: 'lessc.cmd',
};

const macCmd = {
    git: 'git',
    npm: 'npm',
    tsc: 'tsc',
    lessc: 'lessc',
};

const cmd = process.platform === 'win32' ? winCmd : macCmd;
try {
    // 由于 localization-editor 使用了 vue3 需要在安装后单独为它执行 Npm install
    spawnSync (cmd.npm, ['install'], {
        cwd: join(__dirname, '../extensions/localization-editor'),
        env: process.env,
        stdio: 'inherit',
        encoding: 'utf8',
    });   

} catch (error) {
    console.error(error);  
}