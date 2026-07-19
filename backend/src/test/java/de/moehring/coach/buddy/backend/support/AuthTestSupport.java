package de.moehring.coach.buddy.backend.support;

import de.moehring.coach.buddy.backend.auth.dtos.LoginRequest;
import io.restassured.http.ContentType;

import static io.restassured.RestAssured.given;

/**
 * Logs in as the Flyway-seeded admin account so tests can call authenticated
 * endpoints with a real token instead of mocking security.
 */
public final class AuthTestSupport {

    private static final String SEED_USERNAME = "admin";
    private static final String SEED_PASSWORD = "ChangeMe123!";

    private AuthTestSupport() {
    }

    public static String adminToken() {
        return given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(SEED_USERNAME, SEED_PASSWORD))
                .when().post("/api/v1/auth/login")
                .then().statusCode(200)
                .extract().path("token");
    }
}
