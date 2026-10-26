const prisma = require("../db");

const relationInclude = {
  author: { select: { id: true, username: true, fullname: true } },
  _count: { select: { likes: true } },
};

function createPost(data) { return prisma.post.create({ data }); }
function listPosts({ where, orderBy, skip, take }) {
  return prisma.$transaction([
    prisma.post.findMany({ where, orderBy, skip, take, include: relationInclude }),
    prisma.post.count({ where }),
  ]);
}
function getPostById(id) {
  return prisma.post.findUnique({ where: { id }, include: relationInclude });
}
function postExists(id) { return prisma.post.findUnique({ where: { id }, select: { id: true } }); }
function updatePost(id, data) {
  if (!Object.keys(data).length) return getPostById(id);
  return prisma.post.update({ where: { id }, data });
}
function deletePost(id) { return prisma.post.delete({ where: { id } }); }
function listPostLikes(postId) {
  return prisma.like.findMany({
    where: { postId }, orderBy: { user: { username: "asc" } },
    select: { user: { select: { id: true, username: true, fullname: true } } },
  }).then((rows) => rows.map(({ user }) => user));
}

module.exports = { createPost, listPosts, getPostById, postExists, updatePost, deletePost, listPostLikes };
