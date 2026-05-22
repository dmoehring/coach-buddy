package de.moehring.coach.buddy.backend.person.exceptions;

public class BadRequestException extends RuntimeException{
    public BadRequestException(String message) {
        super(message);
    }
}
