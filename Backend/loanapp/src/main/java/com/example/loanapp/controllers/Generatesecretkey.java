package com.example.loanapp.controllers;

import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Base64;

public class Generatesecretkey {


        public static void main(String[] args) {
            SecretKey key = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS512);
            String base64Key = Base64.getEncoder().encodeToString(key.getEncoded());
            System.out.println("Generated secret: " + base64Key);
        }

}
