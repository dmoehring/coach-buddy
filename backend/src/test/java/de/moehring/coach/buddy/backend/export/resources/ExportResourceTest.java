package de.moehring.coach.buddy.backend.export.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.support.AuthTestSupport;
import de.moehring.coach.buddy.backend.support.SeasonTestSupport;
import de.moehring.coach.buddy.backend.team.dtos.CreateSeasonRequest;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamRequest;
import de.moehring.coach.buddy.backend.team.dtos.DeactivateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingRequest;
import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingType;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
class ExportResourceTest {

    private static final String BOM = "﻿";

    private static String token;

    @BeforeEach
    void login() {
        if (token == null) {
            token = AuthTestSupport.adminToken();
        }
    }

    @Test
    void exportsOnlyActiveMembersByDefault() {
        String suffix = suffix();
        String teamId = createTeam(suffix);
        String activeId = createPerson("Aktiv", "Mitglied" + suffix);
        String leftId = createPerson("Ehemalig", "Mitglied" + suffix);

        addMember(teamId, activeId, TeamMemberRole.PLAYER);
        String leftMembershipId = addMember(teamId, leftId, TeamMemberRole.PLAYER);

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new DeactivateTeamMembershipRequest(LocalDate.now()))
                .when().patch("/api/v1/team-memberships/{id}/deactivate", leftMembershipId)
                .then().statusCode(200);

        String activeOnly = download("/api/v1/exports/members", "teamId", teamId);
        assertThat(activeOnly, startsWith(BOM + "Nachname;Vorname;"));
        assertThat(activeOnly, containsString("Mitglied" + suffix + ";Aktiv;"));
        assertThat(activeOnly, not(containsString(";Ehemalig;")));

