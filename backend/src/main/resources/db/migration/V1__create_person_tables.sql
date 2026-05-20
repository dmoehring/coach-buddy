CREATE SCHEMA IF NOT EXISTS coach_buddy;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE coach_buddy.person
(
    id         UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    first_name VARCHAR(255)             NOT NULL,
    last_name  VARCHAR(255)             NOT NULL,
    birth_date DATE,

    nickname   VARCHAR(255),
    notes      TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE coach_buddy.phone_number
(
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    person_id UUID        NOT NULL,
    type      VARCHAR(50) NOT NULL,
    number    VARCHAR(50) NOT NULL,

    CONSTRAINT fk_phone_number_person
        FOREIGN KEY (person_id)
            REFERENCES coach_buddy.person (id)
            ON DELETE CASCADE
);

CREATE TABLE coach_buddy.person_relation
(
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    child_person_id    UUID        NOT NULL,
    guardian_person_id UUID        NOT NULL,
    relation_type      VARCHAR(50) NOT NULL,

    CONSTRAINT fk_person_relation_child_person
        FOREIGN KEY (child_person_id)
            REFERENCES coach_buddy.person (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_person_relation_guardian_person
        FOREIGN KEY (guardian_person_id)
            REFERENCES coach_buddy.person (id)
            ON DELETE CASCADE,

    CONSTRAINT chk_person_relation_not_same_person
        CHECK (child_person_id <> guardian_person_id),

    CONSTRAINT uq_person_relation_child_guardian
        UNIQUE (child_person_id, guardian_person_id)
);

CREATE OR REPLACE FUNCTION coach_buddy.update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_updated_at
    BEFORE UPDATE
    ON coach_buddy.person
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();