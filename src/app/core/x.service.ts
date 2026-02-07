import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class XService {
  constructor(private http: HttpClient) {}

  fetchLatestTweets(limit = 6) {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<{ tweets: { id: string; text: string; created_at?: string }[] }>(
      '/.netlify/functions/latest-tweets',
      { params }
    );
  }
}
