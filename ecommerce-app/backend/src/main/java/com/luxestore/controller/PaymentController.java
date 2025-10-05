package com.luxestore.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private String stripeApiKey = "123456789999000000000000000000";

    @PostMapping("/create-payment-intent")
    public Map<String, Object> createPaymentIntent(@RequestBody Map<String, Object> request) throws Exception {
        Stripe.apiKey = stripeApiKey;

        long amount = Long.parseLong(request.get("amount").toString()); // in cents

        PaymentIntentCreateParams params =
            PaymentIntentCreateParams.builder()
                .setAmount(amount) // e.g. 5000 = $50.00
                .setCurrency("usd")
                .addPaymentMethodType("card")
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, Object> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());

        return response;
    }
}

