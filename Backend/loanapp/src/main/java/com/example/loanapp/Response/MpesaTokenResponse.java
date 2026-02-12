package com.example.loanapp.Response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MpesaTokenResponse {
    @JsonProperty("access_token") private String accessToken;
    @JsonProperty("expires_in") private String expiresIn;
}
