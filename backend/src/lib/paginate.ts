export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Helper generique de pagination Prisma.
 *
 * @param model   - Delegate Prisma exposant `findMany` et `count`
 * @param args    - Arguments de la requete (where, select, orderBy, include...)
 * @param page    - Numero de page (1-based)
 * @param limit   - Nombre d'elements par page
 */
export async function paginate<T>(
  model: {
    findMany(args: any): Promise<T[]>;
    count(args: any): Promise<number>;
  },
  args: {
    where?: any;
    select?: any;
    orderBy?: any;
    include?: any;
  },
  page: number,
  limit: number,
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({ ...args, skip, take: limit }),
    model.count({ where: args.where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
