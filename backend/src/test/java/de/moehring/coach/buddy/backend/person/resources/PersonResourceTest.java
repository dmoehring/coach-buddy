package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRelationRequest;
import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.person.dtos.CreatePhoneNumberRequest;
import de.moehring.coach.buddy.backend.person.util.PhoneType;
import de.moehring.coach.buddy.backend.person.util.RelationType;
import de.moehring.coach.buddy.backend.support.AuthTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class PersonResourceTest {

    private static String token;

    @BeforeAll
    static void login() {
        token = AuthTestSupport.adminToken();
    }

    @Test
    void createPersonWithPhoneNumbersReturnsCreatedPerson() {
        String lastName = uniqueLastName();

        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreatePersonRequest(
                        "Johannes",
                        lastName,
                        null,
                        null,
                        null,
                        List.of(new CreatePhoneNumberRequest(PhoneType.MOBILE, "0151 2345678"))
                ))
                .when().post("/api/v1/persons")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("firstName", equalTo("Johannes"))
                .body("lastName", equalTo(lastName))
                .body("phoneNumbers[0].type", equalTo("MOBILE"))
                .body("phoneNumbers[0].number", equalTo("0151 2345678"));
    }

    @Test
    void findByIdReturnsCreatedPerson() {
        String lastName = uniqueLastName();
        String personId = createPerson("Dominik", lastName);

        given()
                .header("Authorization", "Bearer " + token)
                .when().get("/api/v1/persons/{id}", personId)
                .then()
                .statusCode(200)
                .body("id", equalTo(personId))
                .body("lastName", equalTo(lastName));
    }

    @Test
    void findAllFiltersByLastName() {
        String lastName = uniqueLastName();
        createPerson("Juliane", lastName);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("lastName", lastName)
                .when().get("/api/v1/persons")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].lastName", equalTo(lastName));
    }

    @Test
    void findAllChildrenGroupsGuardiansByRelationType() {
        String suffix = uniqueLastName();
        String childId = createPerson("Kind", suffix);
        String motherId = createPerson("Mutter", suffix);
        String fatherId = createPerson("Vater", suffix);

        createRelation(childId, motherId, RelationType.MOTHER);
        createRelation(childId, fatherId, RelationType.FATHER);

        given()
                .header("Authorization", "Bearer " + token)
                .when().get("/api/v1/persons/children")
                .then()
                .statusCode(200)
                .body("find { it.child.id == '" + childId + "' }.guardians.MOTHER[0].id", equalTo(motherId))
                .body("find { it.child.id == '" + childId + "' }.guardians.FATHER[0].id", equalTo(fatherId));
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

    private static void createRelation(String childId, String guardianId, RelationType relationType) {
        given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(new CreatePersonRelationRequest(
                        UUID.fromString(childId),
                        UUID.fromString(guardianId),
                        relationType
                ))
                .when().post("/api/v1/person-relations")
                .then().statusCode(201);
    }

    private static String uniqueLastName() {
        return "Test-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
