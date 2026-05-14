/**
 * Database seed script — creates initial admin user, categories, and tags.
 *
 * Usage:
 *   MONGODB_URI=<your-uri> npx tsx scripts/seed.ts
 *
 * Or add to package.json:
 *   "seed": "tsx scripts/seed.ts"
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI environment variable is required.');
  process.exit(1);
}

// ── Inline minimal schemas (avoids Next.js/module resolution issues) ──────────

interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'editor';
  isActive: boolean;
}
interface ICategory {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  blogCount: number;
}
interface ITag {
  name: string;
  slug: string;
  blogCount: number;
}

const UserSchema = new mongoose.Schema<IUser & mongoose.Document>({
  name: String,
  email: { type: String, lowercase: true, trim: true },
  password: String,
  role: { type: String, enum: ['super_admin', 'admin', 'editor'], default: 'editor' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CategorySchema = new mongoose.Schema<ICategory & mongoose.Document>({
  name: { type: String, trim: true },
  slug: { type: String, lowercase: true, trim: true },
  description: String,
  color: String,
  isActive: { type: Boolean, default: true },
  blogCount: { type: Number, default: 0 },
}, { timestamps: true });
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ name: 1 }, { unique: true });

const TagSchema = new mongoose.Schema<ITag & mongoose.Document>({
  name: { type: String, trim: true },
  slug: { type: String, lowercase: true, trim: true },
  blogCount: { type: Number, default: 0 },
}, { timestamps: true });
TagSchema.index({ slug: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model<IUser & mongoose.Document>('User', UserSchema);
const Category = mongoose.models.Category || mongoose.model<ICategory & mongoose.Document>('Category', CategorySchema);
const Tag = mongoose.models.Tag || mongoose.model<ITag & mongoose.Document>('Tag', TagSchema);

// ── Seed Data ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Technology', slug: 'technology', description: 'Latest in tech, software, and hardware', color: '#6366f1' },
  { name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'Artificial intelligence, ML, and deep learning', color: '#8b5cf6' },
  { name: 'How-To Guides', slug: 'how-to-guides', description: 'Step-by-step tutorials and guides', color: '#06b6d4' },
  { name: 'Product Reviews', slug: 'product-reviews', description: 'In-depth product analysis and reviews', color: '#10b981' },
  { name: 'Business & Marketing', slug: 'business-marketing', description: 'Growth strategies and marketing insights', color: '#f59e0b' },
  { name: 'Development', slug: 'development', description: 'Web, mobile, and software development', color: '#ef4444' },
];

const TAGS = [
  'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'python',
  'ai', 'machine-learning', 'llm', 'automation', 'seo', 'productivity',
  'tutorial', 'beginner', 'advanced', 'open-source', 'api', 'database',
  'performance', 'security',
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function seed() {
  console.log('🌱  AI Blog Platform — Database Seed Script\n');

  await mongoose.connect(MONGODB_URI as string);
  console.log('✅  Connected to MongoDB\n');

  // ── Admin User ──────────────────────────────────────────────────────────────
  const existingAdmin = await User.findOne({ role: 'super_admin' });
  if (existingAdmin) {
    console.log('⚠️   Super admin already exists:', existingAdmin.email);
  } else {
    const name = await prompt('Enter admin name (default: Admin): ') || 'Admin';
    const email = await prompt('Enter admin email (default: admin@example.com): ') || 'admin@example.com';
    const password = await prompt('Enter admin password (default: Admin@1234): ') || 'Admin@1234';

    const hash = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email, password: hash, role: 'super_admin' });
    console.log('\n✅  Admin user created:', admin.email);
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  let categoriesCreated = 0;
  for (const cat of CATEGORIES) {
    try {
      await Category.create({ ...cat, isActive: true, blogCount: 0 });
      categoriesCreated++;
    } catch {
      // Skip duplicates
    }
  }
  console.log(`✅  Categories seeded: ${categoriesCreated}/${CATEGORIES.length} created`);

  // ── Tags ─────────────────────────────────────────────────────────────────────
  let tagsCreated = 0;
  for (const tagName of TAGS) {
    try {
      await Tag.create({ name: tagName, slug: slugify(tagName), blogCount: 0 });
      tagsCreated++;
    } catch {
      // Skip duplicates
    }
  }
  console.log(`✅  Tags seeded: ${tagsCreated}/${TAGS.length} created`);

  await mongoose.disconnect();
  console.log('\n🎉  Seed complete! You can now log in at /admin/login');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
