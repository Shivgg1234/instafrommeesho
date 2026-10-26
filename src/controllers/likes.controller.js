const likesService = require("../services/likes.service");
const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");

function id(value) { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : null; }
async function create(req, res, next) {
  if (req.body.userId === undefined) return res.status(400).json({ error: "userId is required" });
  const postId = id(req.params.id);
  const userId = id(req.body.userId);
  try {
    if (postId === null || !await postsService.postExists(postId)) return res.status(404).json({ error: "Post not found" });
    if (userId === null || !await usersService.userExists(userId)) return res.status(404).json({ error: "User not found" });
    return res.status(201).json(await likesService.createLike(postId, userId));
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ error: "Already liked" });
    return next(error);
  }
}
async function remove(req, res, next) {
  const postId = id(req.params.id); const userId = id(req.params.userId);
  try {
    await likesService.deleteLike(postId, userId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Like not found" });
    return next(error);
  }
}
module.exports = { create, remove };
