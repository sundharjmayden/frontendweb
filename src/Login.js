import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username && roomId) {
      navigate(`/home/${username}/${roomId}`);
    } else {
      alert("Please enter both Username and Room ID");
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Join Room
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Room ID"
            variant="outlined"
            fullWidth
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Join
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
