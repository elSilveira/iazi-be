// Basic structure for Schedule Block Repository
import { prisma } from "../lib/prisma";
import { Prisma, ScheduleBlock } from "@prisma/client";

export const scheduleBlockRepository = {
  async findMany(params: Prisma.ScheduleBlockFindManyArgs): Promise<ScheduleBlock[]> {
    return prisma.scheduleBlock.findMany(params);
  },

  // Add other necessary methods like findById, create, update, delete as needed
};

