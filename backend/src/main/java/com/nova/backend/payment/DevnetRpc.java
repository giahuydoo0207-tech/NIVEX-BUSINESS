package com.nova.backend.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Component
public class DevnetRpc {
    public static final String GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
    public static final String MINT = "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k";
    public static final String TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    private final ObjectMapper mapper;
    private final URI endpoint;

    public DevnetRpc(ObjectMapper mapper, @Value("${nova.solana.rpc-url:https://api.devnet.solana.com}") String url) {
        this.mapper = mapper;
        this.endpoint = URI.create(url);
    }

    public JsonNode call(String method, List<?> params) {
        try {
            var body = mapper.writeValueAsString(Map.of("jsonrpc", "2.0", "id", 1, "method", method, "params", params));
            var connection = (java.net.HttpURLConnection) endpoint.toURL().openConnection();
            try {
                connection.setConnectTimeout(8000);
                connection.setReadTimeout(15000);
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                try (var output = connection.getOutputStream()) { output.write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
                if (connection.getResponseCode() != 200) throw new IllegalStateException();
                byte[] bytes;
                try (var input = connection.getInputStream()) { bytes = input.readNBytes(2_000_001); }
                if (bytes.length > 2_000_000) throw new IllegalStateException();
                var json = mapper.readTree(bytes);
                if (json.hasNonNull("error") || !json.has("result")) throw new IllegalStateException();
                return json.get("result");
            } finally { connection.disconnect(); }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Devnet RPC unavailable; retry verification, not payment");
        }
    }

    public void requireDevnet() {
        if (!GENESIS.equals(call("getGenesisHash", List.of()).asText())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "RPC is not Solana Devnet");
        }
    }
}
