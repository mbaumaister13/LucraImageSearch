import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Alert, CircularProgress, debounce, TextField } from '@mui/material';
import AlbumListItem from './components/album/AlbumListItem.tsx';
import type { Album, AlbumEvent, Image } from './models/album.model.ts';
import { EventType } from './consts/event.const.ts';
import { useQuery } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid';
import PhotoSlider from './components/photo-slider/PhotoSlider.tsx';

function App() {

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGIN = `http://${ window.location.hostname }:5555`;

  const [searchTerm, setSearchTerm] = useState('');

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Resolvers hold the resolve/reject pair from the IFrame message handler's matching Promise, keyed by
  // requestId so overlapping in-flight requests of the same type don't overwrite each other.
  type PendingRequest<T> = { resolve: (value: T) => void; reject: (error: Error) => void };
  const pendingAlbumsResolversRef = useRef(new Map<string, PendingRequest<Album[]>>());
  const pendingAlbumGalleryResolversRef = useRef(new Map<string, PendingRequest<Image[]>>());

  useEffect(() => {
    const handleMessageFromIframe = (event: MessageEvent<AlbumEvent>) => {
      if (event.origin !== TRUSTED_ORIGIN) {
        return;
      }

      const payload = event.data as AlbumEvent;
      console.log('Received event from data layer', payload);
      switch (payload.type) {
        case EventType.SEARCH: {
          // Fetch stashed resolve/reject for request ID
          const pending = pendingAlbumsResolversRef.current.get(payload.requestId);
          // Call resolve/reject depending on error status
          if (payload.error) {
            pending?.reject(new Error(payload.error))
          } else {
            pending?.resolve(payload.data as Album[])
          }
          // Remove stashed resolve/reject since they've been called
          pendingAlbumsResolversRef.current.delete(payload.requestId);
          return;
        }
        case EventType.ALBUM_CLICK: {
          // Fetch stashed resolve/reject for request ID
          const pending = pendingAlbumGalleryResolversRef.current.get(payload.requestId);
          // Call resolve/reject depending on error status
          if (payload.error) {
            pending?.reject(new Error(payload.error))
          } else {
            pending?.resolve(payload.data as Image[])
          }
          // Remove stashed resolve/reject since they've been called
          pendingAlbumGalleryResolversRef.current.delete(payload.requestId);
          return;
        }
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
    // Stash resolve/reject functions in resolver
    queryFn: () => new Promise<Album[]>((resolve, reject) => {
      const requestId = uuidv4();
      pendingAlbumsResolversRef.current.set(requestId, { resolve, reject });
      sendMessageToIframe({
        type: EventType.SEARCH,
        requestId,
        data: debouncedSearchTerm
      } as AlbumEvent);
      setSelectedAlbum(null);
    }),
    enabled: !!debouncedSearchTerm
  });

  const albumClicked = (album: Album | null) => {
    setSelectedAlbum(selectedAlbum === album ? null : album);
  }

  const { data: albumGalleryImages = [], isLoading: albumGalleryLoading = false, error: albumGalleryError } = useQuery({
    queryKey: ['albumGallery', selectedAlbum],
    // Stash resolve/reject functions in resolver
    queryFn: () => new Promise<Image[]>((resolve, reject) => {
      const requestId = uuidv4();
      pendingAlbumGalleryResolversRef.current.set(requestId, { resolve, reject });
      sendMessageToIframe({
        type: EventType.ALBUM_CLICK,
        requestId,
        data: selectedAlbum
      } as AlbumEvent);
    }),
    enabled: !!selectedAlbum
  });

  return (
    <>
      <section id="search">
        <h1>Lucra Image Search</h1>
        <TextField fullWidth
                   variant="filled"
                   label="Search for an album"
                   value={ searchTerm }
                   onChange={ (event: React.ChangeEvent<HTMLInputElement>) => {
                     search(event.target.value);
                   } }>
        </TextField>
      </section>

      { albumsError && <Alert severity="error">There was an issue fetching albums for your search query.</Alert> }

      { albumsLoading && <CircularProgress aria-label="Loading…"/> }

      { foundAlbums.length > 0 && !albumsLoading && !albumsError &&
          <section id="albums">
              <section id="album-list"
                       className={ selectedAlbum ? 'selected' : '' }>
                  <ul>
                    { foundAlbums.map((album: Album) => (
                      <AlbumListItem key={ `${ album.id }` }
                                     album={ album }
                                     selected={ selectedAlbum === album }
                                     albumClicked={ () => albumClicked(album) }/>
                    ))
                    }
                  </ul>
              </section>

            { albumGalleryError && <Alert severity="error">There was an issue fetching images for this album.</Alert> }

            { albumGalleryLoading && <CircularProgress aria-label="Loading…"/> }

            { albumGalleryImages.length > 0 && !albumGalleryLoading && !albumGalleryError &&
                <section id="selectedAlbum">
                    <PhotoSlider images={ albumGalleryImages as Image[] }/>
                    <div id="artist-title">
                        <h3>{ selectedAlbum?.title }</h3>
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
