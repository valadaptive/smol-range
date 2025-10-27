export type CompressOptions = {
    /**
     * Maximum output size of the compressed bitstream. Defaults to 16 MB.
     */
    maxSize?: number;
};

/**
 * Compress a set of integers, provided as a sorted list of numbers or ranges.
 *
 * The input must be sorted, and consist of numbers and/or inclusive ranges. Bordering numbers or ranges will be merged,
 * but they cannot overlap or decrease (something like [2, 5], [5, 8] is considered overlapping because 5 is in both
 * ranges). All numbers must be between 0 and 2^32 - 1.
 *
 * @param ranges List of numbers and/or inclusive ranges.
 * @param opts Options.
 * @returns A compressed list of ranges.
 */
export const compress = (
    ranges: Iterable<[number, number] | readonly [number, number] | number, void, void>,
    opts?: CompressOptions,
) => {
    let prevRangeEnd = -1;
    // Stored state for a run of ones, to be emitted from the run length iterator after a run of zeroes. If this is
    // nonzero, we emit it, if not then we move onto the next range and emit the run of zeroes.
    let ones: number = 0;
    let rangeStart: number | null = null;
    let rangeEnd: number | null = null;
    // After the final range is consumed, we need to output it exactly once the next time nextRun is called.
    let lastRunEmitted = false;

    const invalidRangeError = (start: number, end: number) => {
        throw new Error(`Invalid range: ${start}, ${end}`);
    };

    const rangeIter = ranges[Symbol.iterator]();
    const nextRun = (): number | null => {
        if (ones) {
            const onesRet = ones;
            ones = 0;
            return onesRet;
        }
        if (lastRunEmitted) {
            return null;
        }
        for (;;) {
            const {done, value} = rangeIter.next();
            if (done) {
                // After the last input range, we know there are no more ranges to merge. Output the final stored range.
                lastRunEmitted = true;
                // If there were 0 input ranges, return null.
                if (rangeStart == null) return null;
                ones = rangeEnd! - rangeStart + 1;
                return rangeStart - prevRangeEnd - 1;
            }
            let start, end;
            if (typeof value == 'number') {
                start = end = value;
            } else {
                [start, end] = value;
            }
            if (
                // Backwards range
                start > end ||
                // Negative input
                start < 0 ||
                // Input bigger than 2**32 - 1
                end > (~0 >>> 0)
            ) {
                invalidRangeError(start, end);
            }
            if (rangeEnd != null && start - 1 < rangeEnd) {
                invalidRangeError(start, end);
            }

            if (start - 1 == rangeEnd) {
                // Continuation of the previous range.
                rangeEnd = end;
            } else if (rangeStart == null) {
                // If this is the first range we're processing, continue onwards.
                rangeStart = start;
                rangeEnd = end;
            } else {
                const zeroes = rangeStart - prevRangeEnd - 1;
                ones = rangeEnd! - rangeStart + 1;
                prevRangeEnd = rangeEnd!;
                rangeStart = start;
                rangeEnd = end;
                return zeroes;
            }
        }
    };

    const maxSize = opts?.maxSize ?? 1 << 24;
    const outBuf = new ArrayBuffer(0, {maxByteLength: maxSize});
    const outBits = new DataView(outBuf);
    // Output length in bits (not bytes).
    let outLen = 0;
    // Elias gamma coding: each number n is encoded as log2(n) zero bits followed by n itself (which takes up log2(n) +
    // 1 bits).
    const eliasGammaEncode = (x: number) => {
        if (x > (~0 >>> 0)) {
            throw new Error(`${x} exceeds encoding range`);
        }
        const log = 31 - Math.clz32(x);
        const encodedLen = (log * 2) + 1;
        // The buffer length necessary to store the new value, rounded up to the next 4 bytes.
        const newLen = (outLen + encodedLen + 31) >>> 5 << 2;
        if (newLen > outBuf.byteLength) {
            outBuf.resize(Math.max(newLen, Math.min(outBuf.byteLength * 2, maxSize)));
        }
        const start = outLen + log;

        const bitLen = log + 1;
        const n = x << (32 - bitLen);

        // Write at a bit-level offset
        const bucket = start >>> 5 << 2;
        const shift = start & 31;
        outBits.setUint32(bucket, outBits.getUint32(bucket) | (n >>> shift));
        const remainder = shift && (n << (32 - shift));
        if (remainder) {
            outBits.setUint32(bucket + 4, outBits.getUint32(bucket + 4) | remainder);
        }

        outLen += encodedLen;
    };

    let remaining = nextRun();
    if (remaining !== null) {
        let inSync = remaining != 0;

        for (;;) {
            if (!remaining) {
                // remaining === 0 and must be refilled
                remaining = nextRun();
                // Only the first run will ever be of zero length--otherwise, a "run of zero symbols" doesn't exist
                // conceptually, and so nextRun will never returh a falsy vaoue other than null.
                if (!remaining) break;
            }

            if (inSync) {
                eliasGammaEncode(remaining + 1);

                remaining = nextRun();
                if (!remaining) break;
            } else {
                eliasGammaEncode(1);
            }
            remaining--;

            // Toggle inSync when remaining != 0
            inSync = (inSync == (remaining == 0));
        }

        outBuf.resize((outLen + 7) >>> 3);
    }

    return new Uint8Array(outBuf);
};
