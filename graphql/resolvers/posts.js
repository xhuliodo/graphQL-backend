const { AuthenticationError, UserInputError } = require("apollo-server");

const Post = require("../../models/Post");
const isLoggedIn = require("../../util/isLoggedIn");

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId);
        if (post) {
          return post;
        } else {
          return new Error("Post not found!");
        }
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = isLoggedIn(context);

      if (body.trim() === "") {
        throw new Error("Body of the post must not be empty");
      }
      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString()
      });

      const post = await newPost.save();

      return post;
    },
    async deletePost(_, { postId }, context) {
      const user = isLoggedIn(context);

      try {
        const postToBeDeleted = await Post.findById(postId);
        if (user.username === postToBeDeleted.username) {
          postToBeDeleted.delete();
          return "Post was deteled successfully";
        } else {
          throw new AuthenticationError(
            "You don't have the permissions to delete this post"
          );
        }
      } catch (err) {
        throw new Error("The post does not exist", err);
      }
    },
    async createComment(_, { postId, body }, context) {
      const { username } = isLoggedIn(context);

      if (body.trim() === "") {
        throw new UserInputError("Empty comment", {
          errors: {
            body: "Empty comment"
          }
        });
      }

      const post = await Post.findById(postId);

      if (post) {
        post.comments.unshift({
          body,
          username,
          createdAt: new Date().toISOString()
        });
        await post.save();
        return post;
      } else {
        throw new UserInputError("The post does not exist");
      }
    },
    async deleteComment(_, { postId, commentId }, context) {
      const { username } = isLoggedIn(context);

      const post = await Post.findById(postId);

      if (post) {
        const commentIndex = post.comments.findIndex(c => c.id === commentId);

        if (post.comments[commentIndex].username === username) {
          post.comments.splice(commentIndex, 1);
          await post.save();
          return post;
        } else {
          throw new AuthenticationError(
            "The comment is not yours, you are not allowed to delete it"
          );
        }
      } else {
        throw new UserInputError("The post does not exist");
      }
    },
    async likePost(_, { postId }, context) {
      const { username } = isLoggedIn(context);

      const post = await Post.findById(postId);

      if (post) {
        const hasUserLiked = post.likes.find(l => l.username === username);
        if (hasUserLiked) {
          // The post is liked, so we have to unlike it
          post.likes = post.likes.filter(p => p.username !== username);
        } else {
          // Post has not been liked, we have to like it
          post.likes.push({
            username,
            createdAt: new Date().toISOString()
          });
        }
        await post.save();
        return post;
      } else throw new UserInputError("Post not found");
    }
  }
};
