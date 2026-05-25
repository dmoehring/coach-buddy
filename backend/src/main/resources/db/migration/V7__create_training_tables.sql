CREATE TABLE coach_buddy.training
(
    id            UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    team_id       UUID                     NOT NULL,

    training_date DATE                     NOT NULL,
    start_time    TIME,
    end_time      TIME,
    location      VARCHAR(255),
    notes         TEXT,

    status        VARCHAR(50)              NOT NULL DEFAULT 'COMPLETED',

    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT fk_training_team
        FOREIGN KEY (team_id)
            REFERENCES coach_buddy.team (id)
            ON DELETE CASCADE,

    CONSTRAINT chk_training_time_range
        CHECK (
            start_time IS NULL
                OR end_time IS NULL
                OR start_time <= end_time
            ),

    CONSTRAINT chk_training_status
        CHECK (status IN ('COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_training_team_id
    ON coach_buddy.training (team_id);

CREATE INDEX idx_training_training_date
    ON coach_buddy.training (training_date);

CREATE INDEX idx_training_team_date
    ON coach_buddy.training (team_id, training_date);


CREATE TABLE coach_buddy.training_participant
(
    id                UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    training_id       UUID                     NOT NULL,
    person_id         UUID                     NOT NULL,

    attendance_status VARCHAR(50)              NOT NULL,
    notes             TEXT,

    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT fk_training_participant_training
        FOREIGN KEY (training_id)
            REFERENCES coach_buddy.training (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_training_participant_person
        FOREIGN KEY (person_id)
            REFERENCES coach_buddy.person (id)
            ON DELETE CASCADE,

    CONSTRAINT chk_training_participant_attendance_status
        CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'EXCUSED')),

    CONSTRAINT uq_training_participant_training_person
        UNIQUE (training_id, person_id)
);

CREATE INDEX idx_training_participant_training_id
    ON coach_buddy.training_participant (training_id);

CREATE INDEX idx_training_participant_person_id
    ON coach_buddy.training_participant (person_id);

CREATE INDEX idx_training_participant_attendance_status
    ON coach_buddy.training_participant (attendance_status);


CREATE TRIGGER trg_training_updated_at
    BEFORE UPDATE
    ON coach_buddy.training
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();

CREATE TRIGGER trg_training_participant_updated_at
    BEFORE UPDATE
    ON coach_buddy.training_participant
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();