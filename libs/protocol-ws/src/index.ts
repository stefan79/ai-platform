export const protocolVersion = '0.1.0';

export interface WsEnvelope<TPayload = unknown> {
  v: number;
  id: string;
  ts: number;
  type: string;
  payload: TPayload;
  threadId?: string;
  turnId?: string;
}

export type WsMessage<TPayload = unknown> = WsEnvelope<TPayload>;
