import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, of, shareReplay, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private API = 'https://www.googleapis.com/youtube/v3';
  private key = environment.YOUTUBE_API_KEY;
  private channelId = environment.CHANNEL_ID;
  private cache = new Map<string, { expiresAt: number; value: Observable<any> }>();
  private readonly cacheTtlMs = 10 * 60 * 1000;
  constructor(private http: HttpClient) { }

  private getFromCache(key: string): Observable<any> | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache(key: string, value: Observable<any>) {
    this.cache.set(key, { expiresAt: Date.now() + this.cacheTtlMs, value });
  }


  fetchVideos(pageToken: string | null = null, q: string | null = null, maxResults = 12): Observable<any> {
    let params = new HttpParams()
      .set('key', this.key)
      .set('part', 'snippet')
      .set('channelId', this.channelId)
      .set('maxResults', String(maxResults))
      .set('order', 'date');

    if (pageToken) params = params.set('pageToken', pageToken);
    if (q) params = params.set('q', q);

    return this.http.get(`${this.API}/search`, { params }).pipe(
      map((resp: any) => ({
        items: resp.items.filter((i: any) => i.id.kind === 'youtube#video'),
        nextPageToken: resp.nextPageToken || null,
        prevPageToken: resp.prevPageToken || null
      }))
    );
  }

  fetchChannelVideos(channelId: string, maxResults = 10) {
    let params = new HttpParams()
      .set('key', this.key)
      .set('part', 'snippet')
      .set('channelId', channelId)
      .set('maxResults', String(maxResults))
      .set('order', 'date');

    return this.http.get(`${this.API}/search`, { params }).pipe(
      map((resp: any) => ({
        items: resp.items.filter((i: any) => i.id.kind === 'youtube#video'),
        nextPageToken: resp.nextPageToken || null,
        prevPageToken: resp.prevPageToken || null
      }))
    );
  }

  fetchChannelStats(): Observable<any> {
    const params = new HttpParams()
      .set('key', this.key)
      .set('part', 'statistics')
      .set('id', this.channelId);

    return this.http.get(`${this.API}/channels`, { params });
  }

  fetchChannelStatsFor(channelId: string): Observable<any> {
    const cacheKey = `stats:${channelId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const params = new HttpParams()
      .set('key', this.key)
      .set('part', 'statistics')
      .set('id', channelId);

    const request$ = this.http.get(`${this.API}/channels`, { params }).pipe(shareReplay(1));
    this.setCache(cacheKey, request$);
    return request$;
  }

  private fetchUploadsPlaylistId(channelId: string): Observable<any> {
    const params = new HttpParams()
      .set('key', this.key)
      .set('part', 'contentDetails')
      .set('id', channelId);

    return this.http.get(`${this.API}/channels`, { params }).pipe(
      map((resp: any) => resp?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null)
    );
  }

  fetchLatestUploadsByChannel(channelId: string, maxResults = 10): Observable<any> {
    const cacheKey = `uploads:${channelId}:${maxResults}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.fetchUploadsPlaylistId(channelId).pipe(
      switchMap((playlistId) => {
        if (!playlistId) {
          return of({ items: [], nextPageToken: null, prevPageToken: null });
        }

        const params = new HttpParams()
          .set('key', this.key)
          .set('part', 'snippet')
          .set('playlistId', playlistId)
          .set('maxResults', String(maxResults));

        return this.http.get(`${this.API}/playlistItems`, { params }).pipe(
          map((resp: any) => ({
            items: (resp.items || []).map((item: any) => ({
              id: { videoId: item?.snippet?.resourceId?.videoId },
              snippet: item?.snippet
            })),
            nextPageToken: resp.nextPageToken || null,
            prevPageToken: resp.prevPageToken || null
          }))
        );
      }),
      shareReplay(1)
    );
    this.setCache(cacheKey, request$);
    return request$;
  }

  fetchChannelsBundle(channelIds: string[], maxResults = 10): Observable<any> {
    if (this.shouldUseNetlifyFunctions()) {
      const params = new HttpParams()
        .set('channels', channelIds.join(','))
        .set('maxResults', String(maxResults));

      return this.http.get(`/.netlify/functions/youtube`, { params });
    }

    return this.fetchChannelsBundleDirect(channelIds, maxResults);
  }

  private shouldUseNetlifyFunctions(): boolean {
    if (environment.production) {
      return true;
    }

    if (typeof window === 'undefined') {
      return true;
    }

    const host = window.location.hostname;
    return !(host === 'localhost' || host === '127.0.0.1');
  }

  private fetchChannelsBundleDirect(channelIds: string[], maxResults = 10): Observable<any> {
    if (!channelIds.length) {
      return of({ channels: [] });
    }

    const params = new HttpParams()
      .set('key', this.key)
      .set('part', 'contentDetails,statistics,snippet')
      .set('id', channelIds.join(','));

    return this.http.get(`${this.API}/channels`, { params }).pipe(
      switchMap((resp: any) => {
        const items = resp?.items || [];
        const channelMap = items.map((item: any) => ({
          id: item.id,
          title: item?.snippet?.title || 'Channel',
          uploads: item?.contentDetails?.relatedPlaylists?.uploads || null,
          subscribers: item?.statistics?.subscriberCount || null
        }));

        if (!channelMap.length) {
          return of({ channels: [] });
        }

        const requests = channelMap.map((channel:any) => {
          if (!channel.uploads) {
            return of({ channelId: channel.id, videos: [] });
          }

          const playlistParams = new HttpParams()
            .set('key', this.key)
            .set('part', 'snippet')
            .set('playlistId', channel.uploads)
            .set('maxResults', String(maxResults));

          return this.http.get(`${this.API}/playlistItems`, { params: playlistParams }).pipe(
            map((playlist: any) => ({
              channelId: channel.id,
              videos: (playlist?.items || []).map((item: any) => ({
                id: item?.snippet?.resourceId?.videoId,
                title: item?.snippet?.title || 'Recent video',
                description: item?.snippet?.description || ''
              }))
            }))
          );
        });

        return forkJoin(requests).pipe(
          map((videosByChannel:any) => ({
            channels: channelMap.map((channel:any) => ({
              channelId: channel.id,
              title: channel.title,
              subscribers: channel.subscribers,
              videos: videosByChannel.find((v:any) => v.channelId === channel.id)?.videos || []
            }))
          }))
        );
      })
    );
  }
}
