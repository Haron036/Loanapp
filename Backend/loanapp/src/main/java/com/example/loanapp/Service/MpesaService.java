package com.example.loanapp.Service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
public class MpesaService {

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${mpesa.consumer.key}") private String consumerKey;
    @Value("${mpesa.consumer.secret}") private String consumerSecret;
    @Value("${mpesa.shortcode}") private String businessShortCode;
    @Value("${mpesa.passkey}") private String passkey;
    @Value("${mpesa.callback.url}") private String callbackUrl;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MpesaTokenResponse {
        @JsonProperty("access_token") private String accessToken;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MpesaStkResponse {
        @JsonProperty("CheckoutRequestID") private String checkoutRequestID;
        @JsonProperty("ResponseCode") private String responseCode;
        @JsonProperty("CustomerMessage") private String customerMessage;
        @JsonProperty("ResponseDescription") private String responseDescription;
        @JsonProperty("errorMessage") private String errorMessage;
        @JsonProperty("errorCode") private String errorCode;
    }

    private String formatPhone(String phone) {
        if (phone == null) return "";
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.startsWith("0")) return "254" + clean.substring(1);
        if (clean.startsWith("7") || clean.startsWith("1")) return "254" + clean;
        return clean;
    }

    public String getAccessToken() throws IOException {
        // Clean credentials to avoid "Invalid Access Token" due to trailing spaces
        String auth = consumerKey.trim() + ":" + consumerSecret.trim();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

        Request request = new Request.Builder()
                .url("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials")
                .get()
                .addHeader("Authorization", "Basic " + encodedAuth)
                .addHeader("Cache-Control", "no-cache")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String body = Objects.requireNonNull(response.body()).string();
            if (!response.isSuccessful()) {
                log.error("Auth Failed: {} - {}", response.code(), body);
                throw new IOException("Mpesa Auth Failed");
            }
            MpesaTokenResponse res = objectMapper.readValue(body, MpesaTokenResponse.class);
            return res.getAccessToken().trim();
        }
    }

    public String initiateStkPush(String phoneNumber, BigDecimal amount, String repaymentId) {
        try {
            // 1. Get a fresh token and ensure it's clean
            String token = getAccessToken();

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String password = Base64.getEncoder().encodeToString((businessShortCode.trim() + passkey.trim() + timestamp).getBytes());
            String formattedPhone = formatPhone(phoneNumber);
            String accountRef = "PAY" + (repaymentId.length() > 8 ? repaymentId.substring(repaymentId.length()-8) : repaymentId);

            // 2. Build Payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("BusinessShortCode", businessShortCode.trim());
            payload.put("Password", password);
            payload.put("Timestamp", timestamp);
            payload.put("TransactionType", "CustomerPayBillOnline");
            payload.put("Amount", amount.intValue() <= 0 ? 1 : amount.intValue());
            payload.put("PartyA", formattedPhone);
            payload.put("PartyB", businessShortCode.trim());
            payload.put("PhoneNumber", formattedPhone);
            payload.put("CallBackURL", callbackUrl.trim());
            payload.put("AccountReference", accountRef);
            payload.put("TransactionDesc", "LoanPayment");

            String jsonBody = objectMapper.writeValueAsString(payload);
            log.info("STK Push Request for {}: {}", formattedPhone, jsonBody);

            // 3. Execute Request with explicit Content-Type
            RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest")
                    .post(body)
                    .addHeader("Authorization", "Bearer " + token)
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String rawJson = Objects.requireNonNull(response.body()).string();
                log.info("Mpesa STK Response: {}", rawJson);

                MpesaStkResponse res = objectMapper.readValue(rawJson, MpesaStkResponse.class);

                if (response.isSuccessful() && "0".equals(res.getResponseCode())) {
                    log.info("STK Push Success! CheckoutID: {}", res.getCheckoutRequestID());
                    return res.getCheckoutRequestID();
                } else {
                    // Handle various M-Pesa error formats
                    String errorMsg = res.getErrorMessage() != null ? res.getErrorMessage() :
                            (res.getResponseDescription() != null ? res.getResponseDescription() : "Unknown Mpesa Error");
                    log.error("Mpesa rejected: {} (Code: {})", errorMsg, res.getResponseCode());
                    throw new RuntimeException(errorMsg);
                }
            }
        } catch (Exception e) {
            log.error("STK Push Flow Error: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
}