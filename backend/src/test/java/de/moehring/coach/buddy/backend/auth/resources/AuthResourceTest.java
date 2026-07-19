package de.moehring.coach.buddy.backend.auth.resources;

import de.moehring.coach.buddy.backend.auth.dtos.LoginRequest;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class AuthResourceTest {

    @Test
    void loginWithValidCredentialsReturnsToken() {
        given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest("admin", "ChangeMe123!"))
                .when().post("/api/v1/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("username", equalTo("admin"))
                .body("displayName", equalTo("Administrator"));
    }

    @Test
    void loginWithWrongPasswordIsUnauthorized() {
        given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest("admin", "wrong-password"))
                .when().post("/api/v1/auth/login")
                .then()
                .statusCode(401);
    }

    @Test
    void loginWithUnknownUsernameIsUnauthorized() {
        given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest("does-not-exist", "whatever"))
                .when().post("/api/v1/auth/login")
                .then()
                .statusCode(401);
    }
}
