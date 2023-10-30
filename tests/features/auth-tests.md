# AUTH: List of Tests

Before we start testing, we need to prepare our environment:

1. Run `resetDatabase()` to avoid user conflicts inside `beforeAll()`.
2. Initialize `beforeAll()` code to create users that will be tested in the next steps.
3. Set up `afterAll()` to clean up the users created during the tests.

## Test List:

- Register with invalid email format.
- Register with invalid password.
- Register a new user.
- User already exists.
- Login with invalid email format.
- Login with valid credentials.
- Login with valid invalid credentials.
- Update user with valid admin key.
- Update user with invalid admin key.
- Update non-existing user.
- Delete user with valid admin key.
- Delete user with invalid admin key.
- Delete non-existing user.
- Fetch all users.
- Create user with invalid data.
- Fetch non-existing user by ID.
- Login with non-existent email.
- Middleware - Access endpoint without Admin Key.
- Register without password.
- Fetch user with invalid ID format.
- Update user with invalid ID format.
- Create user successfully.
- Should hash the password before saving.
