import { DurableObject } from "cloudflare:workers";

interface Attachment {
  vid: string;
  name: string;
}

type Outbound =
  | { type: "system"; message: string; count: number; at: number }
  | { type: "message"; name: string; message: string; at: number }
  | { type: "error"; message: string };

const MAX_MESSAGE_LEN = 256;
const MAX_NAME_LEN = 32;

/**
 * ChatRoom — WebSocket **Hibernation API** を使ったルーム単位のチャット DO
 * (`getByName(room)`)。
 *
 * 教材ポイント: Hibernation では `ctx.acceptWebSocket()` で接続を Runtime に預け、
 * アイドル中は DO をメモリから退避(課金停止)できる。接続情報は
 * `serializeAttachment()` で WebSocket に紐付けて保持し、復帰後も参照できる。
 * keep-alive の ping/pong は `setWebSocketAutoResponse()` に任せ、DO を起こさない。
 */
export class ChatRoom extends DurableObject<Env> {
  /** WS Upgrade を受け付け、接続を Hibernation で確立する。 */
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const vid = (url.searchParams.get("vid") ?? "anonymous").slice(0, 64);
    const name = (url.searchParams.get("name") ?? "ゲスト").slice(0, MAX_NAME_LEN);

    const { 0: client, 1: server } = new WebSocketPair();

    // server.accept() は使わない。acceptWebSocket でハイバネーション対象にする(vid をタグ付け)。
    this.ctx.acceptWebSocket(server, [vid]);
    server.serializeAttachment({ vid, name } satisfies Attachment);

    // ping→pong を Runtime 側で自動応答し、keep-alive で DO を起こさない。
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));

    this.broadcast({
      type: "system",
      message: `${name} が参加しました`,
      count: this.ctx.getWebSockets().length,
      at: Date.now(),
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  /** メッセージ受信。長さを検証し、全接続へブロードキャストする。 */
  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    if (text.length < 1 || text.length > MAX_MESSAGE_LEN) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: `メッセージは1〜${MAX_MESSAGE_LEN}字で入力してください`,
        } satisfies Outbound)
      );
      return;
    }
    const att = ws.deserializeAttachment() as Attachment | null;
    this.broadcast({
      type: "message",
      name: att?.name ?? "ゲスト",
      message: text,
      at: Date.now(),
    });
  }

  /** 切断時。closing handshake を完了し、退出を通知する。 */
  override async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const att = ws.deserializeAttachment() as Attachment | null;
    // サーバ側からも close を返して handshake を完了させる(1006 等の予約コードは 1000 に丸める)。
    const safeCode = code >= 3000 && code <= 4999 ? code : 1000;
    try {
      ws.close(safeCode, reason);
    } catch {
      // 既に閉じている場合は無視
    }
    this.broadcast({
      type: "system",
      message: `${att?.name ?? "ゲスト"} が退出しました`,
      count: this.ctx.getWebSockets().filter((s) => s !== ws).length,
      at: Date.now(),
    });
  }

  /** 現在の接続数(/info 用 RPC)。 */
  count(): number {
    return this.ctx.getWebSockets().length;
  }

  /** 全接続へ JSON を送信。except を指定するとその接続を除外する。 */
  private broadcast(payload: Outbound, except?: WebSocket): void {
    const data = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try {
        ws.send(data);
      } catch {
        // 送信失敗(切断直後など)は無視
      }
    }
  }
}
