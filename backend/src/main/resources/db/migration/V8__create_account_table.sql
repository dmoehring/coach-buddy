CREATE TABLE coach_buddy.account
(
    id            UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),

    username      VARCHAR(255)             NOT NULL,
    password_hash VARCHAR(255)             NOT NULL,
    display_name  VARCHAR(255)             NOT NULL,

    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT uq_account_username
        UNIQUE (username)
);

CREATE TRIGGER trg_account_updated_at
    BEFORE UPDATE
    ON coach_buddy.account
    FOR EACH ROW
EXECUTE FUNCTION coach_buddy.update_updated_at_column();

-- Initial account so the application is usable right after setup.
-- Login: admin / ChangeMe123! -- change the password after first login.
INSERT INTO coach_buddy.account (username, password_hash, display_name)
VALUES ('admin', crypt('ChangeMe123!', gen_salt('bf')), 'Administrator');
