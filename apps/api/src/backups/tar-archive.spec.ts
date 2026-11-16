import { Writable } from 'node:stream';
import { Readable } from 'node:stream';
import { TarReader, TarWriter } from './tar-archive.js';

function createSink(): { stream: Writable; chunks: Buffer[] } {
  const chunks: Buffer[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  return { stream, chunks };
}

async function readEntries(
  buffer: Buffer,
  limits = { maxEntries: 10, maxExtractedBytes: 1024 * 1024 },
) {
  const reader = new TarReader(Readable.from([buffer]), limits);
  const entries: Array<{ name: string; data: Buffer }> = [];

  for (;;) {
    const header = await reader.next();
    if (!header) {
      break;
    }
    const chunks: Buffer[] = [];
    await reader.readData(async (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    entries.push({ name: header.name, data: Buffer.concat(chunks) });
  }

  return entries;
}

describe('TarWriter and TarReader', () => {
  it('round-trips regular files and keeps entry order', async () => {
    const { stream, chunks } = createSink();
    const writer = new TarWriter(stream);

    await writer.addFile('data.json', Buffer.from('{"ok":true}'));
    await writer.addFile('media/logo.png', Buffer.from([1, 2, 3, 4, 5]));
    await writer.finish();

    const entries = await readEntries(Buffer.concat(chunks));

    expect(entries.map((entry) => entry.name)).toEqual([
      'data.json',
      'media/logo.png',
    ]);
    expect(entries[0]?.data.toString('utf8')).toBe('{"ok":true}');
    expect([...entries[1]!.data]).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects unsafe or traversal entry names', async () => {
    const { stream } = createSink();
    const writer = new TarWriter(stream);

    await expect(writer.addFile('../escape', Buffer.from('x'))).rejects.toThrow(
      'Unsafe archive entry name',
    );
    await expect(
      writer.addFile('/etc/passwd', Buffer.from('x')),
    ).rejects.toThrow('Unsafe archive entry name');
    await expect(writer.addFile('a\\b', Buffer.from('x'))).rejects.toThrow(
      'Unsafe archive entry name',
    );
  });

  it('rejects a corrupted header checksum', async () => {
    const { stream, chunks } = createSink();
    const writer = new TarWriter(stream);
    await writer.addFile('data.json', Buffer.from('x'));
    await writer.finish();

    const archive = Buffer.concat(chunks);
    archive[0] = archive[0]! ^ 1;

    await expect(readEntries(archive)).rejects.toThrow();
  });

  it('rejects data after the zero footer', async () => {
    const { stream, chunks } = createSink();
    const writer = new TarWriter(stream);
    await writer.addFile('data.json', Buffer.from('x'));
    await writer.finish();

    const archive = Buffer.concat([Buffer.concat(chunks), Buffer.from([1])]);

    await expect(readEntries(archive)).rejects.toThrow(
      'Unexpected data after the tar archive footer',
    );
  });

  it('enforces the extracted byte limit', async () => {
    const { stream, chunks } = createSink();
    const writer = new TarWriter(stream);
    await writer.addFile('data.json', Buffer.alloc(600, 1));
    await writer.finish();

    await expect(
      readEntries(Buffer.concat(chunks), {
        maxEntries: 10,
        maxExtractedBytes: 100,
      }),
    ).rejects.toThrow('configured limit');
  });

  it('rejects truncated archives', async () => {
    const { stream, chunks } = createSink();
    const writer = new TarWriter(stream);
    await writer.addFile('data.json', Buffer.from('hello'));
    await writer.finish();

    const archive = Buffer.concat(chunks);
    await expect(readEntries(archive.subarray(0, 700))).rejects.toThrow();
  });
});
