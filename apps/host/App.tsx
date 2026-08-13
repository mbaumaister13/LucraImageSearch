import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CircularProgress, debounce, TextField } from '@mui/material';
import AlbumListItem from './components/album/AlbumListItem.tsx';
import type { Album, AlbumEvent } from './models/album.model.ts';
import { EventType } from './consts/event.const.ts';
import { useQuery } from '@tanstack/react-query'

function App() {

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGIN = 'http://localhost:5555';

  const [searchTerm, setSearchTerm] = useState('');

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Resolvers hold values from IFrame message handler to be resolved in the queryFn(s), keyed by requestId
  // so overlapping in-flight requests of the same type don't overwrite each other.
  const pendingAlbumsResolversRef = useRef(new Map<string, (albums: Album[]) => void>());
  const pendingAlbumGalleryResolversRef = useRef(new Map<string, (albumImages: string[]) => void>());

  useEffect(() => {
    const handleMessageFromIframe = (event: MessageEvent<AlbumEvent>) => {
      if (event.origin !== TRUSTED_ORIGIN) {
        return;
      }

      const payload = event.data;
      console.log('Received event from data layer', payload);
      switch (payload.type) {
        case EventType.SEARCH:
          pendingAlbumsResolversRef.current.get(payload.requestId)?.(payload.data as Album[]);
          pendingAlbumsResolversRef.current.delete(payload.requestId);
          return;
        case EventType.ALBUM_CLICK:
          pendingAlbumGalleryResolversRef.current.get(payload.requestId)?.(payload.data as string[]);
          pendingAlbumGalleryResolversRef.current.delete(payload.requestId);
          return;
      }
    };

    window.addEventListener('message', handleMessageFromIframe);
    return () => window.removeEventListener('message', handleMessageFromIframe);
  }, []);

  const sendMessageToIframe = (payload: AlbumEvent) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(payload, TRUSTED_ORIGIN);
    }
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        setDebouncedSearchTerm(searchTerm); // Sets the value after 500ms
      }, 500),
    []
  );

  useEffect(() => {
    return () => debouncedSearch.clear();
  }, [debouncedSearch]);

  const search = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    debouncedSearch(searchTerm);
  }

  const { data: foundAlbums = [], isLoading: albumsLoading = false, error: albumsError } = useQuery({
    queryKey: ['albums', debouncedSearchTerm],
    queryFn: () => new Promise<Album[]>((resolve) => {
      const requestId = crypto.randomUUID();
      pendingAlbumsResolversRef.current.set(requestId, resolve);
      sendMessageToIframe({
        type: EventType.SEARCH,
        requestId,
        data: debouncedSearchTerm
      } as AlbumEvent);
    }),
    enabled: !!debouncedSearchTerm
  });

  const albumClicked = (album: Album | null) => {
    setSelectedAlbum(selectedAlbum === album ? null : album);
  }

  const { data: albumGalleryImages = [], isLoading: albumGalleryLoading = false, error: albumGalleryError } = useQuery({
    queryKey: ['albumGallery', selectedAlbum],
    queryFn: () => new Promise<string[]>((resolve) => {
      const requestId = crypto.randomUUID();
      pendingAlbumGalleryResolversRef.current.set(requestId, resolve);
      sendMessageToIframe({
        type: EventType.ALBUM_CLICK,
        requestId,
        data: {
          artist: selectedAlbum?.artist,
          title: selectedAlbum?.title
        }
      } as AlbumEvent);
    }),
    enabled: !!selectedAlbum
  });

  return (
    <>
      <section id="search">
        <h1>Lucra Album Search</h1>
        <TextField fullWidth
                   variant="filled"
                   label="Search for an album"
                   value={ searchTerm }
                   onChange={ (event: React.ChangeEvent<HTMLInputElement>) => {
                     search(event.target.value);
                   } }>
        </TextField>
      </section>

      { albumsLoading && <CircularProgress aria-label="Loading…"/> }

      { foundAlbums.length > 0 && !albumsLoading &&
          <section id="albums">
              <section id="album-list"
                       className={ selectedAlbum ? 'selected' : '' }>
                  <ul>
                    { foundAlbums.map((album: Album) => (
                      <AlbumListItem key={ `${ album.artist }-${ album.title }` }
                                     album={ album }
                                     selected={ selectedAlbum === album }
                                     albumClicked={ () => albumClicked(album) }/>
                    ))
                    }
                  </ul>
              </section>

            { albumGalleryLoading && <CircularProgress aria-label="Loading…"/> }

            { albumGalleryImages.length > 0 && !albumGalleryLoading &&
                <section id="selectedAlbum">
                    <div id="photo-slider">
                      { albumGalleryImages.map((image: string) => (
                        <img key={ image } src={ image } alt=""/>
                      ))
                      }
                    </div>
                    <div id="artist-title">
                        <p>{ selectedAlbum?.artist } - { selectedAlbum?.title }</p>
                    </div>
                </section>
            }
          </section>
      }

      <iframe ref={ iframeRef }
              src={ TRUSTED_ORIGIN }
              title="Data App"
              sandbox="allow-scripts allow-same-origin"
              height="0"
              width="0">
      </iframe>
    </>
  )
}

export default App
