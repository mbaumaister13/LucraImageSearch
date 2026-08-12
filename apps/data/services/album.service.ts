import { ALBUMS } from '../consts/album.const';

export class AlbumService {

  albums = ALBUMS;

  private static instance: AlbumService;

  public static getInstance() {
    if (!AlbumService.instance) {
      AlbumService.instance = new AlbumService();
    }
    return AlbumService.instance;
  }

  searchAlbums = (searchTerm: string) => {
    if (!searchTerm) {
      return [];
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return this.albums.filter(album => album.artist.toLowerCase().includes(lowerSearchTerm) || album.title.toLowerCase().includes(lowerSearchTerm));
  }
}