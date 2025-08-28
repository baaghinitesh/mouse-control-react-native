# Remote Touchpad Server (Windows)

A tiny FastAPI WebSocket server that receives mouse commands from the mobile app and controls your Windows mouse using `pyautogui`.

## Features
- WebSocket `/ws` for real-time control
- Optional PIN auth (set via env or `.env`)
- Commands:
  - `{"type":"auth","pin":"1234"}`
  - `{"type":"mouse_move","dx":10,"dy":-6}`
  - `{"type":"mouse_click","button":"left|right|middle"}`
  - `{"type":"mouse_scroll","dx":0,"dy":-50}` (dy>0 scrolls **down**)
  - `{"type":"mouse_down","button":"left"}` and `{"type":"mouse_up","button":"left"}`

## Install (Windows)
1. Install Python 3.11+
2. In terminal (PowerShell) inside `server/` run:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
3. (Optional) Create `.env` to set a PIN:
   ```env
   PIN=1234
   HOST=0.0.0.0
   PORT=8765
   ```
4. Start server:
   ```powershell
   uvicorn main:app --host %HOST% --port %PORT%
   ```
   If you didn't set env vars, defaults are host `0.0.0.0`, port `8765`, no PIN.

> Keep the phone and PC on the same Wi‑Fi/LAN. If Windows Defender Firewall prompts, allow private network access.

## Notes
- `pyautogui` uses the active desktop session. Make sure the screen is unlocked.
- Horizontal scroll support varies by OS; this server maps `dx` to `hscroll` when available.

## start virtual environment
.\.venv\Scripts\Activate.ps1

## Run the server
uvicorn main:app --host 0.0.0.0 --port 8765

## For push

git add .
git commit -m "fix finger control"
git push