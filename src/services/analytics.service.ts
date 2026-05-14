import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '@/models/Blog';
import { AITask } from '@/models/AITask';

export class AnalyticsService {
  async getDashboardStats() {
    await connectToDatabase();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      archivedBlogs,
      aiGeneratedBlogs,
      totalAITasks,
      failedTasks,
      completedTasks,
      pendingTasks,
      processingTasks,
      viewsResult,
      likesResult,
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Blog.countDocuments({ status: 'archived' }),
      Blog.countDocuments({ aiGenerated: true }),
      AITask.countDocuments(),
      AITask.countDocuments({ status: 'failed' }),
      AITask.countDocuments({ status: 'completed' }),
      AITask.countDocuments({ status: 'pending' }),
      AITask.countDocuments({ status: 'processing' }),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]),
    ]);

    const totalViews = viewsResult[0]?.total || 0;
    const totalLikes = likesResult[0]?.total || 0;

    const blogPublicationsLast30Days = await Blog.aggregate([
      {
        $match: {
          status: 'published',
          publishedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    const taskStatusBreakdown = await AITask.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    const topBlogsByViews = await Blog.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(10)
      .select('title slug views likes')
      .lean();

    const recentPublished = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title slug publishedAt')
      .lean();

    const recentCompleted = await AITask.find({ status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('blogId', 'title slug')
      .lean();

    const recentFailed = await AITask.find({ status: 'failed' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentActivity = [
      ...recentPublished.map((b) => ({
        type: 'blog_published' as const,
        title: b.title,
        timestamp: b.publishedAt || b.createdAt,
        link: `/blog/${b.slug}`,
      })),
      ...recentCompleted.map((t) => ({
        type: 'task_completed' as const,
        title: `AI Task completed: ${t.contentType}`,
        timestamp: t.completedAt || t.updatedAt,
        link: `/admin/ai-tasks/${t._id}`,
      })),
      ...recentFailed.map((t) => ({
        type: 'task_failed' as const,
        title: `AI Task failed: ${t.contentType}`,
        timestamp: t.updatedAt,
        link: `/admin/ai-tasks/${t._id}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totals: {
        blogs: totalBlogs,
        publishedBlogs,
        draftBlogs,
        archivedBlogs,
        aiGeneratedBlogs,
        aiTasks: totalAITasks,
        failedTasks,
        completedTasks,
        pendingTasks,
        processingTasks,
        totalViews,
        totalLikes,
      },
      charts: {
        blogPublicationsLast30Days,
        taskStatusBreakdown,
        topBlogsByViews,
      },
      recentActivity,
    };
  }
}
