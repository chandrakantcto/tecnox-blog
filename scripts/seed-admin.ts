/**
 * Super Admin seed script — creates the Super Admin user + default categories & tags.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Super Admin credentials created by this script:
 *   Email    : superadmin@aiblog.com
 *   Password : SuperAdmin@123
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Credentials (change these before running in production) ──────────────────
const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@aiblog.com',
  password: 'SuperAdmin@123',
};

// ── Inline schemas (keeps the script self-contained) ─────────────────────────

const UserSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    password:  { type: String, required: true, select: false },
    role:      { type: String, enum: ['super_admin', 'admin', 'editor'], default: 'editor' },
    isActive:  { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);
UserSchema.index({ email: 1 }, { unique: true });

const CategorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, lowercase: true, trim: true },
    description: { type: String },
    color:       { type: String, default: '#6366f1' },
    isActive:    { type: Boolean, default: true },
    blogCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);
CategorySchema.index({ slug: 1 }, { unique: true });

const TagSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    slug:      { type: String, required: true, lowercase: true, trim: true },
    blogCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
TagSchema.index({ slug: 1 }, { unique: true });

const User     = mongoose.models.User     ?? mongoose.model('User',     UserSchema);
const Category = mongoose.models.Category ?? mongoose.model('Category', CategorySchema);
const Tag      = mongoose.models.Tag      ?? mongoose.model('Tag',      TagSchema);

// ── Default seed data ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Technology',          slug: 'technology',          description: 'Latest in tech, software, and hardware',         color: '#6366f1' },
  { name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'Artificial intelligence, ML, and deep learning', color: '#8b5cf6' },
  { name: 'How-To Guides',       slug: 'how-to-guides',       description: 'Step-by-step tutorials and guides',              color: '#06b6d4' },
  { name: 'Product Reviews',     slug: 'product-reviews',     description: 'In-depth product analysis and reviews',          color: '#10b981' },
  { name: 'Business & Marketing', slug: 'business-marketing', description: 'Growth strategies and marketing insights',       color: '#f59e0b' },
  { name: 'Development',         slug: 'development',         description: 'Web, mobile, and software development',          color: '#ef4444' },
];

const TAGS = [
  'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'python',
  'ai', 'machine-learning', 'llm', 'automation', 'seo', 'productivity',
  'tutorial', 'beginner', 'advanced', 'open-source', 'api', 'database',
  'performance', 'security',
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   AI Blog Platform — Super Admin Seed Script   ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB\n');

  // ── Super Admin ─────────────────────────────────────────────────────────────
  const existing = await User.findOne({ email: SUPER_ADMIN.email });

  if (existing) {
    // Update password in case the user wants to reset it
    const hash = await bcrypt.hash(SUPER_ADMIN.password, 12);
    await User.updateOne({ email: SUPER_ADMIN.email }, { $set: { password: hash, role: 'super_admin', isActive: true } });
    console.log('🔄  Super Admin already exists — password reset to default.\n');
  } else {
    const hash = await bcrypt.hash(SUPER_ADMIN.password, 12);
    await User.create({
      name:     SUPER_ADMIN.name,
      email:    SUPER_ADMIN.email,
      password: hash,
      role:     'super_admin',
      isActive: true,
    });
    console.log('✅  Super Admin user created.\n');
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  let catCreated = 0;
  for (const cat of CATEGORIES) {
    try {
      await Category.create({ ...cat, isActive: true, blogCount: 0 });
      catCreated++;
    } catch {
      // already exists — skip
    }
  }
  console.log(`✅  Categories: ${catCreated} created, ${CATEGORIES.length - catCreated} already existed.`);

  // ── Tags ─────────────────────────────────────────────────────────────────────
  let tagCreated = 0;
  for (const name of TAGS) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      await Tag.create({ name, slug, blogCount: 0 });
      tagCreated++;
    } catch {
      // already exists — skip
    }
  }
  console.log(`✅  Tags:       ${tagCreated} created, ${TAGS.length - tagCreated} already existed.\n`);

  await mongoose.disconnect();

  console.log('╔════════════════════════════════════════════════╗');
  console.log('║           🎉  Seed completed!                  ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║  Login at:  http://localhost:3000/admin/login  ║');
  console.log('║                                                ║');
  console.log(`║  Email   :  ${SUPER_ADMIN.email.padEnd(34)}║`);
  console.log(`║  Password:  ${SUPER_ADMIN.password.padEnd(34)}║`);
  console.log('║  Role    :  super_admin                        ║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err.message || err);
  process.exit(1);
});
