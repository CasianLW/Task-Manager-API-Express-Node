const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
// Connection à MongoDB
mongoose
  .connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_NAME}?retryWrites=true&w=majority`,
    {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
    }
  )
  .catch((error) => console.error("Error connecting to MongoDB:", error));

const db = mongoose.connection;
db.on("error", console.error.bind(console, "ERROR:CANNOT CONNECT TO MONGO-DB"));
db.once("open", () => console.log("CONNECTED TO MONGO-DB"));

app.use(express.json()); // pour parse le body des requêtes en JSON

// Importation des routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

// app.use("/login", authRoutes);
// app.use("/register", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Check at url :  ${process.env.APP_URL}`);
});
