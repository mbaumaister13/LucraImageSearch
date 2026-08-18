import { screen, fireEvent, queryByAttribute } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { renderWithQueryClient } from '@shared/test-helpers/query-client.util'; 
import { Album, Image } from '@shared/models/album.model';
import { EventType } from '@shared/consts/event.const';

const getById = queryByAttribute.bind(null, 'id');

describe('Host App - Iframe Boundary', () => {
  const CHILD_ORIGIN = `http://${ window.location.hostname }:5555`;
  const requestId = 'test-request-id';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('sends SEARCH and ALBUM_CLICK events on user interaction', async () => {
    const dom = renderWithQueryClient(<App />);
    const iframe = getById(dom.container, 'dataAppIframe') as HTMLIFrameElement;

    const mockPostMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true
    });

    const album = {
      id: 'test-album-id',
      title: 'Title',
      description: 'description',
      coverImage: {
        id: 'test-image-id',
        type: 'image/jpeg',
        link: 'https://imgur.com/test'
      },
      images: [
        {
          id: 'test-image-id',
          type: 'image/jpeg',
          link: 'https://imgur.com/test'
        }
      ]
    } as Album;

    // Trigger outbound `SEARCH` event
    fireEvent.change(screen.getByLabelText(/Search for an album/i), { target: { value: 'test' } });

    // Listen for postMessage && capture requestId
    await expect.poll(() => mockPostMessage).toHaveBeenCalled();
    const initialSearchPayload = mockPostMessage.mock.calls[0][0];
    const initialSearchRequestId = initialSearchPayload.requestId;

    // Mock search event
    const searchEvent = new MessageEvent('message', {
      data: { 
        type: EventType.SEARCH,
        requestId: initialSearchRequestId,
        data: [album] 
      },
      origin: CHILD_ORIGIN
    });
    window.dispatchEvent(searchEvent);

    // Album list should have 1 item
    await expect.poll(() => {
      const element = getById(dom.container, 'albumUl');
      return element ? element.childElementCount : 0;
    }).toBe(1);

    mockPostMessage.mockClear();

    // Trigger outbound `ALBUM_CLICK` event on album list item
    const albumListItem = getById(dom.container, 'test-album-id-info');
    if (albumListItem) {
      fireEvent.click(albumListItem);
    }
    
    // Listen for outbound `ALBUM_CLICK` event
    await expect.poll(() => mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.ALBUM_CLICK,
        data: album,
        requestId: expect.any(String)
      }),
      CHILD_ORIGIN
    );

    // Capture new requestId
    const capturedPayload = mockPostMessage.mock.calls[0][0];
    const generatedRequestId = capturedPayload.requestId;

    // Generate mock inbound `ALBUM_CLICK` event
    const albumClickResponseEvent = new MessageEvent('message', {
      data: { 
        type: EventType.ALBUM_CLICK,
        requestId: generatedRequestId,
        data: [
          {
            id: 'test-image-id',
            type: 'image/jpeg',
            link: 'https://imgur.com/test'
          } as Image
        ]
      },
      origin: CHILD_ORIGIN
    });
    window.dispatchEvent(albumClickResponseEvent);

    // Album info should be populated
    await expect.poll(() => {
      const element = getById(dom.container, 'selectedAlbum');
      return element ? element.innerText : '';
    }).toBe(album.title);
  });

  it('displays error message if error on SEARCH', async () => {
    const dom = renderWithQueryClient(<App />);

    const failingSearchEvent = new MessageEvent('message', {
      data: {
        type: EventType.SEARCH,
        requestId: requestId,
        error: 'Imgur API Down'
      },
      origin: CHILD_ORIGIN
    });
    window.dispatchEvent(failingSearchEvent);

    // Search error message should be render
    await expect.poll(() => getById(dom.container, 'searchError')).toBeDefined();
  });

  it('displays error message if error on ALBUM_CLICK', async () => {
    const dom = renderWithQueryClient(<App />);
    const iframe = getById(dom.container, 'dataAppIframe') as HTMLIFrameElement;

    const mockPostMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true
    });

    const album = {
      id: 'test-album-id',
      title: 'Title',
      description: 'description',
      coverImage: {
        id: 'test-image-id',
        type: 'image/jpeg',
        link: 'https://imgur.com/test'
      },
      images: [
        {
          id: 'test-image-id',
          type: 'image/jpeg',
          link: 'https://imgur.com/test'
        }
      ]
    } as Album;

    // Trigger outbound `SEARCH` event
    fireEvent.change(screen.getByLabelText(/Search for an album/i), { target: { value: 'test' } });

    // Listen for postMessage && capture requestId
    await expect.poll(() => mockPostMessage).toHaveBeenCalled();
    const initialSearchPayload = mockPostMessage.mock.calls[0][0];
    const initialSearchRequestId = initialSearchPayload.requestId;

    // Mock search event
    const searchEvent = new MessageEvent('message', {
      data: { 
        type: EventType.SEARCH,
        requestId: initialSearchRequestId,
        data: [album] 
      },
      origin: CHILD_ORIGIN
    });
    window.dispatchEvent(searchEvent);

    // Album list should have 1 item
    await expect.poll(() => {
      const element = getById(dom.container, 'albumUl');
      return element ? element.childElementCount : 0;
    }).toBe(1);

    mockPostMessage.mockClear();

    const failingAlbumClickEvent = new MessageEvent('message', {
      data: {
        type: EventType.ALBUM_CLICK,
        requestId: requestId,
        error: 'Imgur API Down'
      },
      origin: CHILD_ORIGIN
    });
    window.dispatchEvent(failingAlbumClickEvent);

    // Gallery error message should be render
    await expect.poll(() => getById(dom.container, 'galleryError')).toBeDefined();
  });

  it('ignores messages originating from untrusted domains', () => {
    const dom = renderWithQueryClient(<App />);

    const untrustedEvent = new MessageEvent('message', {
      data: { 
        type: EventType.SEARCH, 
        requestId: requestId,
        data: [] 
      },
      origin: 'https://my-fake-origin.com'
    });
    window.dispatchEvent(untrustedEvent);

    expect(getById(dom.container, 'albums')).toBeNull();
  });
});