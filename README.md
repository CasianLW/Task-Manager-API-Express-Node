# Express Task Manager API

<div align="center">
    <img src="https://media.giphy.com/media/znlSLQEFWmxI3XO9zP/giphy.gif" alt="gif" />
    <p>An Express-based backend API built to manage tasks with user authentication and CRUD operations on tasks.</p>
</div>

## Features

- **User Registration & Login**: Easily sign up and log into the app.
- **JWT-based Authentication**: Securely access your tasks.
- **CRUD operations for tasks**: Create, Read, Update, and Delete tasks.
- **MongoDB Integration**: Persistent storage using MongoDB.
- **Middleware**: Secure sensitive operations with admin key checks and JWT verification.

## Getting Started

### Prerequisites

Before starting, ensure you have the following:

- Node.js installed.
- A MongoDB account and cluster set up.
- Environment variables:
  - `DB_USER`: MongoDB Database user.
  - `DB_PASSWORD`: MongoDB Database password.
  - `DB_NAME`: MongoDB Database name.
  - `JWT_SECRET`: Secret key for JWT signing and verification.
  - `ADMIN_KEY`: Secret key for admin operations.

### Installation

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   ```

1. **Navigate to Project Directory**
   ```bash
   cd <project-name>
   ```
1. **Install Dependencies**

   ```bash
   npm install
   ```

1. **Start the Server**
   Using nodemon for auto-reloading during development:
   ```bash
   npm start
   ```

### API Endpoints

#### Authentication Routes

- **POST** `/register`: Register a new user.
- **POST** `/login`: Login an existing user.

#### Task Routes (Requires Authentication)

- **GET** `/tasks`: Fetch all tasks for the authenticated user.
- **POST** `/tasks`: Create a new task.
- **GET** `/tasks/:id`: Fetch a specific task by its ID.
- **PUT** `/tasks/:id`: Update a specific task by its ID.
- **DELETE** `/tasks/:id`: Remove a specific task by its ID.

### Testing

Tests are powered by Jest. Run them using:

    ```bash
    npm test
    ```

### Second section (from Technologies Used to License):

```markdown
### Technologies Used

- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [nodemon](https://www.npmjs.com/package/nodemon)

### License

This project is licensed under the MIT License.
```
