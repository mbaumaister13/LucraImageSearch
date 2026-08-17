export const EventType = { SEARCH: 'SEARCH', ALBUM_CLICK: 'ALBUM_CLICK' } as const;
export type EventType = typeof EventType[keyof typeof EventType];