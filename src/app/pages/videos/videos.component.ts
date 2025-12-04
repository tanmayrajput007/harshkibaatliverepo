import { Component } from '@angular/core';
import { VideoCardComponent } from '../../shared/video-card/video-card.component';
import { YoutubeService } from '../../core/youtube.service';

@Component({
  selector: 'app-videos',
  imports: [VideoCardComponent],
  standalone: true,
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss'
})
export class VideosComponent {
  videos: any[] = [];
  next: string | null = null;

  constructor(private yt: YoutubeService) {}

  ngOnInit() { this.load(); }

  load(page: string | null = null) {
    this.yt.fetchVideos(page, null, 12).subscribe((res: any) => {
      this.videos = res.items;
      this.next = res.nextPageToken;
    });
  }
}
