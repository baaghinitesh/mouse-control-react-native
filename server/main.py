import os
import json
import mouse
import asyncio
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import logging

# Try faster "mouse" lib if available, else fallback to pyautogui
try:
    import mouse  # pip install mouse
    USE_MOUSE_LIB = True
except ImportError:
    import pyautogui
    pyautogui.FAILSAFE = False
    USE_MOUSE_LIB = False

# ---- config / env ----
load_dotenv()
PIN = os.getenv("PIN", "").strip()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8765"))

# multiplier for move/drag deltas
MOVE_MULT = float(os.getenv("MOVE_MULT", "1.0"))

# ---- logging ----
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("remote-touchpad-server")

# ---- FastAPI app ----
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---- Mouse actions ----
async def run_move_rel(dx: int, dy: int):
    try:
        if USE_MOUSE_LIB:
            await asyncio.to_thread(mouse.move, dx, dy, absolute=False)
        else:
            await asyncio.to_thread(pyautogui.moveRel, dx, dy, duration=0)
    except Exception as e:
        log.exception("moveRel error: %s", e)


async def run_click(button: str = "left"):
    try:
        if USE_MOUSE_LIB:
            await asyncio.to_thread(mouse.click, button=button)
        else:
            await asyncio.to_thread(pyautogui.click, button=button)
    except Exception as e:
        log.exception("click error: %s", e)


async def run_mouse_down(button: str = "left"):
    try:
        if USE_MOUSE_LIB:
            await asyncio.to_thread(mouse.press, button=button)
        else:
            await asyncio.to_thread(pyautogui.mouseDown, button=button)
    except Exception as e:
        log.exception("mouseDown error: %s", e)


async def run_mouse_up(button: str = "left"):
    try:
        if USE_MOUSE_LIB:
            await asyncio.to_thread(mouse.release, button=button)
        else:
            await asyncio.to_thread(pyautogui.mouseUp, button=button)
    except Exception as e:
        log.exception("mouseUp error: %s", e)


async def run_scroll(dx: int = 0, dy: int = 0):
    try:
        if USE_MOUSE_LIB:
            if dy:
                await asyncio.to_thread(mouse.wheel, -dy)
        else:
            if dy:
                await asyncio.to_thread(pyautogui.scroll, int(-dy))
            if dx:
                try:
                    await asyncio.to_thread(pyautogui.hscroll, int(-dx))
                except Exception:
                    pass
    except Exception as e:
        log.exception("scroll error: %s", e)


def get_int(data, *keys, default=0):
    for k in keys:
        if k in data:
            try:
                return int(round(float(data[k])))
            except Exception:
                try:
                    return int(data[k])
                except Exception:
                    return default
    return default


# ---- WebSocket endpoint ----
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    authed = False if PIN else True
    try:
        while True:
            raw = await ws.receive_text()
            if not raw:
                continue
            try:
                data = json.loads(raw)
            except Exception:
                continue

            t = data.get("type", "") or data.get("action", "")
            if not authed:
                if t == "auth" and str(data.get("pin", "")) == PIN:
                    authed = True
                    await ws.send_text(json.dumps({"ok": True, "msg": "authed"}))
                else:
                    await ws.send_text(json.dumps({"ok": False, "msg": "need auth"}))
                continue

            # --- Handle mouse actions ---
            if t in ("move", "mouse_move"):
                dx = get_int(data, "dx", "deltaX", "delta_x")
                dy = get_int(data, "dy", "deltaY", "delta_y")
                dx = int(dx * MOVE_MULT)
                dy = int(dy * MOVE_MULT)
                await run_move_rel(dx, dy)

            elif t in ("click", "leftClick", "rightClick", "middleClick", "tap"):
                raw_button = str(data.get("button", "")).lower()
                if not raw_button:  # if no "button" provided, infer from type
                    if t == "rightClick":
                        raw_button = "right"
                    elif t == "middleClick":
                        raw_button = "middle"
                    else:
                        raw_button = "left"
                await run_click(raw_button)

            elif t in ("scroll", "mouse_scroll"):
                dx = get_int(data, "dx")
                dy = get_int(data, "dy")
                await run_scroll(dx, dy)

            elif t in ("dragStart", "mouse_down", "mouseDown"):
                button = str(data.get("button", "left")).lower()
                await run_mouse_down(button)

            elif t in ("dragMove",):
                dx = get_int(data, "dx")
                dy = get_int(data, "dy")
                dx = int(dx * MOVE_MULT)
                dy = int(dy * MOVE_MULT)
                await run_move_rel(dx, dy)

            elif t in ("dragEnd", "mouse_up", "mouseUp"):
                button = str(data.get("button", "left")).lower()
                await run_mouse_up(button)

            else:
                try:
                    await ws.send_text(json.dumps({"ok": True, "echo": True, "received": t}))
                except Exception:
                    pass

    except WebSocketDisconnect:
        log.info("WebSocket disconnected")
    except Exception as e:
        log.exception("WebSocket error: %s", e)
        try:
            await ws.close()
        except Exception:
            pass
