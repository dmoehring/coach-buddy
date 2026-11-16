ALTER TABLE coach_buddy.training
    ADD COLUMN type  VARCHAR(50) NOT NULL DEFAULT 'TRAINING',
    ADD COLUMN title VARCHAR(255);

ALTER TABLE coach_buddy.training
    ADD CONSTRAINT chk_training_type
        CHECK (type IN ('TRAINING', 'GAME_DAY'));

ALTER TABLE coach_buddy.training_participant
    ADD COLUMN jersey_number    INTEGER,
    ADD COLUMN minutes_played   INTEGER,
    ADD COLUMN minutes_in_goal  INTEGER;

ALTER TABLE coach_buddy.training_participant
    ADD CONSTRAINT chk_training_participant_jersey_number
        CHECK (jersey_number IS NULL OR jersey_number BETWEEN 0 AND 999),
    ADD CONSTRAINT chk_training_participant_minutes_played
        CHECK (minutes_played IS NULL OR minutes_played BETWEEN 0 AND 999),
    ADD CONSTRAINT chk_training_participant_minutes_in_goal
        CHECK (minutes_in_goal IS NULL OR minutes_in_goal BETWEEN 0 AND 999);
