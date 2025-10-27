/**
 * Parse command-line arguments as integers or ranges.
 * Examples:
 *   "5" -> [5, 5]
 *   "3-7" -> [3, 7]
 *   "10-10" -> [10, 10]
 */
export default function parseRanges(args: string[]): [number, number][] {
    const ranges: [number, number][] = [];

    for (let arg of args) {
        arg = arg.replace(/,$/, '');
        if (arg.includes('-')) {
            // It's a range like "3-7"
            const parts = arg.split('-');
            if (parts.length === 2) {
                const start = Number(parts[0]);
                const end = Number(parts[1]);
                if (Number.isFinite(start) && Number.isFinite(end)) {
                    ranges.push([start, end]);
                }
            }
        } else {
            // It's a single integer
            const num = parseInt(arg, 10);
            if (!isNaN(num)) {
                ranges.push([num, num]);
            }
        }
    }

    return ranges;
}
