import "server-only";
import { NotFoundError } from "@/lib/errors";
import type { PromptListCriteria, PromptData, PromptRecord, PromptRepository } from "@/lib/repositories/types";
import type { PrismaClient } from "./client";
import { mapPrismaError } from "./errors";

const include = {
  category: { select: { id: true, name: true, color: true } },
  author: { select: { oid: true, displayName: true } },
} as const;

type PromptRow = {
  id: string;
  title: string;
  content: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: PromptRecord["category"];
  author: PromptRecord["author"];
};

function toRecord(row: PromptRow): PromptRecord {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: row.category,
    author: row.author,
  };
}

export class PrismaPromptRepository implements PromptRepository {
  constructor(private readonly client: PrismaClient) {}

  async list({ categoryId, q, offset, limit }: PromptListCriteria) {
    // Prisma parameterizes the value but SQL Server still interprets LIKE wildcards.
    const search = q?.replace(/[%_\[]/g, (character) => `[${character}]`);
    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(q ? {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { content: { contains: search } },
        ],
      } : {}),
    };
    const [rows, total] = await this.client.$transaction([
      this.client.prompt.findMany({
        where,
        include,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: offset,
        take: limit,
      }),
      this.client.prompt.count({ where }),
    ]);
    return { items: rows.map(toRecord), total };
  }

  async findById(id: string) {
    const row = await this.client.prompt.findUnique({ where: { id }, include });
    return row ? toRecord(row) : null;
  }

  async create(data: PromptData & { authorOid: string }) {
    try {
      const row = await this.client.prompt.create({
        data: {
          title: data.title,
          content: data.content,
          description: data.description ?? null,
          categoryId: data.categoryId,
          authorOid: data.authorOid,
        },
        include,
      });
      return toRecord(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  }

  async update(id: string, data: PromptData) {
    try {
      const row = await this.client.prompt.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          description: data.description ?? null,
          categoryId: data.categoryId,
        },
        include,
      });
      return toRecord(row);
    } catch (error) {
      const mapped = mapPrismaError(error);
      if (mapped instanceof NotFoundError) return null;
      throw mapped;
    }
  }

  async delete(id: string) {
    const { count } = await this.client.prompt.deleteMany({ where: { id } });
    return count > 0;
  }
}