        String everyone = given()
                .header("Authorization", "Bearer " + token)
                .queryParam("teamId", teamId)
                .queryParam("activeOnly", false)
                .when().get("/api/v1/exports/members")
                .then().statusCode(200)
                .extract().asString();
        assertThat(everyone, containsString(";Ehemalig;"));
    }

    @Test
    void exportsGameDayParticipantsWithJerseyAndPlayingTimes() {
        String suffix = suffix();
        String teamId = createTeam(suffix);
        String firstId = createPerson("Anna", "Torfrau" + suffix);
        String secondId = createPerson("Ben", "Stürmer" + suffix);
        String absentId = createPerson("Cem", "Fehlt" + suffix);
        addMember(teamId, firstId, TeamMemberRole.PLAYER);
        addMember(teamId, secondId, TeamMemberRole.PLAYER);
        addMember(teamId, absentId, TeamMemberRole.PLAYER);

        String trainingId = createTraining(teamId, TrainingType.GAME_DAY, "Spielfest Öschelbronn");
        addParticipant(trainingId, secondId, AttendanceStatus.PRESENT, 9, 40, 0, "Hat durchgespielt");
        addParticipant(trainingId, firstId, AttendanceStatus.PRESENT, 1, 40, 25, null);
        addParticipant(trainingId, absentId, AttendanceStatus.EXCUSED, null, null, null, null);

        String csv = download("/api/v1/exports/trainings/" + trainingId + "/participants", null, null);
        List<String> lines = csv.substring(BOM.length()).lines().toList();

        assertEquals("Nachname;Vorname;Geburtsdatum;Rolle;Anwesenheit;Trikotnummer;Spielzeit (Min.);Im Tor (Min.);Notiz", lines.get(0));
        assertEquals(3, lines.size(), "header plus the two present participants");
        assertEquals("Torfrau" + suffix + ";Anna;;Spieler;Anwesend;1;40;25;", lines.get(1));
        assertEquals("Stürmer" + suffix + ";Ben;;Spieler;Anwesend;9;40;0;Hat durchgespielt", lines.get(2));
    }

    @Test
    void trainingExportOmitsGameDayColumnsAndCanIncludeAbsentPeople() {
        String suffix = suffix();
        String teamId = createTeam(suffix);
        String presentId = createPerson("Da", "Anwesend" + suffix);
        String excusedId = createPerson("Nicht", "Da" + suffix);
        addMember(teamId, presentId, TeamMemberRole.PLAYER);
        addMember(teamId, excusedId, TeamMemberRole.PLAYER);

        String trainingId = createTraining(teamId, TrainingType.TRAINING, null);
        addParticipant(trainingId, presentId, AttendanceStatus.PRESENT, null, null, null, null);
        addParticipant(trainingId, excusedId, AttendanceStatus.EXCUSED, null, null, null, null);

        String presentOnly = download("/api/v1/exports/trainings/" + trainingId + "/participants", null, null);
        assertThat(presentOnly, startsWith(BOM + "Nachname;Vorname;Geburtsdatum;Rolle;Anwesenheit;Notiz"));
        assertEquals(2, presentOnly.lines().count());

        String all = given()
                .header("Authorization", "Bearer " + token)
                .queryParam("onlyPresent", false)
                .when().get("/api/v1/exports/trainings/{id}/participants", trainingId)
                .then().statusCode(200)
                .extract().asString();
        assertEquals(3, all.lines().count());
        assertThat(all, containsString("Entschuldigt"));
    }

    @Test
    void exportsAttendanceMatrixWithQuota() {
        String suffix = suffix();
        String teamId = createTeam(suffix);
        String personId = createPerson("Regelmäßig", "Dabei" + suffix);
        addMember(teamId, personId, TeamMemberRole.PLAYER);

        String first = createTraining(teamId, TrainingType.TRAINING, null);
        String second = createTraining(teamId, TrainingType.GAME_DAY, null, LocalDate.of(2026, 3, 17));
        addParticipant(first, personId, AttendanceStatus.PRESENT, null, null, null, null);
        addParticipant(second, personId, AttendanceStatus.ABSENT, null, null, null, null);

        String csv = download("/api/v1/exports/teams/" + teamId + "/attendance", null, null);
        List<String> lines = csv.substring(BOM.length()).lines().toList();

        assertEquals(2, lines.size());
        assertThat(lines.get(0), containsString("(Spielfest)"));
        assertThat(lines.get(0), containsString("Anwesenheitsquote"));
        assertThat(lines.get(1), startsWith("Dabei" + suffix + ";Regelmäßig;Spieler;Anwesend;Unentschuldigt;1;0;1;0;50 %"));
    }

    @Test
    void unknownTrainingOrTeamReturnsNotFound() {
        given().header("Authorization", "Bearer " + token)
                .when().get("/api/v1/exports/trainings/{id}/participants", UUID.randomUUID())
                .then().statusCode(404);
        given().header("Authorization", "Bearer " + token)
                .when().get("/api/v1/exports/teams/{id}/attendance", UUID.randomUUID())
                .then().statusCode(404);
        given().header("Authorization", "Bearer " + token)
                .queryParam("teamId", UUID.randomUUID())
                .when().get("/api/v1/exports/members")
                .then().statusCode(404);
    }

    @Test
    void exportsRequireAuthentication() {
        given().when().get("/api/v1/exports/members").then().statusCode(401);
    }

    private static String download(String path, String queryName, String queryValue) {
        var request = given().header("Authorization", "Bearer " + token);
        if (queryName != null) {
            request = request.queryParam(queryName, queryValue);
        }
        var response = request.when().get(path).then()
                .statusCode(200)
                .header("Content-Type", containsString("text/csv"))
                .header("Content-Disposition", containsString("attachment; filename=\""))
                .extract();
        return new String(response.asByteArray(), StandardCharsets.UTF_8);
    }

    private static String suffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private static String createTeam(String suffix) {
        String seasonId = given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateSeasonRequest("Saison " + suffix, SeasonTestSupport.nextSeasonStartDate(token)))
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

    private static String createPerson(String firstName, String lastName) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreatePersonRequest(firstName, lastName, null, null, null, null))
                .when().post("/api/v1/persons")
                .then().statusCode(201)
                .extract().path("id");
    }

    private static String addMember(String teamId, String personId, TeamMemberRole role) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTeamMembershipRequest(
                        UUID.fromString(teamId), UUID.fromString(personId), role, LocalDate.of(2026, 1, 1), null))
                .when().post("/api/v1/team-memberships")
                .then().statusCode(201)
                .extract().path("id");
    }

    private static String createTraining(String teamId, TrainingType type, String title) {
        return createTraining(teamId, type, title, LocalDate.of(2026, 3, 10));
    }

    private static String createTraining(String teamId, TrainingType type, String title, LocalDate date) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingRequest(
                        UUID.fromString(teamId), type, title, date,
                        null, null, null, null, TrainingStatus.COMPLETED))
                .when().post("/api/v1/trainings")
                .then().statusCode(201)
                .extract().path("id");
    }

    private static void addParticipant(String trainingId, String personId, AttendanceStatus status,
                                       Integer jersey, Integer played, Integer inGoal, String notes) {
        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTrainingParticipantRequest(
                        UUID.fromString(trainingId), UUID.fromString(personId), status, jersey, played, inGoal, notes))
                .when().post("/api/v1/training-participants")
                .then().statusCode(201);
    }
}
