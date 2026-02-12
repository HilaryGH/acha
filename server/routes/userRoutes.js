const express = require('express');
const router = express.Router();
const User = require('../models/User'); // ⬅️ ADD THIS LINE

const {
  register,
  login,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  searchUsersByLocation
} = require('../controllers/userController');

const { authenticate } = require('../middleware/auth');
const { isSuperAdmin, isAdmin } = require('../middleware/authorize');

/* ===============================
   TEMP RESET ROUTE (REMOVE LATER)
   =============================== */
router.put('/reset-super-admin', async (req, res) => {
  try {
    const user = await User.findOne({ email: 'g.fikre2@gmail.com' }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'Super admin not found' });
    }

    user.password = 'Admin@123'; // plain text
    await user.save(); // 🔥 bcrypt pre('save') runs here

    res.json({ message: 'Super admin password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===== PUBLIC ROUTES ===== */
router.post('/login', login);
router.post('/register', register);
router.post('/register/restricted', authenticate, register);
router.get('/search/location', searchUsersByLocation); // Public endpoint to search users by location

/* ===== PROTECTED ROUTES ===== */
router.use(authenticate);

router.get('/me', getMe);
router.get('/', isAdmin, getAllUsers);
router.get('/:id', isAdmin, getUserById);
router.put('/:id', updateUser);
router.put('/:id/password', changePassword);
router.delete('/:id', isSuperAdmin, deleteUser);

module.exports = router;
