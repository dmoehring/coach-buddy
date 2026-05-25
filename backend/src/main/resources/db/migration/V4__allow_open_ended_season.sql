ALTER TABLE coach_buddy.season
    ALTER COLUMN end_date DROP NOT NULL;

ALTER TABLE coach_buddy.season
    DROP CONSTRAINT chk_season_date_range;

ALTER TABLE coach_buddy.season
    ADD CONSTRAINT chk_season_date_range
        CHECK (end_date IS NULL OR start_date <= end_date);

CREATE UNIQUE INDEX uq_season_only_one_open
    ON coach_buddy.season ((end_date IS NULL))
    WHERE end_date IS NULL;