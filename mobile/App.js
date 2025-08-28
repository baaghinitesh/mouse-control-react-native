import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Touchpad from "./components/Touchpad";
import useWS from "./utils/ws";

export default function App() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("8765");
  const [pin, setPin] = useState("");
  const [sens, setSens] = useState(1.0);
  const { send, status, connect, disconnect } = useWS();

  const connectNow = () => connect({ host, port: Number(port), pin });
  const isConnected = status === "connected";

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Remote Touchpad</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Host</Text>
          <TextInput
            placeholder="192.168.1.12"
            placeholderTextColor="#7c8aa0"
            style={styles.input}
            value={host}
            onChangeText={setHost}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Port</Text>
          <TextInput
            placeholder="8765"
            placeholderTextColor="#7c8aa0"
            style={styles.input}
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>PIN</Text>
          <TextInput
            placeholder="Optional"
            placeholderTextColor="#7c8aa0"
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            secureTextEntry
          />
        </View>
        <View style={styles.actions}>
          {!isConnected ? (
            <Pressable
              onPress={connectNow}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnText}>Connect</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={disconnect}
              style={[styles.btn, styles.btnDanger]}
            >
              <Text style={styles.btnText}>Disconnect</Text>
            </Pressable>
          )}
          <Text style={[styles.status, isConnected && { color: "#35c27c" }]}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.smallBtn}
          onPressIn={() => send({ type: "mouse_down", button: "left" })}
          onPressOut={() => send({ type: "mouse_up", button: "left" })}
        >
          <Text>Left</Text>
        </Pressable>

        <Pressable
          style={styles.smallBtn}
          onPressIn={() => send({ type: "mouse_down", button: "right" })}
          onPressOut={() => send({ type: "mouse_up", button: "right" })}
        >
          <Text>Right</Text>
        </Pressable>

        <Pressable
          style={styles.smallBtn}
          onPressIn={() => send({ type: "mouse_down", button: "middle" })}
          onPressOut={() => send({ type: "mouse_up", button: "middle" })}
        >
          <Text>Middle</Text>
        </Pressable>
      </View>

      <View style={styles.padWrap}>
        <Touchpad
          onMove={(dx, dy) =>
            send({
              type: "mouse_move",
              dx: Math.round(dx * sens),
              dy: Math.round(dy * sens),
            })
          }
          onLeftClick={() => send({ type: "click", button: "left" })} // ✅ add this
          onRightClick={() => send({ type: "click", button: "right" })}
          onScroll={(dx, dy) =>
            send({
              type: "mouse_scroll",
              dx: Math.round(dx),
              dy: Math.round(dy),
            })
          }
          onDragStart={() => send({ type: "mouse_down", button: "left" })}
          onDragMove={(dx, dy) =>
            send({
              type: "dragMove",
              dx: Math.round(dx * sens),
              dy: Math.round(dy * sens),
            })
          }
          onDragEnd={() => send({ type: "mouse_up", button: "left" })}
        />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: "#9fb4cc" }}>
          Tip: double‑tap & hold to drag; two‑finger drag to scroll.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0b0f14" },
  header: {
    padding: 12,
    backgroundColor: "#131a22",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2b3a",
  },
  title: { color: "#e6eef8", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  label: { width: 60, color: "#9fb4cc" },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#0f1720",
    color: "#e6eef8",
    borderWidth: 1,
    borderColor: "#233140",
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnPrimary: { backgroundColor: "#4da3ff" },
  btnDanger: { backgroundColor: "#ff6b6b" },
  btnText: { color: "#0b0f14", fontWeight: "700" },
  status: { marginLeft: 10, color: "#ff6b6b" },
  controls: {
    padding: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-around",
  },
  smallBtn: {
    backgroundColor: "#0f1720",
    borderColor: "#243243",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  padWrap: { flex: 1, padding: 10 },
  footer: { padding: 10, alignItems: "center" },
});
