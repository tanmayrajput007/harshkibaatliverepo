import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private API = 'https://www.googleapis.com/youtube/v3';
  private key = environment.YOUTUBE_API_KEY;
  private channelId = environment.CHANNEL_ID;
  constructor(private http: HttpClient) { }


  fetchVideos(pageToken: string | null = null, q: string | null = null, maxResults = 12) {
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

  fetchChannelStats() {
    const params = new HttpParams()
      .set('key', this.key)
      .set('part', 'statistics')
      .set('id', this.channelId);

    return this.http.get(`${this.API}/channels`, { params });
  }
}
