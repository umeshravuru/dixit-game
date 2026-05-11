export type Phase = 'lobby' | 'clue' | 'submit' | 'vote' | 'reveal' | 'ended';

export interface Player {
  id: string;
  name: string;
  score: number;
  hand: number[]; // card ids
  isHost: boolean;
  connected: boolean;
}

export interface Submission {
  playerId: string;
  cardId: number;
}

export interface Vote {
  voterId: string;
  cardId: number;
}

export interface RoundResult {
  storytellerId: string;
  storytellerCardId: number;
  clue: string;
  submissions: Submission[];
  votes: Vote[];
  scoreDelta: Record<string, number>;
}

export interface GameState {
  code: string;
  phase: Phase;
  players: Player[];
  storytellerIndex: number;
  clue: string | null;
  storytellerCardId: number | null;
  submissions: Submission[]; // others' submitted cards
  shuffledCards: number[]; // storyteller + submissions, shuffled (for voting)
  votes: Vote[];
  deck: number[]; // remaining cards
  round: number;
  maxRounds: number;
  lastResult: RoundResult | null;
  createdAt: number;
}

export const HAND_SIZE = 6;
export const WIN_SCORE = 30;
