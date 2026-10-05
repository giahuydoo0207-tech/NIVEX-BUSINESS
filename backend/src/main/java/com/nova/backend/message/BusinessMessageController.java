package com.nova.backend.message;
import jakarta.validation.Valid; import jakarta.validation.constraints.NotBlank; import jakarta.validation.constraints.Size; import java.util.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/messages") public class BusinessMessageController {
 private static final UUID ORG=UUID.fromString("00000000-0000-0000-0000-000000000001"); private final MessageRepository repo; private final TypingRegistry typing; public BusinessMessageController(MessageRepository repo,TypingRegistry typing){this.repo=repo;this.typing=typing;}
 @GetMapping public List<MessageThread> list(@RequestParam(defaultValue="ACCEPTED") String status){String s=status.toUpperCase();if(!List.of("PENDING","ACCEPTED","BLOCKED").contains(s))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Invalid thread status");return repo.businessThreads(ORG,s);}
 @PostMapping("/{id}/accept") public MessageThread accept(@PathVariable UUID id){return repo.decide(id,ORG,"ACCEPTED");}
 @PostMapping("/{id}/decline") public MessageThread decline(@PathVariable UUID id){return repo.decide(id,ORG,"DECLINED");}
 /** Works for a pending request and for an active conversation; history is kept. */
 @PostMapping("/{id}/block") public MessageThread block(@PathVariable UUID id){return repo.block(id,ORG);}
 @PostMapping("/{id}/unblock") public MessageThread unblock(@PathVariable UUID id){return repo.unblock(id,ORG);}
 /** Notifications for this conversation only; stored on the server so a reload keeps the choice. */
 @PostMapping("/{id}/mute") public MessageThread mute(@PathVariable UUID id){return repo.mute(id,ORG,true);}
 @PostMapping("/{id}/unmute") public MessageThread unmute(@PathVariable UUID id){return repo.mute(id,ORG,false);}
 /** "Delete conversation" for the business only: the thread leaves its list, the candidate's copy is untouched. */
 @PostMapping("/{id}/hide") @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void hide(@PathVariable UUID id){repo.hide(id,ORG);}
 @PostMapping("/{id}/read") public MessageThread read(@PathVariable UUID id){return repo.readByBusiness(id,ORG);}
 @PostMapping("/{id}/messages") public ThreadMessage send(@PathVariable UUID id,@Valid @RequestBody Send body){ThreadMessage sent=repo.sendBusiness(id,ORG,body.body());typing.clear(id,"BUSINESS");return sent;}
 /** The business is typing in this thread; expires after a few seconds without another call. */
 @PostMapping("/{id}/typing") @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void typing(@PathVariable UUID id){repo.requireBusinessThread(id,ORG);typing.mark(id,"BUSINESS");}
 /** Whether the candidate is currently typing in this thread. */
 @GetMapping("/{id}/typing") public Typing typingState(@PathVariable UUID id){repo.requireBusinessThread(id,ORG);return new Typing(typing.isTyping(id,"TALENT"));}
 public record Send(@NotBlank @Size(max=4000)String body){}
 public record Typing(boolean typing){}
}
