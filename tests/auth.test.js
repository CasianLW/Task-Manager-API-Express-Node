require("dotenv").config();
const request = require("supertest");
const express = require("express");
const app = express();
const adminKey = process.env.ADMIN_KEY;

const appUrl = process.env.APP_URL || "http://localhost:3000";
// const app = require("../server"); // import your express app or server
// const User = require("../models/User");

describe("Authentication routes", () => {
  let userId;
  //   beforeAll(async () => {
  //     // setup your test database or any necessary setup before tests run
  //   });

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
    expect(response.body.token).toBeDefined();
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
