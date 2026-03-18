const db = require('./db');
const { getPublicBaseUrl } = require('./utils/baseUrl');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Get user profile
const getUserProfile = (req, res) => {
  const userRef = req.params.userId;
  const isNumericId = /^\d+$/.test(userRef);
  const query = `
    SELECT id, email, name, username, bio, city, website, pinned_post_id,
           avatar, banner, verified, followers_count, join_date, created_at
    FROM users
    WHERE ${isNumericId ? 'id = $1' : 'LOWER(username) = LOWER($1)'}
  `;
  const queryValue = isNumericId ? parseInt(userRef, 10) : userRef;

  db.get(query, [queryValue], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get following count
    const followingQuery = 'SELECT COUNT(*) as count FROM followers WHERE follower_id = $1';
    db.get(followingQuery, [Number(user.id)], (err, followingResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const followingCount = followingResult ? followingResult.count : 0;

      res.json({
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
          bio: user.bio,
          city: user.city,
          website: user.website,
          pinned_post_id: user.pinned_post_id ? user.pinned_post_id.toString() : null,
          avatar: user.avatar,
          banner: user.banner,
          verified: user.verified === 1,
          followers_count: user.followers_count || 0,
          following_count: followingCount,
          joinDate: user.join_date
        }
      });
    });
  });
};

// Update user profile
const updateUserProfile = async (req, res) => {
  const userId = req.user.userId; // From auth middleware
  const { name, username, bio, city, website } = req.body;

  // Validate inputs
  if (!name || !username) {
    return res.status(400).json({ error: 'Name and username are required' });
  }

  // Validate city
  if (city !== undefined) {
    if (city && city.length > 64) {
      return res.status(400).json({ error: 'City must be less than 64 characters' });
    }
  }

  // Validate and normalize website
  let normalizedWebsite = website;
  if (website !== undefined) {
    if (website) {
      const trimmed = website.trim();
      let url = trimmed;
      if (!url.match(/^https?:\/\//i)) {
        url = `https://${url}`;
      }
      
      const urlPattern = /^https?:\/\/[^\s]+$/i;
      if (!urlPattern.test(url)) {
        return res.status(400).json({ error: 'Website must be a valid http or https URL' });
      }
      
      normalizedWebsite = url;
    }
  }

  try {
    // Check if username is already taken by another user
    const checkUsernameQuery = 'SELECT id FROM users WHERE username = $1 AND id != $2';
    db.get(checkUsernameQuery, [username, userId], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      updates.push('name = $1', 'username = $2', 'bio = $3');
      values.push(name, username, bio);

      if (city !== undefined) {
        updates.push(`city = $${updates.length + 1}`);
        values.push(city ? city.trim() : null);
      }

      if (normalizedWebsite !== undefined) {
        updates.push(`website = $${updates.length + 1}`);
        values.push(normalizedWebsite);
      }

      values.push(userId);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${updates.length + 1}`;

      db.run(query, values, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    // Сохраняем полный URL для корректного отображения
    const avatarPath = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;

    // Update user's avatar in database
    const query = 'UPDATE users SET avatar = $1 WHERE id = $2';

    db.run(query, [avatarPath, userId], function(err) {
      if (err) {
        // Delete the uploaded file if DB update fails
        fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        // Delete the uploaded file if user not found
        fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Avatar updated successfully',
        avatar: avatarPath
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload banner
const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    // Сохраняем полный URL для корректного отображения
    const bannerPath = `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`;

    // Update user's banner in database
    const query = 'UPDATE users SET banner = $1 WHERE id = $2';

    db.run(query, [bannerPath, userId], function(err) {
      if (err) {
        // Delete the uploaded file if DB update fails
        fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        // Delete the uploaded file if user not found
        fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Banner updated successfully',
        banner: bannerPath
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadBanner,
  upload // Export multer instance for use in routes
};
