import { Component } from '@angular/core';
import { SafePipe } from '../../core/safe.pipe';
import { VideoCardComponent } from '../../shared/video-card/video-card.component';
import { YoutubeService } from '../../core/youtube.service';
import { RouterLink } from '@angular/router';
import { DatePipe, JsonPipe } from '@angular/common';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-home',
  imports: [SafePipe, VideoCardComponent, RouterLink, DatePipe, FooterComponent,JsonPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,

})
export class HomeComponent {
  currentYear = new Date().getFullYear();

  

  recentVideos = [
  {thumb: 'https://www.youtube.com/embed/Yc2UzSW4mow?si=_r2vCXGsbwfyylkP'},
  {thumb: 'https://www.youtube.com/embed/fzsbKDoO4VE?si=E7y_UpevNLecKVgR'},
  {thumb: 'https://www.youtube.com/embed/E8Isj6y2Bi8?si=3KqzIZgjV5VxG0Is'},
  {thumb: 'https://www.youtube.com/embed/gA199CIreRg?si=CNhXpSVq9rVBhbhl'},
  {thumb: 'https://www.youtube.com/embed/2NcwocKYbEY?si=j1WTyd4so6w8D-ib'},
  {thumb: 'https://www.youtube.com/embed/8neSEZLKzWY?si=L5llm__gWVb1Ysns'}
];


}
