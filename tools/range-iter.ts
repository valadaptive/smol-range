import parseRanges from './parse-ranges.js';

/* eslint-disable no-console */
function rangeIter(ranges: Iterable<[number, number] | readonly [number, number] | number, void, void>) {
    let rangeStart: number | null = null;
    let rangeEnd: number | null = null;
    // State for handling boundary conditions when iterating over ranges. 0 = we haven't started iteration yet; 1 =
    // we're in the middle of the loop; 2 = we're done.
    let rangeIterState = 0;

    const rangeIter = ranges[Symbol.iterator]();
    const nextRun = () => {
        if (rangeIterState === 2) return null;
        let retRange = null;
        for (;;) {
            const range = rangeIter.next();
            if (range.done) {
                // After the last input range, we know there are no more ranges to merge. Output the final stored range.
                rangeIterState = 2;
                // If there were 0 input ranges, return null.
                return rangeStart === null ? null : [rangeStart, rangeEnd];
            }
            let start, end;
            if (typeof range.value === 'number') {
                start = end = range.value;
            } else {
                [start, end] = range.value;
            }
            if (start > end) {
                throw new Error(`Backwards range: ${start}-${end}`);
            }
            if (end < 0) {
                throw new Error(`Negative range: ${start}-${end}`);
            }

            if (start - 1 === rangeEnd) {
                // Continuation of the previous range.
                rangeEnd = end;
            } else if (rangeEnd != null && start - 1 < rangeEnd) {
                throw new Error(`Range ${start}-${end} overlaps previous endpoint ${rangeEnd}`);
            } else {
                retRange = [rangeStart, rangeEnd];
                rangeStart = start;
                rangeEnd = end;
                // If this is the first range we're processing, continue onwards.
                if (rangeIterState === 0) {
                    rangeIterState = 1;
                } else {
                    break;
                }
            }
        }

        return retRange;
    };

    return nextRun;
}

function main() {
    const args = process.argv.slice(2);

    const ranges = parseRanges(args);

    console.log('Input ranges:', ranges);
    const nextRun = rangeIter(ranges);
    let range;
    while ((range = nextRun())) {
        console.log(range);
    }
}

main();
