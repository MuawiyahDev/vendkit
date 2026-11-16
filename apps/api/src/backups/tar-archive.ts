import type { Writable } from 'node:stream';

const BLOCK_SIZE = 512;
const MAX_TRAILING_ZERO_BYTES = 1024 * 1024;
const CHECKSUM_OFFSET = 148;
const CHECKSUM_LENGTH = 8;
const NAME_LENGTH = 100;
const PREFIX_OFFSET = 345;
const PREFIX_LENGTH = 155;

export interface TarEntryHeader {
  name: string;
  size: number;
}

export interface TarReadLimits {
  maxEntries: number;
  maxExtractedBytes: number;
}

/**
 * Minimal, strict tar writer used for versioned VendKit backup archives.
 * Only regular files with short names are supported; that is all the backup
 * format needs and it keeps the reader small and auditable.
 */
export class TarWriter {
  constructor(private readonly destination: Writable) {}

  async addFile(
    name: string,
    data: Buffer,
    modifiedAt: Date = new Date(),
  ): Promise<void> {
    assertSafeEntryName(name);

    const header = createHeader(name, data.length, modifiedAt);
    await this.write(header);

    if (data.length > 0) {
      await this.write(data);
    }

    const padding = paddingFor(data.length);
    if (padding > 0) {
      await this.write(Buffer.alloc(padding));
    }
  }

  async finish(): Promise<void> {
    await this.write(Buffer.alloc(BLOCK_SIZE * 2));
  }

  private write(chunk: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        this.destination.off('drain', handleDrain);
        this.destination.off('error', handleError);
      };
      const handleDrain = () => {
        cleanup();
        resolve();
      };
      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };

      this.destination.once('drain', handleDrain);
      this.destination.once('error', handleError);

      if (this.destination.write(chunk)) {
        cleanup();
        resolve();
      }
    });
  }
}

/**
 * Streaming tar reader with defensive limits. Entry data is never buffered by
 * the reader itself; callers decide whether to keep it in memory or stream it
 * to a staging file. Symlinks, directories, PAX/GNU extensions and path
 * traversal are rejected outright.
 */
export class TarReader {
  private readonly iterator: AsyncIterator<Buffer>;
  private buffered: Buffer = Buffer.alloc(0);
  private ended = false;
  private finished = false;
  private totalEntries = 0;
  private totalExtractedBytes = 0;
  private entryRemaining = 0;
  private entrySize = 0;

  constructor(
    source: AsyncIterable<Buffer>,
    private readonly limits: TarReadLimits,
  ) {
    this.iterator = source[Symbol.asyncIterator]();
  }

  async next(): Promise<TarEntryHeader | null> {
    if (this.finished) {
      return null;
    }
    if (this.entryRemaining > 0) {
      throw new Error('Previous tar entry data was not consumed');
    }

    const block = await this.readExactly(BLOCK_SIZE, true);
    if (!block) {
      throw new Error('Tar archive ended without a valid footer');
    }

    if (isZeroBlock(block)) {
      const second = await this.readExactly(BLOCK_SIZE, true);
      if (!second || !isZeroBlock(second)) {
        throw new Error('Corrupt tar archive footer');
      }
      await this.assertZeroTrailing();
      this.finished = true;
      return null;
    }

    const header = parseHeader(block);
    this.totalEntries += 1;
    if (this.totalEntries > this.limits.maxEntries) {
      throw new Error('Tar archive contains too many entries');
    }

    this.entrySize = header.size;
    this.entryRemaining = header.size;
    return { name: header.name, size: header.size };
  }

  async readData(onChunk: (chunk: Buffer) => Promise<void>): Promise<number> {
    let received = 0;

    while (this.entryRemaining > 0) {
      const chunk = await this.readUpTo(
        Math.min(this.entryRemaining, 64 * 1024),
      );
      if (!chunk) {
        throw new Error('Unexpected end of tar entry data');
      }

      this.entryRemaining -= chunk.length;
      received += chunk.length;
      this.totalExtractedBytes += chunk.length;

      if (this.totalExtractedBytes > this.limits.maxExtractedBytes) {
        throw new Error('Tar archive expands beyond the configured limit');
      }

      await onChunk(chunk);
    }

    const padding = paddingFor(this.entrySize);
    if (padding > 0) {
      await this.skip(padding);
    }

    return received;
  }

  private async assertZeroTrailing(): Promise<void> {
    let trailing = 0;

    for (;;) {
      const chunk = await this.readUpTo(64 * 1024);
      if (!chunk) {
        return;
      }

      trailing += chunk.length;
      if (trailing > MAX_TRAILING_ZERO_BYTES || !isZeroBlock(chunk)) {
        throw new Error('Unexpected data after the tar archive footer');
      }
    }
  }

  private async readExactly(
    size: number,
    allowEndOfStream: false,
  ): Promise<Buffer>;
  private async readExactly(
    size: number,
    allowEndOfStream: true,
  ): Promise<Buffer | null>;
  private async readExactly(
    size: number,
    allowEndOfStream: boolean,
  ): Promise<Buffer | null> {
    while (this.buffered.length < size) {
      const chunk = await this.pull();
      if (!chunk) {
        if (allowEndOfStream && this.buffered.length === 0) {
          return null;
        }
        throw new Error('Unexpected end of tar archive');
      }
      this.buffered =
        this.buffered.length === 0
          ? chunk
          : Buffer.concat([this.buffered, chunk]);
    }

    const result = this.buffered.subarray(0, size);
    this.buffered = this.buffered.subarray(size);
    return result;
  }

