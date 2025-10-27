import {describe, expect, test} from 'vitest';
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

describe('Roundtrip encode/decode', () => {
    test('empty ranges', () => {
        const input: [number, number][] = [];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('single element', () => {
        const input: [number, number][] = [[5, 5]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('single range', () => {
        const input: [number, number][] = [[10, 15]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('two separated ranges', () => {
        const input: [number, number][] = [[1, 3], [5, 7]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('two separated ranges', () => {
        const input: [number, number][] = [[1, 3], [9, 10]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('multiple ranges with gaps', () => {
        const input: [number, number][] = [[1, 3], [9, 10], [15, 15], [21, 21]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('ranges starting at 0', () => {
        const input: [number, number][] = [[0, 2], [5, 7]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('single range at 0', () => {
        const input: [number, number][] = [[0, 0]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('many small ranges', () => {
        const input: [number, number][] = [
            [1, 1], [3, 3], [5, 5], [7, 7], [9, 9],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('large range', () => {
        const input: [number, number][] = [[0, 1000]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('multiple large ranges', () => {
        const input: [number, number][] = [
            [0, 100],
            [202, 302],
            [504, 604],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('consecutive single elements', () => {
        const input: [number, number][] = [
            [0, 0], [2, 2], [4, 4], [6, 6], [8, 8],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('large gaps between ranges', () => {
        const input: [number, number][] = [
            [0, 5],
            [1007, 1012],
            [10015, 10017],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('alternating single elements and ranges', () => {
        const input: [number, number][] = [
            [1, 1],
            [5, 10],
            [15, 15],
            [20, 25],
            [30, 30],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });
});

describe('Random roundtrip tests', () => {
    /**
     * Generate a random set of ranges
     */
    function generateRandomRanges(seed: number, count: number, maxValue: number): [number, number][] {
        // Simple seeded random number generator
        let state = seed;
        const random = () => {
            state = ((state * 1103515245) + 12345) & 0x7fffffff;
            return state / 0x7fffffff;
        };

        const ranges: [number, number][] = [];
        let pos = 0;

        for (let i = 0; i < count; i++) {
            // Random gap before next range (at least 1 for subsequent ranges to avoid adjacent ranges)
            const gap = Math.floor(random() * 20) + (i > 0 ? 1 : 0);
            pos += gap;

            // Random range length (0 to 50)
            const length = Math.floor(random() * 51);
            const start = pos;
            const end = pos + length;

            if (end > maxValue) break;

            ranges.push([start, end]);
            pos = end + 1;
        }

        return ranges;
    }

    /**
     * Generate random set of integers and convert to ranges
     */
    function generateRandomIntegerSet(seed: number, count: number, maxValue: number): [number, number][] {
        let state = seed;
        const random = () => {
            state = ((state * 1103515245) + 12345) & 0x7fffffff;
            return state / 0x7fffffff;
        };

        // Generate random integers
        const integers = new Set<number>();
        for (let i = 0; i < count; i++) {
            integers.add(Math.floor(random() * maxValue));
        }

        // Convert to sorted array
        const sorted = Array.from(integers).sort((a, b) => a - b);

        // Convert to ranges
        const ranges: [number, number][] = [];
        if (sorted.length === 0) return ranges;

        let start = sorted[0];
        let end = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === end + 1) {
                end = sorted[i];
            } else {
                ranges.push([start, end]);
                start = sorted[i];
                end = sorted[i];
            }
        }
        ranges.push([start, end]);

        return ranges;
    }

    test('random ranges - small dataset', () => {
        for (let seed = 0; seed < 20; seed++) {
            const input = generateRandomRanges(seed, 10, 1000);
            const compressed = compress(input);
            const decompressed = decompressToArray(compressed);
            expect(decompressed).toEqual(input);
        }
    });

    test('random ranges - medium dataset', () => {
        for (let seed = 0; seed < 10; seed++) {
            const input = generateRandomRanges(seed + 100, 50, 10000);
            const compressed = compress(input);
            const decompressed = decompressToArray(compressed);
            expect(decompressed).toEqual(input);
        }
    });

    test('random ranges - large dataset', () => {
        for (let seed = 0; seed < 5; seed++) {
            const input = generateRandomRanges(seed + 200, 200, 100000);
            const compressed = compress(input);
            const decompressed = decompressToArray(compressed);
            expect(decompressed).toEqual(input);
        }
    });

    test('random integer sets - sparse', () => {
        for (let seed = 0; seed < 20; seed++) {
            const input = generateRandomIntegerSet(seed + 300, 50, 10000);
            const compressed = compress(input);
            const decompressed = decompressToArray(compressed);
            expect(decompressed).toEqual(input);
        }
    });

    test('random integer sets - dense', () => {
        for (let seed = 0; seed < 20; seed++) {
            const input = generateRandomIntegerSet(seed + 400, 100, 500);
            const compressed = compress(input);
            const decompressed = decompressToArray(compressed);
            expect(decompressed).toEqual(input);
        }
    });

    test('random integer sets - very sparse', () => {
        for (let seed = 0; seed < 10; seed++) {
            const input = generateRandomIntegerSet(seed + 500, 10, 1000000);
            const compressed = compress(input);
            const decompressed = decompressToArray(compressed);
            expect(decompressed).toEqual(input);
        }
    });

    test('edge case - all separated single integers', () => {
        const input: [number, number][] = [];
        for (let i = 0; i < 100; i++) {
            input.push([i * 2, i * 2]);
        }
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('edge case - maximum gaps', () => {
        const input: [number, number][] = [
            [0, 0],
            [10001, 10001],
            [20002, 20002],
            [30003, 30003],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });
});

describe('Adjacent ranges and mixed inputs', () => {
    test('two adjacent ranges - should merge', () => {
        const input: [number, number][] = [[1, 5], [6, 10]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        // Adjacent ranges should merge into one
        expect(decompressed).toEqual([[1, 10]]);
    });

    test('multiple adjacent ranges - should merge all', () => {
        const input: [number, number][] = [[1, 3], [4, 6], [7, 9], [10, 12]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 12]]);
    });

    test('adjacent single numbers - should merge into range', () => {
        const input: [number, number][] = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 5]]);
    });

    test('single numbers as bare numbers - adjacent', () => {
        const input = [1, 2, 3, 4, 5];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 5]]);
    });

    test('single numbers as bare numbers - with gaps', () => {
        const input = [1, 3, 5, 7, 9];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 1], [3, 3], [5, 5], [7, 7], [9, 9]]);
    });

    test('mixed bare numbers and ranges', () => {
        const input: (number | [number, number])[] = [1, [3, 5], 7, [10, 15], 20];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 1], [3, 5], [7, 7], [10, 15], [20, 20]]);
    });

    test('mixed bare numbers and ranges - with merging', () => {
        const input: (number | [number, number])[] = [1, 2, [3, 5], 6, 7, [8, 10]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 10]]);
    });

    test('range adjacent to single number on left', () => {
        const input: [number, number][] = [[5, 5], [6, 10]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[5, 10]]);
    });

    test('range adjacent to single number on right', () => {
        const input: [number, number][] = [[1, 5], [6, 6]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 6]]);
    });

    test('complex mixture - adjacent and separated', () => {
        const input: (number | [number, number])[] = [
            1, 2, 3,           // Should merge to [1, 3]
            [5, 7],            // Gap, then range
            8, 9,              // Adjacent to [5, 7], should merge to [5, 9]
            15,                // Gap, single number
            [20, 25], 26, 27,  // Should merge to [20, 27]
            30, 31, 32,        // Gap, should merge to [30, 32]
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 3], [5, 9], [15, 15], [20, 27], [30, 32]]);
    });

    test('all adjacent from 0', () => {
        const input: (number | [number, number])[] = [0, 1, [2, 5], 6, [7, 10]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[0, 10]]);
    });

    test('pattern of adjacent pairs with gaps', () => {
        const input: [number, number][] = [
            [1, 2], [3, 4],    // Adjacent pairs, merge to [1, 4]
            [10, 11], [12, 13], // Gap, then adjacent pairs, merge to [10, 13]
            [20, 21], [22, 23], // Gap, then adjacent pairs, merge to [20, 23]
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual([[1, 4], [10, 13], [20, 23]]);
    });
});

describe('Error handling', () => {
    test('overlapping ranges - partial overlap', () => {
        const input: [number, number][] = [[1, 5], [4, 8]];
        expect(() => compress(input)).toThrow('Invalid range: 4, 8');
    });

    test('overlapping ranges - complete overlap', () => {
        const input: [number, number][] = [[1, 10], [3, 7]];
        expect(() => compress(input)).toThrow('Invalid range: 3, 7');
    });

    test('overlapping ranges - same start', () => {
        const input: [number, number][] = [[5, 8], [5, 10]];
        expect(() => compress(input)).toThrow('Invalid range: 5, 10');
    });

    test('overlapping ranges - same end', () => {
        const input: [number, number][] = [[1, 10], [5, 10]];
        expect(() => compress(input)).toThrow('Invalid range: 5, 10');
    });

    test('overlapping ranges - identical ranges', () => {
        const input: [number, number][] = [[5, 10], [5, 10]];
        expect(() => compress(input)).toThrow('Invalid range: 5, 10');
    });

    test('negative start', () => {
        const input: [number, number][] = [[-5, 10]];
        expect(() => compress(input)).toThrow('Invalid range');
    });

    test('negative end', () => {
        const input: [number, number][] = [[5, -10]];
        expect(() => compress(input)).toThrow('Invalid range: 5, -10');
    });

    test('both negative', () => {
        const input: [number, number][] = [[-10, -5]];
        expect(() => compress(input)).toThrow('Invalid range: -10, -5');
    });

    test('negative single number', () => {
        const input = [-5];
        expect(() => compress(input)).toThrow('Invalid range: -5, -5');
    });

    test('backwards range', () => {
        const input: [number, number][] = [[10, 5]];
        expect(() => compress(input)).toThrow('Invalid range: 10, 5');
    });

    test('backwards range with larger numbers', () => {
        const input: [number, number][] = [[1000, 500]];
        expect(() => compress(input)).toThrow('Invalid range: 1000, 500');
    });

    test('unsorted ranges - decreasing', () => {
        const input: [number, number][] = [[10, 15], [1, 5]];
        expect(() => compress(input)).toThrow('Invalid range: 1, 5');
    });

    test('unsorted ranges - out of order', () => {
        const input: [number, number][] = [[5, 10], [1, 3], [15, 20]];
        expect(() => compress(input)).toThrow('Invalid range: 1, 3');
    });

    test('exactly 2^32 - 1', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [[0, MAX_UINT32]];
        expect(() => compress(input)).toThrow('exceeds encoding range');
    });

    test('number larger than 2^32 - 1', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [[0, MAX_UINT32 + 1]];
        expect(() => compress(input)).toThrow('Invalid range');
    });

    test('range starting above 2^32 - 1', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [[MAX_UINT32 + 1, MAX_UINT32 + 10]];
        expect(() => compress(input)).toThrow('Invalid range');
    });

    test('single number above 2^32 - 1', () => {
        const MAX_UINT32 = 4294967295;
        const input = [MAX_UINT32 + 1];
        expect(() => compress(input)).toThrow('Invalid range');
    });

    test('mixed valid and too-large numbers', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [[0, 10], [MAX_UINT32 + 1, MAX_UINT32 + 5]];
        expect(() => compress(input)).toThrow('Invalid range');
    });

    test('very large number - 2^33', () => {
        const TOO_LARGE = Math.pow(2, 33);
        const input: [number, number][] = [[0, TOO_LARGE]];
        expect(() => compress(input)).toThrow('Invalid range');
    });

    test('very large number - 2^40', () => {
        const TOO_LARGE = Math.pow(2, 40);
        const input: [number, number][] = [[TOO_LARGE, TOO_LARGE]];
        expect(() => compress(input)).toThrow('Invalid range');
    });
});

describe('Large gap tests (31-bit and higher)', () => {
    test('31-bit number - single range at 2^31-1', () => {
        const input: [number, number][] = [[2147483647, 2147483647]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('31-bit gap - ranges separated by ~2^31', () => {
        const input: [number, number][] = [
            [0, 5],
            [2147483648, 2147483650],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('32-bit number - range near 2^32-1', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [
            [0, 0],
            [MAX_UINT32 - 100, MAX_UINT32 - 100],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('32-bit gap - ranges separated by ~2^32', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [
            [100, 105],
            [MAX_UINT32 - 1000, MAX_UINT32 - 1000],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('multiple ranges with very large gaps', () => {
        const input: [number, number][] = [
            [0, 10],
            [1000000000, 1000000005],
            [2147483647, 2147483650],
            [3000000000, 3000000010],
            [4294967290, 4294967295],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('very large range spanning billions', () => {
        const input: [number, number][] = [[1000000000, 2000000000]];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('sparse ranges across 32-bit address space', () => {
        const input: [number, number][] = [
            [0, 0],
            [1073741824, 1073741824], // 2^30
            [2147483648, 2147483648], // 2^31
            [3221225472, 3221225472], // 3 * 2^30
            [4294967295, 4294967295], // 2^32 - 1
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('ranges with gaps of exactly 2^31', () => {
        const GAP_SIZE = 2147483648; // 2^31
        const input: [number, number][] = [
            [0, 5],
            [GAP_SIZE + 6, GAP_SIZE + 10],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('ranges with gaps of exactly 2^32 - 1', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [
            [0, 0],
            [MAX_UINT32, MAX_UINT32],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('alternating small and large numbers', () => {
        const unsorted: [number, number][] = [
            [5, 10],
            [1000000000, 1000000000],
            [50, 55],
            [2147483647, 2147483647],
            [100, 100],
            [4000000000, 4000000010],
        ];
        const input = unsorted.sort((a, b) => a[0] - b[0]); // Ensure sorted
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('large range at the end of 32-bit space', () => {
        const input: [number, number][] = [
            [4294967200, 4294967295],
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });

    test('multiple ranges near 32-bit boundaries', () => {
        const input: [number, number][] = [
            [2147483640, 2147483646], // Around 2^31 - 1 (2147483647)
            [2147483650, 2147483655], // Just after 2^31
            [4294967200, 4294967210], // Near 2^32 - 1 (4294967295)
        ];
        const compressed = compress(input);
        const decompressed = decompressToArray(compressed);
        expect(decompressed).toEqual(input);
    });
});

describe('Base64 decoding', () => {
    /**
     * Helper to decompress from base64 string
     */
    function decompressFromBase64(base64: string): [number, number][] {
        const ranges: [number, number][] = [];
        decompress(base64, (start, end) => {
            ranges.push([start, end]);
        });
        return ranges;
    }

    /**
     * Helper to convert Uint8Array to base64 string
     */
    function toBase64(data: Uint8Array): string {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');
    }

    test('empty ranges - base64', () => {
        const input: [number, number][] = [];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('single element - base64', () => {
        const input: [number, number][] = [[5, 5]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('single range - base64', () => {
        const input: [number, number][] = [[10, 15]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('multiple ranges - base64', () => {
        const input: [number, number][] = [[1, 3], [5, 7], [10, 15]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('ranges starting at 0 - base64', () => {
        const input: [number, number][] = [[0, 2], [5, 7]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('large range - base64', () => {
        const input: [number, number][] = [[0, 1000]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('multiple large ranges - base64', () => {
        const input: [number, number][] = [
            [0, 100],
            [202, 302],
            [504, 604],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('large gaps between ranges - base64', () => {
        const input: [number, number][] = [
            [0, 5],
            [1007, 1012],
            [10015, 10017],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('alternating single elements and ranges - base64', () => {
        const input: [number, number][] = [
            [1, 1],
            [5, 10],
            [15, 15],
            [20, 25],
            [30, 30],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('31-bit numbers - base64', () => {
        const input: [number, number][] = [[2147483647, 2147483647]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('32-bit numbers - base64', () => {
        const MAX_UINT32 = 4294967295;
        const input: [number, number][] = [
            [0, 0],
            [MAX_UINT32 - 100, MAX_UINT32 - 100],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('very large gaps - base64', () => {
        const input: [number, number][] = [
            [0, 10],
            [1000000000, 1000000005],
            [2147483647, 2147483650],
            [3000000000, 3000000010],
            [4294967290, 4294967295],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });

    test('adjacent ranges merge - base64', () => {
        const input: [number, number][] = [[1, 5], [6, 10]];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        // Adjacent ranges should merge into one
        expect(decompressed).toEqual([[1, 10]]);
    });

    test('mixed numbers and ranges - base64', () => {
        const input: (number | [number, number])[] = [1, [3, 5], 7, [10, 15], 20];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual([[1, 1], [3, 5], [7, 7], [10, 15], [20, 20]]);
    });

    test('roundtrip Uint8Array vs base64 equivalence', () => {
        const input: [number, number][] = [
            [1, 10],
            [50, 100],
            [500, 1000],
            [10000, 20000],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);

        // Decompress from Uint8Array
        const fromBytes = decompressToArray(compressed);
        // Decompress from base64
        const fromBase64 = decompressFromBase64(base64);

        // Both should produce the same result
        expect(fromBytes).toEqual(fromBase64);
        expect(fromBytes).toEqual(input);
    });

    test('decode various base64 strings', () => {
        // Empty ranges (empty array)
        const emptyBase64 = '';
        expect(decompressFromBase64(emptyBase64)).toEqual([]);

        // Single element at position 5: [5, 5]
        const input1: [number, number][] = [[5, 5]];
        const compressed1 = compress(input1);
        const base641 = toBase64(compressed1);
        expect(decompressFromBase64(base641)).toEqual(input1);

        // Simple range [0, 10]
        const input2: [number, number][] = [[0, 10]];
        const compressed2 = compress(input2);
        const base642 = toBase64(compressed2);
        expect(decompressFromBase64(base642)).toEqual(input2);
    });

    test('base64 with special padding', () => {
        // Test various lengths to ensure padding is handled correctly
        const testCases: [number, number][][] = [
            [[1, 1]], // 1 byte encoded
            [[1, 10]], // 2 bytes encoded
            [[1, 100]], // 3 bytes encoded
            [[1, 10000]], // 4 bytes encoded
            [[1, 100000]], // 5 bytes encoded
            [[1, 1000000]], // 6 bytes encoded
        ];

        for (const input of testCases) {
            const compressed = compress(input);
            const base64 = toBase64(compressed);
            const decompressed = decompressFromBase64(base64);
            expect(decompressed).toEqual(input);
        }
    });

    test('complex data set - base64', () => {
        const input: [number, number][] = [
            [0, 0], [2, 2], [4, 4], [6, 6], [8, 8],
            [100, 200],
            [1000, 1001], [1003, 1003],
            [1000000, 1000100],
            [2147483647, 2147483647],
            [3000000000, 3000000010],
        ];
        const compressed = compress(input);
        const base64 = toBase64(compressed);
        const decompressed = decompressFromBase64(base64);
        expect(decompressed).toEqual(input);
    });
});
