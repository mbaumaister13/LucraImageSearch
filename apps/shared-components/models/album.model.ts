import { EventType } from '../consts/event.const';

export interface Image {
  id: string;
  type: string;
  link: string;
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
  data?: string | Album | Album[] | Image[]; // string -> outbound SEARCH, Album -> outbound ALBUM_CLICK, Album[] -> inbound SEARCH, Image[] -> inbound ALBUM_CLICK
  error?: string;
}