import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import Restaurant from "@models/restaurant.model"
import Blogger from "@models/blogger.model"
import Category from "@models/category.model"

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Categories by Recommendations
    const categoriesByRecommendations = await Category.aggregate([
      {
        $project: {
          name: 1,
          recommendationsCount: { $size: "$recommendations" }
        }
      },
      {
        $match: {
          recommendationsCount: { $gt: 0 }
        }
      },
      {
        $sort: { recommendationsCount: -1 }
      }
    ])

    // Top Bloggers by Recommendations
    const topBloggersByRecommendations = await Blogger.aggregate([
      {
        $project: {
          name: 1,
          recommendationsCount: { $size: "$recommendations" }
        }
      },
      {
        $match: {
          recommendationsCount: { $gt: 0 }
        }
      },
      {
        $sort: { recommendationsCount: -1 }
      },
      {
        $limit: 10
      }
    ])

    // Top Restaurants by Recommendations
    const topRestaurantsByRecommendations = await Restaurant.aggregate([
      {
        $project: {
          name: 1,
          recommendationsCount: { $size: "$recommendations" }
        }
      },
      {
        $match: {
          recommendationsCount: { $gt: 0 }
        }
      },
      {
        $sort: { recommendationsCount: -1 }
      },
      {
        $limit: 10
      }
    ])

    // Recommendations Over Time
    const recommendationsOverTime = await Recommendation.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }
      }
    ])

    // Top Bloggers by Followers
    const topBloggersByFollowers = await Blogger.aggregate([
      {
        $project: {
          name: 1,
          followersCount: { $size: "$followers" }
        }
      },
      {
        $match: {
          followersCount: { $gt: 0 }
        }
      },
      {
        $sort: { followersCount: -1 }
      },
      {
        $limit: 10
      }
    ])

    res.status(200).json({
      data: {
        categoriesByRecommendations: categoriesByRecommendations.map(item => ({
          category: item.name,
          count: item.recommendationsCount
        })),
        topBloggersByRecommendations: topBloggersByRecommendations.map(item => ({
          blogger: item.name,
          count: item.recommendationsCount
        })),
        topRestaurantsByRecommendations: topRestaurantsByRecommendations.map(item => ({
          restaurant: item.name,
          count: item.recommendationsCount
        })),
        recommendationsOverTime: recommendationsOverTime,
        topBloggersByFollowers: topBloggersByFollowers.map(item => ({
          blogger: item.name,
          count: item.followersCount
        }))
      },
      message: "Dashboard stats fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error
    })
  }
}
