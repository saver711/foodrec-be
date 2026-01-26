import { createRecommendation } from "@controllers/recommendation-controllers/crud/create-recommendation.controller"
import { deleteMultiRecommendations } from "@controllers/recommendation-controllers/crud/delete-multi-recommendations.controller"
import { deleteRecommendation } from "@controllers/recommendation-controllers/crud/delete-recommendation.controller"
import { getAllRecommendations } from "@controllers/recommendation-controllers/crud/get-all-recommendations.controller"
import { getRecommendationById } from "@controllers/recommendation-controllers/crud/get-recommendation-by-id.controller"
import { updateRecommendation } from "@controllers/recommendation-controllers/crud/update-recommendation.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/s3.util"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

// Create a new recommendation
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  upload.array("mealImages"),
  (req: Request, res: Response, next: NextFunction) => {
    createRecommendation(req, res)
  }
)

// Get a recommendation by ID
router.get(
  "/:id",
  // (req: Request, res: Response, next: NextFunction) => {
  //   authenticate(req, res, next)
  // },
  // (req: Request, res: Response, next: NextFunction) => {
  //   authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
  //     req,
  //     res,
  //     next
  //   )
  // },
  (req: Request, res: Response, next: NextFunction) => {
    getRecommendationById(req, res)
  }
)

// Update a recommendation by ID
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next) // Allow SUPER_ADMIN and AUDITOR to update
  },
  upload.array("mealImages"),
  (req: Request, res: Response, next: NextFunction) => {
    updateRecommendation(req, res)
  }
)

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Get all recommendations
 *     description: Fetches all recommendations with optional filters, sorting, and pagination.
 *     tags:
 *       - RECOMMENDATIONS
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The page number (0-indexed).
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: mealName
 *         description: Field to sort by (e.g., mealName, rating, or nearest).
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: asc
 *         description: Sort order (ascending or descending).
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           example: 30.0444
 *         description: Latitude for nearest location sorting.
 *       - in: query
 *         name: long
 *         schema:
 *           type: number
 *           example: 31.2357
 *         description: Longitude for nearest location sorting.
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           example: blogger,restaurant
 *         description: Comma-separated fields to populate in the response.
 *       - in: query
 *         name: _id
 *         schema:
 *           type: string
 *           example: "64adcf4d3e6f5b7f7a098c3e"
 *         description: Filter by recommendation ID.
 *       - in: query
 *         name: mealName
 *         schema:
 *           type: string
 *           example: "Spaghetti Bolognese"
 *         description: Partial match for meal name.
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           example: 4.5
 *         description: Exact match for rating.
 *       - in: query
 *         name: restaurantIds
 *         schema:
 *           type: string
 *           example: "64adcf4d3e6f5b7f7a098c3e,64adcf4d3e6f5b7f7a098c3f"
 *         description: Comma-separated restaurant IDs to filter by.
 *       - in: query
 *         name: bloggerIds
 *         schema:
 *           type: string
 *           example: "64adcf4d3e6f5b7f7a098c3e,64adcf4d3e6f5b7f7a098c3f"
 *         description: Comma-separated blogger IDs to filter by.
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *           example: "64adcf4d3e6f5b7f7a098c3e,64adcf4d3e6f5b7f7a098c3f"
 *         description: Comma-separated category IDs to filter by.
 *     responses:
 *       200:
 *         description: Successfully fetched recommendations.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/definitions/Recommendation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     currentPage:
 *                       type: integer
 *                       example: 0
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                 message:
 *                   type: string
 *                   example: "Recommendations fetched successfully"
 *       500:
 *         description: Failed to fetch recommendations.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch recommendations"
 */
router.get(
  "/",
  // (req: Request, res: Response, next: NextFunction) => {
  //   authenticate(req, res, next)
  // },
  // (req: Request, res: Response, next: NextFunction) => {
  //   authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
  //     req,
  //     res,
  //     next
  //   )
  // },
  (req: Request, res: Response, next: NextFunction) => {
    getAllRecommendations(req, res)
  }
)

// Delete a recommendation by ID
router.delete(
  "/:recommendationId",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next) // Only SUPER_ADMIN and AUDITOR can delete
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteRecommendation(req, res)
  }
)

// Delete multiple recommendations
router.delete(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response) => {
    deleteMultiRecommendations(req, res)
  }
)

export default router
