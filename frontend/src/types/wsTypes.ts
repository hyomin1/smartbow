type PolygonMessage = {
  type: 'polygon';
  points: number[][];
};

export type HitMessage = {
  type: 'hit';
  tip: [number, number];
  inside: boolean;
};

export type Hit = {
  tip: [number, number];
  inside: boolean;
  id: number;
};

export type WsMessage = PolygonMessage | HitMessage;

type VideoSizeMessage = {
  type: 'video_size';
  width: number;
  height: number;
};

export type ClientMessage = VideoSizeMessage;
