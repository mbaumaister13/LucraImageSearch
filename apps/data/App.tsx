import { useEffect } from 'react';
import { AlbumService } from './services/album.service';
import { AlbumEvent } from './models/album.model';
import { EventType } from './consts/event.const';

function App() {
  const PARENT_ORIGIN = 'http://localhost:5554';

  useEffect(() => {
    const albumService = AlbumService.getInstance();

    const handleMessageFromHost = (event: MessageEvent<AlbumEvent>) => {
      if (event.origin !== PARENT_ORIGIN) {
        return;
      }

      const payload = event.data;
      console.log('Received event from host', payload);
      switch (payload.type) {
        case EventType.SEARCH:
          window.parent.postMessage({
            type: payload.type,
            requestId: payload.requestId,
            data: albumService.searchAlbums(payload.data as string)
          } as AlbumEvent, PARENT_ORIGIN);
          break;
        case EventType.ALBUM_CLICK:
          window.parent.postMessage({
            type: payload.type,
            requestId: payload.requestId,
            data: ['assets/hero.png']
          } as AlbumEvent, PARENT_ORIGIN);
          break;
      }
    };

    window.addEventListener('message', handleMessageFromHost);
    return () => window.removeEventListener('message', handleMessageFromHost);
  }, []);

  return null;
}

export default App
