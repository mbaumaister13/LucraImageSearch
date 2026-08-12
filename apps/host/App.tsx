import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CircularProgress, debounce, TextField } from '@mui/material';
import AlbumListItem from './components/album/AlbumListItem.tsx';
import type { Album, AlbumEvent } from './models/album.model.ts';
import { EventType } from './consts/event.const.ts';

function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGIN = 'http://localhost:5555';

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchedAlbums, setSearchedAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  useEffect(() => {
    const handleMessageFromIframe = (event: MessageEvent<AlbumEvent>) => {
      if (event.origin !== TRUSTED_ORIGIN) {
        return;
      }

      const payload = event.data;
      console.log('Received event from data layer', payload);
      switch (payload.type) {
        case EventType.SEARCH:
          setSearchedAlbums(payload.data as Album[]);
          setLoading(false);
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
    // Prevent running on the very first mount if the input is empty
    if (debouncedSearchTerm !== null) {
      sendMessageToIframe({
        type: EventType.SEARCH,
        data: debouncedSearchTerm
      } as AlbumEvent);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    return () => debouncedSearch.clear();
  }, [debouncedSearch]);

  const search = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    debouncedSearch(searchTerm);
    setLoading(true);
  }

  const albumClicked = (album: Album) => {
    if (selectedAlbum === album) {
      setSelectedAlbum(null);
    } else {
      setSelectedAlbum(album);
    }

    sendMessageToIframe({
      type: EventType.ALBUM_CLICK,
      data: {
        artist: album.artist,
        title: album.title
      }
    } as AlbumEvent);
  }

  return (
    <>
      <section id="search">
        <TextField fullWidth
                   variant="filled"
                   label="Search for an album"
                   value={ searchTerm }
                   onChange={ (event: React.ChangeEvent<HTMLInputElement>) => {
                     search(event.target.value);
                   } }>
        </TextField>
      </section>

      { loading && <CircularProgress aria-label="Loading…"/> }

      { searchedAlbums.length > 0 && !loading &&
          <section id="albums">
              <section id="album-list"
                       className={ selectedAlbum ? 'selected' : '' }>
                  <ul>
                    { searchedAlbums.map((album) => (
                      <AlbumListItem key={ `${ album.artist }-${ album.title }` }
                                     album={ album }
                                     selected={ selectedAlbum === album }
                                     albumClicked={ albumClicked }/>
                    ))
                    }
                  </ul>
              </section>

            { selectedAlbum &&
                <section id="selectedAlbum">
                    <div id="photo-slider">
                        <img src="assets/hero.png" alt=""/>
                    </div>
                    <div id="artist-title">
                        <p>{ selectedAlbum.artist } - { selectedAlbum.title }</p>
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
