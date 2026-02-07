import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SafePipe } from '../../core/safe.pipe';
import { VideoCardComponent } from '../../shared/video-card/video-card.component';
import { YoutubeService } from '../../core/youtube.service';
import { XService } from '../../core/x.service';
import { RouterLink } from '@angular/router';
import { DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { FooterComponent } from '../../shared/footer/footer.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [SafePipe, VideoCardComponent, RouterLink, DatePipe, FooterComponent, JsonPipe, NgFor, NgIf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,

})
export class HomeComponent implements OnInit {
  currentYear = new Date().getFullYear();

  selectedVideoUrl: string | null = null;
  isLoadingVideos = false;
  videoLoadError: string | null = null;

  recentVideos: { id: string; title: string; description: string }[] = [];
  subscriberCount: string | null = null;
  subscriberCountError: string | null = null;
  subscriberCountDisplay: string | null = null;
  tweets: { id: string; text: string; created_at?: string | null }[] = [];
  isLoadingTweets = false;
  tweetsError: string | null = null;

  @ViewChild('recentCarousel') recentCarousel?: ElementRef<HTMLDivElement>;

  constructor(private youtube: YoutubeService, private xService: XService) {}

  ngOnInit() {
    // if (!environment.YOUTUBE_API_KEY || environment.YOUTUBE_API_KEY === 'AIzaSyB0SsMKimjoPU-GNy41LF9ZQK6UgSMqgso') {
    //   this.videoLoadError = 'Add your YouTube API key in src/environments/environment.ts to load latest videos.';
    //   return;
    // }

    this.isLoadingVideos = true;
    this.youtube.fetchVideos(null, null, environment.YOUTUBE_MAX_RESULTS).subscribe({
      next: (resp: any) => {
        this.recentVideos = (resp.items || []).map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet?.title || 'Recent video',
          description: item.snippet?.description || ''
        }));
        this.isLoadingVideos = false;
      },
      error: () => {
        this.videoLoadError = 'Unable to load videos right now.';
        this.isLoadingVideos = false;
      }
    });

    this.youtube.fetchChannelStats().subscribe({
      next: (resp: any) => {
        const count = resp?.items?.[0]?.statistics?.subscriberCount ?? null;
        this.subscriberCount = count;
        this.subscriberCountDisplay = count ? this.formatSubscribers(count) : null;
      },
      error: () => {
        this.subscriberCountError = 'Unable to load subscriber count.';
      }
    });

    this.isLoadingTweets = true;
    this.xService.fetchLatestTweets(6).subscribe({
      next: (resp) => {
        this.tweets = resp.tweets || [];
        this.isLoadingTweets = false;
      },
      error: () => {
        this.tweetsError = 'Unable to load tweets right now.';
        this.isLoadingTweets = false;
      }
    });
  }

  private formatSubscribers(value: string) {
    const count = Number(value);
    if (!Number.isFinite(count)) {
      return value;
    }

    if (count >= 1_000_000) {
      const formatted = (count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1);
      return `${formatted}M`;
    }

    if (count >= 1_000) {
      const formatted = (count / 1_000).toFixed(count >= 100_000 ? 0 : 1);
      return `${formatted}K`;
    }

    return `${count}`;
  }

  openVideo(videoId: string) {
    this.selectedVideoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }

  onModalHidden() {
    this.selectedVideoUrl = null;
  }

  scrollRecent(direction: 1 | -1) {
    const carousel = this.recentCarousel?.nativeElement;
    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector('.video-card') as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 320;
    const gap = 24;

    carousel.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  }

}
