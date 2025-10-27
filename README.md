# smol-range

This is a pair of TypeScript packages for compressing and decompressing sets of integers. The compression method is well-suited for "gappy" datasets--those which are very sparse, very dense, or a mix of both--without adding too much overhead when the data is truly random.

Its original purpose is encoding Unicode-related information, such as the list of code points belonging to a certain language. This type of data is usually clustered into large ranges, but sometimes has more complex portions.

## The encoding strategy

There are two parts to an encoding: the abstract encoding method and its binary representation.

This library uses a hybrid between gap encoding and run-length encoding that I haven't seen described before. With gap encoding, you store the gaps between successive present integers--this works well when they are sparse, but a long run of integers requires encoding all of them and takes up a lot of space. Run-length encoding handles long runs of absent and present integers, treating them symmetrically, but loses out when the integers are somewhat sparse since it must encode an extra run length of 1 for each of them.

The hybrid encoding used by this library (which I tentatively call "flip coding") is like gap encoding, but with a twist: after two successive present integers, we switch to encoding the gaps between *absences*. After two successive absences, we then switch back to encoding gaps between presences, and so on. This provides the performance of gap encoding on sparse data and run-length encoding on dense data, while also treating zeroes and ones completely symmetrically.

The binary representation encodes each gap using [Elias gamma coding](https://en.wikipedia.org/wiki/Elias_gamma_coding): a number *n* is encoded as a run of `log2(n)` zero bits, followed by the number itself, which is `log2(n) + 1` bits long. I've tested other encodings, but gamma coding is the simplest and also the best-performing in terms of output size.. Others (like [Elias delta coding](https://en.wikipedia.org/wiki/Elias_delta_coding)) encode large integers better at the expense of small ones, but this only benefits very sparse datasets that would be small anyway.

## The packages

For code size purposes, compression and decompression are split into different packages (they can't really share any code anyway). Both are quite small:

- [@smol-range/compress](./packages/compress/README.md)
- [@smol-range/decompress](./packages/decompress/README.md)
