import {bench, group, run} from 'mitata';
import {compress} from '../packages/compress/src/index.js';
import {decompress} from '../packages/decompress/src/index.js';

/**
 * Helper to decompress data and collect ranges into an array
 */
function decompressToArray(data: Uint8Array): [number, number][] {
    const ranges: [number, number][] = [];
    decompress(data, (start, end) => {
        ranges.push([start, end]);
    });
    return ranges;
}

/**
 * Unified function to generate ranges with configurable parameters
 */
function generateRanges(
    count: number,
    rangeSize: number | [number, number],
    gapSize: number | [number, number],
    seed: number = 0,
): [number, number][] {
    // Simple seeded random number generator
    let state = seed;
    const random = () => {
        state = ((state * 1103515245) + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };

    const ranges: [number, number][] = [];
    let pos = 0;

    for (let i = 0; i < count; i++) {
        // Add gap
        const [minGap, maxGap] = typeof gapSize === 'number' ? [gapSize, gapSize] : gapSize;
        const gap = minGap + Math.floor(random() * (maxGap - minGap + 1));
        pos += gap;

        // Create range
        const [minSize, maxSize] = typeof rangeSize === 'number' ? [rangeSize, rangeSize] : rangeSize;
        const size = minSize + Math.floor(random() * (maxSize - minSize + 1));
        const start = pos;
        const end = pos + size;

        ranges.push([start, end]);
        pos = end + 1;
    }

    return ranges;
}

/**
 * Generate multiple datasets of the same type for more stable benchmarks
 */
function generateMultipleDatasets(
    numDatasets: number,
    count: number,
    rangeSize: number | [number, number],
    gapSize: number | [number, number],
): [number, number][][] {
    const datasets: [number, number][][] = [];
    for (let i = 0; i < numDatasets; i++) {
        datasets.push(generateRanges(count, rangeSize, gapSize, i * 1000));
    }
    return datasets;
}

// Generate multiple datasets for each benchmark category (5 datasets each)
const NUM_DATASETS = 5;

const smallRangesDatasets = generateMultipleDatasets(NUM_DATASETS, 4, [0, 2], [2, 8]);
const mediumRangesDatasets = generateMultipleDatasets(NUM_DATASETS, 50, [0, 20], [10, 100]);
const largeRangesDatasets = generateMultipleDatasets(NUM_DATASETS, 2000, [0, 50], [100, 1000]);
const sparseRangesDatasets = generateMultipleDatasets(NUM_DATASETS, 5, [0, 5], [1000000, 1000000]);
const denseRangesDatasets = generateMultipleDatasets(NUM_DATASETS, 100, 0, 2); // Single elements with gap of 2
const veryLargeGapsDatasets = generateMultipleDatasets(NUM_DATASETS, 4, [0, 10], [500000000, 1000000000]);
const singleLargeRangeDatasets = generateMultipleDatasets(NUM_DATASETS, 1, 1000000, 0);

// Pre-compress all datasets
const smallCompressedDatasets = smallRangesDatasets.map(d => compress(d));
const mediumCompressedDatasets = mediumRangesDatasets.map(d => compress(d));
const largeCompressedDatasets = largeRangesDatasets.map(d => compress(d));
const sparseCompressedDatasets = sparseRangesDatasets.map(d => compress(d));
const denseCompressedDatasets = denseRangesDatasets.map(d => compress(d));
const veryLargeGapsCompressedDatasets = veryLargeGapsDatasets.map(d => compress(d));
const singleLargeRangeCompressedDatasets = singleLargeRangeDatasets.map(d => compress(d));

group('Compression', () => {
    bench('small ranges (4 ranges)', () => {
        for (const dataset of smallRangesDatasets) {
            compress(dataset);
        }
    });

    bench('medium ranges (50 ranges)', () => {
        for (const dataset of mediumRangesDatasets) {
            compress(dataset);
        }
    });

    bench('large ranges (2000 ranges)', () => {
        for (const dataset of largeRangesDatasets) {
            compress(dataset);
        }
    });

    bench('sparse ranges (large gaps)', () => {
        for (const dataset of sparseRangesDatasets) {
            compress(dataset);
        }
    });

    bench('dense ranges (many single elements)', () => {
        for (const dataset of denseRangesDatasets) {
            compress(dataset);
        }
    });

    bench('very large gaps (31-bit numbers)', () => {
        for (const dataset of veryLargeGapsDatasets) {
            compress(dataset);
        }
    });

    bench('single large range (1M elements)', () => {
        for (const dataset of singleLargeRangeDatasets) {
            compress(dataset);
        }
    });
});

group('Decompression', () => {
    bench('small ranges (4 ranges)', () => {
        for (const dataset of smallCompressedDatasets) {
            decompressToArray(dataset);
        }
    });

    bench('medium ranges (50 ranges)', () => {
        for (const dataset of mediumCompressedDatasets) {
            decompressToArray(dataset);
        }
    });

    bench('large ranges (2000 ranges)', () => {
        for (const dataset of largeCompressedDatasets) {
            decompressToArray(dataset);
        }
    });

    bench('sparse ranges (large gaps)', () => {
        for (const dataset of sparseCompressedDatasets) {
            decompressToArray(dataset);
        }
    });

    bench('dense ranges (many single elements)', () => {
        for (const dataset of denseCompressedDatasets) {
            decompressToArray(dataset);
        }
    });

    bench('very large gaps (31-bit numbers)', () => {
        for (const dataset of veryLargeGapsCompressedDatasets) {
            decompressToArray(dataset);
        }
    });

    bench('single large range (1M elements)', () => {
        for (const dataset of singleLargeRangeCompressedDatasets) {
            decompressToArray(dataset);
        }
    });
});

group('Roundtrip (compress + decompress)', () => {
    bench('small ranges (4 ranges)', () => {
        for (const dataset of smallRangesDatasets) {
            const compressed = compress(dataset);
            decompressToArray(compressed);
        }
    });

    bench('medium ranges (50 ranges)', () => {
        for (const dataset of mediumRangesDatasets) {
            const compressed = compress(dataset);
            decompressToArray(compressed);
        }
    });

    bench('large ranges (2000 ranges)', () => {
        for (const dataset of largeRangesDatasets) {
            const compressed = compress(dataset);
            decompressToArray(compressed);
        }
    });

    bench('sparse ranges (large gaps)', () => {
        for (const dataset of sparseRangesDatasets) {
            const compressed = compress(dataset);
            decompressToArray(compressed);
        }
    });
});

group('Compression ratio', () => {
    bench('small ranges - avg size', () => {
        const sizes = smallCompressedDatasets.map(d => d.byteLength);
        const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        return avg;
    }).compact();

    bench('medium ranges - avg size', () => {
        const sizes = mediumCompressedDatasets.map(d => d.byteLength);
        const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        return avg;
    }).compact();

    bench('large ranges - avg size', () => {
        const sizes = largeCompressedDatasets.map(d => d.byteLength);
        const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        return avg;
    }).compact();

    bench('sparse ranges - avg size', () => {
        const sizes = sparseCompressedDatasets.map(d => d.byteLength);
        const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        return avg;
    }).compact();

    bench('dense ranges - avg size', () => {
        const sizes = denseCompressedDatasets.map(d => d.byteLength);
        const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        return avg;
    }).compact();
});

await run();
