import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Alert, CircularProgress, debounce, TextField } from '@mui/material';
import AlbumListItem from './components/album/AlbumListItem.tsx';
import type { Album, AlbumEvent, Image } from '@shared/models/album.model';
import { EventType } from '@shared/consts/event.const';
import { useQuery } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid';
import PhotoSlider from './components/photo-slider/PhotoSlider.tsx';

function App() {

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGIN = `http://${ window.location.hostname }:5555`;

  const [searchTerm, setSearchTerm] = useState('');

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Used for animated album list
  const [areSearchResultsRendered, setAreSearchResultsRendered] = useState(false);
  const isSearchAnimating = Boolean(debouncedSearchTerm);

  if (debouncedSearchTerm && !areSearchResultsRendered) {
    setAreSearchResultsRendered(true);
  }

  const handleSearchTransitionEnd = () => {
    if (!isSearchAnimating) {
      setAreSearchResultsRendered(false);
    }
  };

  // Used for animated album selection
  const [isAlbumDetailsRendered, setIsAlbumDetailsRendered] = useState(false);
  const isAlbumListAnimating = Boolean(selectedAlbum);

  if (selectedAlbum && !isAlbumDetailsRendered) {
    setIsAlbumDetailsRendered(true);
  }

  const handleAlbumListTransitionEnd = () => {
    if (!isAlbumListAnimating) {
      setIsAlbumDetailsRendered(false);
    }
  };

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
  }, [TRUSTED_ORIGIN]);

  const sendMessageToIframe = (payload: AlbumEvent) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(payload, TRUSTED_ORIGIN);
    }
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        setDebouncedSearchTerm(searchTerm);
        setAreSearchResultsRendered(!!searchTerm);
      }, 500), // Sets the value after 500ms of idle time
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
      <section id="search" 
               className={ areSearchResultsRendered ? 'top' : '' }>
        <div id="header">
          <img src="./assets/lucra_logo.png" alt="Lucra logo" width={96} height={96}></img>
          <h1 className={ areSearchResultsRendered ? 'top' : '' }>
            Lucra Image Search
          </h1>
        </div>
        
        <TextField fullWidth
                   variant="filled"
                   label="Search for an album"
                   color="success"
                   value={ searchTerm }
                   onChange={ (event: React.ChangeEvent<HTMLInputElement>) => {
                     search(event.target.value);
                   } }>
        </TextField>
      </section>

      { areSearchResultsRendered && 
        <section id="albumContainer" 
                 onTransitionEnd={ handleSearchTransitionEnd }>
          { albumsError && <Alert severity="error">There was an issue fetching albums for your search query.</Alert> }

          { albumsLoading && <CircularProgress color="success" aria-label="Loading…"/> }

          { !albumsLoading && !albumsError && foundAlbums.length === 0 &&
            <h2>No albums found.</h2>
          }

          { !albumsLoading && !albumsError && foundAlbums.length > 0 &&
            <section id="albums">
              <section id="album-list"
                      onTransitionEnd={ handleAlbumListTransitionEnd }
                      style={{ width: isAlbumListAnimating ? '50%' : '100%' }}>
                <ul id="album-ul">
                  { foundAlbums.map((album: Album, index: number) => (
                    <AlbumListItem className="animate-cascade"
                                   style={{ animationDelay: `${index * 250}ms` }}
                                   key={ `${ album.id }` }
                                   album={ album }
                                   selected={ selectedAlbum === album }
                                   albumClicked={ () => albumClicked(album) }/>
                  ))
                  }
                </ul>
              </section>

              { isAlbumDetailsRendered && 
                <section id="albumDetails">
                  { albumGalleryError && <Alert severity="error">There was an issue fetching images for this album.</Alert> }

                  { albumGalleryLoading && <CircularProgress color="success" aria-label="Loading…"/> }

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
            </section>
          }
        </section>
      }

      <iframe ref={ iframeRef }
              src={ TRUSTED_ORIGIN }
              id="data-app-iframe"
              title="Data App"
              sandbox="allow-scripts allow-same-origin"
              height="0"
              width="0">
      </iframe>
    </>
  )
}

export default App
