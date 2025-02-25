




import { useParams, useNavigate } from "react-router-dom";
import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { Container, Paper, Box, Button, Typography } from "@mui/material";

const socket = io("https://webcall-scfp.onrender.com");

// const socket = io("http://192.168.1.9:7001");



const VideoCall = () => {
  const { roomId, username } = useParams();
  const userName =username;
  const ROOM_ID = roomId;
  console.log(ROOM_ID,userName,'check');
  

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const iceCandidatesQueue = useRef([]);

  useEffect(() => {
    socket.on("user-joined", (data) => {
      console.log(`${data.name} joined the room`);
    });

    socket.on("offer", async ({ offer }) => {
      if (!offer || !peerConnection.current || peerConnection.current.signalingState !== "stable") return;
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        while (iceCandidatesQueue.current.length) {
          const candidate = iceCandidatesQueue.current.shift();
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
        if (peerConnection.current.signalingState === "have-remote-offer") {
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", { roomId: ROOM_ID, answer });
        }
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.on("answer", async ({ answer }) => {
      if (!answer || !peerConnection.current || peerConnection.current.signalingState !== "have-local-offer") return;
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("Error setting remote answer:", error);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!candidate || !peerConnection.current) return;
      if (peerConnection.current.remoteDescription) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    });

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  useEffect(() => {
    socket.emit("join-room", { roomId: ROOM_ID, userName });
    setupWebRTC();
  }, []);
  

  const setupWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      localVideoRef.current.srcObject = stream;
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "turn:your.turn.server", username: "user", credential: "pass" }
        ]
      });
      stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId: ROOM_ID, candidate: event.candidate });
        }
      };
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const createOffer = async () => {
    if (!peerConnection.current) return;
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", { roomId: ROOM_ID, offer });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Video Call Room
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "48%", borderRadius: "8px", background: "black", height: "50vh", }}></video>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "48%", borderRadius: "8px", background: "black" , height: "50vh",}}></video>
        </Box>
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={createOffer}>
          Start Call
        </Button>
      </Paper>
    </Container>
  );
};

export default VideoCall;
