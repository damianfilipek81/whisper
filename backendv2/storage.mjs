import Corestore from 'corestore';
import { log } from './logger.mjs';

import { persistedState, memoryState } from './state.mjs';

export async function initializeStorage(storagePath) {
  memoryState.storagePath = storagePath;
  memoryState.corestore = new Corestore(storagePath);
  await memoryState.corestore.ready();
  memoryState.localCore = memoryState.corestore.get({ name: 'local' });
  await memoryState.localCore.ready();
}

export async function closeStorage() {
  try {
    await memoryState.corestore?.close();
  } catch {}
}

export async function saveMetadata() {
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

let _saveTimer = null;
export async function saveMetadataDebounced(delay = 300) {
  try {
    if (_saveTimer) clearTimeout(_saveTimer);
  } catch {}
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

export async function loadMetadata() {
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
    const peers = JSON.parse(peersStr.toString());
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
    const chats = JSON.parse(chatsStr.toString());
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
