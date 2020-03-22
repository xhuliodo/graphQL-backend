const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server");

const { TOKENSECRET } = require("../config");

module.exports = context => {
  const authHeader = context.req.headers.authorization;

  if (authHeader) {
    // get the actual token
    const token = authHeader.split("Bearer ")[1];
    if (token) {
      try {
        const user = jwt.verify(token, TOKENSECRET);
        return user;
      } catch (err) {
        throw new AuthenticationError("Invalid/Expired user token");
      }
    }
    throw new AuthenticationError(
      "The authentication token provided was not in the stardard format"
    );
  }
  throw new AuthenticationError("The authorization header was not provided");
};
