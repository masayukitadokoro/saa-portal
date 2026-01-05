import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 動画一覧を取得（記事関連カラムも含む）
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        video_id,
        title,
        video_url,
        thumbnail_url,
        custom_thumbnail_url,
        duration,
        category_id,
        article_content,
        article_status,
        related_article_url,
        related_spreadsheet_url
      `)
      .order('video_id', { ascending: true });

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    // 動画IDリストを作成
    const videoIds = videos.map(v => v.video_id);

    // article_versionsテーブルから記事の有無を確認
    const { data: articleVersions } = await supabase
      .from('article_versions')
      .select('video_id, content')
      .in('video_id', videoIds);

    // 記事があるvideo_idのセット（article_versionsにcontentがあるもの）
    const articlesFromVersions = new Set(
      articleVersions
        ?.filter(a => a.content && a.content.trim() !== '')
        .map(a => a.video_id) || []
    );

    // video_resourcesテーブルから資料を取得
    const { data: resources } = await supabase
      .from('video_resources')
      .select('video_id, id, title, url, resource_type')
      .in('video_id', videoIds);

    // 資料をvideo_idでグループ化
    const resourcesMap = new Map<string, Array<{ id: number; title: string; url: string; type: string }>>();
    resources?.forEach(r => {
      if (!resourcesMap.has(r.video_id)) {
        resourcesMap.set(r.video_id, []);
      }
      resourcesMap.get(r.video_id)?.push({
        id: r.id,
        title: r.title,
        url: r.url,
        type: r.resource_type
      });
    });

    // 動画データにステータスを追加
    const enrichedVideos = videos.map(video => {
      // 記事の有無を判定
      // 1. article_versionsにコンテンツがある
      // 2. または videosテーブルのarticle_contentがある
      // 3. または article_statusが'published'
      const hasArticleContent = !!(
        articlesFromVersions.has(video.video_id) ||
        (video.article_content && video.article_content.trim() !== '') ||
        video.article_status === 'published'
      );

      // 資料の有無を判定
      // 1. video_resourcesにデータがある
      // 2. または related_spreadsheet_urlがある
      const videoResources = resourcesMap.get(video.video_id) || [];
      const hasResourcesData = videoResources.length > 0 || 
        !!(video.related_spreadsheet_url && video.related_spreadsheet_url.trim() !== '');

      return {
        ...video,
        has_article: hasArticleContent,
        has_thumbnail: !!video.custom_thumbnail_url,
        resources: videoResources,
        has_resources: hasResourcesData
      };
    });

    return NextResponse.json({ videos: enrichedVideos });

  } catch (error) {
    console.error('Error in admin videos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
