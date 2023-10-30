const express = require("express");
const jwt = require("jsonwebtoken");
const Task = require("../models/Task");
require("dotenv").config();
const mongoose = require("mongoose");

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
// Middleware pour vérifier le JWT
router.use((req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).send("Access denied.");

  const token = authHeader.replace("Bearer ", "");

  //   const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) return res.status(401).send("Access denied.");

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch {
    res.status(401).send("Access denied.");
  }
});

// Obtenir toutes les tâches de l'utilisateur
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user_id: req.user.id }).sort({
      created_at: -1,
    });
    res.status(200).send(tasks);
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error get all tasks >",
      err
    );
    res.status(500).send("Server error.");
  }
});

// Fetch completed tasks of the user
router.get("/completed", async (req, res) => {
  try {
    const tasks = await Task.find({
      user_id: req.user.id,
      completed: true,
    }).sort({ created_at: -1 });
    if (tasks[0] && tasks[0].user_id.toString() !== req.user.id)
      return res.status(401).send("Access denied.");

    res.status(200).send(tasks);
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error post task >",
      err
    );
    res.status(500).send("Server error.");
  }
});

// Fetch pending (or uncompleted) tasks of the user
router.get("/pending", async (req, res) => {
  try {
    const tasks = await Task.find({
      user_id: req.user.id,
      completed: false,
    }).sort({ created_at: -1 });

    if (tasks[0] && tasks[0].user_id.toString() !== req.user.id)
      return res.status(401).send("Access denied.");

    res.status(200).send(tasks);
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error post task >",
      err
    );
    res.status(500).send("Server error.");
  }
});

// Ajouter une tâche
router.post("/", async (req, res) => {
  if (!req.body.body)
    return res.status(400).send("Task body & completed status is required.");
  try {
    const task = new Task({
      ...req.body,
      user_id: req.user.id,
    });
    await task.save();
    res.status(200).send(task);
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error post task >",
      err
    );
    res.status(500).send("Server error.");
  }
});

// Get a single task by its ID
router.use("/:id", async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid task ID.");
  }
  next();
});
router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id) return res.status(404).send("Task not found.");
    const task = await Task.findById(req.params.id);
    // Task.findById(req.params.id).then((task) => {
    //   if (!task) {
    //     return res.status(404).send("Task not found");
    //   }
    //   res.status(200).send(task);
    // });
    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(401).send("Access denied.");

    res.status(200).send(task);
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error get task >",
      err
    );
    res.status(500).send("Server error.");
  }
});

// Modifier une tâche
router.put("/:id", async (req, res) => {
  if (!req.body.body || !req.body.completed)
    return res.status(400).send("Task body & completed status is required.");
  try {
    const updatedFields = { ...req.body, updated_at: Date.now() };

    if (!req.params.id) return res.status(404).send("Task not found.");

    const task = await Task.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true, // This option returns the modified document rather than the original
      runValidators: true, // This option ensures all model validators run on the update
    });

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(401).send("Access denied.");

    res.status(200).send(task);
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error update task >",
      err
    );
    res.status(500).send("Server error.");
  }
});

// Supprimer une tâche
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(401).send("Access denied.");

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: "Task deleted." });
  } catch (err) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routes\tasks.js > error delete task >",
      err
    );
    res.status(500).send("Server error.");
  }
});

module.exports = router;
