const express = require("express");
const jwt = require("jsonwebtoken");
const Task = require("../models/Task");
require("dotenv").config();

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;

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
    res.status(400).send("Invalid token.");
  }
});

// Obtenir toutes les tâches de l'utilisateur
router.get("/", async (req, res) => {
  const tasks = await Task.find({ user_id: req.user.id }).sort({
    created_at: -1,
  });
  res.send(tasks);
});

// Ajouter une tâche
router.post("/", async (req, res) => {
  const task = new Task({
    ...req.body,
    user_id: req.user.id,
  });
  await task.save();
  res.send(task);
});

// Get a single task by its ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(403).send("Access denied.");

    res.send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Modifier une tâche
router.put("/:id", async (req, res) => {
  try {
    const updatedFields = { ...req.body, updated_at: Date.now() };

    const task = await Task.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true, // This option returns the modified document rather than the original
      runValidators: true, // This option ensures all model validators run on the update
    });

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(403).send("Access denied.");

    res.send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Supprimer une tâche
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(403).send("Access denied.");

    await Task.findByIdAndDelete(req.params.id);
    res.send({ message: "Task deleted." });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
