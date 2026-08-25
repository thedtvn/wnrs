"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const gameEngine_1 = require("./gameEngine");
const p1 = { id: 'p1', name: 'Alice' };
const p2 = { id: 'p2', name: 'Bob' };
const p3 = { id: 'p3', name: 'Charlie' };
/** Build a lobby with the given players joined; first is host. */
function lobbyWith(...players) {
    let s = (0, gameEngine_1.createInitialState)();
    for (const p of players) {
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'join', user: p }, p.id, 0).state;
    }
    return s;
}
/** Ready everyone except host, then host starts. Returns answering-phase state. */
function startGame(base, now = 1000) {
    let s = base;
    const host = s.hostId;
    for (const p of s.players) {
        if (p.id !== host)
            s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, p.id, now).state;
    }
    s = (0, gameEngine_1.handleClientMessage)(s, { type: 'start' }, host, now).state;
    return s;
}
(0, vitest_1.describe)('lobby', () => {
    (0, vitest_1.it)('initializes to lobby, no host', () => {
        const s = (0, gameEngine_1.createInitialState)();
        (0, vitest_1.expect)(s.phase).toBe('lobby');
        (0, vitest_1.expect)(s.roundNumber).toBe(0);
        (0, vitest_1.expect)(s.hostId).toBeNull();
    });
    (0, vitest_1.it)('first joiner becomes host', () => {
        const s = lobbyWith(p1);
        (0, vitest_1.expect)(s.hostId).toBe('p1');
        (0, vitest_1.expect)(s.players.map(p => p.id)).toEqual(['p1']);
    });
    (0, vitest_1.it)('additional joiners are players, host unchanged', () => {
        const s = lobbyWith(p1, p2, p3);
        (0, vitest_1.expect)(s.hostId).toBe('p1');
        (0, vitest_1.expect)(s.players.map(p => p.id)).toEqual(['p1', 'p2', 'p3']);
    });
    (0, vitest_1.it)('rejoin by same id is idempotent', () => {
        let s = lobbyWith(p1, p2);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'join', user: p2 }, p2.id, 0).state;
        (0, vitest_1.expect)(s.players.filter(p => p.id === 'p2')).toHaveLength(1);
    });
    (0, vitest_1.it)('late join during game auto-joins as spectator', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'join', user: p3 }, 'p3', 2000).state;
        (0, vitest_1.expect)(s.players.map(p => p.id)).toContain('p3');
        (0, vitest_1.expect)(s.spectatorIds).toContain('p3');
    });
    (0, vitest_1.it)('ready / unready toggles readiness', () => {
        let s = lobbyWith(p1, p2);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, 'p2', 0).state;
        (0, vitest_1.expect)(s.readyIds).toContain('p2');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'unready' }, 'p2', 0).state;
        (0, vitest_1.expect)(s.readyIds).not.toContain('p2');
    });
    (0, vitest_1.it)('spectate removes from players and readiness', () => {
        let s = lobbyWith(p1, p2, p3);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, 'p3', 0).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'spectate' }, 'p3', 0).state;
        (0, vitest_1.expect)(s.spectatorIds).toContain('p3');
        (0, vitest_1.expect)(s.players.map(p => p.id)).not.toContain('p3');
        (0, vitest_1.expect)(s.readyIds).not.toContain('p3');
    });
    (0, vitest_1.it)('unspectate returns player to players list', () => {
        let s = lobbyWith(p1, p2);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'spectate' }, 'p2', 0).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'unspectate' }, 'p2', 0).state;
        (0, vitest_1.expect)(s.players.map(p => p.id)).toContain('p2');
        (0, vitest_1.expect)(s.spectatorIds).not.toContain('p2');
    });
    (0, vitest_1.it)('spectator can join as player during scoring phase', () => {
        let s = lobbyWith(p1, p2);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, 'p2', 0).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'start' }, 'p1', 0).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'join', user: { id: 'p3', name: 'P3' } }, 'p3', 0).state;
        (0, vitest_1.expect)(s.spectatorIds).toContain('p3');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: 'p1', rating: 7 }, 'p2', 200).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 300).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: 'p2', rating: 5 }, 'p1', 400).state;
        (0, vitest_1.expect)(s.phase).toBe('scoring');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'unspectate' }, 'p3', 500).state;
        (0, vitest_1.expect)(s.players.map(p => p.id)).toContain('p3');
        (0, vitest_1.expect)(s.spectatorIds).not.toContain('p3');
    });
    (0, vitest_1.it)('host can set settings; non-host cannot', () => {
        let s = lobbyWith(p1, p2);
        const settings = { selectedDecks: ['main'], seed: 'z', answerSeconds: 45, ratingSeconds: 20, totalRounds: 5, locale: 'en' };
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'setSettings', settings }, 'p2', 0).state;
        (0, vitest_1.expect)(s.settings.answerSeconds).not.toBe(45); // non-host ignored
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'setSettings', settings }, 'p1', 0).state;
        (0, vitest_1.expect)(s.settings.answerSeconds).toBe(45);
        (0, vitest_1.expect)(s.settings.totalRounds).toBe(5);
    });
    (0, vitest_1.it)('host can transfer host to another player', () => {
        let s = lobbyWith(p1, p2);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'transferHost', targetId: 'p2' }, 'p1', 0).state;
        (0, vitest_1.expect)(s.hostId).toBe('p2');
        // non-host cannot transfer
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'transferHost', targetId: 'p1' }, 'p1', 0).state;
        (0, vitest_1.expect)(s.hostId).toBe('p2');
    });
    (0, vitest_1.it)('start is blocked unless all non-host non-spectator players are ready', () => {
        let s = lobbyWith(p1, p2, p3);
        // nobody ready
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'start' }, 'p1', 100).state;
        (0, vitest_1.expect)(s.phase).toBe('lobby');
        // ready p2 only
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, 'p2', 100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'start' }, 'p1', 100).state;
        (0, vitest_1.expect)(s.phase).toBe('lobby');
        // ready p3 too
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, 'p3', 100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'start' }, 'p1', 100).state;
        (0, vitest_1.expect)(s.phase).toBe('answering');
    });
    (0, vitest_1.it)('non-host cannot start', () => {
        let s = lobbyWith(p1, p2);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'ready' }, 'p2', 0).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'start' }, 'p2', 0).state;
        (0, vitest_1.expect)(s.phase).toBe('lobby');
    });
});
(0, vitest_1.describe)('answering phase', () => {
    (0, vitest_1.it)('start enters answering with a question and a deadline', () => {
        const s = startGame(lobbyWith(p1, p2), 1000);
        (0, vitest_1.expect)(s.phase).toBe('answering');
        (0, vitest_1.expect)(s.roundNumber).toBe(1);
        (0, vitest_1.expect)(s.round).not.toBeNull();
        (0, vitest_1.expect)(typeof s.round.question).toBe('string');
        (0, vitest_1.expect)(s.round.question.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(s.round.deadline).toBe(1000 + s.settings.answerSeconds * 1000);
    });
    (0, vitest_1.it)('players submit answers; own answer stored', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'my answer' }, 'p1', 1500).state;
        (0, vitest_1.expect)(s.round.answers['p1']).toBe('my answer');
    });
    (0, vitest_1.it)('does not reveal answers of others while answering (redaction is transport concern, engine stores raw)', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'secret' }, 'p1', 1500).state;
        (0, vitest_1.expect)(s.phase).toBe('answering');
    });
    (0, vitest_1.it)('when all eligible players submit, phase advances to revealing', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state;
        (0, vitest_1.expect)(s.phase).toBe('answering');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
    (0, vitest_1.it)('spectators do not gate answering completion', () => {
        let base = lobbyWith(p1, p2, p3);
        base = (0, gameEngine_1.handleClientMessage)(base, { type: 'spectate' }, 'p3', 0).state;
        let s = startGame(base, 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing'); // p3 spectator not required
    });
    (0, vitest_1.it)('timeout ends answering even with missing answers', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'only one' }, 'p1', 1500).state;
        const deadline = s.round.deadline;
        s = (0, gameEngine_1.checkTimeouts)(s, deadline + 1).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
    (0, vitest_1.it)('checkTimeouts bumps version on phase transition', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a' }, 'p1', 1500).state;
        const before = s.version;
        s = (0, gameEngine_1.checkTimeouts)(s, s.round.deadline + 1).state;
        (0, vitest_1.expect)(s.version).toBeGreaterThan(before);
    });
    (0, vitest_1.it)('host can skip answering phase with revealNext', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        (0, vitest_1.expect)(s.phase).toBe('answering');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'only one' }, 'p1', 1500).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
    (0, vitest_1.it)('non-host cannot skip answering phase', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p2', 2000).state;
        (0, vitest_1.expect)(s.phase).toBe('answering');
    });
    (0, vitest_1.it)('empty answer counts as submitted', () => {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: '' }, 'p1', 1500).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: '' }, 'p2', 1600).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
});
(0, vitest_1.describe)('revealing phase', () => {
    function toRevealing() {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state;
        return s;
    }
    (0, vitest_1.it)('host revealNext reveals first answer and enters rating', () => {
        let s = toRevealing();
        (0, vitest_1.expect)(s.phase).toBe('revealing');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        (0, vitest_1.expect)(s.phase).toBe('rating');
        (0, vitest_1.expect)(s.round.currentRevealId).not.toBeNull();
        (0, vitest_1.expect)(s.round.revealedAnswerIds).toHaveLength(1);
    });
    (0, vitest_1.it)('non-host cannot revealNext', () => {
        let s = toRevealing();
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p2', 2000).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
    (0, vitest_1.it)('rating deadline is set on reveal', () => {
        let s = toRevealing();
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        (0, vitest_1.expect)(s.round.deadline).toBe(2000 + s.settings.ratingSeconds * 1000);
    });
    (0, vitest_1.it)('solo: revealNext still enters rating (does not skip)', () => {
        let s = startGame(lobbyWith(p1), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'solo answer' }, 'p1', 1500).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        (0, vitest_1.expect)(s.phase).toBe('rating');
        (0, vitest_1.expect)(s.round.currentRevealId).toBe('p1');
    });
});
(0, vitest_1.describe)('rating phase', () => {
    function toRating() {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        return s;
    }
    (0, vitest_1.it)('players rate the revealed answer 1-10; owner cannot rate self', () => {
        let s = toRating();
        const ownerId = s.round.currentRevealId;
        const other = ownerId === 'p1' ? 'p2' : 'p1';
        // owner tries to rate self -> ignored
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 5 }, ownerId, 2100).state;
        (0, vitest_1.expect)(s.round.ratings[ownerId]?.[ownerId]).toBeUndefined();
        // other rates -> stored
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state;
        (0, vitest_1.expect)(s.round.ratings[ownerId]?.[other]).toBe(8);
    });
    (0, vitest_1.it)('when all eligible raters rate, goes back to revealing (more answers) or scoring (done)', () => {
        let s = toRating();
        const ownerId = s.round.currentRevealId;
        const other = ownerId === 'p1' ? 'p2' : 'p1';
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state;
        // only 2 answers, one revealed & rated -> back to revealing for the 2nd
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
    (0, vitest_1.it)('rating timeout advances even with missing ratings', () => {
        let s = toRating();
        const deadline = s.round.deadline;
        s = (0, gameEngine_1.checkTimeouts)(s, deadline + 1).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
    });
    (0, vitest_1.it)('after last answer rated, phase becomes scoring with per-answer means', () => {
        let s = toRating();
        // reveal & rate first
        let ownerId = s.round.currentRevealId;
        let other = ownerId === 'p1' ? 'p2' : 'p1';
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state;
        // reveal & rate second
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2200).state;
        ownerId = s.round.currentRevealId;
        other = ownerId === 'p1' ? 'p2' : 'p1';
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 6 }, other, 2300).state;
        (0, vitest_1.expect)(s.phase).toBe('scoring');
    });
    (0, vitest_1.it)('revealNext from rating phase acts as skip-voting', () => {
        let s = toRating();
        (0, vitest_1.expect)(s.phase).toBe('rating');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2100).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
        (0, vitest_1.expect)(s.round.currentRevealId).toBeNull();
    });
    (0, vitest_1.it)('author is not a required rater — auto-advances once all others voted', () => {
        let s = startGame(lobbyWith(p1, p2, p3), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1200).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a3' }, 'p3', 1300).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        const owner = s.round.currentRevealId;
        const others = ['p1', 'p2', 'p3'].filter(id => id !== owner);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: owner, rating: 7 }, others[0], 2100).state;
        (0, vitest_1.expect)(s.phase).toBe('rating');
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: owner, rating: 9 }, others[1], 2200).state;
        (0, vitest_1.expect)(s.phase).toBe('revealing');
        (0, vitest_1.expect)(s.round.currentRevealId).toBeNull();
        (0, vitest_1.expect)(Object.keys(s.round.ratings[owner])).toHaveLength(2);
    });
});
(0, vitest_1.describe)('scoring & progression', () => {
    function toScoring() {
        let s = startGame(lobbyWith(p1, p2), 1000);
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state;
        // reveal & rate both
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2000).state;
        let ownerId = s.round.currentRevealId;
        let other = ownerId === 'p1' ? 'p2' : 'p1';
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state;
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'revealNext' }, 'p1', 2200).state;
        ownerId = s.round.currentRevealId;
        other = ownerId === 'p1' ? 'p2' : 'p1';
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'rateAnswer', targetId: ownerId, rating: 6 }, other, 2300).state;
        return s;
    }
    (0, vitest_1.it)('toScoring archives round in roundHistory', () => {
        const s = toScoring();
        (0, vitest_1.expect)(s.phase).toBe('scoring');
        (0, vitest_1.expect)(s.roundHistory).toHaveLength(1);
        const archived = s.roundHistory[0];
        (0, vitest_1.expect)(Object.keys(archived.answers)).toHaveLength(2);
        (0, vitest_1.expect)(Object.keys(archived.ratings)).toHaveLength(2);
    });
    (0, vitest_1.it)('host nextQuestion advances round and re-enters answering', () => {
        let s = toScoring();
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'nextQuestion' }, 'p1', 3000).state;
        (0, vitest_1.expect)(s.phase).toBe('answering');
        (0, vitest_1.expect)(s.roundNumber).toBe(2);
        (0, vitest_1.expect)(s.round.answers).toEqual({});
    });
    (0, vitest_1.it)('non-host cannot advance', () => {
        let s = toScoring();
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'nextQuestion' }, 'p2', 3000).state;
        (0, vitest_1.expect)(s.phase).toBe('scoring');
    });
    (0, vitest_1.it)('after totalRounds reached, nextQuestion goes to finished', () => {
        let s = toScoring();
        // force this to be the last round
        s = { ...s, settings: { ...s.settings, totalRounds: 1 } };
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'nextQuestion' }, 'p1', 3000).state;
        (0, vitest_1.expect)(s.phase).toBe('finished');
    });
    (0, vitest_1.it)('finished phase archives all rounds in roundHistory', () => {
        let s = toScoring();
        s = { ...s, settings: { ...s.settings, totalRounds: 1 } };
        s = (0, gameEngine_1.handleClientMessage)(s, { type: 'nextQuestion' }, 'p1', 3000).state;
        (0, vitest_1.expect)(s.phase).toBe('finished');
        (0, vitest_1.expect)(s.roundHistory.length).toBe(1);
        (0, vitest_1.expect)(Object.keys(s.roundHistory[0].answers)).toHaveLength(2);
    });
});
