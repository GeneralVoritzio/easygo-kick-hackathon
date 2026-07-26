import type { ChatMessage } from '../types';

const VIEWER_NAMES = [
  'nightowl22', 'xX_Raven_Xx', 'lurkmaster', 'sodapop', 'ghostie', 'kelpy_dev',
  'quietstorm', 'BunsenBurner', 'triple_axel', 'mango.tv', 'zerocool', 'flickerbulb',
];

const MESSAGE_TEMPLATES = [
  'POGGERS', "let's gooo", 'who else just joined', 'W stream', 'chat is moving so fast rn',
  'first time catching this live, loving it', 'any tips for beginners?', '🔥🔥🔥', 'clip that', 'LOL',
  'been watching for 2 hours straight', "can't believe that just happened",
];

export function createMockChatMessage(): ChatMessage {
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    viewerName: VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)],
    text: MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)],
  };
}

export function createMockChatMessages(count = 12): ChatMessage[] {
  return Array.from({ length: count }, () => createMockChatMessage());
}
