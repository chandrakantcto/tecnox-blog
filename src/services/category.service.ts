import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { Blog } from '@/models/Blog';
import { generateSlug } from '@/utils/slug';
import type { CreateCategoryInput } from '@/validations/category.schema';

export class CategoryService {
  async create(input: CreateCategoryInput) {
    await connectToDatabase();
    const slug = input.slug || generateSlug(input.name);

    const existing = await Category.findOne({ slug });
    if (existing) throw new Error('Category with this slug already exists');

    return Category.create({ ...input, slug });
  }

  async update(id: string, input: Partial<CreateCategoryInput>) {
    await connectToDatabase();
    if (input.name && !input.slug) {
      input.slug = generateSlug(input.name);
    }
    return Category.findByIdAndUpdate(id, input, { new: true });
  }

  async delete(id: string, forceDelete = false) {
    await connectToDatabase();

    const inUseCount = await Blog.countDocuments({ category: id });
    if (inUseCount > 0 && !forceDelete) {
      throw new Error(`Cannot delete: category is used in ${inUseCount} blog(s)`);
    }

    return Category.findByIdAndDelete(id);
  }

  async getAll(includeInactive = false) {
    await connectToDatabase();
    const filter = includeInactive ? {} : { isActive: true };
    return Category.find(filter).sort({ name: 1 }).lean();
  }

  async getBySlug(slug: string) {
    await connectToDatabase();
    return Category.findOne({ slug, isActive: true }).lean();
  }

  async getById(id: string) {
    await connectToDatabase();
    return Category.findById(id).lean();
  }
}
