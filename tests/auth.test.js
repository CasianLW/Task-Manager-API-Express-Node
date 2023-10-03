require("dotenv").config();
const request = require("supertest");
const express = require("express");
const app = express();
const adminKey = process.env.ADMIN_KEY;

const appUrl = process.env.APP_URL || "http://localhost:3000";
// const app = require("../server"); // import your express app or server
const User = require("../models/User");

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

  test("Register a new user", async () => {
    const response = await request(appUrl).post("/register").send({
      // const response = await request(app).post("/register").send({
      name: "Test User",
      email: "authTestUser1@example.com",
      password: "password123",
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
      password: "password123",
    });

    expect(response.status).toBe(400);
  });

  test("Login with valid credentials", async () => {
    // const response = await request(app)
    const response = await request(appUrl).post("/login").send({
      email: "authTestUser1@example.com",
      password: "password123",
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
