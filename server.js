const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

const JWT_SECRET = "my_mock_secret_key"; // chỉ dùng mock test

// In-memory user storage
let users = [
  {
    username: "user1",
    password: "password123",
    name: "Nguyễn Văn A",
  },
  {
    username: "user2",
    password: "password456",
    name: "Trần Thị B",
  },
  {
    username: "user3",
    password: "password789",
    name: "Lê Văn C",
  },
];

let googleUsers = []; // user đăng nhập bằng Google

// Register endpoint
app.post("/api/register", (req, res) => {
  try {
    const { username, password, name } = req.body;
    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
      return res.status(400).json({ message: "Tên tài khoản đã tồn tại" });
    }

    const user = { username, password, name };
    users.push(user);

    res.status(201).json({
      message: "Đăng ký thành công",
      user: { username, name },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Login endpoint
app.post("/api/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(
      (user) => user.username === username && user.password === password
    );
    if (!user) {
      return res
        .status(400)
        .json({ message: "Tên tài khoản hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: { username: user.username, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 🔐 Google Login endpoint
app.post("/api/auth/google", (req, res) => {
  try {
    const { accessToken, profile } = req.body;

    if (!accessToken || !profile) {
      return res
        .status(400)
        .json({ message: "Thiếu accessToken hoặc profile từ Google" });
    }

    const googleId = profile.sub;

    let user = googleUsers.find((u) => u.googleId === googleId);

    if (!user) {
      user = {
        googleId,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        lastLogin: new Date().toISOString(),
      };
      googleUsers.push(user);
    } else {
      user.lastLogin = new Date().toISOString();
    }

    const token = jwt.sign(
      {
        googleId: user.googleId,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Đăng nhập Google thành công",
      token,
      user,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock server đang chạy tại http://localhost:${PORT}`);
});
