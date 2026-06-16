# Sipadi Deployment

## Local

```bash
python3.11 -m venv .venv-simulator
.venv-simulator/bin/pip install -r ai/simulator/requirements.txt

# Terminal 1
PROJECT_ROOT="$PWD" PYTHONPATH=ai .venv-simulator/bin/uvicorn simulator.app.main:app --port 8000

# Terminal 2
export GOOGLE_GENERATIVE_AI_API_KEY="your-rotated-server-key"
export SIMULATOR_URL="http://127.0.0.1:8000"
cd app
npm ci
npm run build
PORT=3000 npm run start
```

The main dashboard is at `/`; the agentic AI insight workspace is at `/ai`.
The `/ai` page starts as a centered chatbot. After the first message, the composer moves to the bottom center and evidence figures render inside the assistant message above the text.
The Next.js web app lives in `app/`; the FastAPI simulator and AI artifacts live in `ai/`.

## Docker Compose

```bash
export GOOGLE_GENERATIVE_AI_API_KEY="your-rotated-server-key"
docker compose up --build -d
docker compose ps
```

The simulator is internal to the Compose network. Only the Next.js service is published.

## Security

- Keep the Gemini key server-side as `GOOGLE_GENERATIVE_AI_API_KEY`.
- Never use a `NEXT_PUBLIC_*` name for the key.
- Rotate any key pasted into chat, logs, screenshots, or shell history before production use.
- The chat route limits input length, conversation context, execution time, and requests per client.

The AI agent uses `gemini-3.1-flash-lite` at temperature `0.8`. All numeric claims are obtained through Zod-validated tools backed by the FastAPI simulator. Final dashboard priority scores use the LHS-enhanced priority outputs.
