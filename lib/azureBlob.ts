// Azure Blob Storage upload utility
import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
import { promises as fs } from 'fs';

// Read env vars lazily (do NOT throw on import so routes that don't use Azure don't crash)
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;
const AZURE_USE_LOCAL_FALLBACK = process.env.AZURE_USE_LOCAL_FALLBACK === 'true';

/**
 * Uploads a Buffer to Azure Blob Storage.
 * If Azure env is not configured and AZURE_USE_LOCAL_FALLBACK=true (or NODE_ENV !== 'production'),
 * it will save the file under `public/<blobName>` and return a local URL instead.
 */
export async function uploadToAzureBlob(fileBuffer: Buffer, blobName: string, mimetype?: string): Promise<string> {
  // If Azure config missing, optionally fallback to local storage for development
  if (!AZURE_STORAGE_CONNECTION_STRING || !AZURE_STORAGE_CONTAINER_NAME) {
    if (AZURE_USE_LOCAL_FALLBACK || process.env.NODE_ENV !== 'production') {
      const localPath = path.join(process.cwd(), 'public', blobName);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, fileBuffer);
      const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || '';
      // Construct public URL - ensure we don't duplicate slashes
      const publicUrl = `${baseUrl}/${blobName}`.replace(/([^:])\/\//g, '$1/');
      return publicUrl;
    }
    throw new Error('Azure Storage connection string or container name is not set in environment variables.');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: mimetype ? { blobContentType: mimetype } : undefined,
  });
  return blockBlobClient.url;
} 

export async function deleteFromAzureBlob(fileUrlOrPath: string | null) {
  if (!fileUrlOrPath) return;

  try {
    // If Azure not configured, delete from local public fallback when used
    if (!AZURE_STORAGE_CONNECTION_STRING || !AZURE_STORAGE_CONTAINER_NAME) {
      if (AZURE_USE_LOCAL_FALLBACK || process.env.NODE_ENV !== 'production') {
        // Try to extract a path after the container (if the URL included it) or use the given path
        let blobName = fileUrlOrPath;
        const container = AZURE_STORAGE_CONTAINER_NAME || 'uploads';
        if (fileUrlOrPath.startsWith('http')) {
          const urlParts = fileUrlOrPath.split(`/${container}/`);
          if (urlParts.length > 1) blobName = decodeURIComponent(urlParts[1]);
        }
        const localPath = path.join(process.cwd(), 'public', blobName);
        try { await fs.unlink(localPath); console.log(`Deleted local fallback file: ${localPath}`); } catch (e) { /* ignore */ }
        return;
      }
      return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);

    // Extract blob name from URL or take as-is
    let blobName = fileUrlOrPath;
    if (fileUrlOrPath.startsWith('http')) {
       const urlParts = fileUrlOrPath.split(`/${AZURE_STORAGE_CONTAINER_NAME}/`);
       if (urlParts.length > 1) {
          blobName = decodeURIComponent(urlParts[1]);
       }
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
    console.log(`Deleted blob: ${blobName}`);

  } catch (error) {
    console.warn(`Failed to delete blob: ${fileUrlOrPath}`, error);
  }
}