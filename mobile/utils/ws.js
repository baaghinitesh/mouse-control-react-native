import { useEffect, useRef, useState } from 'react';

export default function useWS() {
  const wsRef = useRef(null);
  const [status, setStatus] = useState('disconnected');

  const connect = ({ host, port, pin }) => {
    if (!host || !port) return;
    const url = `ws://${host}:${port}/ws`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus('connecting');
      ws.onopen = () => {
        setStatus('connected');
        if (pin && pin.length) {
          ws.send(JSON.stringify({ type: 'auth', pin }));
        }
      };
      ws.onclose = () => setStatus('disconnected');
      ws.onerror = () => setStatus('error');
      ws.onmessage = (_) => {};
    } catch (e) {
      setStatus('error');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
      setStatus('disconnected');
    }
  };

  const send = (obj) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    try { ws.send(JSON.stringify(obj)); } catch {}
  };

  useEffect(() => () => disconnect(), []);
  return { connect, disconnect, send, status };
}