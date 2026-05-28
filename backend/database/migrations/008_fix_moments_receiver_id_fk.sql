ALTER TABLE media
DROP CONSTRAINT IF EXISTS media_receiver_id_fkey;

ALTER TABLE media
ADD CONSTRAINT media_receiver_id_fkey
FOREIGN KEY (receiver_id)
REFERENCES chats(id)
ON DELETE CASCADE;

