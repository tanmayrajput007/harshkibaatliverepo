import { Component, OnInit } from '@angular/core';
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
export class HomeComponent implements OnInit {
  currentYear = new Date().getFullYear();

  selectedVideoUrl: string | null = null;
  isLoadingVideos = false;
  videoLoadError: string | null = null;

  recentVideos: { id: string; title: string; description: string }[] = [];

  constructor(private youtube: YoutubeService) {}

  ngOnInit() {
    debugger
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
  }

  openVideo(videoId: string) {
    this.selectedVideoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }

  onModalHidden() {
    this.selectedVideoUrl = null;
  }


}
