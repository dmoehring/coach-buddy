-- Team gehört künftig direkt zu einer Saison.
-- TeamMembership verweist dann nur noch auf Team + Person.

ALTER TABLE coach_buddy.team
    ADD COLUMN season_id UUID;

-- Sicherheitsprüfung:
-- Ein bestehendes Team darf bisher nicht Mitgliedschaften in mehreren Saisons haben.
-- Falls doch, müsste man Teams pro Saison duplizieren.
DO
$$
    BEGIN
        IF EXISTS (SELECT team_id
                   FROM coach_buddy.team_membership
                   GROUP BY team_id
                   HAVING COUNT(DISTINCT season_id) > 1) THEN
            RAISE EXCEPTION
                'Migration nicht eindeutig möglich: Mindestens ein Team hat Memberships in mehreren Saisons.';
        END IF;
    END
$$;

-- season_id aus bestehenden Memberships ableiten.
-- PostgreSQL unterstützt MIN(uuid) nicht, daher DISTINCT ON.
UPDATE coach_buddy.team t
SET season_id = tm.season_id
FROM (SELECT DISTINCT ON (team_id) team_id,
                                   season_id
      FROM coach_buddy.team_membership
      ORDER BY team_id, season_id::text) tm
WHERE t.id = tm.team_id;

-- Teams ohne Membership bekommen die aktuell offene Saison,
-- falls es eine gibt.
UPDATE coach_buddy.team t
SET season_id = s.id
FROM coach_buddy.season s
WHERE t.season_id IS NULL
  AND s.end_date IS NULL;

-- Falls es keine offene Saison gibt, nehmen wir die jüngste Saison nach start_date.
UPDATE coach_buddy.team t
SET season_id = s.id
FROM (SELECT id
      FROM coach_buddy.season
      ORDER BY start_date DESC
      LIMIT 1) s
WHERE t.season_id IS NULL;

-- Falls jetzt noch Teams ohne Saison existieren, soll die Migration abbrechen.
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM coach_buddy.team
                   WHERE season_id IS NULL) THEN
            RAISE EXCEPTION
                'Migration nicht möglich: Es gibt Teams ohne zuordenbare Saison.';
        END IF;
    END
$$;

ALTER TABLE coach_buddy.team
    ALTER COLUMN season_id SET NOT NULL;

ALTER TABLE coach_buddy.team
    ADD CONSTRAINT fk_team_season
        FOREIGN KEY (season_id)
            REFERENCES coach_buddy.season (id)
            ON DELETE CASCADE;

-- Alte globale Eindeutigkeit von Teamnamen entfernen.
DROP INDEX IF EXISTS coach_buddy.uq_team_name;

-- Teamname soll nur innerhalb einer Saison eindeutig sein.
CREATE UNIQUE INDEX uq_team_season_name
    ON coach_buddy.team (
                         season_id,
                         lower(trim(name))
        );

-- Alte Membership-Indizes/Constraints mit season_id entfernen.
DROP INDEX IF EXISTS coach_buddy.idx_team_membership_season_id;
DROP INDEX IF EXISTS coach_buddy.idx_team_membership_team_season;

ALTER TABLE coach_buddy.team_membership
    DROP CONSTRAINT IF EXISTS uq_team_membership_team_person_season;

ALTER TABLE coach_buddy.team_membership
    DROP CONSTRAINT IF EXISTS fk_team_membership_season;

ALTER TABLE coach_buddy.team_membership
    DROP COLUMN season_id;

-- Eine Person darf pro Team nur einmal Mitglied sein.
CREATE UNIQUE INDEX uq_team_membership_team_person
    ON coach_buddy.team_membership (
                                    team_id,
                                    person_id
        );