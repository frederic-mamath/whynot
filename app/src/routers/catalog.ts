import { router, protectedProcedure } from "../trpc";
import { categoryRepository, conditionRepository } from "../repositories";

export const catalogRouter = router({
  listCategories: protectedProcedure.query(async () => {
    const categories = await categoryRepository.findAll();
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      position: c.position,
    }));
  }),

  listConditions: protectedProcedure.query(async () => {
    const conditions = await conditionRepository.findAll();
    return conditions.map((c) => ({
      id: c.id,
      name: c.name,
      position: c.position,
    }));
  }),
});
