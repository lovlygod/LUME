ALTER TABLE moments
DROP CONSTRAINT IF EXISTS moments_receiver_id_fkey;

ALTER TABLE moments
ADD CONSTRAINT moments_receiver_id_fkey
FOREIGN KEY (receiver_id)
REFERENCES chats(id)
ON DELETE CASCADE;