  private async readUpTo(max: number): Promise<Buffer | null> {
    if (this.buffered.length === 0) {
      const chunk = await this.pull();
      if (!chunk) {
        return null;
      }
      this.buffered = chunk;
    }

    const take = Math.min(max, this.buffered.length);
    const result = this.buffered.subarray(0, take);
    this.buffered = this.buffered.subarray(take);
    return result;
  }

  private async skip(size: number): Promise<void> {
    let remaining = size;
    while (remaining > 0) {
      const chunk = await this.readUpTo(Math.min(remaining, 64 * 1024));
      if (!chunk) {
        throw new Error('Unexpected end of tar archive');
      }
      remaining -= chunk.length;
    }
  }

  private async pull(): Promise<Buffer | null> {
    if (this.ended) {
      return null;
    }

    const result = await this.iterator.next();
    if (result.done) {
      this.ended = true;
      return null;
    }

    return Buffer.isBuffer(result.value)
      ? result.value
      : Buffer.from(result.value);
  }
}

export function assertSafeEntryName(name: string): void {
  if (
    name.length === 0 ||
    name.length > NAME_LENGTH ||
    name.startsWith('/') ||
    name.includes('\\') ||
    name.includes('\0') ||
    name
      .split('/')
      .some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`Unsafe archive entry name: "${name}"`);
  }
}

function createHeader(name: string, size: number, modifiedAt: Date): Buffer {
  const header = Buffer.alloc(BLOCK_SIZE, 0);

  if (Buffer.byteLength(name, 'utf8') > NAME_LENGTH) {
    throw new Error(`Archive entry name is too long: "${name}"`);
  }

  header.write(name, 0, NAME_LENGTH, 'utf8');
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(
    header,
    136,
    12,
    Math.max(0, Math.floor(modifiedAt.getTime() / 1000)),
  );
  header.fill(0x20, CHECKSUM_OFFSET, CHECKSUM_OFFSET + CHECKSUM_LENGTH);
  header.write('0', 156, 1, 'ascii');
  header.write('ustar', 257, 5, 'ascii');
  header.write('00', 263, 2, 'ascii');
  header.write('vendkit', 265, 7, 'ascii');
  header.write('vendkit', 297, 7, 'ascii');

  const checksum = sumBytes(header);
  // The standard checksum field is six octal digits, NUL, space.
  writeOctal(header, CHECKSUM_OFFSET, CHECKSUM_LENGTH - 1, checksum);
  header[CHECKSUM_OFFSET + 6] = 0;
  header[CHECKSUM_OFFSET + 7] = 0x20;

  return header;
}

interface ParsedHeader {
  name: string;
  size: number;
}

function parseHeader(block: Buffer): ParsedHeader {
  const checksum = parseOctal(block, CHECKSUM_OFFSET, CHECKSUM_LENGTH);
  const expected = sumBytesWithChecksumSpaces(block);

  if (checksum !== expected) {
    throw new Error('Tar header checksum mismatch');
  }

  const name = readCString(block, 0, NAME_LENGTH);
  assertSafeEntryName(name);

  const prefix = readCString(block, PREFIX_OFFSET, PREFIX_LENGTH);
  if (prefix.length > 0) {
    throw new Error('Long tar path prefixes are not supported');
  }

  const magic = block.toString('ascii', 257, 263);
  if (magic !== 'ustar\0' && magic !== 'ustar ') {
    throw new Error('Unsupported tar archive format');
  }

  const typeFlag = String.fromCharCode(block[156] ?? 0);
  if (typeFlag !== '0' && typeFlag !== '\0') {
    throw new Error('Only regular files are allowed in backup archives');
  }

  const size = parseOctal(block, 124, 12);

  return { name, size };
}

function writeOctal(
  buffer: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Value cannot be encoded as a tar octal field');
  }

  const encoded = value.toString(8);
  if (encoded.length > length - 1) {
    throw new Error('Value exceeds the tar octal field width');
  }

  buffer.write(encoded.padStart(length - 1, '0'), offset, length - 1, 'ascii');
  buffer[offset + length - 1] = 0;
}

function parseOctal(buffer: Buffer, offset: number, length: number): number {
  const raw = buffer
    .subarray(offset, offset + length)
    .toString('ascii')
    .replace(/\0/g, '')
    .trim();

  if (raw.length === 0) {
    return 0;
  }
  if (!/^[0-7]+$/.test(raw)) {
    throw new Error('Invalid tar octal field');
  }

  const parsed = Number.parseInt(raw, 8);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error('Tar field exceeds the supported size');
  }

  return parsed;
}

function readCString(buffer: Buffer, offset: number, length: number): string {
  const field = buffer.subarray(offset, offset + length);
  const end = field.indexOf(0);
  const slice = end === -1 ? field : field.subarray(0, end);
  return slice.toString('utf8');
}

function sumBytes(buffer: Buffer): number {
  let total = 0;
  for (const byte of buffer) {
    total += byte;
  }
  return total;
}

function sumBytesWithChecksumSpaces(buffer: Buffer): number {
  let total = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    const byte =
      index >= CHECKSUM_OFFSET && index < CHECKSUM_OFFSET + CHECKSUM_LENGTH
        ? 0x20
        : (buffer[index] ?? 0);
    total += byte;
  }
  return total;
}

function isZeroBlock(buffer: Buffer): boolean {
  return buffer.every((byte) => byte === 0);
}

function paddingFor(size: number): number {
  return (BLOCK_SIZE - (size % BLOCK_SIZE)) % BLOCK_SIZE;
}
