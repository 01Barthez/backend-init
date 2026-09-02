import fs from 'fs';
import path from 'path';

/**
 * Ensure a directory exists and is writable.
 * Creates the path recursively when missing.
 *
 * @throws {Error} when the directory cannot be created or is not writable
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true,
      mode: 0o755,
    });
  }

  try {
    const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (writeError) {
    throw new Error(`Cannot write to directory: ${dirPath}. Check permissions.` + writeError);
  }
}

/** Read a UTF-8 file synchronously with a clear failure message. */
export function readFileSync(filePath: string): string {
  try {
    const pathResolv = path.resolve(filePath);
    return fs.readFileSync(pathResolv, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}: ${error}`);
  }
}
