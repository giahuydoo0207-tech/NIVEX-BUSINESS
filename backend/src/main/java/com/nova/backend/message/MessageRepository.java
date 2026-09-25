package com.nova.backend.message;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.nova.backend.notification.NotificationRepository;

@Repository
public class MessageRepository {
    private final JdbcTemplate jdbc;
    private final NotificationRepository notifications;
    public MessageRepository(JdbcTemplate jdbc, NotificationRepository notifications) { this.jdbc = jdbc; this.notifications = notifications; }

    public List<MessageThread> businessThreads(UUID organizationId, String status) { return jdbc.query(threadSelect() + " where t.organization_id=? and t.request_status=? order by t.updated_at desc", this::mapThread, organizationId, status); }
    @Transactional public List<MessageThread> contractorThreads(String contractorId) {
        jdbc.update("update thread_messages m set delivered_at=coalesce(delivered_at,now()), seen_at=coalesce(seen_at,now()) from message_threads t where m.thread_id=t.id and t.contractor_id=? and t.request_status='ACCEPTED' and m.sender_type='BUSINESS'", contractorId);
        return jdbc.query(threadSelect() + " where t.contractor_id=? and t.request_status in ('PENDING','ACCEPTED') order by t.updated_at desc", this::mapThread, contractorId);
    }
    @Transactional public MessageThread request(UUID organizationId, String contractorId, String body) {
        var existing=jdbc.query("select id, request_status from message_threads where organization_id=? and contractor_id=?", (rs,row)->new Object[]{rs.getObject(1,UUID.class),rs.getString(2)}, organizationId,contractorId);
        UUID id;
        if(existing.isEmpty()){ id=UUID.randomUUID(); jdbc.update("insert into message_threads(id,organization_id,contractor_id,request_status) values(?,?,?,'PENDING')",id,organizationId,contractorId); }
        else { id=(UUID)existing.getFirst()[0]; String status=(String)existing.getFirst()[1]; if("BLOCKED".equals(status))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You cannot contact this business"); if("ACCEPTED".equals(status))throw new ResponseStatusException(HttpStatus.CONFLICT,"Use the existing conversation"); jdbc.update("update message_threads set request_status='PENDING',updated_at=now() where id=?",id); }
        message(id,"TALENT",body); notifications.business(organizationId,"MESSAGE_REQUEST","Yêu cầu tin nhắn mới","Có một yêu cầu tin nhắn đang chờ xử lý","{\"threadId\":\""+id+"\"}"); return thread(id);
    }
    @Transactional public MessageThread decide(UUID id, UUID organizationId, String decision) {
        owns(id,organizationId); String current=status(id);
        if(!"PENDING".equals(current))throw new ResponseStatusException(HttpStatus.CONFLICT,"Only pending requests can be decided");
        if("ACCEPTED".equals(decision)) { jdbc.update("update message_threads set request_status='ACCEPTED',accepted_at=now(),updated_at=now() where id=?",id); jdbc.update("update thread_messages set delivered_at=coalesce(delivered_at,now()), seen_at=coalesce(seen_at,now()) where thread_id=? and sender_type='TALENT'",id); }
        else jdbc.update("update message_threads set request_status=?,updated_at=now() where id=?",decision,id);
        if("ACCEPTED".equals(decision)) notifications.talent(thread(id).contractorId(),"MESSAGE_REQUEST_ACCEPTED","Yêu cầu tin nhắn đã được chấp nhận","Bạn có thể bắt đầu trò chuyện với doanh nghiệp.","{\"threadId\":\""+id+"\"}"); return thread(id);
    }
    @Transactional public ThreadMessage sendBusiness(UUID id,UUID organizationId,String body){owns(id,organizationId);accepted(id);return message(id,"BUSINESS",body);}
    @Transactional public ThreadMessage sendTalent(UUID id,String contractorId,String body){if(!owner(id,contractorId))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Thread belongs to another contractor");accepted(id);return message(id,"TALENT",body);}
    private ThreadMessage message(UUID id,String sender,String body){UUID messageId=UUID.randomUUID();jdbc.update("insert into thread_messages(id,thread_id,sender_type,body) values(?,?,?,?)",messageId,id,sender,body.trim());jdbc.update("update message_threads set updated_at=now() where id=?",id);return jdbc.query("select id,sender_type,body,sent_at,delivered_at,seen_at from thread_messages where id=?",this::mapMessage,messageId).getFirst();}
    private MessageThread thread(UUID id){return jdbc.query(threadSelect()+" where t.id=?",this::mapThread,id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Thread not found"));}
    private void accepted(UUID id){if(!"ACCEPTED".equals(status(id)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Message request has not been accepted");}
    private String status(UUID id){return jdbc.query("select request_status from message_threads where id=?",(rs,row)->rs.getString(1),id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Thread not found"));}
    private void owns(UUID id,UUID org){if(!jdbc.queryForObject("select exists(select 1 from message_threads where id=? and organization_id=?)",Boolean.class,id,org))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Thread belongs to another organization");}
    private boolean owner(UUID id,String contractor){return jdbc.queryForObject("select exists(select 1 from message_threads where id=? and contractor_id=?)",Boolean.class,id,contractor);}
    private String threadSelect(){return "select t.id,t.contractor_id,p.display_name,p.headline,t.request_status,t.created_at,t.accepted_at,t.updated_at from message_threads t join talent_profiles p on p.contractor_id=t.contractor_id";}
    private MessageThread mapThread(ResultSet rs,int row)throws SQLException{UUID id=rs.getObject(1,UUID.class);return new MessageThread(id,rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getTimestamp(6).toInstant(),rs.getTimestamp(7)==null?null:rs.getTimestamp(7).toInstant(),rs.getTimestamp(8).toInstant(),jdbc.query("select id,sender_type,body,sent_at,delivered_at,seen_at from thread_messages where thread_id=? order by sent_at,id",this::mapMessage,id));}
    private ThreadMessage mapMessage(ResultSet rs,int row)throws SQLException{return new ThreadMessage(rs.getObject(1,UUID.class),rs.getString(2),rs.getString(3),rs.getTimestamp(4).toInstant(),rs.getTimestamp(5)==null?null:rs.getTimestamp(5).toInstant(),rs.getTimestamp(6)==null?null:rs.getTimestamp(6).toInstant());}
}
