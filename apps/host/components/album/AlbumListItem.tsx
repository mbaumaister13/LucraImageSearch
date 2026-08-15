import './AlbumListItem.css'
import type { Album } from '../../models/album.model.ts';
import ImageContainer from '../image/ImageContainer.tsx';

interface AlbumListItemProps {
  className: string;
  style: object;
  album: Album;
  selected: boolean;
  albumClicked: (album: Album) => void
}

function AlbumListItem({ className, style, album, selected, albumClicked }: AlbumListItemProps) {

  return (
    <>
      <section id="info"
               style={style}
               className={`${className} ${ selected ? 'selected' : '' }`}
               onClick={ () => albumClicked(album) }>
        <ImageContainer key={ album.coverImage.id } link={ album.coverImage.link } type={ album.coverImage.type }
                        height={ 100 } width={ 100 }/>
        <div id="artist-title">
          <p>{ album.title }</p>{ album.description && <p> - { album.description }</p> }
        </div>
      </section>
    </>
  )
}

export default AlbumListItem
