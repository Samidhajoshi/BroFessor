package com.skillify.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown by the service layer for expected business-rule failures
 * (not found, not enough points, wrong owner, etc). Carries an HTTP
 * status so GlobalExceptionHandler can map it straight to a response.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
