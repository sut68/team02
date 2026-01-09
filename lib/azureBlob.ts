// Azure Blob Storage upload utility
import { BlobServiceClient } from '@azure/storage-blob';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME!;

if (!AZURE_STORAGE_CONNECTION_STRING || !AZURE_STORAGE_CONTAINER_NAME) {
  throw new Error('Azure Storage connection string or container name is not set in environment variables.');
}

export async function uploadToAzureBlob(fileBuffer: Buffer, blobName: string, mimetype?: string): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: mimetype ? { blobContentType: mimetype } : undefined,
  });
  return blockBlobClient.url;
}
