const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

const router = express.Router();
const USER_FILE = path.join(__dirname, "../users.json");

// Helper function to read from users JSON file
function readUsersFromFile() {
  try {
    if (!fs.existsSync(USER_FILE)) {
      fs.writeFileSync(USER_FILE, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(USER_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users from file:", err);
    return [];
  }
}

// Helper function to write to users JSON file
function writeUsersToFile(users) {
  try {
    fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing users to file:", err);
  }
}

// SIGNUP ROUTE
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        email,
        password: hashedPassword,
      });

      await user.save();
      res.status(201).json({ message: "User registered successfully" });
    } else {
      const users = readUsersFromFile();
      const userExists = users.find(u => u.email === email);
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        name,
        email,
        password: hashedPassword
      };
      users.push(newUser);
      writeUsersToFile(users);
      res.status(201).json({ message: "User registered successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      res.status(200).json({
        message: "Login successful",
        userId: user._id,
        name: user.name
      });
    } else {
      const users = readUsersFromFile();
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      res.status(200).json({
        message: "Login successful",
        userId: user._id,
        name: user.name
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

