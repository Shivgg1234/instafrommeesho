const usersService = require("../services/users.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
function validationError(res, message) { return res.status(400).json({ error: message }); }

async function create(req, res, next) {
  const { username, email, fullname, bio } = req.body;
  if (username === undefined || email === undefined || fullname === undefined)
    return validationError(res, "username, email and fullname are required");
  try {
    return res.status(201).json(await usersService.createUser({ username, email, fullname, bio }));
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ error: "username or email already taken" });
    return next(error);
  }
}

async function list(req, res, next) {
  const pagination = parsePagination(req.query);
  if (!pagination) return validationError(res, "page and limit must be positive integers");
  const allowedSort = ["createdAt", "username", "fullname"];
  const sortBy = req.query.sortBy || "createdAt";
  if (!allowedSort.includes(sortBy))
    return validationError(res, "sortBy must be one of: createdAt, username, fullname");
  const order = req.query.order || "desc";
  if (!["asc", "desc"].includes(order)) return validationError(res, "order must be asc or desc");
  const where = {};
  if (req.query.isPrivate !== undefined) {
    if (!["true", "false"].includes(req.query.isPrivate))
      return validationError(res, "isPrivate must be true or false");
    where.isPrivate = req.query.isPrivate === "true";
  }
  if (req.query.search !== undefined) {
    where.OR = [
      { username: { contains: req.query.search, mode: "insensitive" } },
      { fullname: { contains: req.query.search, mode: "insensitive" } },
    ];
  }
  if (req.query.hasPosts !== undefined) {
    if (!["true", "false"].includes(req.query.hasPosts))
      return validationError(res, "hasPosts must be true or false");
    where.posts = req.query.hasPosts === "true" ? { some: {} } : { none: {} };
  }
  try {
    const [data, total] = await usersService.listUsers({
      where, orderBy: { [sortBy]: order }, skip: pagination.skip, take: pagination.limit,
    });
    return res.json({ data, meta: paginationMeta(pagination.page, pagination.limit, total) });
  } catch (error) { return next(error); }
}

async function getOne(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });
  try {
    const user = await usersService.getUserById(id);
    return user ? res.json(user) : res.status(404).json({ error: "User not found" });
  } catch (error) { return next(error); }
}

async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });
  const data = {};
  for (const key of ["fullname", "bio", "isPrivate"]) if (req.body[key] !== undefined) data[key] = req.body[key];
  try { return res.json(await usersService.updateUser(id, data)); }
  catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "User not found" });
    return next(error);
  }
}

async function remove(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });
  try { await usersService.deleteUser(id); return res.status(204).send(); }
  catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "User not found" });
    return next(error);
  }
}

async function posts(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) return res.status(404).json({ error: "User not found" });
  const pagination = parsePagination(req.query);
  if (!pagination) return validationError(res, "page and limit must be positive integers");
  try {
    if (!await usersService.userExists(userId)) return res.status(404).json({ error: "User not found" });
    const [data, total] = await usersService.listUserPosts(userId, pagination.skip, pagination.limit);
    return res.json({ data, meta: paginationMeta(pagination.page, pagination.limit, total) });
  } catch (error) { return next(error); }
}

async function likedPosts(req, res, next) {
  const userId = parseId(req.params.id);
  if (userId === null) return res.status(404).json({ error: "User not found" });
  const pagination = parsePagination(req.query);
  if (!pagination) return validationError(res, "page and limit must be positive integers");
  try {
    if (!await usersService.userExists(userId)) return res.status(404).json({ error: "User not found" });
    const [data, total] = await usersService.listLikedPosts(userId, pagination.skip, pagination.limit);
    return res.json({ data, meta: paginationMeta(pagination.page, pagination.limit, total) });
  } catch (error) { return next(error); }
}

module.exports = { create, list, getOne, update, remove, posts, likedPosts };
