import type { Types } from 'mongoose';

export type BlogStatus = 'draft' | 'published' | 'archived';
export type BlogVisibility = 'public' | 'private';

export interface IBlogSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface IBlog {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  category: Types.ObjectId | string | IPopulatedCategory;
  tags: string[];
  author: Types.ObjectId | string | IPopulatedAuthor;
  seo: IBlogSeo;
  status: BlogStatus;
  visibility: BlogVisibility;
  aiGenerated: boolean;
  aiTaskId?: Types.ObjectId | string;
  difyWorkflowId?: string;
  readingTime: number;
  views: number;
  likes: number;
  isFeatured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedCategory {
  _id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface IPopulatedAuthor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface IBlogCard {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category: IPopulatedCategory;
  tags: string[];
  author: IPopulatedAuthor;
  readingTime: number;
  views: number;
  likes: number;
  publishedAt?: Date;
  aiGenerated: boolean;
  isFeatured: boolean;
}

export interface CreateBlogInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  category: string;
  tags?: string[];
  status: BlogStatus;
  visibility?: BlogVisibility;
  seo?: IBlogSeo;
  isFeatured?: boolean;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: string;
}
