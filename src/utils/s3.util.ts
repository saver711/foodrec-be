import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3"
import multer from "multer"
import path from "node:path"
import crypto from "node:crypto"

// Initialize AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

// Specify the bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME!

// Configure multer for file uploads
export const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory before uploading to S3
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
})

// Function to upload file to AWS S3 (generic)
export const uploadFileToS3 = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  try {
    const fileName = `${folder}/${Date.now()}_${file.originalname}`
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    })

    await s3Client.send(command)

    // Construct the public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`
    return publicUrl
  } catch (error) {
    console.error("Error uploading file to S3:", error)
    throw error
  }
}

// Function to upload multiple files to AWS S3 (generic)
export const uploadFilesToS3 = async (
  files: Express.Multer.File[],
  folder: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => {
      return uploadFileToS3(file, folder)
    })
    const uploadedFileUrls = await Promise.all(uploadPromises)
    return uploadedFileUrls
  } catch (err) {
    throw err
  }
}

// Function to delete a file from AWS S3
export const deleteFileFromS3 = async (filePath: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath
    })

    await s3Client.send(command)
  } catch (error) {
    console.error("Error deleting file from S3:", error)
    throw error
  }
}

// Function to delete multiple files from AWS S3
export const deleteFilesFromS3 = async (
  files: string[],
  storageFolderName: string
): Promise<void[]> => {
  try {
    const deletePromises = files.map(file => {
      const oldFileName = path.basename(file)
      return deleteFileFromS3(`${storageFolderName}/${oldFileName}`)
    })
    return await Promise.all(deletePromises)
  } catch (err) {
    throw err
  }
}

const getFileNameFromUrl = (url: string) => url.split("/").pop()

export const deleteFilesWrapper = async <T>(
  entities: T[],
  mediaKey: keyof T,
  storageFolderName: string
) => {
  for (const entity of entities) {
    console.log({ entity })
    if (entity[mediaKey]) {
      console.log({ mediaKey })
      if (Array.isArray(entity[mediaKey])) {
        console.log("array")
        const fileNames = entity[mediaKey]
          .map((file: string) => getFileNameFromUrl(file))
          .filter((fileName): fileName is string => fileName !== undefined)
        await deleteFilesFromS3(fileNames, storageFolderName)
      } else {
        const fileName = getFileNameFromUrl(entity[mediaKey] as string)
        console.log({ fileName })
        await deleteFileFromS3(`${storageFolderName}/${fileName}`)
      }
    }
  }
}

// Function to get file from S3
export const getFileFromS3 = async (filePath: string): Promise<Buffer> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath
    })

    const response = await s3Client.send(command)
    const chunks: Uint8Array[] = []

    if (response.Body) {
      for await (const chunk of response.Body as any) {
        chunks.push(chunk)
      }
    }

    return Buffer.concat(chunks)
  } catch (error) {
    console.error("Error getting file from S3:", error)
    throw error
  }
}

// Function to calculate MD5 hash of a buffer
const calculateFileHash = (buffer: Buffer): string => {
  return crypto.createHash("md5").update(buffer).digest("hex")
}

// Function to check if uploaded file is the same as existing file in S3
export const isFileSameAsS3 = async (
  uploadedFile: Express.Multer.File,
  s3FilePath: string
): Promise<boolean> => {
  try {
    // Get file from S3
    const s3FileBuffer = await getFileFromS3(s3FilePath)

    // Calculate hashes
    const uploadedFileHash = calculateFileHash(uploadedFile.buffer)
    const s3FileHash = calculateFileHash(s3FileBuffer)

    // Compare hashes
    return uploadedFileHash === s3FileHash
  } catch (error) {
    // If file doesn't exist in S3 or error occurs, consider them different
    console.error("Error comparing files:", error)
    return false
  }
}

// Function to find matching files between uploaded files and existing S3 files
// Returns an object with:
// - filesToKeep: existing S3 file URLs that match uploaded files
// - filesToUpload: new files that don't match any existing file
// - filesToDelete: existing S3 files that don't match any uploaded file
export const compareMultipleFilesWithS3 = async (
  uploadedFiles: Express.Multer.File[],
  existingS3FileUrls: string[],
  s3Folder: string
): Promise<{
  filesToKeep: string[]
  filesToUpload: Express.Multer.File[]
  filesToDelete: string[]
}> => {
  const filesToKeep: string[] = []
  const filesToUpload: Express.Multer.File[] = []
  const matchedExistingFiles = new Set<string>()

  // For each uploaded file, check if it matches any existing file
  for (const uploadedFile of uploadedFiles) {
    let matched = false
    for (const existingUrl of existingS3FileUrls) {
      if (matchedExistingFiles.has(existingUrl)) {
        continue // This existing file already matched another uploaded file
      }

      const existingFileName = path.basename(existingUrl)
      const s3FilePath = `${s3Folder}/${existingFileName}`
      const isSame = await isFileSameAsS3(uploadedFile, s3FilePath)

      if (isSame) {
        filesToKeep.push(existingUrl)
        matchedExistingFiles.add(existingUrl)
        matched = true
        break
      }
    }

    // If no match found, this is a new file to upload
    if (!matched) {
      filesToUpload.push(uploadedFile)
    }
  }

  // Find existing files that weren't matched (to be deleted)
  const filesToDelete = existingS3FileUrls.filter(
    url => !matchedExistingFiles.has(url)
  )

  return {
    filesToKeep,
    filesToUpload,
    filesToDelete
  }
}
