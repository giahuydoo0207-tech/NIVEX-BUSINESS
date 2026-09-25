package com.nova.backend.message;
import jakarta.validation.Valid; import jakarta.validation.constraints.NotBlank; import jakarta.validation.constraints.Size; import java.util.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/messages") public class BusinessMessageController {
 private static final UUID ORG=UUID.fromString("00000000-0000-0000-0000-000000000001"); private final MessageRepository repo; public BusinessMessageController(MessageRepository repo){this.repo=repo;}
 @GetMapping public List<MessageThread> list(@RequestParam(defaultValue="ACCEPTED") String status){String s=status.toUpperCase();if(!List.of("PENDING","ACCEPTED").contains(s))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Invalid thread status");return repo.businessThreads(ORG,s);}
 @PostMapping("/{id}/accept") public MessageThread accept(@PathVariable UUID id){return repo.decide(id,ORG,"ACCEPTED");}
 @PostMapping("/{id}/decline") public MessageThread decline(@PathVariable UUID id){return repo.decide(id,ORG,"DECLINED");}
 @PostMapping("/{id}/block") public MessageThread block(@PathVariable UUID id){return repo.decide(id,ORG,"BLOCKED");}
 @PostMapping("/{id}/messages") public ThreadMessage send(@PathVariable UUID id,@Valid @RequestBody Send body){return repo.sendBusiness(id,ORG,body.body());}
 public record Send(@NotBlank @Size(max=4000)String body){}
}
