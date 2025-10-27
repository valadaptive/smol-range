# @smol-range/decompress

Decompress bitstreams created by `@smol-range/compress` back into sets of integer ranges.

For information about the encoding strategy, see [the repository](https://github.com/valadaptive/smol-range).

This library is optimized for size; it's ~400 bytes minified and ~300 bytes gzipped.

## Installation

```bash
npm install @smol-range/decompress
```

## Usage

```typescript
import {decompress} from '@smol-range/decompress';

// Decompress from a Uint8Array
const compressed = new Uint8Array([/* ... */]);
decompress(compressed, (start, end) => {
  console.log(`${start}-${end}`);
});

// Decompress from a base64 string
// The padding at the end ("=") can be omitted to save space
const base64 = "SGVsbG8gd29ybGQ=";
decompress(base64, (start, end) => {
  console.log(`${start}-${end}`);
});

// Expand ranges into individual numbers
const numbers = new Set<number>();

decompress(compressed, (start, end) => {
  for (let i = start; i <= end; i++) {
    numbers.add(i);
  }
});

console.log(numbers); // Set { 1, 2, 3, 4, 5, 10, 11, 12, ... }
```

## API

### `decompress(data, onRange)`

Decompress a previously-compressed set of non-negative integers back into a set of inclusive ranges.

**Parameters:**

- `data: Uint8Array | string` - The data to decompress. Can be either:
  - A `Uint8Array` containing the compressed bitstream
  - A base64-encoded string
- `onRange: (start: number, end: number) => unknown` - Callback function that will be invoked for each decoded range. Ranges are inclusive on both ends.

**Returns:** `void`

The callback is invoked once per range in the original input, in ascending order. Single numbers are represented as ranges where `start === end`.
