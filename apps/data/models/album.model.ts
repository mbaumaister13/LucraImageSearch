import { EventType } from '../consts/event.const';

export interface Album {
  artist: string;
  title: string;
  songCount: number;
  duration: string;
}

export interface AlbumEvent {
  type: EventType;
  data: Album | Album[] | string; // string represents search term
}