CREATE UNIQUE INDEX uq_person_first_name_last_name_birth_date
    ON coach_buddy.person (
                           lower(trim(first_name)),
                           lower(trim(last_name)),
                           COALESCE(birth_date, DATE '0001-01-01')
        );