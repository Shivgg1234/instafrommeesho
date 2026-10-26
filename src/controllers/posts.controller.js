const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function parseId(value) { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }
function bad(res, error) { return res.status(400).json({ error }); }

async function create(req, res, next) {
  const { imageUrl, authorId, caption, location } = req.body;
  if (imageUrl === undefined || authorId === undefined) return bad(res, "imageUrl and authorId are required");
  try {
    if (!await usersService.userExists(Number(authorId))) return res.status(404).json({ error: "User not found" });
    return res.status(201).json(await postsService.createPost({ imageUrl, authorId: Number(authorId), caption, location }));
  } catch (error) { return next(error); }
}

async function list(req, res, next) {
  const pagination = parsePagination(req.query);
  if (!pagination) return bad(res, "page and limit must be positive integers");
  const sortBy = req.query.sortBy || "createdAt";
  if (!["createdAt", "updatedAt", "likes"].includes(sortBy))
    return bad(res, "sortBy must be one of: createdAt, updatedAt, likes");
  const order = req.query.order || "desc";
  if (!["asc", "desc"].includes(order)) return bad(res, "order must be asc or desc");
  const where = {};
  if (req.query.location !== undefined) where.location = { equals: req.query.location, mode: "insensitive" };
  if (req.query.search !== undefined) where.caption = { contains: req.query.search, mode: "insensitive" };
  for (const key of ["from", "to"]) {
    if (req.query[key] !== undefined && Number.isNaN(new Date(req.query[key]).getTime()))
      return bad(res, "from and to must be valid dates");
  }
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt.gte = new Date(req.query.from);
    if (req.query.to) where.createdAt.lt = new Date(req.query.to);
  }
  const orderBy = sortBy === "likes"
    ? [{ likes: { _count: order } }, { createdAt: "desc" }]
    : { [sortBy]: order };
  try {
    const [data, total] = await postsService.listPosts({ where, orderBy, skip: pagination.skip, take: pagination.limit });
    return res.json({ data, meta: paginationMeta(pagination.page, pagination.limit, total) });
  } catch (error) { return next(error); }
}

async function getOne(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });
  try {
    const post = await postsService.getPostById(id);
    return post ? res.json(post) : res.status(404).json({ error: "Post not found" });
  } catch (error) { return next(error); }
}
async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });
  const data = {};
  for (const key of ["caption", "location"]) if (req.body[key] !== undefined) data[key] = req.body[key];
  try { return res.json(await postsService.updatePost(id, data)); }
  catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Post not found" });
    return next(error);
  }
}
async function remove(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });
  try { await postsService.deletePost(id); return res.status(204).send(); }
  catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Post not found" });
    return next(error);
  }
}
async function likes(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });
  try {
    if (!await postsService.postExists(id)) return res.status(404).json({ error: "Post not found" });
    return res.json(await postsService.listPostLikes(id));
  } catch (error) { return next(error); }
}
module.exports = { create, list, getOne, update, remove, likes };
