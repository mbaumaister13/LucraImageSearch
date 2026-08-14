import './ImageContainer.css'

interface ImageContainerProps {
  link: string;
  type: string;
  height: number;
  width: number;
}

function ImageContainer({ link, type, height, width }: ImageContainerProps) {

  const getImageType = (type: string) => {
    if (type.includes('image')) {
      return 'image';
    } else if (type.includes('video')) {
      return 'video';
    }
    return 'unknown';
  }

  return (
    <>
      { getImageType(type) === 'image' &&
          <img src={ link } alt="" height={ height } width={ width }/>
      }
      { getImageType(type) === 'video' &&
          <video className="gif-video"
                 style={{ height: height, width: width }}
                 autoPlay
                 loop
                 muted
                 playsInline>
              <source src={ link } type={ type }/>
          </video>
      }
    </>
  )
}

export default ImageContainer
