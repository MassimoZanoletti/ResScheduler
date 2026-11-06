UPDATE iscritti i JOIN season s ON s.nome = '2025/2026' SET i.seasonid_link = s.id;
ALTER TABLE iscritti ADD INDEX idx_iscritti_stagione (seasonid_link);
