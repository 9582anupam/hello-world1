import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const loadCookies = () => {
    const cookiePath = path.resolve(__dirname, '../config/cookies.txt');
    try {
        return fs.readFileSync(cookiePath, 'utf8');
    } catch (err) {
        console.warn('Could not load cookies file:', err.message);
        return '';
    }
};
