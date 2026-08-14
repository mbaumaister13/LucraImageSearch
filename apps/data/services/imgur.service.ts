/* eslint-disable @typescript-eslint/no-explicit-any */

import { Album, Image } from '../models/album.model';

export class ImgurService {

  private albumUrl = 'https://api.imgur.com/3/gallery/search?q_type=album&q_all=';
  private imageUrl = 'https://api.imgur.com/3/image/';

  private static instance: ImgurService;

  public static getInstance() {
    if (!ImgurService.instance) {
      ImgurService.instance = new ImgurService();
    }
    return ImgurService.instance;
  }

  getAlbums = async (searchTerm: string) => {
    const response = await fetch(`${ this.albumUrl }${ encodeURIComponent(searchTerm) }`, {
      headers: new Headers({
        "Authorization": "Client-ID 2d086962f60c89e"
      })
    });

    if (!response.ok) {
      return Promise.reject(new Error('Failed to fetch album images'));
    }

    const result = await response.json();
    const output: Album[] = await Promise.all(result.data.slice(0, 5).map(async (album: any) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      coverImage: await this.getImage(album.cover),
      images: album.images.map((image: any) => ({ id: image.id, link: image.link, type: image.type } as Image))
    } as Album)));
    console.log(output);
    return output;
  }

  getImage = async (imageId: string) => {
    const response = await fetch(`${ this.imageUrl }${ encodeURIComponent(imageId) }`, {
      headers: new Headers({
        "Authorization": "Client-ID 2d086962f60c89e"
      })
    });

    if (!response.ok) {
      return Promise.reject(new Error('Failed to fetch album images'));
    }

    const result = await response.json();
    return {
      id: result.data.id,
      link: result.data.link,
      type: result.data.type
    } as Image;
  }
}