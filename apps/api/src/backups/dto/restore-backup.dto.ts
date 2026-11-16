import { Equals, IsString } from 'class-validator';

/**
 * Restore is destructive. The API requires the literal confirmation phrase
 * even after the UI has shown its own warning dialog.
 */
export class RestoreBackupDto {
  @IsString()
  @Equals('RESTORE')
  confirmation!: string;
}

export const RESTORE_CONFIRMATION_PHRASE = 'RESTORE';
