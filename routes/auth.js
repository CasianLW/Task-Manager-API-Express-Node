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
    return res.status(401).send("Access denied. Invalid admin key.");
  }
  next();
}
// Inscription
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(422).send("Missing Required Information");
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
  if (user) return res.status(409).send("Email already exists.");
  //   const salt = bcrypt.genSaltSync(12);
  //   const hashedPassword = bcrypt.hashSync(password, salt);
  //   user = new User({ name, email, password: hashedPassword });
  try {
    user = new User({ name, email, password });
    //   user.password = bcrypt.hashSync(password, salt);

    await user.save();

    // Génération du token JWT
    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: "1h",
    });
    res.status(200).send({ token, userId: user.id });
  } catch (error) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error register >",
      error
    );

    res.status(500).send("Server error.");
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Email and Password Validation (optional for login as this is just to check if entered email is in valid format or not)
    if (!email || !password)
      return res.status(422).send("Missing Required Information");
    if (!isValidEmail(email)) {
      return res.status(400).send("Invalid email or password.");
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password.");
    // if (!user) return res.status(400).send("Invalid email or password.");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).send("Invalid email or password.");

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: "1h",
    });
    res.status(200).send({ token, userId: user.id });
  } catch (error) {
    console.error(error);
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error login >",
      error
    );
    res.status(500).send("Server error.");
  }
});

// Fetch all users
router.get("/users", checkAdminKey, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error get all users >",
      error
    );
    res.status(500).json("Error fetching users.");
  }
});

// Fetch a specific user by its ID
router.get("/users/:id", checkAdminKey, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid user ID.");
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json("User not found");
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error get specific user >",
      error
    );
    res.status(500).json("Error fetching user");
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
    res.status(200).send(user);
  } catch (error) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error update user >",
      error
    );
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
    res.status(200).send("User deleted.");
  } catch (error) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error delete >",
      error
    );
    res.status(500).send("Server error.");
  }
});
router.delete("/secret/reset-database", checkAdminKey, async (req, res) => {
  try {
    await User.deleteMany();
    await Task.deleteMany();

    return res.status(200).json("Database Reseted");
  } catch (error) {
    console.error("---");
    console.error(
      new Date().toISOString(),
      "routesauth.js > error secret/reset-database >",
      error
    );
    res.status(500).send("Server error.");
  }
});

module.exports = router;
