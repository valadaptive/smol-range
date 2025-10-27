import esbuild from 'esbuild';
import zlib from 'node:zlib';
import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * This isn't actually used for the bundles that are published to npm. Its purpose is to allow one to check the minified
 * and gzipped sizes of the packages, in order to test out any potential code size optimizations.
 */

const packages = [
    {
        name: 'compress',
        entry: 'packages/compress/src/index.ts',
        outfile: 'bundles/compress.min.js',
    },
    {
        name: 'decompress',
        entry: 'packages/decompress/src/index.ts',
        outfile: 'bundles/decompress.min.js',
    },
];

// Ensure bundles directory exists
await fs.mkdir('bundles', {recursive: true});

const results = [];

for (const pkg of packages) {
    const result = await esbuild.build({
        entryPoints: [pkg.entry],
        bundle: true,
        minify: true,
        target: 'es2024',
        format: 'esm',
        outfile: pkg.outfile,
        write: false,
    });

    for (const out of result.outputFiles) {
        const zipped = await new Promise((res, rej) => {
            zlib.gzip(out.contents, (err, result) => {
                if (err) {
                    rej(err);
                } else {
                    res(result);
                }
            });
        });

        await fs.writeFile(out.path, out.contents);

        const relPath = path.relative(import.meta.dirname, out.path);
        results.push(`${relPath}: ${out.contents.byteLength} bytes (${zipped.byteLength} bytes gzipped)`);
    }
}

// eslint-disable-next-line no-console
console.log('\n' + results.join('\n') + '\n');
