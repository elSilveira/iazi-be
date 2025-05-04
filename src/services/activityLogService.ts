import prisma from '../utils/prismaClient';

interface RelatedEntity {
  id: string;
  type: string;
}

/**
 * Logs an activity for a specific user.
 *
 * @param userId - The ID of the user performing the action.
 * @param type - The type of activity (e.g., 'NEW_APPOINTMENT', 'NEW_REVIEW').
 * @param relatedEntity - Optional entity related to the activity (e.g., the appointment or review object).
 * @param message - A descriptive message for the activity log.
 */
export const logActivity = async (
  userId: string,
  type: string,
  message: string,
  relatedEntity?: RelatedEntity | null
): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type,
        message,
        relatedEntityId: relatedEntity?.id,
        relatedEntityType: relatedEntity?.type,
      },
    });
    console.log(`Activity logged: User ${userId}, Type: ${type}, Message: ${message}`);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Decide if the error should be thrown or handled silently
    // Depending on the application's needs, you might not want
    // a logging failure to interrupt the main flow.
    // throw new Error('Failed to log activity');
  }
};

/**
 * Retrieves the activity feed for a given user.
 *
 * @param userId - The ID of the user whose feed is being requested.
 * @param page - The page number for pagination (default: 1).
 * @param pageSize - The number of items per page (default: 10).
 * @returns A list of activity logs for the user.
 */
export const getUserActivityFeed = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const activities = await prisma.activityLog.findMany({
      where: {
        // Initially, just fetch the user's own activities.
        // TODO: Expand logic to include activities from followed entities if/when a follow system exists.
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    const totalActivities = await prisma.activityLog.count({
        where: {
            userId: userId,
        },
    });

    return {
        data: activities,
        pagination: {
            page,
            pageSize,
            totalItems: totalActivities,
            totalPages: Math.ceil(totalActivities / pageSize),
        }
    };

  } catch (error) {
    console.error('Error fetching user activity feed:', error);
    throw new Error('Failed to fetch activity feed');
  }
};

