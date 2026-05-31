const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Todo = require("../models/Todo");

const TODO_FILE = path.join(__dirname, "../todos.json");

// Helper function to read from JSON file
function readTodosFromFile() {
  try {
    if (!fs.existsSync(TODO_FILE)) {
      fs.writeFileSync(TODO_FILE, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(TODO_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading todos from file:", err);
    return [];
  }
}

// Helper function to write to JSON file
function writeTodosToFile(todos) {
  try {
    fs.writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2));
  } catch (err) {
    console.error("Error writing todos to file:", err);
  }
}

// ================= GET TASKS =================
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (mongoose.connection.readyState === 1) {
      const filter = userId ? { user: userId } : {};
      const todos = await Todo.find(filter).sort({ createdAt: -1 });
      res.json(todos);
    } else {
      const todos = readTodosFromFile();
      const filtered = userId ? todos.filter(t => t.user === userId) : todos;
      // Sort by createdAt descending (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(filtered);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// ================= ADD TASK =================
router.post("/", async (req, res) => {
  try {
    const { text, dueDate, priority, userId } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Task text required" });
    }

    if (mongoose.connection.readyState === 1) {
      const todo = new Todo({
        text,
        dueDate,
        priority: priority || "Medium",
        completed: false,
        user: userId || null
      });
      await todo.save();
      res.status(201).json(todo);
    } else {
      const todos = readTodosFromFile();
      const newTodo = {
        _id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        text,
        dueDate: dueDate || null,
        priority: priority || "Medium",
        completed: false,
        user: userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      todos.push(newTodo);
      writeTodosToFile(todos);
      res.status(201).json(newTodo);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add task" });
  }
});

// ================= TOGGLE =================
router.put("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const todo = await Todo.findById(req.params.id);
      if (!todo) return res.status(404).json({ message: "Not found" });

      todo.completed = !todo.completed;
      await todo.save();
      res.json(todo);
    } else {
      const todos = readTodosFromFile();
      const index = todos.findIndex(t => t._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: "Not found" });

      todos[index].completed = !todos[index].completed;
      todos[index].updatedAt = new Date().toISOString();
      writeTodosToFile(todos);
      res.json(todos[index]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Todo.findByIdAndDelete(req.params.id);
      res.json({ message: "Deleted" });
    } else {
      const todos = readTodosFromFile();
      const filtered = todos.filter(t => t._id !== req.params.id);
      writeTodosToFile(filtered);
      res.json({ message: "Deleted" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
