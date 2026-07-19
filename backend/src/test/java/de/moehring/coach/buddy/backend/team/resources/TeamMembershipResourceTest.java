package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.support.AuthTestSupport;
import de.moehring.coach.buddy.backend.team.dtos.CreateSeasonRequest;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamRequest;
import de.moehring.coach.buddy.backend.team.dtos.DeactivateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class TeamMembershipResourceTest {

    private static String token;

    @BeforeAll
    static void login() {
        token = AuthTestSupport.adminToken();
    }

    @Test
    void createFindAndDeactivateMembership() {
        String suffix = uniqueSuffix();
        String seasonId = createSeason("Saison " + suffix);
        String teamId = createTeam(seasonId, "Team " + suffix);
        String personId = createPerson("Johannes", suffix);

        String membershipId = given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTeamMembershipRequest(
                        UUID.fromString(teamId),
                        UUID.fromString(personId),
                        TeamMemberRole.PLAYER,
                        LocalDate.of(2026, 1, 1),
                        null
                ))
                .when().post("/api/v1/team-memberships")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("team.id", equalTo(teamId))
                .body("person.id", equalTo(personId))
                .body("role", equalTo("PLAYER"))
                .body("leftAt", equalTo(null))
                .extract().path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("teamId", teamId)
                .when().get("/api/v1/team-memberships")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(membershipId));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("personId", personId)
                .when().get("/api/v1/team-memberships")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(membershipId));

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new DeactivateTeamMembershipRequest(LocalDate.of(2026, 6, 30)))
                .when().patch("/api/v1/team-memberships/{id}/deactivate", membershipId)
                .then()
                .statusCode(200)
                .body("leftAt", equalTo("2026-06-30"));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("teamId", teamId)
                .queryParam("active", true)
                .when().get("/api/v1/team-memberships")
                .then()
                .statusCode(200)
                .body("", hasSize(0));
    }

    private static String createSeason(String name) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateSeasonRequest(name, LocalDate.of(2026, 1, 1)))
                .when().post("/api/v1/seasons")
                .then().statusCode(201)
                .extract().path("id");
    }

    private static String createTeam(String seasonId, String name) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreateTeamRequest(UUID.fromString(seasonId), name, null))
                .when().post("/api/v1/teams")
                .then().statusCode(201)
                .extract().path("id");
    }

    private static String createPerson(String firstName, String lastNameSuffix) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreatePersonRequest(firstName, "Test-" + lastNameSuffix, null, null, null, null))
                .when().post("/api/v1/persons")
                .then().statusCode(201)
                .extract().path("id");
    }

    private static String uniqueSuffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
