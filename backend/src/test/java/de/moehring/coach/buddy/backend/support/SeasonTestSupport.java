package de.moehring.coach.buddy.backend.support;

import java.time.LocalDate;
import java.util.List;

import static io.restassured.RestAssured.given;

/**
 * Tests share one database and creating a season closes the open one, so a new season
 * must always start after the currently open season instead of at a fixed date.
 */
public final class SeasonTestSupport {

    private SeasonTestSupport() {
    }

    public static LocalDate nextSeasonStartDate(String token) {
        List<String> openStartDates = given()
                .header("Authorization", "Bearer " + token)
                .when().get("/api/v1/seasons")
                .then().statusCode(200)
                .extract().jsonPath().getList("findAll { it.endDate == null }.startDate");

        return openStartDates.stream()
                .map(LocalDate::parse)
                .max(LocalDate::compareTo)
                .map(date -> date.plusDays(1))
                .orElse(LocalDate.of(2026, 1, 1));
    }
}
