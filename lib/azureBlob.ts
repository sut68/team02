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

export async function deleteFromAzureBlob(fileUrlOrPath: string | null) {
  if (!fileUrlOrPath) return;

  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const CONTAINER_NAME = "uploads";

    if (!AZURE_STORAGE_CONNECTION_STRING) return;

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // แกะชื่อไฟล์ (Blob Name) จาก URL
    // สมมติ URL: https://my.blob.core.windows.net/uploads/budget/evidence/file.pdf
    // เราต้องการแค่: budget/evidence/file.pdf
    let blobName = fileUrlOrPath;
    if (fileUrlOrPath.startsWith("http")) {
       const urlParts = fileUrlOrPath.split(`/${CONTAINER_NAME}/`);
       if (urlParts.length > 1) {
          blobName = decodeURIComponent(urlParts[1]);
       }
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // สั่งลบ
    await blockBlobClient.deleteIfExists();
    console.log(`Deleted blob: ${blobName}`);

  } catch (error) {
    console.warn(`Failed to delete blob: ${fileUrlOrPath}`, error);
  }
}