import { EventType } from '../consts/event.const';

export interface Album {
  artist: string;
  title: string;
  songCount: number;
  duration: string;
}

export interface AlbumEvent {
  type: EventType;
  requestId: string;
  data: Album | Album[] | string | string[];
}