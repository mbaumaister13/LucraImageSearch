import './AlbumListItem.css'
import type { Album } from '../../models/album.model.ts';

interface AlbumListItemProps {
  album: Album;
  selected: boolean;
  albumClicked: (album: Album) => void
}

function AlbumListItem({ album, selected, albumClicked }: AlbumListItemProps) {

  return (
    <>
      <section id="info"
               className={ selected ? 'selected' : '' }
               onClick={ () => albumClicked(album) }>
        <div id="artist-title">
          <p>{ album.artist } - { album.title }</p>
        </div>
        <div id="songcount-duration">
          <p>{ album.songCount } songs, { `${ album.duration }` }</p>
        </div>
      </section>
    </>
  )
}

export default AlbumListItem
