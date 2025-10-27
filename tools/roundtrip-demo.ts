/* eslint-disable no-console */
import {compress} from '../packages/compress/src/index.js';
import {decompress} from '../packages/decompress/src/index.js';
import parseRanges from './parse-ranges.js';

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: tsx tools/roundtrip-demo.ts <ranges...>');
        console.log('Examples:');
        console.log('  tsx tools/roundtrip-demo.ts 5 10-15 20');
        console.log('  tsx tools/roundtrip-demo.ts 0-0 5-10');
        process.exit(1);
    }

    const ranges = parseRanges(args);

    console.log('Input ranges:', ranges);
    console.log('');

    const compressed = compress(ranges);
    console.log('Compressed data:', compressed);
    console.log('Compressed size:', compressed.length, 'bytes');
    console.log('');

    const decompressed: (readonly [number, number])[] = [];
    decompress(compressed, (start, end) => {
        decompressed.push([start, end]);
    });
    console.log('Decompressed:', decompressed);
}

main();
