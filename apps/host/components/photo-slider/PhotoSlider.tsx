import './PhotoSlider.css'
import type { Image } from '../../models/album.model.ts';
import ImageContainer from '../image/ImageContainer.tsx';
import { useState } from 'react';

interface PhotoSliderProps {
  images: Image[];
}

function PhotoSlider({ images }: PhotoSliderProps) {

  const [slideIndex, setSlideIndex] = useState(0);

  const handlePrev = () => {
    setSlideIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setSlideIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <>
      <div className="slider">
        <div className="image-wrapper" 
             style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
          { images.map((image: Image) => (
            <ImageContainer key={ image.id } link={ image.link } type={ image.type } height={ 500 } width={ 500 }/>
          ))
          }
        </div>
        
        { images.length > 1 &&
          <section id="buttonContainer">
            { slideIndex > 0 && 
              <button className="nav-button prev" onClick={handlePrev}>&#10094;</button> 
            }
            { slideIndex < images.length - 1 &&
              <button className="nav-button next" onClick={handleNext}>&#10095;</button>
            }
          </section>
        }
      </div>
    </>
  )
}

export default PhotoSlider
