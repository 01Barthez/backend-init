import fs from 'fs';
import path from 'path';

/**
 * Checks and creates a directory with the necessary permissions
 * @param dirPath Path of the directory to check/create
 * @throws {Error} If the directory cannot be created or is not writable
 */

export function ensureDirectoryExists(dirPath: string): void {
  try {
    // Create the directory if it does not exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true,
        mode: 0o755, // More secure permissions (rwxr-xr-x)
      });
      console.log(`Directory created: ${dirPath}`);
    }

    // Check write permissions
    try {
      const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (writeError) {
      throw new Error(`Cannot write to directory: ${dirPath}. Check permissions.`);
    }
  } catch (error) {
    console.error(`Error while checking directory ${dirPath}:`, error);
    throw error; // Propagate the error for custom handling
  }
}
