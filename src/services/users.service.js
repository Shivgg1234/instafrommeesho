const prisma = require("../db");

const userSummary = { id: true, username: true, fullname: true };

function createUser(data) { return prisma.user.create({ data }); }

function listUsers({ where, orderBy, skip, take }) {
  return prisma.$transaction([
    prisma.user.findMany({
      where, orderBy, skip, take,
      include: { _count: { select: { posts: true, likes: true } } },
    }),
    prisma.user.count({ where }),
  ]);
}

function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { posts: true, likes: true } } },
  });
}

function userExists(id) { return prisma.user.findUnique({ where: { id }, select: { id: true } }); }
function updateUser(id, data) {
  if (!Object.keys(data).length) return getUserById(id);
  return prisma.user.update({ where: { id }, data });
}
function deleteUser(id) { return prisma.user.delete({ where: { id } }); }

function listUserPosts(userId, skip, take) {
  return prisma.$transaction([
    prisma.post.findMany({
      where: { authorId: userId }, orderBy: { createdAt: "desc" }, skip, take,
      include: { _count: { select: { likes: true } } },
    }),
    prisma.post.count({ where: { authorId: userId } }),
  ]);
}
function listLikedPosts(userId, skip, take) {
  const where = { likes: { some: { userId } } };
  return prisma.$transaction([
    prisma.post.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take,
      include: { author: { select: userSummary }, _count: { select: { likes: true } } },
    }),
    prisma.post.count({ where }),
  ]);
}

module.exports = { createUser, listUsers, getUserById, userExists, updateUser, deleteUser, listUserPosts, listLikedPosts, userSummary };
