package com.nova.backend.credential;

import com.nova.backend.businessprofile.BusinessProfile;
import com.nova.backend.businessprofile.BusinessProfileRepository;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Manages the current Business organization's Nova ID and Nova Key.
 * Like the rest of /api/v1/business, it is guarded only by the server-side demo key and always acts on the
 * demo organization; it needs Business-member authentication before production.
 */
@RestController
@RequestMapping("/api/v1/business/nova-credentials")
public class BusinessNovaCredentialController {
    private final NovaCredentialService credentials;
    private final BusinessProfileRepository profiles;

    public BusinessNovaCredentialController(NovaCredentialService credentials, BusinessProfileRepository profiles) {
        this.credentials = credentials;
        this.profiles = profiles;
    }

    @GetMapping
    public ResponseEntity<CredentialView> status() {
        return noStore(view(credentials.status(currentOrganization())));
    }

    /** Creates or rotates the key. The plaintext appears in this response only. */
    @PostMapping("/key")
    public ResponseEntity<IssuedKeyView> issueKey() {
        NovaCredentialService.IssuedKey issued = credentials.issueKey(currentOrganization());
        return noStore(new IssuedKeyView(issued.novaKey(), view(issued.credential())));
    }

    @DeleteMapping("/key")
    public ResponseEntity<CredentialView> revokeKey() {
        return noStore(view(credentials.revokeKey(currentOrganization())));
    }

    private UUID currentOrganization() { return BusinessProfileRepository.NOVA_LABS_ID; }

    private CredentialView view(NovaCredentialService.Credential credential) {
        BusinessProfile profile = profiles.find(credential.organizationId()).orElseThrow();
        return new CredentialView(
            new Organization(profile.organizationId(), profile.handle(), profile.name(), profile.verified(), profile.avatarUrl()),
            credential.novaId(), credential.novaIdIssuedAt(), credential.key(), credential.updatedAt());
    }

    private static <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }

    public record Organization(UUID id, String handle, String name, boolean verified, String avatarUrl) {}
    public record CredentialView(Organization organization, String novaId, java.time.Instant novaIdIssuedAt,
                                 NovaCredentialService.KeyState key, java.time.Instant updatedAt) {}
    public record IssuedKeyView(String novaKey, CredentialView credential) {}
}
