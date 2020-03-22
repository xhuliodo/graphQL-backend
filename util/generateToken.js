const jwt = require("jsonwebtoken");

const { TOKENSECRET } = require("../config");

module.exports.generateToken = user => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username
    },
    TOKENSECRET,
    { expiresIn: "1h" }
  );
};
