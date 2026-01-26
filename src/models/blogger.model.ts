import Recommendation from "@models/recommendation.model"
import { deleteFileFromS3 } from "@utils/s3.util"
import mongoose, { CallbackError, Document, Schema } from "mongoose"
import path from "path"

export interface IBlogger extends Document {
  name: string
  bio: string
  image: string
  // TODO: platform should be enum
  socialLinks: { platform: string; url: string }[]
  recommendations: mongoose.Types.ObjectId[]
  followers: mongoose.Types.ObjectId[]
}

const BloggerSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  bio: { type: String, required: true },
  image: { type: String }, // URL to blogger's image
  socialLinks: [
    {
      platform: { type: String },
      url: { type: String }
    }
  ],
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }], // Many recommendations
  // TODO: ref is User or AppUser?
  followers: [{ type: Schema.Types.ObjectId, ref: "AppUser" }] // Many followers
})

// Post hook to handle cleanup after blogger deletion
BloggerSchema.post(
  ["findOneAndDelete", "deleteMany"],
  async function (doc: IBlogger) {
    try {
      const bloggers: IBlogger[] = doc
        ? [doc]
        : await this.model.find(this.getFilter())

      // Loop through each blogger and handle deletions
      for (const blogger of bloggers) {
        // 1. Delete blogger's image from S3
        if (blogger.image) {
          const oldImageFileName = path.basename(blogger.image)
          await deleteFileFromS3(`bloggers/${oldImageFileName}`)
        }

        // 2. Find and delete all recommendations associated with the blogger
        const recommendationIds = blogger.recommendations.map(id =>
          id.toString()
        )
        await Recommendation.deleteMany({ _id: { $in: recommendationIds } })
        // This will trigger any post hooks on the Recommendation model for further cleanup.
      }
    } catch (err) {
      console.error("Error during blogger post-delete cleanup:", err)
    }
  }
)

export default mongoose.model<IBlogger>("Blogger", BloggerSchema)
