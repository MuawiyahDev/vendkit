import {
  createArchiveIdentity,
  sanitizeOriginalFileName,
} from './backups.utils.js';

describe('backup utilities', () => {
  it('creates a versioned, safe archive name and storage key', () => {
    const identity = createArchiveIdentity(
      'MANUAL',
      new Date('2026-11-16T12:34:56.000Z'),
    );

    expect(identity.fileName).toBe('vendkit-backup-20261116T123456Z.tar.gz');
    expect(identity.storageKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tar\.gz$/,
    );
  });

  it('labels pre-restore safety archives', () => {
    const identity = createArchiveIdentity(
      'PRE_RESTORE',
      new Date('2026-11-16T12:34:56.000Z'),
    );

    expect(identity.fileName).toContain('pre-restore-backup');
  });

  it('strips path components and control characters from uploaded names', () => {
    expect(sanitizeOriginalFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeOriginalFileName('C:\\temp\\backup.tar.gz')).toBe(
      'backup.tar.gz',
    );
    expect(sanitizeOriginalFileName('bad\u0000name.tar.gz')).toBe(
      'badname.tar.gz',
    );
    expect(sanitizeOriginalFileName(undefined)).toBe('backup.tar.gz');
  });
});
