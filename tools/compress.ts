/* eslint-disable no-console */
import {compress} from '../packages/compress/src/index.js';
import parseRanges from './parse-ranges.js';

function main() {
    const args = process.argv.slice(2);

    const ranges = parseRanges(args);
    const compressed = compress(ranges);
    const encoded = Buffer.from(compressed.buffer, compressed.byteOffset, compressed.byteLength).toString('base64');

    console.log(encoded);
}

main();
