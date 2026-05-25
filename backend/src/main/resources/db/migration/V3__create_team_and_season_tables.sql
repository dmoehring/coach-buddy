CREATE TABLE coach_buddy.season
(
    id         UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    name       VARCHAR(50)              NOT NULL,
    start_date DATE                     NOT NULL,
    end_date   DATE                     NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT chk_season_date_range
        CHECK (start_date <= end_date)
);

CREATE UNIQUE INDEX uq_season_name
    ON coach_buddy.season (
                           lower(trim(name))
        );


CREATE TABLE coach_buddy.team
(
    id          UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    name        VARCHAR(100)             NOT NULL,
    description TEXT,

    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_team_name
    ON coach_buddy.team (
                         lower(trim(name))
        );


CREATE TABLE coach_buddy.team_membership
(
    id         UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    team_id    UUID                     NOT NULL,
    person_id  UUID                     NOT NULL,
    season_id  UUID                     NOT NULL,

    joined_at  DATE                     NOT NULL,
    left_at    DATE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT fk_team_membership_team
        FOREIGN KEY (team_id)
            REFERENCES coach_buddy.team (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_team_membership_person
        FOREIGN KEY (person_id)
            REFERENCES coach_buddy.person (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_team_membership_season
        FOREIGN KEY (season_id)
            REFERENCES coach_buddy.season (id)
            ON DELETE CASCADE,

    CONSTRAINT chk_team_membership_date_range
        CHECK (left_at IS NULL OR joined_at <= left_at),

    CONSTRAINT uq_team_membership_team_person_season
        UNIQUE (team_id, person_id, season_id)
);

CREATE INDEX idx_team_membership_team_id
    ON coach_buddy.team_membership (team_id);

CREATE INDEX idx_team_membership_person_id
    ON coach_buddy.team_membership (person_id);

CREATE INDEX idx_team_membership_season_id
    ON coach_buddy.team_membership (season_id);

CREATE INDEX idx_team_membership_team_season
    ON coach_buddy.team_membership (team_id, season_id);


CREATE TRIGGER trg_season_updated_at
    BEFORE UPDATE
    ON coach_buddy.season
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();

CREATE TRIGGER trg_team_updated_at
    BEFORE UPDATE
    ON coach_buddy.team
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();

CREATE TRIGGER trg_team_membership_updated_at
    BEFORE UPDATE
    ON coach_buddy.team_membership
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();