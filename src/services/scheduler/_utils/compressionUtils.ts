import { createReadStream, createWriteStream, unlinkSync } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGzip } from 'zlib';

const pipelineAsync = promisify(pipeline);

export async function compressFile(inputPath: string, outputPath: string): Promise<void> {
  const gzip = createGzip();
  const source = createReadStream(inputPath);
  const destination = createWriteStream(outputPath);

  try {
    await pipelineAsync(source, gzip, destination);
    // Supprimer le fichier original après compression
    unlinkSync(inputPath);
  } catch (error) {
    throw new Error(`Erreur lors de la compression: ${error}`);
  }
}
