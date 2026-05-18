module.exports = function registerStickerRoutes(router, deps) {
  const {
    authenticateToken,
    asyncHandler,
    db,
    ensureStickerData,
    ensureStickerSchema,
    normalizeStickerSlug,
    isRemoteUrl,
    getPublicBaseUrl,
    stickerFileCache,
    resolveStickerAssetPath,
    cacheStickerBuffer,
    fs,
  } = deps;

  router.get('/stickers/packs', authenticateToken, asyncHandler(async (_req, res) => {
    await ensureStickerData();

    db.all(
      `SELECT sp.id, sp.name, sp.slug, sp.description, sp.author, sp.created_at,
              COUNT(s.id) as sticker_count
       FROM sticker_packs sp
       LEFT JOIN stickers s ON s.pack_id = sp.id
       GROUP BY sp.id, sp.name, sp.description, sp.author, sp.created_at
       ORDER BY sp.created_at DESC`,
      (err, packs) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        const formatted = (packs || []).map((pack) => ({
          id: pack.id.toString(),
          name: pack.name,
          slug: pack.slug,
          description: pack.description,
          author: pack.author,
          createdAt: pack.created_at,
          stickerCount: Number(pack.sticker_count || 0),
        }));
        res.json({ packs: formatted });
      }
    );
  }));

  router.get('/stickers/packs/:id', authenticateToken, asyncHandler(async (req, res) => {
    await ensureStickerData();
    const packId = req.params.id;

    db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE id = $1', [packId], (err, pack) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!pack) {
        return res.status(404).json({ error: 'Pack not found' });
      }

      db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [packId], (err2, stickers) => {
        if (err2) {
          return res.status(500).json({ error: 'Database error' });
        }
        const formatted = (stickers || []).map((sticker) => ({
          id: sticker.id.toString(),
          name: sticker.name,
          filePath: sticker.file_path,
          url: isRemoteUrl(sticker.file_path)
            ? sticker.file_path
            : `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
        }));

        res.json({
          pack: {
            id: pack.id.toString(),
            name: pack.name,
            slug: pack.slug,
            description: pack.description,
            author: pack.author,
            createdAt: pack.created_at,
          },
          stickers: formatted,
        });
      });
    });
  }));

  router.get('/stickers/slug/:slug', authenticateToken, asyncHandler(async (req, res) => {
    await ensureStickerData();
    const slug = normalizeStickerSlug(req.params.slug || '');
    if (!slug) {
      return res.status(400).json({ error: 'Invalid sticker slug' });
    }

    db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE slug = $1', [slug], (err, pack) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!pack) {
        return res.status(404).json({ error: 'Pack not found' });
      }

      db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [pack.id], (err2, stickers) => {
        if (err2) {
          return res.status(500).json({ error: 'Database error' });
        }
        const formatted = (stickers || []).map((sticker) => ({
          id: sticker.id.toString(),
          name: sticker.name,
          filePath: sticker.file_path,
          url: isRemoteUrl(sticker.file_path)
            ? sticker.file_path
            : `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
        }));

        res.json({
          pack: {
            id: pack.id.toString(),
            name: pack.name,
            slug: pack.slug,
            description: pack.description,
            author: pack.author,
            createdAt: pack.created_at,
          },
          stickers: formatted,
        });
      });
    });
  }));

  router.get('/stickers/public/slug/:slug', authenticateToken, asyncHandler(async (req, res) => {
    await ensureStickerData();
    const slug = normalizeStickerSlug(req.params.slug || '');
    if (!slug) {
      return res.status(400).json({ error: 'Invalid sticker slug' });
    }

    db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE slug = $1', [slug], (err, pack) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!pack) {
        return res.status(404).json({ error: 'Pack not found' });
      }

      db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [pack.id], (err2, stickers) => {
        if (err2) {
          return res.status(500).json({ error: 'Database error' });
        }
        const formatted = (stickers || []).map((sticker) => ({
          id: sticker.id.toString(),
          name: sticker.name,
          filePath: sticker.file_path,
          url: isRemoteUrl(sticker.file_path)
            ? sticker.file_path
            : `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
        }));

        res.json({
          pack: {
            id: pack.id.toString(),
            name: pack.name,
            slug: pack.slug,
            description: pack.description,
            author: pack.author,
            createdAt: pack.created_at,
          },
          stickers: formatted,
        });
      });
    });
  }));

  router.get('/stickers/mine', authenticateToken, asyncHandler(async (req, res) => {
    await ensureStickerData();
    const userId = req.user.userId;
    console.info('[Stickers] mine request', { userId });

    db.all(
      `SELECT sp.id, sp.name, sp.slug, sp.description, sp.author, sp.created_at,
              COUNT(s.id) as sticker_count,
              MAX(usp.added_at) as added_at
       FROM user_sticker_packs usp
       JOIN sticker_packs sp ON sp.id = usp.pack_id
       LEFT JOIN stickers s ON s.pack_id = sp.id
       WHERE usp.user_id = $1
       GROUP BY sp.id, sp.name, sp.description, sp.author, sp.created_at
       ORDER BY added_at DESC`,
      [userId],
      (err, packs) => {
        if (err) {
          console.error('[Stickers] mine failed', err);
          return res.status(500).json({ error: 'Database error' });
        }
        const formatted = (packs || []).map((pack) => ({
          id: pack.id.toString(),
          name: pack.name,
          slug: pack.slug,
          description: pack.description,
          author: pack.author,
          createdAt: pack.created_at,
          stickerCount: Number(pack.sticker_count || 0),
        }));
        res.json({ packs: formatted });
      }
    );
  }));

  router.get('/stickers/pack/:id', authenticateToken, asyncHandler(async (req, res) => {
    await ensureStickerData();
    const packId = req.params.id;

    db.get('SELECT id, name, slug, description, author, created_at FROM sticker_packs WHERE id = $1', [packId], (err, pack) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!pack) {
        return res.status(404).json({ error: 'Pack not found' });
      }

      db.all('SELECT id, name, file_path FROM stickers WHERE pack_id = $1 ORDER BY id ASC', [packId], (err2, stickers) => {
        if (err2) {
          return res.status(500).json({ error: 'Database error' });
        }
        const formatted = (stickers || []).map((sticker) => ({
          id: sticker.id.toString(),
          name: sticker.name,
          filePath: sticker.file_path,
          url: isRemoteUrl(sticker.file_path)
            ? sticker.file_path
            : `${getPublicBaseUrl(req)}/api/stickers/${sticker.id}`,
        }));

        res.json({
          pack: {
            id: pack.id.toString(),
            name: pack.name,
            slug: pack.slug,
            description: pack.description,
            author: pack.author,
            createdAt: pack.created_at,
          },
          stickers: formatted,
        });
      });
    });
  }));

  router.post('/stickers/add-pack', authenticateToken, asyncHandler(async (req, res) => {
    await ensureStickerSchema();
    const userId = req.user.userId;
    const { packId } = req.body;
    console.info('[Stickers] add-pack request', { userId, packId });
    if (!packId) {
      return res.status(400).json({ error: 'packId is required' });
    }

    db.run(
      'INSERT INTO user_sticker_packs (user_id, pack_id) VALUES ($1, $2) ON CONFLICT(user_id, pack_id) DO NOTHING',
      [userId, packId],
      (err) => {
        if (err) {
          console.error('[Stickers] add-pack failed', err);
          return res.status(500).json({ error: 'Database error' });
        }
        console.info('[Stickers] add-pack success', { userId, packId });
        res.json({ message: 'Sticker pack added' });
      }
    );
  }));

  router.get('/stickers/:id', authenticateToken, asyncHandler(async (req, res) => {
    const stickerId = req.params.id;
    if (!stickerId || !Number.isInteger(Number(stickerId))) {
      return res.status(400).json({ error: 'Invalid sticker id' });
    }

    const cached = stickerFileCache.get(stickerId);
    if (cached?.buffer) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
      return res.end(cached.buffer);
    }

    db.get('SELECT file_path FROM stickers WHERE id = $1', [stickerId], (err, sticker) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!sticker) {
        return res.status(404).json({ error: 'Sticker not found' });
      }

      if (isRemoteUrl(sticker.file_path)) {
        return res.redirect(sticker.file_path);
      }

      let absolutePath;
      try {
        absolutePath = resolveStickerAssetPath(sticker.file_path);
      } catch (_error) {
        return res.status(400).json({ error: 'Invalid sticker path' });
      }

      fs.readFile(absolutePath, (readErr, buffer) => {
        if (readErr) {
          return res.status(404).json({ error: 'Sticker file missing' });
        }
        cacheStickerBuffer(stickerId, buffer);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
        return res.end(buffer);
      });
    });
  }));
};
