import { EventType } from '../consts/event.const';

export interface Image {
  id: string;
  link: string;
  type: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  coverImage: Image;
  images: Image[];
}

export interface AlbumEvent {
  type: EventType;
  requestId: string;
  data?: string | Album | Album[] | Image[];
  error?: string;
}