# Testing the Invite Endpoint

This folder contains scripts for testing the invite code generation endpoint in the IAZI-BE application.

## Prerequisites

- Node.js and npm installed
- IAZI-BE server running (default port: 3003)
- Database properly configured

## Setup

Before running the tests for the first time, run the setup script to install required dependencies:

```bash
node setup-invite-test.js
```

This will install node-fetch@2 if it's not already installed.

## Available Scripts

### Option 0: Simple Token Generator

If you're having issues with the other token generation methods, use the simplified token generator:

```bash
node simple-token-gen.js
```

You can also specify a role:

```bash
node simple-token-gen.js ADMIN
```

To automatically update the test file with the generated token:

```bash
node simple-token-gen.js --update
```

### Option 0.5: Simple Test Runner

For the simplest experience with the fewest dependencies, use:

```bash
node simple-run-test.js
```

Or specify a role:

```bash
node simple-run-test.js ADMIN
```

This will generate a token and run the test in one command.

### Option 1: All-in-one Test Runner

Run the following command to generate a token and test the invite endpoint in one step:

```bash
node run-invite-test.js
```

This script will:
1. Generate a JWT token based on a user in the database (or fallback to mock data)
2. Update the test-invite.js file with the generated token
3. Run the test-invite.js script to test the endpoint

### Option 2: Step-by-step Testing

If you prefer to run the tests step by step:

1. Generate a token:
   ```bash
   node generate-test-token.js
   ```

2. Copy the generated token and manually replace `YOUR_AUTH_TOKEN_HERE` in the test-invite.js file

3. Run the test:
   ```bash
   node test-invite.js
   ```

## Expected Results

- For a successful test, you'll see a 201 status code and a newly generated invite code
- If unauthorized, you'll see a 401 status code with an error message

## Troubleshooting

- If the server connection fails, make sure the server is running and check the baseUrl in test-invite.js
- If authentication fails, generate a new token and update the test script
- For other errors, check the server logs for more detailed information
