import Corestore from 'corestore';
import { log } from './logger.js';
import { persistedState, memoryState } from './state.js';
import type { Peer, Chat } from './types.js';

export async function initializeStorage(storagePath: string): Promise<void> {
  memoryState.storagePath = storagePath;
  memoryState.corestore = new Corestore(storagePath);
  await memoryState.corestore.ready();
  memoryState.localCore = memoryState.corestore.get({ name: 'local' });
  await memoryState.localCore.ready();
}

export async function closeStorage(): Promise<void> {
  try {
    await memoryState.corestore?.close();
  } catch (error) {
    log.w('[STORAGE] Error closing storage:', error);
  }
}

export async function saveMetadata(): Promise<void> {
  if (!memoryState.localCore) return;

  // Save peers (persisted metadata only - no connection state)
  const peers = JSON.stringify(Array.from(persistedState.peers.values()));

  // Save chats (messages only - no connected status)
  const chats = JSON.stringify(
    Array.from(persistedState.chats.values()).map((c) => ({
      id: c.id,
      peerId: c.peerId,
      messages: c.messages,
    }))
  );

  // Save profile
  const profile = JSON.stringify(persistedState.profile || {});

  await memoryState.localCore.setUserData('v2_peers', peers);
  await memoryState.localCore.setUserData('v2_chats', chats);
  await memoryState.localCore.setUserData('v2_profile', profile);
}

let _saveTimer: NodeJS.Timeout | null = null;

export async function saveMetadataDebounced(delay: number = 300): Promise<void> {
  try {
    if (_saveTimer) clearTimeout(_saveTimer);
  } catch (error) {
    log.w('[STORAGE] Error clearing save timer:', error);
  }
  return new Promise((resolve) => {
    _saveTimer = setTimeout(async () => {
      _saveTimer = null;
      try {
        await saveMetadata();
      } finally {
        resolve();
      }
    }, delay);
  });
}

export async function loadMetadata(): Promise<void> {
  if (!memoryState.localCore) return;

  log.i('[STORAGE] Loading metadata from storage...');

  const peersStr = await memoryState.localCore.getUserData('v2_peers');
  const chatsStr = await memoryState.localCore.getUserData('v2_chats');
  const profileStr = await memoryState.localCore.getUserData('v2_profile');

  if (profileStr) {
    persistedState.profile = JSON.parse(profileStr.toString());
    log.i(`[STORAGE] Loaded user profile: ${persistedState.profile?.name || 'NONE'}`);
  }

  if (peersStr) {
    const peers: Peer[] = JSON.parse(peersStr.toString());
    log.i(`[STORAGE] Loaded ${peers.length} peers`);
    for (const p of peers) {
      persistedState.peers.set(p.peerId, p);
      log.i(
        `[STORAGE] Peer ${p.peerId.slice(0, 8)}: profile.name=${
          p.profile?.name || 'NONE'
        }`
      );
    }
  }

  if (chatsStr) {
    const chats: Chat[] = JSON.parse(chatsStr.toString());
    log.i(
      `[STORAGE] Loaded ${chats.length} chats with ${chats.reduce(
        (sum, c) => sum + c.messages.length,
        0
      )} total messages`
    );
    for (const c of chats) {
      // Note: connected status is NOT persisted - it's always false on load
      persistedState.chats.set(c.id, c);
    }
  }
}
