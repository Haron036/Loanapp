package com.example.loanapp.Exception;

public class LoanProcessingException extends RuntimeException{
    public LoanProcessingException(String message) {
        super(message);
    }
}
