import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import App from './App';
import { Album, Image } from '@shared/models/album.model';
import { EventType } from '@shared/consts/event.const';
import { ImgurService } from './services/imgur.service';

// Mock the ImgurService module
vi.mock('./services/imgur.service', () => {
  const mockGetAlbums = vi.fn();
  const mockGetImage = vi.fn();
  
  return {
    ImgurService: {
      getInstance: () => ({
        getAlbums: mockGetAlbums,
        getImage: mockGetImage
      }),
    },
  };
});

describe('Child App - Iframe Boundary', () => {
  const PARENT_ORIGIN = `http://${window.location.hostname}:5554`;
  const requestId = 'test-request-id';
  
  let imgurServiceMock: ImgurService;
  let mockParentPostMessage: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    imgurServiceMock = ImgurService.getInstance();

    // Mock postMessage to prevent Happy DOM from throwing cross-origin errors when posting messages
    mockParentPostMessage = vi.fn();
    vi.spyOn(window.parent, 'postMessage').mockImplementation(mockParentPostMessage);
  });

  it('handles SEARCH and ALBUM_CLICK messages from host and posts back data', async () => {
    render(<App />);

    const mockAlbum = {
      id: 'test-album-id',
      title: 'Title',
      description: 'description',
      images: [{ id: 'test-image-id' }]
    } as Album;

    const mockImage = {
      id: 'test-image-id',
      type: 'image/jpeg',
      link: 'https://imgur.com/test'
    } as Image;

    // Set up resolved data values for service layer mocks
    imgurServiceMock.getAlbums.mockResolvedValue([mockAlbum]);
    imgurServiceMock.getImage.mockResolvedValue(mockImage);

    // Inbound `SEARCH` event
    const hostSearchEvent = new MessageEvent('message', {
      data: {
        type: EventType.SEARCH,
        requestId: requestId,
        data: 'test'
      },
      origin: PARENT_ORIGIN
    });
    window.dispatchEvent(hostSearchEvent);

    // Verify Imgur service was called with the right argument
    expect(imgurServiceMock.getAlbums).toHaveBeenCalledWith('test');

    // Outbound SEARCH event
    await expect.poll(() => mockParentPostMessage).toHaveBeenCalledWith(
      {
        type: EventType.SEARCH,
        requestId: requestId,
        data: [mockAlbum]
      },
      PARENT_ORIGIN
    );

    // Clear postMessage log history to test the subsequent execution block cleanly
    mockParentPostMessage.mockClear();

    // Inbound ALBUM_CLICK event
    const hostClickEvent = new MessageEvent('message', {
      data: {
        type: EventType.ALBUM_CLICK,
        requestId: `${requestId}2`,
        data: mockAlbum
      },
      origin: PARENT_ORIGIN
    });
    window.dispatchEvent(hostClickEvent);

    // Verify service fetched individual images
    expect(imgurServiceMock.getImage).toHaveBeenCalledWith('test-image-id');

    // Outbound ALBUM_CLICK event
    await expect.poll(() => mockParentPostMessage).toHaveBeenCalledWith(
      {
        type: EventType.ALBUM_CLICK,
        requestId: `${requestId}2`,
        data: [mockImage]
      },
      PARENT_ORIGIN
    );
  });

  it('posts back an error payload if service layers fail', async () => {
    render(<App />);

    // Force service to reject with an error
    imgurServiceMock.getAlbums.mockRejectedValue(new Error('Imgur API Down'));

    const failingSearchEvent = new MessageEvent('message', {
      data: {
        type: EventType.SEARCH,
        requestId: requestId,
        data: 'break-me'
      },
      origin: PARENT_ORIGIN
    });
    window.dispatchEvent(failingSearchEvent);

    // Outbound error event
    await expect.poll(() => mockParentPostMessage).toHaveBeenCalledWith(
      {
        type: EventType.SEARCH,
        requestId: requestId,
        error: 'Imgur API Down'
      },
      PARENT_ORIGIN
    );
  });

  it('ignores messages originating from untrusted domains', async () => {
    render(<App />);

    const untrustedEvent = new MessageEvent('message', {
      data: { 
        type: EventType.SEARCH, 
        requestId: requestId,
        data: [] 
      },
      origin: 'https://my-fake-origin.com'
    });
    window.dispatchEvent(untrustedEvent);
    
    expect(imgurServiceMock.getAlbums).not.toHaveBeenCalled();
    expect(mockParentPostMessage).not.toHaveBeenCalled();
  });
});
