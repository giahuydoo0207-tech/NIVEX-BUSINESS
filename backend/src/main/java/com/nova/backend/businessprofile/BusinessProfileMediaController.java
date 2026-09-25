package com.nova.backend.businessprofile;

import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Asset URLs can be embedded in img tags; IDs are opaque and contain no private profile data. */
@RestController
public class BusinessProfileMediaController {
    private final BusinessProfileRepository repository;
    public BusinessProfileMediaController(BusinessProfileRepository repository) { this.repository = repository; }

    @GetMapping("/media/business-profile/{assetId}")
    public ResponseEntity<byte[]> asset(@PathVariable UUID assetId) {
        BusinessProfileAsset asset = repository.asset(assetId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile asset not found"));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(asset.contentType()))
            .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(30)).cachePublic())
            .body(asset.content());
    }
}
