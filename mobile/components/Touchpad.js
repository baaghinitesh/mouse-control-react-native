import React, { useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { GestureHandlerRootView, GestureDetector, Gesture } from "react-native-gesture-handler";

export default function Touchpad({ socket }) {
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Pan gesture for finger movement
  const pan = Gesture.Pan()
    .onStart((e) => {
      lastX.current = e.x;
      lastY.current = e.y;
    })
    .onUpdate((e) => {
      const dx = e.x - lastX.current;
      const dy = e.y - lastY.current;

      lastX.current = e.x;
      lastY.current = e.y;

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "move", dx, dy }));
      }
    });

  // Left click
  const handleLeftClick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "click", button: "left" }));
    }
  };

  // Right click
  const handleRightClick = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "click", button: "right" }));
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Touchpad Area */}
        <GestureDetector gesture={pan}>
          <View style={styles.touchArea}>
            <Text style={{ color: "#aaa" }}>Move your finger here</Text>
          </View>
        </GestureDetector>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={handleLeftClick}>
            <Text style={styles.buttonText}>Left Click</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleRightClick}>
            <Text style={styles.buttonText}>Right Click</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 20,
  },
  touchArea: {
    width: "100%",
    height: "70%",
    backgroundColor: "#222",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: "#444",
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
