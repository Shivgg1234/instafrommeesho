const prisma = require("../db");

function createLike(postId, userId) { return prisma.like.create({ data: { postId, userId } }); }
function deleteLike(postId, userId) {
  return prisma.like.delete({ where: { userId_postId: { userId, postId } } });
}
module.exports = { createLike, deleteLike };
