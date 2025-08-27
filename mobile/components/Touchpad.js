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

  // Pan gesture
  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(() => {
      moved.current = false;
    })
    .onUpdate((g) => {
      moved.current = true;
      const dx = g.changeX * sensitivity;
      const dy = g.changeY * sensitivity;

      if (!enabled) return;

      if (dragging) {
        onMove && onMove(dx, dy);
        onDragStart && onDragStart();
      } else if (g.numberOfPointers === 1) {
        onMove && onMove(dx, dy);
      } else if (g.numberOfPointers === 2) {
        onScroll && onScroll(dx, dy);
      }
    })
    .onEnd(() => {
      if (!moved.current && !dragging) {
        onLeftClick && onLeftClick();
      }
      if (dragging) {
        setDragging(false);
        onDragEnd && onDragEnd();
      }
    });

  // Long press for drag
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
        <View style={[styles.pad, dragging && styles.dragging]}>
          <Text style={styles.hint}>
            Single finger = move • Tap = left click • Long press = drag • Two-finger drag = scroll
          </Text>
        </View>
      </GestureDetector>

      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={onLeftClick}>
          <Text style={styles.buttonText}>Left Click</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onRightClick}>
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
