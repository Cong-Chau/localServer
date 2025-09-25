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

// ================== API MOCK DATA ==================

// Video API
app.get("/api/video", (req, res) => {
  const videoData = {
    video:
      "https://web-assets.invideo.io/landing-pages/prod/homepage/videos/Gen3Promo.mp4",
    user: "Nguyễn Văn A",
  };
  res.json(videoData);
});

// Info API
app.get("/api/info", (req, res) => {
  const info = {
    title: "Đom Đóm - J97 | Bản tình ca dang dở giữa ánh sáng và bóng tối",
    description:
      "Đom đóm là bản hit đầy cảm xúc của J97 (Jack), mang đậm chất tự sự với hình ảnh ẩn dụ về chú đom đóm – biểu tượng của ánh sáng nhỏ bé nhưng kiên cường giữa đêm tối. Ca khúc là lời thổ lộ chân thành về một tình yêu đã qua, nơi những kỷ niệm vẫn cháy âm ỉ như ánh sáng của đom đóm giữa màn đêm lạnh lẽo.",
  };
  res.json(info);
});

// Photos API (50 items)
const photos = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Photo ${i + 1}`,
  url: `https://picsum.photos/id/${i + 1}/600/400`,
  description: `This is the description for photo ${i + 1}.`,
}));

app.get("/api/photos", (req, res) => {
  res.json(photos);
});

app.get("/api/photos/:id", (req, res) => {
  const photo = photos.find((p) => p.id === parseInt(req.params.id));
  if (photo) {
    res.json(photo);
  } else {
    res.status(404).json({ message: "Photo not found" });
  }
});

// ================== UTILITIES ==================
function logAllEndpoints(app) {
  app._router.stack.forEach(function (middleware) {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods)
        .map((m) => m.toUpperCase())
        .join(", ");
      console.log(`${methods}: ${middleware.route.path}`);
    } else if (middleware.name === "router" && middleware.handle.stack) {
      middleware.handle.stack.forEach(function (handler) {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .map((m) => m.toUpperCase())
            .join(", ");
          console.log(`${methods}: ${handler.route.path}`);
        }
      });
    }
  });
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock server đang chạy tại http://localhost:${PORT}`);
  logAllEndpoints(app);
});
