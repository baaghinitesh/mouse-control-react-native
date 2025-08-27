// mobile/components/Touchpad.js
import React, { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export default function Touchpad({
  enabled = true,
  onMove,
  onScroll,
  onLeftClick,
  onRightClick,
  onDragStart,
  onDragEnd,
}) {
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  const sensitivity = 1.5;

  // Track the previous translation to compute per-frame deltas
  const prevTX = useRef(0);
  const prevTY = useRef(0);

  const resetTranslations = () => {
    prevTX.current = 0;
    prevTY.current = 0;
  };

  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(() => {
      moved.current = false;
      resetTranslations();
    })
    .onUpdate((g) => {
      if (!enabled) return;

      moved.current = true;

      // Compute incremental deltas from cumulative translation
      const dx = (g.translationX - prevTX.current) * sensitivity;
      const dy = (g.translationY - prevTY.current) * sensitivity;

      // update prev for next frame
      prevTX.current = g.translationX;
      prevTY.current = g.translationY;

      if (dragging) {
        // During drag we still send movement (mouse button is already down)
        onMove && onMove(dx, dy);
        // DO NOT call onDragStart here (it should only fire once on long-press)
      } else if (g.numberOfPointers === 1) {
        onMove && onMove(dx, dy);
      } else if (g.numberOfPointers >= 2) {
        onScroll && onScroll(dx, dy);
      }
    })
    .onEnd(() => {
      if (!enabled) return;

      // Tap with no movement -> left click
      if (!moved.current && !dragging) {
        onLeftClick && onLeftClick();
      }

      // If we were dragging, end drag
      if (dragging) {
        setDragging(false);
        onDragEnd && onDragEnd();
      }

      resetTranslations();
    })
    .onFinalize(() => {
      // Safety reset on cancellation
      resetTranslations();
    });

  const longPress = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      if (!enabled) return;
      setDragging(true);
      onDragStart && onDragStart();
    })
    .onEnd(() => {
      if (!enabled) return;
      setDragging(false);
      onDragEnd && onDragEnd();
    });

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={Gesture.Exclusive(pan, longPress)}>
        <View style={[styles.pad, dragging && styles.dragging, !enabled && styles.disabled]}>
          <Text style={styles.hint}>
            Single finger = move • Tap = left click • Long press = drag • Two-finger drag = scroll
          </Text>
        </View>
      </GestureDetector>

      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={onLeftClick} disabled={!enabled}>
          <Text style={styles.buttonText}>Left Click</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onRightClick} disabled={!enabled}>
          <Text style={styles.buttonText}>Right Click</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  dragging: {
    borderColor: "#4ade80",
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  hint: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    height: 80,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#444",
    marginHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
