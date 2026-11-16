package de.moehring.coach.buddy.backend.training.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.support.AuthTestSupport;
import de.moehring.coach.buddy.backend.team.dtos.CreateSeasonRequest;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamRequest;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingRequest;
import de.moehring.coach.buddy.backend.training.dtos.UpdateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.dtos.UpdateTrainingRequest;
import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingType;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class TrainingResourceTest {

    private static String token;
    private static String teamId;

    // Not @BeforeAll: Quarkus points RestAssured at the test port only right
    // before each test, so a static login would hit the default port 8080.
    @BeforeEach
    void login() {
        if (token == null) {
            token = AuthTestSupport.adminToken();
        }
        if (teamId == null) {
            teamId = createTeam();
        }
    }

    @Test
    void updateTrainingChangesFieldsButKeepsTeam() {
        String trainingId = createTraining(teamId);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingRequest(
                        null,
                        null,
                        LocalDate.of(2026, 3, 12),
                        LocalTime.of(18, 0),
                        LocalTime.of(19, 30),
                        "  Realschulhalle  ",
                        "   ",
                        TrainingStatus.CANCELLED
                ))
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(200)
                .body("id", equalTo(trainingId))
                .body("team.id", equalTo(teamId))
                .body("trainingDate", equalTo("2026-03-12"))
                .body("startTime", equalTo("18:00:00"))
                .body("endTime", equalTo("19:30:00"))
                .body("location", equalTo("Realschulhalle"))
                .body("notes", equalTo(null))
                .body("status", equalTo("CANCELLED"));

        given()
                .header("Authorization", "Bearer " + token)
                .when().get("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CANCELLED"))
                .body("team.id", equalTo(teamId));
    }

    @Test
    void cancellingTrainingKeepsRecordedParticipants() {
        String trainingId = createTraining(teamId);
        String personId = createPerson();

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingParticipantRequest(
                        UUID.fromString(trainingId),
                        UUID.fromString(personId),
                        AttendanceStatus.PRESENT,
                        null,
                        null,
                        null,
                        null
                ))
                .when().post("/api/v1/training-participants")
                .then()
                .statusCode(201);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingRequest(
                        null,
                        null,
                        LocalDate.of(2026, 3, 10),
                        null,
                        null,
                        null,
                        null,
                        TrainingStatus.CANCELLED
                ))
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CANCELLED"));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("trainingId", trainingId)
                .when().get("/api/v1/training-participants")
                .then()
                .statusCode(200)
                .body("", hasSize(1));
    }

    @Test
    void updateRejectsEndTimeBeforeStartTime() {
        String trainingId = createTraining(teamId);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingRequest(
                        null,
                        null,
                        LocalDate.of(2026, 3, 10),
                        LocalTime.of(19, 0),
                        LocalTime.of(18, 0),
                        null,
                        null,
                        TrainingStatus.COMPLETED
                ))
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(400);
    }

    @Test
    void updateRequiresStatusAndDate() {
        String trainingId = createTraining(teamId);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body("{\"trainingDate\":\"2026-03-10\"}")
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body("{\"status\":\"CANCELLED\"}")
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(400);
    }

    @Test
    void updateUnknownTrainingReturnsNotFound() {
        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingRequest(
                        null,
                        null,
                        LocalDate.of(2026, 3, 10),
                        null,
                        null,
                        null,
                        null,
                        TrainingStatus.COMPLETED
                ))
                .when().put("/api/v1/trainings/{id}", UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void gameDayStoresJerseyAndPlayingTimesPerParticipant() {
        String trainingId = given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingRequest(
                        UUID.fromString(teamId),
                        TrainingType.GAME_DAY,
                        "  Spielfest in Musterstadt  ",
                        LocalDate.of(2026, 5, 16),
                        null, null, null, null,
                        TrainingStatus.COMPLETED
                ))
                .when().post("/api/v1/trainings")
                .then()
                .statusCode(201)
                .body("type", equalTo("GAME_DAY"))
                .body("title", equalTo("Spielfest in Musterstadt"))
                .extract().path("id");

        String participantId = given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingParticipantRequest(
                        UUID.fromString(trainingId),
                        UUID.fromString(createPerson()),
                        AttendanceStatus.PRESENT,
                        7, 30, 10, "Hat im Tor angefangen"
                ))
                .when().post("/api/v1/training-participants")
                .then()
                .statusCode(201)
                .body("jerseyNumber", equalTo(7))
                .body("minutesPlayed", equalTo(30))
                .body("minutesInGoal", equalTo(10))
                .extract().path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingParticipantRequest(AttendanceStatus.PRESENT, 11, 40, 0, null))
                .when().patch("/api/v1/training-participants/{id}", participantId)
                .then()
                .statusCode(200)
                .body("jerseyNumber", equalTo(11))
                .body("minutesPlayed", equalTo(40))
                .body("minutesInGoal", equalTo(0))
                .body("notes", equalTo(null));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("type", "GAME_DAY")
                .queryParam("teamId", teamId)
                .when().get("/api/v1/trainings")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(trainingId));
    }

    @Test
    void participantRejectsOutOfRangeValues() {
        String trainingId = createTraining(teamId);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingParticipantRequest(
                        UUID.fromString(trainingId),
                        UUID.fromString(createPerson()),
                        AttendanceStatus.PRESENT,
                        -1, null, null, null
                ))
                .when().post("/api/v1/training-participants")
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingParticipantRequest(
                        UUID.fromString(trainingId),
                        UUID.fromString(createPerson()),
                        AttendanceStatus.PRESENT,
                        null, 1000, null, null
                ))
                .when().post("/api/v1/training-participants")
                .then()
                .statusCode(400);
    }

    @Test
    void updateKeepsTypeWhenOmitted() {
        String trainingId = createTraining(teamId);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingRequest(
                        TrainingType.GAME_DAY, "Turnier", LocalDate.of(2026, 3, 10), null, null, null, null,
                        TrainingStatus.COMPLETED))
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(200)
                .body("type", equalTo("GAME_DAY"))
                .body("title", equalTo("Turnier"));

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new UpdateTrainingRequest(
                        null, null, LocalDate.of(2026, 3, 10), null, null, null, null,
                        TrainingStatus.CANCELLED))
                .when().put("/api/v1/trainings/{id}", trainingId)
                .then()
                .statusCode(200)
                .body("type", equalTo("GAME_DAY"))
                .body("title", equalTo(null));
    }

    private static String createTraining(String teamId) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingRequest(
                        UUID.fromString(teamId),
                        null,
                        null,
                        LocalDate.of(2026, 3, 10),
                        LocalTime.of(17, 30),
                        LocalTime.of(19, 0),
                        "Sporthalle",
                        "Notiz",
                        TrainingStatus.COMPLETED
                ))
                .when().post("/api/v1/trainings")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .extract().path("id");
    }

    private static String createTeam() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        String seasonId = given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateSeasonRequest("Saison " + suffix, nextSeasonStartDate()))
                .when().post("/api/v1/seasons")
                .then().statusCode(201)
                .extract().path("id");

        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTeamRequest(UUID.fromString(seasonId), "Team " + suffix, null))
                .when().post("/api/v1/teams")
                .then().statusCode(201)
                .extract().path("id");
    }

    /** A new season has to start after the currently open one (which it closes). */
    private static LocalDate nextSeasonStartDate() {
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

    private static String createPerson() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreatePersonRequest("Max", "Test-" + suffix, null, null, null, null))
                .when().post("/api/v1/persons")
                .then().statusCode(201)
                .extract().path("id");
    }
}
