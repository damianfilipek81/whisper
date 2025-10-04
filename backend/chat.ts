import { log } from './logger.js';
import { persistedState, getOrCreateChat, getActiveConnection } from './state.js';
import { joinChat } from './swarm.js';
import { deriveChatIdForPeer } from './peers.js';
import { emitMessageReceived } from './events.js';
import { saveMetadataDebounced } from './storage.js';
import type { Message, IncomingMessage } from './types.js';

export async function ensureChat(peerIdHex: string): Promise<any> {
  const chatId = deriveChatIdForPeer(peerIdHex);
  const chat = getOrCreateChat(chatId, peerIdHex);
  await joinChat(chatId);
  return chat;
}

export async function sendChatMessage(
  chatId: string,
  text: string,
  type: string = 'text',
  metadata: Record<string, any> = {}
): Promise<{ messageId: string }> {
  const chat = persistedState.chats.get(chatId);
  if (!chat) throw new Error('chat not found');

  const message: Message = {
    id: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
    chatId,
    senderId: persistedState.userId!,
    type: type as 'text' | 'voice',
    text,
    timestamp: Date.now(),
    status: 'pending',
    ...metadata,
  };

  chat.messages.push(message);
  try {
    await saveMetadataDebounced();
  } catch (error) {
    log.w('[CHAT] Failed to save metadata:', error);
  }

  try {
    emitMessageReceived(message, chatId);
  } catch (error) {
    log.w('[CHAT] emitMessageReceived failed', message.id);
  }
  log.i('[CHAT] send local append', message.id, 'to', chat.peerId);

  const activeConn = getActiveConnection(chat.peerId);
  if (activeConn?.chatWriter) {
    try {
      activeConn.chatWriter.write(Buffer.from(JSON.stringify({ t: 'msg', message })));
      message.status = 'sent';
      log.i('[CHAT] send bytes ok for', message.id);
    } catch (err) {
      log.e('[CHAT] send failed', message.id, err);
      throw new Error('Failed to send message - peer offline');
    }
  } else {
    log.e('[CHAT] no connection for', chat.peerId);
    throw new Error('Cannot send message - peer not connected');
  }

  return { messageId: message.id };
}

export async function handleIncomingChannelData(
  peerIdHex: string,
  data: Buffer | string
): Promise<void> {
  try {
    const msg: IncomingMessage = JSON.parse(
      Buffer.isBuffer(data) ? data.toString('utf8') : String(data)
    );
    if (msg.t === 'msg' && msg.message) {
      const m = msg.message;
      const chatId = m.chatId || deriveChatIdForPeer(peerIdHex);
      const chat = getOrCreateChat(chatId, peerIdHex);

      const isDuplicate = chat.messages.some((existing) => existing.id === m.id);
      if (!isDuplicate) {
        chat.messages.push(m);
        try {
          await saveMetadataDebounced();
        } catch (error) {
          log.w('[CHAT] Failed to save metadata:', error);
        }
        emitMessageReceived(m, chatId);
        log.i('[CHAT] received message', m.id, 'from', peerIdHex.slice(0, 16));
      } else {
        log.i('[CHAT] duplicate message ignored', m.id);
      }
    }
  } catch (error) {
    log.w('[CHAT] Error handling incoming data:', error);
  }
}

export async function getChatMessages(
  chatId: string,
  limit: number = 50
): Promise<Message[]> {
  const chat = persistedState.chats.get(chatId);
  if (!chat) return [];
  const start = Math.max(0, chat.messages.length - limit);
  return chat.messages.slice(start);
}
