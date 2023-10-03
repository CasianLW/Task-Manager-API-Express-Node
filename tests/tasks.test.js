require("dotenv").config();
const request = require("supertest");
// const app = require("../server"); // import your express app or server
const mongoose = require("mongoose");
const express = require("express");
const app = express();

const appUrl = process.env.APP_URL || "http://localhost:3000";
const adminKey = process.env.ADMIN_KEY;
const User = require("../models/User");

describe("Tasks routes", () => {
  let token1, token2, taskId, taskId2, userId1, userId2;

  beforeAll(async () => {
    // Register user1
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
      .send({ body: "Task by user2" });
    taskId2 = taskRes.body._id; // Assuming your task object has an `_id` field
  }, 10000);

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
  }, 10000);

  // afterAll(async () => {
  //   // cleanup
  //   await Task.deleteMany({});
  // });

  test("Post a task", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .post("/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .send({ body: "Sample task" });

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
  test("Access task with invalid ObjectId format", async () => {
    const invalidObjectId = "dzadzad";
    const response = await request(appUrl)
      .get(`/tasks/${invalidObjectId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(400);
    // expect(response.body.error).toBe("Invalid ID format."); // Replace with whatever error message your server would send
  });

  test("Access unauthorized task", async () => {
    // const response = await request(app)
    //have to create another user, then create a task with that user, then try to access it with the first user
    const response = await request(appUrl)
      .get(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(403);
    // expect(response.body).toBeInstanceOf(Array);
  });
  test("Delete specific task of another user", async () => {
    // const response = await request(app)
    const response = await request(appUrl)
      .delete(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(403);
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
