import { Storage } from "@google-cloud/storage"
import multer from "multer"
import path from "path"

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEYFILE_NAME // Path to your service account key
})

// Specify the bucket name
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!)

// Configure multer for file uploads
export const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory before uploading to GCS
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
})

// Function to upload file to Google Cloud Storage (generic)
export const uploadFileToGCS = (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(`${folder}/${Date.now()}_${file.originalname}`)
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype
      //   public: true
    })

    blobStream.on("error", err => reject(err))

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      resolve(publicUrl) // Return the public URL
    })

    blobStream.end(file.buffer)
  })
}

// Function to upload multiple files to Google Cloud Storage (generic)
export const uploadFilesToGCS = (
  files: Express.Multer.File[],
  folder: string
): Promise<string[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadPromises = files.map(file => {
        return uploadFileToGCS(file, folder) // Using the existing upload function
      })
      const uploadedFileUrls = await Promise.all(uploadPromises)
      resolve(uploadedFileUrls) // Resolve with the array of file URLs
    } catch (err) {
      reject(err) // Reject in case of error
    }
  })
}

// Function to delete a file from Google Cloud Storage
export const deleteFileFromGCS = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = bucket.file(filePath)
    console.log(`🚀 ~ returnnewPromise ~ filePath:`, filePath)
    file.delete(err => {
      if (err) {
        console.log({ err })

        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Function to delete multiple files from Google Cloud Storage
export const deleteFilesFromGCS = (
  files: string[],
  storageFolderName: string
): Promise<void[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const deletePromises = files.map(file => {
        const oldFileName = path.basename(file)
        return deleteFileFromGCS(`${storageFolderName}/${oldFileName}`) // Using the existing deleteFileFromGCS function
      })
      const results = await Promise.all(deletePromises) // Wait for all delete operations to complete
      resolve(results) // Resolve when all files are deleted
    } catch (err) {
      reject(err) // Reject in case of any errors
    }
  })
}
