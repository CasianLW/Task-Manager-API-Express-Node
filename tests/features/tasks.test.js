require("dotenv").config();
const request = require("supertest");
// const app = require("../server"); // import your express app or server
const mongoose = require("mongoose");
// const express = require("express");
// const app = express();

// const app = require("../../server"); // import express app or server

const appUrl = process.env.APP_URL || "http://localhost:3000";

const adminKey = process.env.ADMIN_KEY;
const User = require("../../models/User");
// const User = require("../../models/User");

const resetDatabase = require("../../routes/handlers.js");

describe("Tasks routes", () => {
  let token1, token2, taskId, taskId2, userId1, userId2;

  beforeAll(async () => {
    await resetDatabase();
    //
    const res1 = await request(appUrl).post("/register").send({
      name: "Test UserTasks1",
      email: "testUserTasks1@example.com",
      password: "Password123",
    });
    token1 = res1.body.token;
    userId1 = res1.body.userId;

    // Register user2
    const res2 = await request(appUrl).post("/register").send({
      name: "Test UserTasks2",
      email: "testUserTasks2@example.com",
      password: "Password123",
    });
    token2 = res2.body.token;
    userId2 = res2.body.userId;

    // Create task with user2
    const taskRes = await request(appUrl)
      .post("/tasks")
      .set("Authorization", `Bearer ${token2}`)
      .send({ body: "Task by user2", completed: true });
    taskId2 = taskRes.body._id; // Assuming your task object has an `_id` field
  }, 50000);

  afterAll(async () => {
    // Delete tasks created during tests
    await request(appUrl)
      .delete(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token2}`)
      .send();
    await request(appUrl)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    // Delete users created during tests
    // Ideally, when you register the users in your beforeAll block, you would save their IDs so you can delete them here
    // let user1 = await User.findOne({ email: "test1@example.com" });
    // let user2 = await User.findOne({ email: "test2@example.com" });
    // if (user1) {
    await request(appUrl)
      .delete(`/user/${userId1}`)
      .set("Admin-Key", adminKey)
      .send();
    // }
    // if (user2) {
    await request(appUrl)
      .delete(`/user/${userId2}`)
      .set("Admin-Key", adminKey)
      .send();
    // }
  }, 50000);
  // afterEach(() => {
  //   jest.clearAllTimers();
  // });

  // afterAll(async () => {
  //   // cleanup
  //   await Task.deleteMany({});
  // });

  test("Post a task", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .post("/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .send({ body: "Sample task", completed: false });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_id"); // Ensure task object with ID
    expect(response.body).toHaveProperty("body", "Sample task");
    taskId = response.body._id; // Save task ID for future tests
  });

  test("Get all tasks of user", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .get("/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
  // Test to check the completed tasks of a user
  test("Get completed tasks of user", async () => {
    const response = await request(appUrl)
      .get("/tasks/completed")
      .set("Authorization", `Bearer ${token2}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty("completed", true); // Ensure the first task in the list is completed
  });
  test("Access task with invalid ObjectId format", async () => {
    const invalidObjectId = "dzadzad";
    const response = await request(appUrl)
      .get(`/tasks/${invalidObjectId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(400);
    // expect(response.body.error).toBe("Invalid ID format."); // Replace with whatever error message your server would send
  });

  // Test to check the pending tasks of a user
  test("Get pending tasks of user", async () => {
    const response = await request(appUrl)
      .get("/tasks/pending")
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty("completed", false); // Ensure the first task in the list is not completed
  });

  test("Access specific task", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .get(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_id", taskId);
  });
  test("Access inexistent task", async () => {
    // const response = await request(app)
    const fakeObjectId = new mongoose.Types.ObjectId();
    const response = await request(appUrl)
      .get(`/tasks/${fakeObjectId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(404);
  });

  test("Access unauthorized task", async () => {
    // const response = await request(app)
    //have to create another user, then create a task with that user, then try to access it with the first user
    const response = await request(appUrl)
      .get(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(401);
    // expect(response.body).toBeInstanceOf(Array);
  });
  test("Delete specific task of another user", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .delete(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(401);
    // expect(response.body).toBeInstanceOf(Array);
  });
  test("Delete specific task", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    // expect(response.body).toBeInstanceOf(Array);
  });
});
