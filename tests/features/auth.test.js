require("dotenv").config();
const request = require("supertest");
const express = require("express");
const app = express();
const adminKey = process.env.ADMIN_KEY;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
// Connection à MongoDB
mongoose.connect(
  `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_NAME}?retryWrites=true&w=majority`,
  {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  }
);

const appUrl = process.env.APP_URL || "http://localhost:3000";
// const app = require("../server"); // import your express app or server
// const User = require("../models/User");

const resetDatabase = require("../../routes/handlers.js");

describe("Authentication routes", () => {
  let userId;

  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    // Use the admin endpoint to delete the user
    if (userId) {
      await request(appUrl)
        .delete(`/user/${userId}`)
        .set("Admin-Key", adminKey)
        .send();
    }
  });

  test("Register with invalid email format", async () => {
    const response = await request(appUrl).post("/register").send({
      name: "Test User",
      email: "invalidEmailFormat",
      password: "Password123",
    });

    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid email format.");
  });
  test("Register with invalid password", async () => {
    const response = await request(appUrl).post("/register").send({
      name: "Test User",
      email: "validemail@example.com",
      password: "pass", // Less than 5 characters
    });

    expect(response.status).toBe(400);
    expect(response.text).toBe(
      "Password should have a minimum of 5 characters, at least one uppercase letter and one number."
    );
  });
  test("Register a new user", async () => {
    const response = await request(appUrl).post("/register").send({
      // const response = await request(app).post("/register").send({
      name: "Test User",
      email: "authTestUser1@example.com",
      password: "Password123",
    });
    userId = response.body.userId || null;

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.userId).toBeDefined();
  });
  test("User already exists", async () => {
    const response = await request(appUrl).post("/register").send({
      // const response = await request(app).post("/register").send({
      name: "Test User",
      email: "authTestUser1@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(400);
  });

  test("Login with invalid email format", async () => {
    const response = await request(appUrl).post("/login").send({
      email: "invalidEmailFormat",
      password: "Password123",
    });

    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid email format.");
  });

  test("Login with valid credentials", async () => {
    // const response = await request(app)
    const response = await request(appUrl).post("/login").send({
      email: "authTestUser1@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.userId).toBeDefined();
  });
  test("Login with valid invalid credentials", async () => {
    // const response = await request(app)
    const response = await request(appUrl).post("/login").send({
      email: "authTestUser1@example.com",
      password: "password123NOTVALID",
    });

    expect(response.status).toBe(400);
  });
});

describe("User management routes", () => {
  let userId;
  const testUser = {
    name: "userTestAdminCrud",
    email: "userTestAdminCrud@example.com",
    password: "Password123",
  };
  const updatedName = "Updated Test User";

  // Create a test user before running tests
  beforeAll(async () => {
    const response = await request(appUrl).post("/register").send(testUser);
    userId = response.body.userId || null;
  });

  // Clean up after tests: delete the test user
  afterAll(async () => {
    if (userId) {
      await request(appUrl)
        .delete(`/user/${userId}`)
        .set("Admin-Key", adminKey)
        .send();
    }
  });

  test("Update user with valid admin key", async () => {
    const response = await request(appUrl)
      .put(`/user/${userId}`)
      .set("Admin-Key", adminKey)
      .send({
        name: updatedName,
      });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updatedName);
  });

  test("Update user with invalid admin key", async () => {
    const response = await request(appUrl)
      .put(`/user/${userId}`)
      .set("Admin-Key", "invalidKey")
      .send({
        name: updatedName,
      });

    expect(response.status).toBe(403); // 403 for forbidden
  });

  test("Update non-existing user", async () => {
    const response = await request(appUrl)
      .put(`/user/60f4da2b3842a92fa8888888`) // Some random non-existing user id
      .set("Admin-Key", adminKey)
      .send({
        name: updatedName,
      });

    expect(response.status).toBe(404); // 404 for not found
  });

  test("Delete user with valid admin key", async () => {
    const response = await request(appUrl)
      .delete(`/user/${userId}`)
      .set("Admin-Key", adminKey)
      .send();
    if (response.status === 200) {
      userId = null;
    }
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted.");
  });

  test("Delete user with invalid admin key", async () => {
    const response = await request(appUrl)
      .delete(`/user/${userId}`)
      .set("Admin-Key", "invalidKey")
      .send();

    expect(response.status).toBe(403); // 403 for forbidden
  });

  test("Delete non-existing user", async () => {
    const response = await request(appUrl)
      .delete(`/user/60f4da2b3842a92fa8888888`) // Some random non-existing user id
      .set("Admin-Key", adminKey)
      .send();

    expect(response.status).toBe(404); // 404 for not found
  });
});

describe("Additional test cases for coverage", () => {
  let createdUserId;
  afterAll(async () => {
    // Cleanup: If we created a user during the tests, we'll delete them.
    if (createdUserId) {
      await request(appUrl).delete(`/users/${createdUserId}`);
    }
  });
  test("Fetch all users", async () => {
    const response = await request(appUrl).get("/users");
    expect(response.status).toBe(200);
  });

  test("Create user with invalid data", async () => {
    const response = await request(appUrl).post("/users").send({
      name: "",
      email: "invalidk",
      password: "shrt",
    });
    expect(response.status).toBe(400); // Adjust as per your validation
  });

  test("Fetch non-existing user by ID", async () => {
    const response = await request(appUrl).get(
      "/users/60f4da2b3842a92fa8888888"
    );
    expect(response.status).toBe(404);
  });

  test("Login with non-existent email", async () => {
    const response = await request(appUrl).post("/login").send({
      email: "nonexistent@example.com",
      password: "Password123",
    });
    expect(response.status).toBe(400);
  });

  test("Middleware - Access endpoint without Admin Key", async () => {
    const response = await request(appUrl).put(`/user/someId`).send({
      name: "Test",
    });
    expect(response.status).toBe(403);
  });

  test("Register without password", async () => {
    const response = await request(appUrl).post("/register").send({
      name: "Test User",
      email: "test2@example.com",
    });
    expect(response.status).toBe(400); // Adjust based on your validation
  });

  // Error case: Providing invalid ID format for getting user
  test("Fetch user with invalid ID format", async () => {
    const response = await request(appUrl).get("/users/invalidIDformat");
    expect(response.status).toBe(500);
  });

  // Error case: Try to update a user with invalid ID format
  test("Update user with invalid ID format", async () => {
    const response = await request(appUrl)
      .put("/user/invalidIDformat")
      .set("Admin-Key", adminKey)
      .send({
        name: "New Name",
      });
    expect(response.status).toBe(400);
  });

  // Success case: Create a user successfully through /users route
  test("Create user successfully", async () => {
    const response = await request(appUrl).post("/users").send({
      name: "New User",
      email: "newuser12467@example.com",
      password: "ValidPassword123",
    });
    expect(response.status).toBe(201);
    expect(response.body.userId).toBeDefined();

    createdUserId = response.body.userId || null;
  });
});
describe("User Model", () => {
  let createdUserId; // to store the ID of the created user

  afterAll(async () => {
    // Cleanup: delete the user created during the test
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }

    // Disconnect from the database
    await mongoose.disconnect();
  });

  it("should hash the password before saving", async () => {
    const db = mongoose.connection;

    const password = "PlainTextPassword123";
    const response = await request(appUrl).post("/register").send(
      {
        name: "Test User",
        email: "testModelUserNew@example.com",
        password: password,
      },
      10000
    );

    expect(response.status).toBe(200);

    const user = await User.findOne({ email: "testModelUserNew@example.com" });
    console.log(user);
    expect(user).toBeTruthy();

    createdUserId = user._id;

    // The stored password should not be the plain-text password
    expect(user.password).not.toBe(password);

    // The stored password should be the hashed version
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });
});
