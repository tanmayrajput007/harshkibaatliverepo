import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SafePipe } from '../../core/safe.pipe';
import { VideoCardComponent } from '../../shared/video-card/video-card.component';
import { YoutubeService } from '../../core/youtube.service';
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
export class HomeComponent implements OnInit, AfterViewInit {
  currentYear = new Date().getFullYear();

  selectedVideoUrl: string | null = null;
  isLoadingVideos = false;
  videoLoadError: string | null = null;

  recentVideos: { id: string; title: string; description: string }[] = [];
  subscriberCount: string | null = null;
  subscriberCountError: string | null = null;
  subscriberCountDisplay: string | null = null;
  tweetsEmbedFailed = false;
  tweetsEmbedLoading = true;

  @ViewChild('recentCarousel') recentCarousel?: ElementRef<HTMLDivElement>;
  @ViewChild('tweetsEmbed') tweetsEmbed?: ElementRef<HTMLDivElement>;

  constructor(private youtube: YoutubeService, private cdr: ChangeDetectorRef) {}

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

  ngAfterViewInit() {
    this.loadTwitterWidgets();
  }

  private loadTwitterWidgets() {
    const existing = document.getElementById('twitter-wjs');
    if (existing) {
      this.initTimelineWhenReady();
      return;
    }

    const script = document.createElement('script');
    script.id = 'twitter-wjs';
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      this.initTimelineWhenReady();
    };
    document.body.appendChild(script);
  }

  private initTimelineWhenReady() {
    const twttr = (window as any).twttr;
    if (!twttr?.ready) {
      return;
    }

    twttr.ready(() => {
      const container = document.getElementById('tweetsTimeline');
      if (!twttr?.widgets?.createTimeline || !container || container.childElementCount > 0) {
        return;
      }

      this.tweetsEmbedLoading = true;
      this.tweetsEmbedFailed = false;

      const target = this.tweetsEmbed?.nativeElement;
      if (twttr?.widgets?.load) {
        twttr.widgets.load(target ?? undefined);
      }

      const timelinePromise = twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: 'harshktweets' },
        container,
        { height: 520, theme: 'light', tweetLimit: 10, dnt: true }
      );

      if (timelinePromise?.then) {
        timelinePromise
          .then(() => {
            this.tweetsEmbedLoading = false;
            this.cdr.detectChanges();
          })
          .catch(() => {
            this.tweetsEmbedFailed = true;
            this.tweetsEmbedLoading = false;
            this.cdr.detectChanges();
          });
      }

      window.setTimeout(() => {
        const hasIframe = !!container.querySelector('iframe');
        if (!hasIframe) {
          this.tweetsEmbedFailed = true;
          this.tweetsEmbedLoading = false;
          this.cdr.detectChanges();
        }
      }, 5000);
    });
  }

}
