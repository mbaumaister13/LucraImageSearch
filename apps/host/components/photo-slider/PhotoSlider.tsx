import './PhotoSlider.css'
import type { Image } from '../../models/album.model.ts';
import ImageContainer from '../image/ImageContainer.tsx';

interface PhotoSliderProps {
  images: Image[];
}

function PhotoSlider({ images }: PhotoSliderProps) {

  return (
    <>
      <div className="slider">
        { images.map((image: Image) => (
          <ImageContainer key={ image.id } link={ image.link } type={ image.type } height={ 500 } width={ 500 }/>
        ))
        }
      </div>
    </>
  )
}

export default PhotoSlider
