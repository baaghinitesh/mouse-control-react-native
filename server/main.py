# main.py
import os
import json
import asyncio
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import pyautogui
import logging

# ---- config / env ----
load_dotenv()
PIN = os.getenv("PIN", "").strip()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8765"))

# multiplier for move/drag deltas (tweak if mobile movement is too slow/fast)
MOVE_MULT = float(os.getenv("MOVE_MULT", "1.0"))

# ---- pyautogui safety / logging ----
pyautogui.FAILSAFE = False
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("remote-touchpad-server")

# ---- FastAPI app ----
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# helper wrappers to run blocking pyautogui calls off the event loop
async def run_move_rel(dx: int, dy: int):
    try:
        await asyncio.to_thread(pyautogui.moveRel, dx, dy, 0)
    except Exception as e:
        log.exception("moveRel error: %s", e)


async def run_move_to(x: int, y: int):
    try:
        await asyncio.to_thread(pyautogui.moveTo, x, y, 0)
    except Exception as e:
        log.exception("moveTo error: %s", e)


async def run_click(button: str = "left"):
    try:
        await asyncio.to_thread(pyautogui.click, None, None, 1, button)
    except Exception as e:
        log.exception("click error: %s", e)


async def run_mouse_down(button: str = "left"):
    try:
        await asyncio.to_thread(pyautogui.mouseDown, button=button)
    except Exception as e:
        log.exception("mouseDown error: %s", e)


async def run_mouse_up(button: str = "left"):
    try:
        await asyncio.to_thread(pyautogui.mouseUp, button=button)
    except Exception as e:
        log.exception("mouseUp error: %s", e)


async def run_scroll(dx: int = 0, dy: int = 0):
    try:
        # pyautogui.scroll uses vertical units: positive->up, negative->down
        if dy:
            await asyncio.to_thread(pyautogui.scroll, int(-dy))
        # try horizontal scroll if supported
        if dx:
            try:
                await asyncio.to_thread(pyautogui.hscroll, int(-dx))
            except Exception:
                # some platforms/pyautogui versions don't support hscroll
                pass
    except Exception as e:
        log.exception("scroll error: %s", e)


# Accept lots of slightly different message keys (robust mapping)
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
                # ignore non-json messages
                continue

            # AUTH handling (support MESSAGE with type "auth" + "pin")
            t = data.get("type", "") or data.get("action", "")
            if not authed:
                if t in ("auth",) and str(data.get("pin", "")) == PIN:
                    authed = True
                    await ws.send_text(json.dumps({"ok": True, "msg": "authed"}))
                else:
                    await ws.send_text(json.dumps({"ok": False, "msg": "need auth"}))
                continue

            # Normalize possible message types
            # move variants: "move", "mouse_move"
            if t in ("move", "mouse_move"):
                dx = get_int(data, "dx", "deltaX", "delta_x", default=0)
                dy = get_int(data, "dy", "deltaY", "delta_y", default=0)
                dx = int(dx * MOVE_MULT)
                dy = int(dy * MOVE_MULT)
                # use relative movement to emulate touchpad
                await run_move_rel(dx, dy)

            # click variants
            elif t in ("leftClick", "mouse_click", "click", "tap"):
                # some clients send button field, others rely on type name
                button = data.get("button", "left")
                await run_click(button)

            elif t in ("rightClick",):
                await run_click("right")

            # scroll / mouse_scroll
            elif t in ("scroll", "mouse_scroll"):
                dx = get_int(data, "dx", default=0)
                dy = get_int(data, "dy", default=0)
                await run_scroll(dx=dx, dy=dy)

            # mouse down / drag start (press and hold)
            elif t in ("dragStart", "mouse_down", "mouseDown"):
                button = data.get("button", "left")
                await run_mouse_down(button)

            # dragMove: move while mouseDown (relative)
            elif t in ("dragMove",):
                dx = get_int(data, "dx", default=0)
                dy = get_int(data, "dy", default=0)
                dx = int(dx * MOVE_MULT)
                dy = int(dy * MOVE_MULT)
                # move relative while button is down
                await run_move_rel(dx, dy)

            # mouse up / drag end
            elif t in ("dragEnd", "mouse_up", "mouseUp"):
                button = data.get("button", "left")
                await run_mouse_up(button)

            else:
                # unknown message -> echo or ignore
                try:
                    await ws.send_text(json.dumps({"ok": True, "echo": True, "received": t}))
                except Exception:
                    pass

    except WebSocketDisconnect:
        log.info("WebSocket disconnected")
        return
    except Exception as e:
        log.exception("WebSocket error: %s", e)
        try:
            await ws.close()
        except Exception:
            pass
