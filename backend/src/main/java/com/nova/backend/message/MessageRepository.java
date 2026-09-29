package com.nova.backend.message;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.nova.backend.notification.NotificationRepository;

/**
 * Message threads shared by Nova Business (organization side) and Nova Mobile (talent side).
 * Listing a thread only marks messages as delivered; "seen" is recorded when a client explicitly
 * opens the conversation through the read endpoints.
 */
@Repository
public class MessageRepository {
    private final JdbcTemplate jdbc;
    private final NotificationRepository notifications;
    public MessageRepository(JdbcTemplate jdbc, NotificationRepository notifications) { this.jdbc = jdbc; this.notifications = notifications; }

    @Transactional public List<MessageThread> businessThreads(UUID organizationId, String status) {
        jdbc.update("update thread_messages m set delivered_at=now() from message_threads t where m.thread_id=t.id and t.organization_id=? and t.request_status='ACCEPTED' and m.sender_type='TALENT' and m.delivered_at is null", organizationId);
        return jdbc.query(threadSelect() + " where t.organization_id=? and t.request_status=? order by t.updated_at desc", this::mapThread, organizationId, status);
    }
    @Transactional public List<MessageThread> contractorThreads(String contractorId) {
        jdbc.update("update thread_messages m set delivered_at=now() from message_threads t where m.thread_id=t.id and t.contractor_id=? and t.request_status='ACCEPTED' and m.sender_type='BUSINESS' and m.delivered_at is null", contractorId);
        return jdbc.query(threadSelect() + " where t.contractor_id=? and t.request_status in ('PENDING','ACCEPTED') order by t.updated_at desc", this::mapThread, contractorId);
    }
    /** Marks the organization's messages as seen when the talent opens the thread. */
    @Transactional public MessageThread readByTalent(UUID id, String contractorId) {
        if (!owner(id, contractorId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Thread belongs to another contractor");
        jdbc.update("update thread_messages set delivered_at=coalesce(delivered_at,now()), seen_at=now() where thread_id=? and sender_type='BUSINESS' and seen_at is null", id);
        return thread(id);
    }
    /** Marks the talent's messages as seen when the business opens an accepted thread. */
    @Transactional public MessageThread readByBusiness(UUID id, UUID organizationId) {
        owns(id, organizationId);
        if ("ACCEPTED".equals(status(id))) {
            jdbc.update("update thread_messages set delivered_at=coalesce(delivered_at,now()), seen_at=now() where thread_id=? and sender_type='TALENT' and seen_at is null", id);
        }
        return thread(id);
    }
    @Transactional public MessageThread request(UUID organizationId, String contractorId, String body) {
        var existing=jdbc.query("select id, request_status from message_threads where organization_id=? and contractor_id=? for update", (rs,row)->new Object[]{rs.getObject(1,UUID.class),rs.getString(2)}, organizationId,contractorId);
        UUID id;
        boolean newRequest;
        if(existing.isEmpty()){ id=UUID.randomUUID(); jdbc.update("insert into message_threads(id,organization_id,contractor_id,request_status) values(?,?,?,'PENDING')",id,organizationId,contractorId); newRequest=true; }
        else {
            id=(UUID)existing.getFirst()[0]; String status=(String)existing.getFirst()[1];
            if("BLOCKED".equals(status))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You cannot contact this business");
            if("ACCEPTED".equals(status))throw new ResponseStatusException(HttpStatus.CONFLICT,"Use the existing conversation");
            newRequest=!"PENDING".equals(status);
            jdbc.update("update message_threads set request_status='PENDING',updated_at=now() where id=?",id);
        }
        message(id,"TALENT",body);
        // A follow-up while the request is still pending must not notify the business again.
        if(newRequest) notifications.business(organizationId,"MESSAGE_REQUEST","Yêu cầu tin nhắn mới",talentName(contractorId)+" muốn trò chuyện với doanh nghiệp của bạn.","{\"threadId\":\""+id+"\"}");
        return thread(id);
    }
    @Transactional public MessageThread decide(UUID id, UUID organizationId, String decision) {
        owns(id,organizationId); String current=status(id);
        if(!"PENDING".equals(current))throw new ResponseStatusException(HttpStatus.CONFLICT,"Only pending requests can be decided");
        if("ACCEPTED".equals(decision)) { jdbc.update("update message_threads set request_status='ACCEPTED',accepted_at=now(),updated_at=now() where id=?",id); jdbc.update("update thread_messages set delivered_at=coalesce(delivered_at,now()), seen_at=coalesce(seen_at,now()) where thread_id=? and sender_type='TALENT'",id); }
        else jdbc.update("update message_threads set request_status=?,updated_at=now() where id=?",decision,id);
        if("ACCEPTED".equals(decision)) notifications.talent(thread(id).contractorId(),"MESSAGE_REQUEST_ACCEPTED","Yêu cầu tin nhắn đã được chấp nhận","Bạn có thể bắt đầu trò chuyện với "+organizationName(organizationId)+".","{\"threadId\":\""+id+"\"}"); return thread(id);
    }
    @Transactional public ThreadMessage sendBusiness(UUID id,UUID organizationId,String body){
        owns(id,organizationId); accepted(id); ThreadMessage sent=message(id,"BUSINESS",body); MessageThread thread=thread(id);
        notifications.talent(thread.contractorId(),"MESSAGE_RECEIVED","Tin nhắn mới từ " + organizationName(organizationId),body.trim(),"{\"threadId\":\""+id+"\"}"); return sent;
    }
    @Transactional public ThreadMessage sendTalent(UUID id,String contractorId,String body){
        if(!owner(id,contractorId))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Thread belongs to another contractor"); accepted(id); ThreadMessage sent=message(id,"TALENT",body);
        notifications.business(organization(id),"MESSAGE_RECEIVED","Tin nhắn mới từ "+talentName(contractorId),body.trim(),"{\"threadId\":\""+id+"\"}"); return sent;
    }
    public void requireBusinessThread(UUID id, UUID organizationId) { owns(id, organizationId); }
    public void requireTalentThread(UUID id, String contractorId) {
        if (!owner(id, contractorId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Thread belongs to another contractor");
    }
    private ThreadMessage message(UUID id,String sender,String body){UUID messageId=UUID.randomUUID();jdbc.update("insert into thread_messages(id,thread_id,sender_type,body) values(?,?,?,?)",messageId,id,sender,body.trim());jdbc.update("update message_threads set updated_at=now() where id=?",id);return jdbc.query("select id,sender_type,body,sent_at,delivered_at,seen_at from thread_messages where id=?",this::mapMessage,messageId).getFirst();}
    private MessageThread thread(UUID id){return jdbc.query(threadSelect()+" where t.id=?",this::mapThread,id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Thread not found"));}
    private void accepted(UUID id){if(!"ACCEPTED".equals(status(id)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Message request has not been accepted");}
    private String status(UUID id){return jdbc.query("select request_status from message_threads where id=?",(rs,row)->rs.getString(1),id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Thread not found"));}
    private UUID organization(UUID id){return jdbc.query("select organization_id from message_threads where id=?",(rs,row)->rs.getObject(1,UUID.class),id).stream().findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Thread not found"));}
    private String organizationName(UUID organizationId){return jdbc.query("select coalesce(b.display_name,o.trading_name) from organizations o left join business_profiles b on b.organization_id=o.id where o.id=?",(rs,row)->rs.getString(1),organizationId).stream().findFirst().orElse("Doanh nghiệp");}
    private String talentName(String contractorId){return jdbc.query("select display_name from talent_profiles where contractor_id=?",(rs,row)->rs.getString(1),contractorId).stream().findFirst().orElse("Ứng viên");}
    private void owns(UUID id,UUID org){if(!jdbc.queryForObject("select exists(select 1 from message_threads where id=? and organization_id=?)",Boolean.class,id,org))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Thread belongs to another organization");}
    private boolean owner(UUID id,String contractor){return jdbc.queryForObject("select exists(select 1 from message_threads where id=? and contractor_id=?)",Boolean.class,id,contractor);}
    private String threadSelect(){return "select t.id,t.contractor_id,p.display_name,p.headline,t.request_status,t.created_at,t.accepted_at,t.updated_at,"
        + "t.organization_id,coalesce(b.display_name,o.trading_name),cp.avatar_url,"
        + "(select a.id from business_profile_assets a where a.organization_id=t.organization_id and a.asset_type='AVATAR'),"
        + "(select count(*) from thread_messages m where m.thread_id=t.id and m.sender_type='BUSINESS' and m.seen_at is null),"
        + "(select count(*) from thread_messages m where m.thread_id=t.id and m.sender_type='TALENT' and m.seen_at is null) "
        + "from message_threads t join talent_profiles p on p.contractor_id=t.contractor_id "
        + "join organizations o on o.id=t.organization_id left join business_profiles b on b.organization_id=t.organization_id "
        + "left join community_profiles cp on cp.id=t.contractor_id";}
    private MessageThread mapThread(ResultSet rs,int row)throws SQLException{UUID id=rs.getObject(1,UUID.class);UUID org=rs.getObject(9,UUID.class);return new MessageThread(id,rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5),rs.getTimestamp(6).toInstant(),rs.getTimestamp(7)==null?null:rs.getTimestamp(7).toInstant(),rs.getTimestamp(8).toInstant(),org,rs.getString(10),rs.getString(11),rs.getObject(12,UUID.class)==null?null:"/media/business-profile/"+rs.getObject(12,UUID.class),rs.getLong(13),rs.getLong(14),jdbc.query("select id,sender_type,body,sent_at,delivered_at,seen_at from thread_messages where thread_id=? order by sent_at,id",this::mapMessage,id));}
    private ThreadMessage mapMessage(ResultSet rs,int row)throws SQLException{return new ThreadMessage(rs.getObject(1,UUID.class),rs.getString(2),rs.getString(3),rs.getTimestamp(4).toInstant(),rs.getTimestamp(5)==null?null:rs.getTimestamp(5).toInstant(),rs.getTimestamp(6)==null?null:rs.getTimestamp(6).toInstant());}
}
