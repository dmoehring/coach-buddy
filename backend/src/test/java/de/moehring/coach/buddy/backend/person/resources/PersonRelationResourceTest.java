package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRelationRequest;
import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.person.util.RelationType;
import de.moehring.coach.buddy.backend.support.AuthTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

@QuarkusTest
class PersonRelationResourceTest {

    private static String token;

    @BeforeAll
    static void login() {
        token = AuthTestSupport.adminToken();
    }

    @Test
    void createFindAndDeleteRelation() {
        String suffix = uniqueLastName();
        String childId = createPerson("Kind", suffix);
        String motherId = createPerson("Mutter", suffix);

        String relationId = given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreatePersonRelationRequest(
                        UUID.fromString(childId),
                        UUID.fromString(motherId),
                        RelationType.MOTHER
                ))
                .when().post("/api/v1/person-relations")
                .then()
                .statusCode(201)
                .body("childPerson.id", equalTo(childId))
                .body("guardianPerson.id", equalTo(motherId))
                .body("relationType", equalTo("MOTHER"))
                .extract().path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("childPersonId", childId)
                .when().get("/api/v1/person-relations")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(relationId));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("guardianPersonId", motherId)
                .when().get("/api/v1/person-relations")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(relationId));

        given()
                .header("Authorization", "Bearer " + token)
                .when().delete("/api/v1/person-relations/{id}", relationId)
                .then()
                .statusCode(204);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("childPersonId", childId)
                .when().get("/api/v1/person-relations")
                .then()
                .statusCode(200)
                .body("", hasSize(0));
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

    private static String uniqueLastName() {
        return "Test-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
