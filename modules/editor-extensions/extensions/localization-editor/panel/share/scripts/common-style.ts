import { existsSync, readFileSync } from 'fs-extra';
import { join } from 'path';

const commonCssPath = join(__dirname, '../style/common.css');
export const commonCss = existsSync(commonCssPath) ? readFileSync(commonCssPath, 'utf-8') : '';
