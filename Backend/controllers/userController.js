import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendMail from '../util/mailer.js';
import { JWT_CONFIG, PASSWORD_RESET_CONFIG } from '../config.js';

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    return res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_CONFIG.secret, { expiresIn: JWT_CONFIG.expiresIn });
    return res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) delete updates.password; // Prevent password update here
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const updates = {};
    
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    // This is a placeholder for profile photo upload
    // You would typically use multer or similar middleware to handle file uploads
    // For now, we'll return a mock response
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Mock profile photo URL - in real implementation, you'd save the file and return the URL
    const profilePhotoUrl = `https://example.com/profile-photos/${user._id}.jpg`;
    
    user.profilePhoto = profilePhotoUrl;
    await user.save();
    
    return res.status(200).json({ 
      message: 'Profile photo uploaded successfully.',
      profilePhoto: profilePhotoUrl
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const resetToken = crypto.randomBytes(PASSWORD_RESET_CONFIG.tokenLength).toString('hex');
    const resetTokenExpiry = Date.now() + PASSWORD_RESET_CONFIG.tokenExpiry;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    const resetLink = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
    // Send email using mailer utility
    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Reset your password using this link: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>If you did not request this, please ignore this email.</p>`,
    });
    return res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required.' });
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 