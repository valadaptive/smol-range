# @smol-range/compress

Compress sets of integers (for example, Unicode codepoints) into a compact bitstream.

For information about the encoding strategy, see [the repository](https://github.com/valadaptive/smol-range).

While the corresponding decompression package has less stringent compatibility requirements, this package requires [resizable `ArrayBuffer` support](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/resize).

## Usage

```typescript
import {compress} from '@smol-range/compress';

// Compress a list of ranges
const ranges: [number, number][] = [[1, 5], [10, 15], [20, 20]];
const compressed = compress(ranges);

// You can also pass single numbers
const mixed = [1, 2, 3, [10, 15], 20];
const compressed2 = compress(mixed);

// Adjacent ranges are automatically merged
const adjacent = [[1, 5], [6, 10]]; // Will be merged to [1, 10]
const compressed3 = compress(adjacent);

// The decompressor works on `Uint8Array`s, but also base64-encoded data. To encode it here, you can use Node's buffer API:
const encoded = Buffer.from(compressed.buffer, compressed.byteOffset, compressed.byteLength).toString('base64');
// Or eventually, the new `toBase64` method (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64):
const encoded2 = compressed.toBase64();

```

## API

### `compress(ranges, opts?)`

Compress a set of integers, provided as a sorted list of numbers or ranges.

**Parameters:**

- `ranges: Iterable<[number, number] | number>` - List of numbers and/or inclusive ranges. Must be sorted in ascending order.
- `opts?: CompressOptions` - Optional configuration:
  - `maxSize?: number` - Maximum output size in bytes. Defaults to 16 MB.

**Returns:** `Uint8Array` - The compressed bitstream.

**Input requirements:**

- The input must be sorted in ascending order.
- Numbers and ranges can be mixed in any combination.
- Ranges are *inclusive* on both ends: `[1, 5]` includes 1, 2, 3, 4, and 5
- Adjacent ranges are automatically merged: `[1, 5], [6, 10]` becomes `[1, 10]`
- Ranges *cannot overlap*: `[1, 5], [5, 8]` is invalid (the ranges are inclusive, so 5 is in both).
- All numbers must be non-negative and at most 2**32 - 1 (4,294,967,295)
  - Because of how the encoding works, trying to encode *solely* the number 4294967295, or the range 0-4294967295, will fail. If there are other numbers in between, or you start at 1, it will work.

## Performance

This library is optimized for "gappy" datasets--those which are very sparse, very dense, or a mix of both. It performs well across a wide range of input patterns:

- **Sparse data**: Single integers separated by large gaps
- **Dense data**: Long consecutive runs of integers
- **Mixed data**: Combination of sparse and dense regions
- **Unicode ranges**: Typical use case with clustered code points
