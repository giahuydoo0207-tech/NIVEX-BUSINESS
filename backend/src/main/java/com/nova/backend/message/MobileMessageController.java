package com.nova.backend.message;
import com.nova.backend.mobile.MobileSessionAuthenticator; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.util.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/mobile/messages") public class MobileMessageController { private static final UUID ORG=UUID.fromString("00000000-0000-0000-0000-000000000001"); private final MessageRepository repo; private final MobileSessionAuthenticator auth; public MobileMessageController(MessageRepository repo,MobileSessionAuthenticator auth){this.repo=repo;this.auth=auth;}
 @GetMapping public List<MessageThread> list(@RequestHeader(value="Authorization",required=false)String authorization){return repo.contractorThreads(auth.authenticate(authorization).contractorId());}
 @PostMapping("/requests") public MessageThread request(@RequestHeader(value="Authorization",required=false)String authorization,@Valid @RequestBody Send body){return repo.request(ORG,auth.authenticate(authorization).contractorId(),body.body());}
 @PostMapping("/{id}/messages") public ThreadMessage send(@RequestHeader(value="Authorization",required=false)String authorization,@PathVariable UUID id,@Valid @RequestBody Send body){return repo.sendTalent(id,auth.authenticate(authorization).contractorId(),body.body());}
 public record Send(@NotBlank @Size(max=4000)String body){}
}
