function App() {
  const PARENT_ORIGIN = 'http://localhost:5554';

  window.addEventListener('message', (event) => {
    if (event.origin !== PARENT_ORIGIN) {
      return;
    }

    console.log(`Data app received event`, event.data);
    window.parent.postMessage({
      type: 'DATA',
      text: `Here's your message back: ${ event.data.text }`
    }, PARENT_ORIGIN);
  });

  return null;
}

export default App
