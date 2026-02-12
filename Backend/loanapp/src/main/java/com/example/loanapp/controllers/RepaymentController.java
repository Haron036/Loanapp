package com.example.loanapp.controllers;

import com.example.loanapp.Entity.Repayment;
import com.example.loanapp.Service.RepaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/repayments")
@RequiredArgsConstructor
public class RepaymentController {

    private final RepaymentService repaymentService;

    /**
     * Processes a payment for a specific installment.
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payInstallment(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            log.info("Payment request received for Repayment ID: {} via {}", id, request.get("paymentMethod"));

            String method = request.getOrDefault("paymentMethod", "WALLET");

            // This calls the service which should initiate the STK Push if method is MPESA
            Repayment updated = repaymentService.processPayment(id, method);

            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("PAYMENT ERROR: {}", e.getMessage());
            // Returning a 400 with the actual error message helps frontend debugging
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * M-Pesa Callback Endpoint
     * SecurityConfig permits this for PUBLIC access so Safaricom can hit it.
     */
    @PostMapping("/mpesa-callback")
    public ResponseEntity<?> handleMpesaCallback(@RequestBody Map<String, Object> payload) {
        try {
            log.info("M-Pesa Callback Received: {}", payload);

            Map<String, Object> body = (Map<String, Object>) payload.get("Body");
            Map<String, Object> stkCallback = (Map<String, Object>) body.get("stkCallback");

            Integer resultCode = (Integer) stkCallback.get("ResultCode");
            String checkoutRequestId = (String) stkCallback.get("CheckoutRequestID");

            if (resultCode == 0) {
                log.info("STK Push Confirmed! CheckoutID: {}", checkoutRequestId);

                // IMPORTANT: You need a method in your service to find the repayment
                // by checkoutRequestId and mark it as PAID.
                repaymentService.completeMpesaPayment(checkoutRequestId);
            } else {
                log.warn("STK Push Failed/Cancelled. Code: {}, Message: {}",
                        resultCode, stkCallback.get("ResultDesc"));
            }

            return ResponseEntity.ok("Callback Processed");
        } catch (Exception e) {
            log.error("Callback Processing Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}