import Recommendation from "@models/recommendation.model"
import { deleteFileFromGCS } from "@utils/gcs.util"
import mongoose, { CallbackError, Document, Schema } from "mongoose"
import path from "path"

export interface IBlogger extends Document {
  name: string
  bio: string
  image: string
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

// Pre-remove hook to handle blogger deletion
BloggerSchema.pre(
  ["findOneAndDelete", "deleteMany"],
  { document: false, query: true },
  async function (next) {
    const bloggers = await this.model.find(this.getFilter()) // Find blogger(s) being deleted

    try {
      // Loop through each blogger and handle deletions
      for (const blogger of bloggers) {
        // 1. Delete blogger's image from GCS
        if (blogger.image) {
          const oldImageFileName = path.basename(blogger.image) // Extract the filename from the image URL
          await deleteFileFromGCS(`bloggers/${oldImageFileName}`)
        }

        // 2. Find and delete all recommendations associated with the blogger
        const recommendations = await Recommendation.find({
          _id: { $in: blogger.recommendations }
        })
        const recommendationIds = recommendations.map((r: any) =>
          r._id.toString()
        )
        await Recommendation.deleteMany({ _id: { $in: recommendationIds } })
        // This will fire the `pre` hooks for recommendations to ensure cleanup is done.
      }

      next() // Proceed with the deletion
    } catch (err) {
      next(err as CallbackError)
    }
  }
)

export default mongoose.model<IBlogger>("Blogger", BloggerSchema)
