import { useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const TRUSTED_ORIGIN = 'http://localhost:5555';

  useEffect(() => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const handleMessageFromIframe = (event: any) => {
      if (event.origin !== TRUSTED_ORIGIN) {
        return;
      }

      console.log('Host app received event', event.data);
    };

    window.addEventListener('message', handleMessageFromIframe);
    return () => window.removeEventListener('message', handleMessageFromIframe);
  }, []);

  const sendMessageToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const payload = {
        type: 'HOST',
        text: 'HELLO WORLD'
      }

      iframeRef.current.contentWindow.postMessage(payload, TRUSTED_ORIGIN);
    }
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={ heroImg } className="base" width="170" height="179" alt=""/>
          <img src={ reactLogo } className="framework" alt="React logo"/>
          <img src={ viteLogo } className="vite" alt="Vite logo"/>
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button type="button"
                className="counter"
                onClick={ sendMessageToIframe }>
          Say hi to iframe
        </button>
      </section>

      <iframe ref={ iframeRef }
              src={ TRUSTED_ORIGIN }
              title="Data App"
              sandbox="allow-scripts allow-same-origin">
      </iframe>
    </>
  )
}

export default App
