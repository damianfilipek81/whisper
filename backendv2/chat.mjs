import { log } from './logger.mjs';

import { persistedState, getOrCreateChat, getActiveConnection } from './state.mjs';
import { joinChat } from './swarm.mjs';
import { deriveChatIdForPeer } from './peers.mjs';
import { emitMessageReceived } from './events.mjs';
import { saveMetadataDebounced } from './storage.mjs';

export async function ensureChat(peerIdHex) {
  const chatId = deriveChatIdForPeer(peerIdHex);
  const chat = getOrCreateChat(chatId, peerIdHex);
  await joinChat(chatId);
  return chat;
}

export async function sendChatMessage(chatId, text, type = 'text', metadata = {}) {
  const chat = persistedState.chats.get(chatId);
  if (!chat) throw new Error('chat not found');

  const message = {
    id: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
    chatId,
    senderId: persistedState.userId,
    type,
    text,
    timestamp: Date.now(),
    status: 'pending', // pending | sent | delivered
    ...metadata, // Include voice message metadata (audioData, transcription, etc.)
  };

  // persist locally
  chat.messages.push(message);
  try {
    await saveMetadataDebounced();
  } catch {}
  
  // Emit event locally so sender UI updates immediately
  try {
    emitMessageReceived(message, chatId);
  } catch {
    log.w('[CHAT] emitMessageReceived failed', message.id);
  }
  log.i('[CHAT] send local append', message.id, 'to', chat.peerId);

  // send over active connection if available
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

export async function handleIncomingChannelData(peerIdHex, data) {
  try {
    const msg = JSON.parse(
      Buffer.isBuffer(data) ? data.toString('utf8') : String(data)
    );
    if (msg.t === 'msg' && msg.message) {
      const m = msg.message;
      const chatId = m.chatId || deriveChatIdForPeer(peerIdHex);
      const chat = getOrCreateChat(chatId, peerIdHex);

      // Check for duplicate (idempotency)
      const isDuplicate = chat.messages.some((existing) => existing.id === m.id);
      if (!isDuplicate) {
        chat.messages.push(m);
        try {
          await saveMetadataDebounced();
        } catch {}
        emitMessageReceived(m, chatId);
        log.i('[CHAT] received message', m.id, 'from', peerIdHex.slice(0, 16));
      } else {
        log.i('[CHAT] duplicate message ignored', m.id);
      }
    }
  } catch {}
}

export async function getChatMessages(chatId, limit = 50) {
  const chat = persistedState.chats.get(chatId);
  if (!chat) return [];
  const start = Math.max(0, chat.messages.length - limit);
  return chat.messages.slice(start);
}
