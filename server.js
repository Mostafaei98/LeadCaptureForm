const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const xlsx = require("xlsx");
const PORT = process.env.PORT || 3006;
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "signin.html"));
});

app.post("/save", (req, res) => {
  const { mobile, email, instagram, telegram } = req.body;

  // بررسی اینکه حداقل یکی از موبایل یا ایمیل پر شده باشد
  if (!mobile && !email && !instagram && !telegram) {
    return res
      .status(400)
      .json({ success: false, message: "One of the fields must be filled" });
  }

  const dataToSave = [
    {
      mobile: mobile || "",
      email: email || "",
      instagram: instagram || "",
      telegram: telegram || "",
    },
  ];

  const filePath = path.join(__dirname, "data.xlsx");
  let existingData = [];

  try {
    if (fs.existsSync(filePath)) {
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets["Data"];
      existingData = xlsx.utils.sheet_to_json(worksheet);
    }

    const updatedData = existingData.concat(dataToSave);

    const worksheet = xlsx.utils.json_to_sheet(updatedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");

    xlsx.writeFile(workbook, filePath);

    res.json({ success: true, message: "Data saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving data" });
  }
});


app.post("/signin", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.USER_NAME && password === process.env.PASSWORD) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ success: true, message: "Login successful", token });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

const authenticateToken = (req, res, next) => {
  const headers = req.headers;
  const authorization = headers["authorization"];
  if (!authorization) {
    return res
      .status(403)
      .json({ success: false, message: "Token is required" });
  }
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid token format" });
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

app.get("/authentication", authenticateToken, (req, res) => {
  return res.status(403).json({ success: true, message: "Token is Valid" });
});

app.get("/download-excel", (req, res) => {
  const filePath = path.join(__dirname, "data.xlsx");
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("File not found");
    }
    res.download(filePath, "data.xlsx", (err) => {
    });
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
