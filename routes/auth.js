const express = require("express");
const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();
const mongoose = require("mongoose");

const adminKey = process.env.ADMIN_KEY;
function isValidEmail(email) {
  // A very basic email validation, just for demo purposes
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPassword(password) {
  // At least one uppercase letter, one number and a minimum of 5 characters
  const regex = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
  return regex.test(password);
}
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

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
  // Email and Password Validation
  if (!isValidEmail(email)) {
    return res.status(400).send("Invalid email format.");
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .send(
        "Password should have a minimum of 5 characters, at least one uppercase letter and one number."
      );
  }

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
    // Email and Password Validation (optional for login as this is just to check if entered email is in valid format or not)
    if (!isValidEmail(email)) {
      return res.status(400).send("Invalid email format.");
    }

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

// Fetch all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});
// Create a new user
router.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  // Email Validation
  if (!isValidEmail(email)) {
    return res.status(400).send("Invalid email format.");
  }

  // Password Validation
  if (!isValidPassword(password)) {
    return res
      .status(400)
      .send(
        "Password should have a minimum of 5 characters, at least one uppercase letter and one number."
      );
  }

  // Check if user with given email already exists
  let existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("Email already exists.");
  }

  // Create a new user instance
  const user = new User({ name, email, password }); // Note: Ideally, password should be hashed before saving!

  try {
    await user.save();
    res
      .status(201)
      .json({ message: "User created successfully", userId: user.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// Fetch a specific user by its ID
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
});
// Update user
router.put("/user/:id", checkAdminKey, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send("Invalid user ID.");
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Update fields if they are provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) {
      // const hashedPassword = bcrypt.hashSync(req.body.password, 12);
      // user.password = hashedPassword;
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
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send("Invalid user ID.");
    }
    const user = await User.findByIdAndRemove(id);
    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.send({ message: "User deleted." });
  } catch (error) {
    console.error("Error detail:", error.message); // Added more detailed logging
    res.status(500).send("Server error.");
  }
});
router.delete("/secret/reset-database", checkAdminKey, async (req, res) => {
  try {
    await User.deleteMany();
    await Task.deleteMany();

    return res.status(200).json({ message: "Database Deleted" });
  } catch (error) {
    console.error("Error detail:", error.message);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
