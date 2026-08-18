import { useEffect } from 'react';
import type { Album, AlbumEvent, Image } from '@shared/models/album.model';
import { EventType } from '@shared/consts/event.const';
import { ImgurService } from './services/imgur.service';

function App() {
  const PARENT_ORIGIN = `http://${ window.location.hostname }:5554`;

  useEffect(() => {
    const imgurService = ImgurService.getInstance();

    const handleMessageFromHost = async (event: MessageEvent<AlbumEvent>) => {
      if (event.origin !== PARENT_ORIGIN) {
        return;
      }

      const payload = event.data;
      try {
        switch (payload.type) {
          case EventType.SEARCH:
            window.parent.postMessage({
              type: payload.type,
              requestId: payload.requestId,
              data: await imgurService.getAlbums(payload.data as string)
            } as AlbumEvent, PARENT_ORIGIN);
            break;
          case EventType.ALBUM_CLICK: {
            const album = payload.data as Album;
            window.parent.postMessage({
              type: payload.type,
              requestId: payload.requestId,
              data: await Promise.all(album.images.map(async (image: Image) => await imgurService.getImage(image.id)))
            } as AlbumEvent, PARENT_ORIGIN);
            break;
          }
        }
      } catch (error) {
        window.parent.postMessage({
          type: payload.type,
          requestId: payload.requestId,
          error: error instanceof Error ? error.message : 'Unknown error'
        } as AlbumEvent, PARENT_ORIGIN);
      }
    };

    window.addEventListener('message', handleMessageFromHost);
    return () => window.removeEventListener('message', handleMessageFromHost);
  }, [PARENT_ORIGIN]);

  return null;
}

export default App
