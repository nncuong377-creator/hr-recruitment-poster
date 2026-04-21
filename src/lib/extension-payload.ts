import type { PostJob } from '@/types/extension';
import type { ContentItem, GroupItem } from '@/app/(dashboard)/dashboard/post/_hooks/use-posting-session';

export function buildExtensionJobs(content: ContentItem, groups: GroupItem[]): PostJob[] {
  const hashtagStr = content.hashtags ?? '';
  const text = [content.description, hashtagStr].filter(Boolean).join('\n\n');

  // mediaUrls phải là absolute URL để extension background worker fetch được
  const mediaUrls =
    content.medias.length > 0
      ? content.medias.map((m) => `${window.location.origin}${m.url}`)
      : undefined;

  return groups.map((group) => ({
    id: `${content.id}-${group.id}`,
    groupId: group.id,
    groupUrl: group.url,
    text,
    mediaUrls,
  }));
}
