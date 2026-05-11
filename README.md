# Dreamscape

A Dixit-style storytelling card game. 3–8 players, ~10 minutes per game.

- **Frontend + Backend:** Next.js 14 (App Router) — one deploy on Vercel.
- **Real-time:** [Pusher Channels](https://pusher.com) (free Sandbox tier).
- **State:** [Vercel KV](https://vercel.com/storage/kv) (Redis, free tier). Falls back to in-memory locally.
- **Art:** Public-domain paintings from Wikimedia Commons.

## How to play

1. One player creates a room and shares the 5-letter code.
2. Each round, the **storyteller** picks a card from their hand and gives a clue (word, phrase, sound, etc.).
3. Other players pick a card from their hand that matches the clue.
4. All cards are shuffled and revealed face-up. Other players vote on which they think is the storyteller's.
5. **Scoring:**
   - If *everyone* or *no one* guesses correctly → storyteller gets 0, others get 2.
   - Otherwise → storyteller gets 3, plus each correct voter gets 3.
   - Bonus: +1 to anyone whose decoy card got votes.

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill in your Pusher credentials.
npm run dev
```

Open <http://localhost:3000> in two browser windows to test.

## Deploy to Vercel

1. **Push to GitHub.**
2. **Create a Pusher app** at <https://dashboard.pusher.com>. Note `app_id`, `key`, `secret`, `cluster`.
3. **Import to Vercel.** Add the four `PUSHER_*` env vars in Project Settings → Environment Variables.
4. **Add Vercel KV.** Project Settings → Storage → Create Database → KV. Vercel will auto-add `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
5. **Deploy.** That's it.

## Free-tier limits (more than enough for hobby use)

- **Pusher Sandbox:** 100 concurrent connections, 200K messages/day. One game ≈ 50–100 messages total.
- **Vercel Hobby:** 100GB bandwidth/month, unlimited deployments.
- **Vercel KV:** 30K commands/month, 256MB storage.

## Notes

- Game state is not persisted after the game ends; rooms auto-expire after 6 hours.
- No accounts. Player identity is a UUID stored in `localStorage`.
- If Pusher env vars are missing, the client falls back to 2-second polling.
- Card art: 40 public-domain paintings (Bosch, Friedrich, Rousseau, Magritte, etc.) loaded from Wikimedia Commons. Add more in `lib/cards.ts` and bump `CARD_COUNT` in `lib/cards-meta.ts`.
