/* eslint-disable no-console */
import {decompress} from '../packages/decompress/src/index.js';

function main() {
    const encoded = process.argv[2];
    if (!encoded) {
        throw new Error('Provide a base64-encoded compressed input');
    }
    let decompressed = '';
    decompress(encoded, (start, end) => {
        decompressed += start === end ? `${start}, ` : `${start}-${end}, `;
    });

    console.log(decompressed.slice(0, -2));
}

main();
