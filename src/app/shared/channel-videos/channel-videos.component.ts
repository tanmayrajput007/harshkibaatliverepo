import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

type ChannelVideo = { id: string; title: string; description: string };
type ChannelSection = { channelId: string; title: string; videos: ChannelVideo[] };

@Component({
  selector: 'app-channel-videos',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './channel-videos.component.html',
  styleUrl: './channel-videos.component.scss'
})
export class ChannelVideosComponent {
  @Input() sections: ChannelSection[] = [];
  @Output() videoSelected = new EventEmitter<string>();

  @ViewChildren('channelCarousel') channelCarousels?: QueryList<ElementRef<HTMLDivElement>>;

  selectVideo(videoId: string) {
    this.videoSelected.emit(videoId);
  }

  scrollChannel(index: number, direction: 1 | -1) {
    const carousel = this.channelCarousels?.get(index)?.nativeElement;
    if (!carousel) {
      return;
    }

    const firstCard = carousel.querySelector('.video-card') as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 260;
    const gap = 20;

    carousel.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  }
}
