import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
import { deleteFileFromGCS, deleteFilesWrapper } from "@utils/gcs.util"
import mongoose, { Document, Schema } from "mongoose"
import path from "path"
import Restaurant from "./restaurant.model"


export interface IRestaurant extends Document {
  name: string
  logo: string
  recommendations: mongoose.Types.ObjectId[]
  locations: mongoose.Types.ObjectId[]
}

const RestaurantSchema: Schema = new Schema({
  name: { type: String, required: true },
  logo: { type: String }, // URL to restaurant's logo
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }], // Restaurant has many recommendations
  locations: [{ type: Schema.Types.ObjectId, ref: "Location" }] // Restaurant has many locations
})

// Post hook to handle cleanup after restaurant deletion
RestaurantSchema.post(
  ["findOneAndDelete", "deleteMany"],
  async function (doc: IRestaurant) {
    try {
      const restaurants: IRestaurant[] = doc
        ? [doc]
        : await this.model.find(this.getFilter())

      // Loop through each restaurant and handle deletions
      for (const restaurant of restaurants) {
        // 1. Delete restaurant's logo from GCS
        if (restaurant.logo) {
          const oldLogoFileName = path.basename(restaurant.logo)
          await deleteFileFromGCS(`restaurants/${oldLogoFileName}`)
        }

        // 2. Delete associated locations
        await Location.deleteMany({ restaurant: restaurant._id })

        // 3. Delete all recommendations associated with the restaurant
        await Recommendation.deleteMany({ restaurant: restaurant._id })
      }
    } catch (err) {
      console.error("Error during restaurant post-delete cleanup:", err)
    }
  }
)

const deletedRestaurantsMap = new Map<string, IRestaurant[]>()

// Utility function to remove references
const removeReferences = async (restaurantsIds: string[]) => {
  // Remove theri locations (locations is key inside restaurant model)
  await Restaurant.updateMany(
    { _id: { $in: restaurantsIds } },
    { $pull: { locations: { $in: restaurantsIds } } }
  )

  // Remove the recommendations for the restaurants
  await Recommendation.updateMany(
    { restaurant: { $in: restaurantsIds } },
    { $pull: { recommendations: { $in: restaurantsIds } } }
  )
}

// Pre hook for deleteMany
RestaurantSchema.pre("deleteMany", async function () {
  const restaurants = await this.model.find(this.getFilter())
  const key = JSON.stringify(this.getFilter())
  deletedRestaurantsMap.set(key, restaurants)
})

// Post hook for deleteMany
RestaurantSchema.post("deleteMany", async function () {
  try {
    const filterKey = JSON.stringify(this.getFilter())
    const restaurants = deletedRestaurantsMap.get(filterKey)

    if (!restaurants || restaurants.length === 0) {
      console.log("No restaurants found for cleanup.")
      return
    }

    const restaurantIds = restaurants.map(rec => rec._id.toString())

    // Remove references and delete images
    await removeReferences(restaurantIds)
    await deleteFilesWrapper(restaurants, "logo", "restaurants")

    // Clean up the map
    deletedRestaurantsMap.delete(filterKey)
  } catch (err) {
    console.error("Error during post-delete cleanup:", err)
  }
})

// Post hook for findOneAndDelete
RestaurantSchema.post(
  "findOneAndDelete",
  async function (doc: IRestaurant) {
    try {
      if (!doc) {
        console.error("No restaurant document found for post-delete hook.")
        return
      }

      const restaurantId = doc._id.toString()

      // Remove references and delete images
      console.log({restaurantId, doc})
      await removeReferences([restaurantId])
      await deleteFilesWrapper([doc], 'logo', 'restaurants')

      console.log(`Cleanup complete for restaurant: ${restaurantId}`)
    } catch (err) {
      console.error("Error during restaurant post-delete cleanup:", err)
    }
  }
)





export default mongoose.model<IRestaurant>("Restaurant", RestaurantSchema)
