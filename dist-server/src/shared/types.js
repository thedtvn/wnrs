"use strict";
// Shared types used by both the client bundle and the Cloudflare Worker (if applicable) and Server.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClientMessage = isClientMessage;
function isClientMessage(data) {
    if (typeof data !== 'object' || data === null)
        return false;
    const msg = data;
    switch (msg.type) {
        case 'join':
            return (typeof msg.user?.id === 'string' &&
                typeof msg.user?.name === 'string');
        case 'setSettings': {
            const s = msg.settings;
            return (Array.isArray(s?.selectedDecks) &&
                typeof s?.seed === 'string' &&
                typeof s?.answerSeconds === 'number' &&
                typeof s?.ratingSeconds === 'number' &&
                typeof s?.totalRounds === 'number');
        }
        case 'transferHost':
            return typeof msg.targetId === 'string';
        case 'submitAnswer':
            return typeof msg.answer === 'string';
        case 'rateAnswer':
            return (typeof msg.targetId === 'string' &&
                typeof msg.rating === 'number' &&
                Number.isInteger(msg.rating) &&
                msg.rating >= 1 &&
                msg.rating <= 10);
        case 'start':
        case 'ready':
        case 'unready':
        case 'spectate':
        case 'unspectate':
        case 'revealNext':
        case 'nextQuestion':
            return true;
        default:
            return false;
    }
}
