const bcrypt = require("bcryptjs");
const { UserInputError } = require("apollo-server");

const User = require("../../models/User");
const { validateRegisterInput } = require("../../util/validators");
const { validateLoginInput } = require("../../util/validators");
const { generateToken } = require("../../util/generateToken");

module.exports = {
  Mutation: {
    // Login resolver
    async login(_, { loginInput: { username, password } }) {
      const { valid, errors } = validateLoginInput(username, password);
      // Validate incoming data
      if (!valid) {
        throw new UserInputError("Login Errors", { errors });
      }

      // Check if the user exists
      const userDoesExist = await User.findOne({ username });
      if (!userDoesExist) {
        errors.username = "User does not exist";
        throw new UserInputError("User does not exist", { errors });
      }

      // Check if the password provided is correct
      const match = await bcrypt.compare(password, userDoesExist.password);
      if (!match) {
        errors.password = "Incorrect password";
        throw new UserInputError("Incorrect Password", { errors });
      }

      const token = generateToken(userDoesExist);

      return {
        ...userDoesExist._doc,
        id: userDoesExist._id,
        token
      };
    },

    // Register resolver
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      // Validate the incoming data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors have been encountered", { errors });
      }

      // Check if the user already exists
      const userExists = await User.findOne({ username });
      console.log(userExists);
      if (userExists) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username has already been taken"
          }
        });
      }

      // Hash the password and return a token
      password = await bcrypt.hash(password, 12);
      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString()
      });
      const res = await newUser.save();
      const token = generateToken(res);
      return {
        ...res._doc,
        id: res._id,
        token
      };
    }
  }
};
