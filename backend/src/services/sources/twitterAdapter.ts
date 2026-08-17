import config from '../../config/index.js'
import { twitterService } from '../twitterService.js'
import type { SourceAdapter, SourceItem } from './types.js'

// X/Twitter（默认关闭；需要时 .env 设 TWITTER_ENABLED=true 并填 twitterapi.io 的 X-API-Key）
export const twitterAdapter: SourceAdapter = {
  id: 'twitter',
  label: 'X/Twitter',
  isEnabled: () => config.sources.twitter.enabled,
  async search(keyword: string, limit: number): Promise<SourceItem[]> {
    const tweets = await twitterService.searchTweets(keyword, limit)
    return tweets.map(t => ({
      title: t.text.substring(0, 100),
      description: t.author_name ? `@${t.username}（${t.author_name}）：${t.text}` : t.text,
      url: t.url || `https://twitter.com/i/web/status/${t.id}`,
      source: 'Twitter',
      timestamp: t.created_at,
      trend: (t.public_metrics?.retweet_count || 0) + (t.public_metrics?.like_count || 0),
    }))
  },
}
