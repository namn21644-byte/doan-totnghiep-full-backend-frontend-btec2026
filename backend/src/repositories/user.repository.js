import { UserModel } from '../models/user.model.js';

export const userRepository = {
  async create(data) {
    return UserModel.create(data);
  },

  async findByEmail(email) {
    return UserModel.findOne({ email: email.toLowerCase() });
  },

  async findById(id) {
    return UserModel.findById(id);
  },

  async updateById(id, update) {
    return UserModel.findByIdAndUpdate(id, update, { new: true });
  },

  async addRefreshToken(userId, refreshTokenEntry) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $push: { refreshTokens: refreshTokenEntry } },
      { new: true }
    );
  },

  async removeRefreshTokenByHash(userId, tokenHash) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $pull: { refreshTokens: { tokenHash } } },
      { new: true }
    );
  },

  async clearExpiredRefreshTokens(userId) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } },
      { new: true }
    );
  }
};
