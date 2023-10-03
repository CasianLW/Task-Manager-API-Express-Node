const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();

const adminKey = process.env.ADMIN_KEY;

// Middleware to check admin key
function checkAdminKey(req, res, next) {
  const providedKey = req.header("Admin-Key");
  if (providedKey !== adminKey) {
    return res.status(403).send("Access denied. Invalid admin key.");
  }
  next();
}
// Inscription
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Vérification si l'utilisateur existe déjà
  let user = await User.findOne({ email });
  if (user) return res.status(400).send("Email already exists.");
  //   const salt = bcrypt.genSaltSync(12);
  //   const hashedPassword = bcrypt.hashSync(password, salt);
  //   user = new User({ name, email, password: hashedPassword });
  user = new User({ name, email, password });
  //   user.password = bcrypt.hashSync(password, salt);

  await user.save();

  // Génération du token JWT
  const token = jwt.sign({ id: user.id }, jwtSecret, {
    expiresIn: "1h",
  });
  res.send({ token, userId: user.id });
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password.");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).send("Invalid email or password.");

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: "1h",
    });
    res.send({ token, userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

// Update user
router.put("/user/:id", checkAdminKey, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Update fields if they are provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) {
      const hashedPassword = bcrypt.hashSync(req.body.password, 12);
      user.password = hashedPassword;
    }

    await user.save();
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

// Delete user
router.delete("/user/:id", checkAdminKey, async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);
    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.send({ message: "User deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
